const fs = require("node:fs"),
  path = require("node:path"),
  crypto = require("node:crypto"),
  cp = require("node:child_process"),
  net = require("node:net"),
  http = require("node:http"),
  assert = require("node:assert/strict"),
  { pathToFileURL } = require("node:url"),
  { createRequire } = require("node:module");

const options = {};
for (let i = 2; i < process.argv.length; i += 2) {
  const key = process.argv[i],
    value = process.argv[i + 1];
  assert.ok(
    [
      "--service-root",
      "--source-root",
      "--dependency-root",
      "--node",
      "--npm-cli",
      "--postgres-bin",
      "--scratch",
      "--receipt",
    ].includes(key),
    "Unknown option",
  );
  assert.ok(value && !options[key], "Missing or duplicate option");
  options[key] = path.resolve(value);
}
for (const key of [
  "--service-root",
  "--source-root",
  "--dependency-root",
  "--node",
  "--npm-cli",
  "--postgres-bin",
  "--scratch",
  "--receipt",
])
  assert.ok(options[key], "Provide " + key);
assert.equal(
  process.platform,
  "win32",
  "Owned process identity tracking currently requires Windows",
);
assert.equal(process.versions.node, "22.18.0");
assert.equal(
  fs.realpathSync(options["--node"]).toLowerCase(),
  fs.realpathSync(process.execPath).toLowerCase(),
);
const canonicalNew = (file) =>
  path.join(fs.realpathSync(path.dirname(file)), path.basename(file));
options["--scratch"] = canonicalNew(options["--scratch"]);
options["--receipt"] = canonicalNew(options["--receipt"]);
const root = options["--source-root"],
  own = __dirname.split(path.sep).join("/"),
  out = options["--scratch"].split(path.sep).join("/"),
  fixture = out + "/service",
  bin = options["--postgres-bin"].split(path.sep).join("/"),
  data = out + "/cluster-service-v5",
  source = options["--service-root"],
  dependencies = options["--dependency-root"],
  receiptTarget = options["--receipt"];
const nested = (a, b) => {
  const relative = path.relative(fs.realpathSync(a), b);
  return (
    relative === "" ||
    (!relative.startsWith(".." + path.sep) &&
      relative !== ".." &&
      !path.isAbsolute(relative))
  );
};
for (const base of [
  source,
  dependencies,
  own,
  bin,
  path.dirname(options["--npm-cli"]),
  root + "/scanner/packages/scanners/evm-scanner/lib",
  root +
    "/scanner/packages/observation-extractors/evm-observation-extractor/lib",
  root + "/ui/packages/asset-calculator/lib",
]) {
  assert.ok(!nested(base, out), "Scratch must stay outside inputs");
  assert.ok(!nested(base, receiptTarget), "Receipt must stay outside inputs");
}
assert.ok(!fs.existsSync(out), "Scratch must be fresh");
assert.ok(!fs.existsSync(receiptTarget), "Receipt must be new");
assert.ok(
  fs.existsSync(path.dirname(out)) &&
    fs.existsSync(path.dirname(receiptTarget)),
  "Scratch and receipt parents must exist",
);
const free = fs.statfsSync(path.dirname(out), { bigint: true });
assert.ok(
  free.bavail * free.bsize >= 10n * 1024n ** 3n,
  "Replay needs 10 GiB free",
);
const receiptFree = fs.statfsSync(path.dirname(receiptTarget), {
  bigint: true,
});
assert.ok(
  receiptFree.bavail * receiptFree.bsize >= 10n * 1024n ** 3n,
  "Receipt needs 10 GiB free",
);
const digest = (file) =>
    crypto.createHash("sha256").update(fs.readFileSync(file)).digest("hex"),
  sourcePins = [],
  dependencyPins = [],
  supportPins = [],
  generatedPins = [],
  toolchainPins = [];
const pin = (file, relative) => ({
  path: relative.split(path.sep).join("/"),
  bytes: fs.statSync(file).size,
  sha256: digest(file),
});
const walk = (base, relative, records) => {
  for (const entry of fs.readdirSync(path.join(base, relative), {
    withFileTypes: true,
  })) {
    const next = path.join(relative, entry.name);
    assert.ok(
      !entry.isSymbolicLink(),
      "Input tree symlinks require a materialized dependency closure",
    );
    if (entry.isDirectory()) walk(base, next, records);
    else records.push(pin(path.join(base, next), next));
  }
};
assert.equal(
  cp
    .execFileSync(options["--node"], [options["--npm-cli"], "--version"], {
      encoding: "utf8",
      windowsHide: true,
      timeout: 15000,
    })
    .trim(),
  "11.6.2",
);
assert.match(
  cp.execFileSync(bin + "/pg_ctl.exe", ["--version"], {
    encoding: "utf8",
    windowsHide: true,
    timeout: 15000,
  }),
  /PostgreSQL\) 17\.11/,
);
walk(dependencies, "", dependencyPins);
for (const name of [
  "replay.cjs",
  "bootstrap.mjs",
  "loader.mjs",
  "observer.mjs",
  "legacy.mjs",
  "network-guard.mjs",
  "contracts.json",
  "tokens.json",
  "manifest.json",
])
  supportPins.push(pin(own + "/" + name, name));
for (const [base, name] of [
  [options["--node"], "node"],
  [options["--npm-cli"], "npm-cli"],
  ...["initdb.exe", "pg_ctl.exe", "postgres.exe", "createdb.exe"].map(
    (name) => [bin + "/" + name, name],
  ),
])
  toolchainPins.push(pin(base, name));
for (const relative of [
  "scanner/packages/scanners/evm-scanner/lib",
  "scanner/packages/observation-extractors/evm-observation-extractor/lib",
  "ui/packages/asset-calculator/lib",
])
  walk(root, relative, sourcePins);
fs.mkdirSync(out);
fs.mkdirSync(fixture);
const copy = (relative) => {
  const input = path.join(source, relative),
    target = path.join(fixture, relative);
  assert.ok(!fs.lstatSync(input).isSymbolicLink());
  if (fs.statSync(input).isDirectory()) {
    fs.mkdirSync(target, { recursive: true });
    for (const name of fs.readdirSync(input)) copy(path.join(relative, name));
  } else {
    const before = pin(input, relative);
    fs.copyFileSync(input, target, fs.constants.COPYFILE_EXCL);
    assert.equal(digest(target), before.sha256);
    sourcePins.push({ ...before, root: "service" });
    generatedPins.push(pin(target, "service/" + relative));
  }
};
for (const relative of ["src", "config", "package.json"]) copy(relative);
assert.equal(
  JSON.parse(fs.readFileSync(fixture + "/package.json")).scripts["start:prod"],
  "tsx ./src/main.ts",
);
fs.symlinkSync(dependencies, fixture + "/node_modules", "junction");
const req = createRequire(fixture + "/package.json"),
  { Transaction } = req("ethers"),
  credential = crypto.randomBytes(32).toString("hex"),
  events = [],
  calls = [],
  tracked = [];
/** Reads process identities without exposing command lines or environment values. */
const processRows = (parent) => {
  const script =
    "$all=@(Get-CimInstance Win32_Process); $ids=@(" +
    parent +
    '); do {$old=$ids.Count; $ids=@($ids + @($all | Where-Object {$ids -contains $_.ParentProcessId} | ForEach-Object {$_.ProcessId}) | Select-Object -Unique)} while ($old -ne $ids.Count); @($all | Where-Object {$ids -contains $_.ProcessId} | Select-Object ProcessId,Name,@{n="created";e={$_.CreationDate.ToUniversalTime().ToString("o")}}) | ConvertTo-Json -Compress';
  const r = cp.spawnSync("powershell.exe", ["-NoProfile", "-Command", script], {
    windowsHide: true,
    encoding: "utf8",
    timeout: 15000,
  });
  assert.equal(r.status, 0);
  return r.stdout.trim() ? [].concat(JSON.parse(r.stdout)) : [];
};
const processFamilies = new Map();
const track = (pid) => {
  const family = processFamilies.get(pid);
  if (family && !sameIdentity(family.parent)) return [];
  const rows = processRows(pid);
  const parent = rows.find((row) => row.ProcessId === pid);
  if (!parent) return [];
  const owned = family ?? { parent, rows: [] };
  processFamilies.set(pid, owned);
  for (const row of rows) {
    if (
      !owned.rows.some(
        (p) => p.ProcessId === row.ProcessId && p.created === row.created,
      )
    )
      owned.rows.push(row);
    if (
      !tracked.some(
        (p) => p.ProcessId === row.ProcessId && p.created === row.created,
      )
    )
      tracked.push(row);
  }
  return rows;
};
const sameIdentity = (row) =>
  processRows(row.ProcessId).find(
    (current) =>
      current.ProcessId === row.ProcessId &&
      current.created === row.created &&
      current.Name === row.Name,
  );
/** Stops only captured identities, never a newly reused PID or an unowned process tree. */
const stopOwned = (child) => {
  if (!child) return;
  const family = processFamilies.get(child.pid);
  if (!family) return;
  if (sameIdentity(family.parent)) track(child.pid);
  for (const row of [...family.rows].reverse())
    if (sameIdentity(row)) {
      const result = cp.spawnSync(
        "taskkill.exe",
        ["/PID", String(row.ProcessId), "/F"],
        { windowsHide: true, encoding: "utf8", timeout: 10000 },
      );
      assert.equal(result.status, 0, "Owned process stop failed");
    }
};
const verifyInputs = () => {
  for (const p of generatedPins.filter((p) => p.role !== "copied-preimage"))
    assert.equal(digest(path.join(out, p.path)), p.sha256);
  for (const p of toolchainPins) {
    const file =
      p.path === "node"
        ? options["--node"]
        : p.path === "npm-cli"
          ? options["--npm-cli"]
          : path.join(bin, p.path);
    assert.equal(digest(file), p.sha256);
  }
  for (const p of sourcePins)
    assert.equal(
      digest(path.join(p.root === "service" ? source : root, p.path)),
      p.sha256,
    );
  for (const p of dependencyPins)
    assert.equal(digest(path.join(dependencies, p.path)), p.sha256);
  for (const p of supportPins)
    assert.equal(digest(path.join(own, p.path)), p.sha256);
};

assert.ok(!fs.existsSync(data));
assert.ok(
  fs.statfsSync(out, { bigint: true }).bavail *
    fs.statfsSync(out, { bigint: true }).bsize >=
    10n * 1024n ** 3n,
);
fs.mkdirSync(out + "/runtime-config-v5");
const tokenTarget = fixture + "/config/tokensMap.json";
fs.copyFileSync(own + "/tokens.json", tokenTarget);
const copiedTokenMap = generatedPins.find(
  (p) => p.path === "service/config/tokensMap.json",
);
if (copiedTokenMap) copiedTokenMap.role = "copied-preimage";
generatedPins.push({
  ...pin(tokenTarget, "service/config/tokensMap.json"),
  role: "runtime",
});
const contracts = JSON.parse(fs.readFileSync(own + "/contracts.json")),
  manifest = JSON.parse(fs.readFileSync(own + "/manifest.json")),
  tokens = JSON.parse(fs.readFileSync(tokenTarget)).tokens,
  joe = tokens.find((set) => set.avalanche?.name === "JOE");
assert.equal(manifest.chainId, 43114);
const lock = contracts.avalanche.addresses.lock.toLowerCase(),
  balanceAddress = contracts.avalanche.addresses.cold.toLowerCase(),
  hash = "0x" + "aa".repeat(32),
  parentHash = "0x" + "bb".repeat(32),
  zero = "0x" + "00".repeat(32),
  quantity = (n) => "0x" + BigInt(n).toString(16),
  timestamp = Math.floor(Date.now() / 1000) - 2;
const joeAmount = 100000000000n,
  joeData =
    "0xa9059cbb" +
    lock.slice(2).padStart(64, "0") +
    joeAmount.toString(16).padStart(64, "0") +
    "00000000000000000200000000000000032103f999da8e6e42660e4464d17d29e63bc006734a6710a24eb489b466323d3a9339";
const signed = Transaction.from({
  type: 2,
  to: joe.avalanche.tokenId,
  data: joeData,
  nonce: 10,
  gasLimit: 80000n,
  maxPriorityFeePerGas: 500000000n,
  maxFeePerGas: 48978500000n,
  value: 0n,
  chainId: BigInt(manifest.chainId),
  accessList: [],
  signature: {
    r: "0x" + "01".repeat(32),
    s: "0x" + "02".repeat(32),
    yParity: 0,
  },
});
fs.writeFileSync(
  out + "/expected.json",
  JSON.stringify(
    {
      lock,
      balanceAddress,
      joe,
      transactionHash: signed.hash,
      transactionFrom: signed.from,
      joeAmount: joeAmount.toString(),
      data: joeData,
      nativeBalance: "3000000000000000000",
      tokenBalance: "7000000000000000000",
      chainId: manifest.chainId,
    },
    null,
    2,
  ) + "\n",
  { flag: "wx" },
);
const tx = {
  hash: signed.hash,
  from: signed.from,
  to: signed.to,
  nonce: quantity(signed.nonce),
  gas: quantity(signed.gasLimit),
  gasPrice: quantity(signed.maxFeePerGas),
  maxFeePerGas: quantity(signed.maxFeePerGas),
  maxPriorityFeePerGas: quantity(signed.maxPriorityFeePerGas),
  value: quantity(signed.value),
  input: signed.data,
  chainId: quantity(signed.chainId),
  type: "0x2",
  accessList: [],
  r: signed.signature.r,
  s: signed.signature.s,
  v: "0x0",
  yParity: "0x0",
  blockHash: hash,
  blockNumber: "0x1",
  transactionIndex: "0x0",
};
const receipt = {
  transactionHash: signed.hash,
  transactionIndex: "0x0",
  blockHash: hash,
  blockNumber: "0x1",
  from: signed.from,
  to: signed.to,
  cumulativeGasUsed: "0x5208",
  gasUsed: "0x5208",
  effectiveGasPrice: quantity(signed.maxFeePerGas),
  contractAddress: null,
  logs: [
    {
      address: joe.avalanche.tokenId,
      topics: [
        "0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef",
        "0x" + signed.from.slice(2).toLowerCase().padStart(64, "0"),
        "0x" + lock.slice(2).padStart(64, "0"),
      ],
      data: "0x" + joeAmount.toString(16).padStart(64, "0"),
      blockHash: hash,
      blockNumber: "0x1",
      transactionHash: signed.hash,
      transactionIndex: "0x0",
      logIndex: "0x0",
      removed: false,
    },
  ],
  logsBloom: "0x" + "00".repeat(256),
  status: "0x1",
  type: "0x2",
};
const block = (full) => ({
  number: "0x1",
  hash,
  parentHash,
  timestamp: quantity(timestamp),
  nonce: "0x0000000000000000",
  difficulty: "0x0",
  totalDifficulty: "0x0",
  gasLimit: "0x1c9c380",
  gasUsed: "0x5208",
  miner: balanceAddress,
  extraData: "0x",
  baseFeePerGas: "0x1",
  size: "0x200",
  sha3Uncles: zero,
  transactions: [full ? tx : signed.hash],
  uncles: [],
});

/** Allocates an owned loopback port. */
const freePort = () =>
  new Promise((resolve, reject) => {
    const server = net.createServer();
    server.on("error", reject);
    server.listen(0, "127.0.0.1", () => {
      const port = server.address().port;
      server.close(() => resolve(port));
    });
  });
/** Executes and retains an attributed command with sanitized output. */
const command = (name, exe, args, env = process.env) => {
  if (name.endsWith("-stop")) {
    const pid = Number(
      fs.readFileSync(data + "/postmaster.pid", "utf8").split(/\r?\n/)[0],
    );
    assert.ok(
      tracked.some(
        (row) =>
          row.ProcessId === pid &&
          row.Name === "postgres.exe" &&
          sameIdentity(row),
      ),
      "Refuse to stop an unowned PostgreSQL identity",
    );
  }
  const file = out + "/v5-" + name + ".log",
    fd = fs.openSync(file, "wx");
  let result;
  try {
    result = cp.spawnSync(exe, args, {
      cwd: out,
      env,
      encoding: "utf8",
      windowsHide: true,
      timeout: 90000,
      maxBuffer: 16 * 1024 ** 2,
      stdio: ["ignore", fd, fd],
    });
  } finally {
    fs.closeSync(fd);
  }
  assert.ok(!fs.readFileSync(file, "utf8").includes(credential));
  if (name.includes("-start") && fs.existsSync(data + "/postmaster.pid"))
    track(
      Number(
        fs.readFileSync(data + "/postmaster.pid", "utf8").split(/\r?\n/)[0],
      ),
    );
  events.push({ name, exit: result.status });
  assert.equal(result.status, 0, name + " failed");
  return result;
};
let server,
  rpcPort,
  pgPort,
  initialized = false,
  running = false,
  activeChild,
  passed = false;
/** Builds the exact inherited synthetic configuration for one phase. */
const configFor = (phase, database) => {
  const addresses = {
      lock: "synthetic",
      eventTrigger: "synthetic",
      permit: "synthetic",
      fraud: "synthetic",
      commitment: "synthetic",
    },
    config = {
      logs: [{ type: "console", level: "info" }],
      postgres: {
        url:
          "postgresql://fixture:" +
          credential +
          "@127.0.0.1:" +
          pgPort +
          "/" +
          database,
        logging: false,
        useSSL: false,
      },
      notification: { discordWebhookUrl: "" },
      calculator: { interval: 60, addresses: {} },
      healthCheck: {
        avalancheScannerWarnDiff: 1000,
        avalancheScannerCriticalDiff: 2000,
        interval: 0.2,
        duration: 600,
        maxAllowedErrorCount: 99,
        maxAllowedWarnCount: 99,
        reportPath: out + "/health-" + phase + ".json",
      },
      avalanche: {
        enabled: true,
        chainId: manifest.chainId,
        initialHeight: 0,
        selectedSourceId: "provider-a",
        endpoints: [
          {
            sourceId: "provider-a",
            url: "http://127.0.0.1:" + rpcPort + "/rpc",
            timeoutMs: 2000,
          },
          {
            sourceId: "provider-b",
            url: "http://localhost:" + rpcPort + "/rpc",
            timeoutMs: 2000,
          },
        ],
        addresses: {
          lock,
          eventTrigger: contracts.avalanche.addresses.WatcherTriggerEvent,
          permit: contracts.avalanche.addresses.WatcherPermit,
          fraud: contracts.avalanche.addresses.Fraud,
          commitment: contracts.avalanche.addresses.Commitment,
        },
        tokens: { rwt: contracts.avalanche.tokens.RWTId },
        calculatorAddresses: [balanceAddress],
        intervalMs: 60000,
        health: { blockTime: 2 },
      },
    };
  for (const chain of [
    "ergo",
    "cardano",
    "bitcoin",
    "bitcoin-runes",
    "ethereum",
    "binance",
    "doge",
    "firo",
    "handshake",
  ]) {
    config[chain] = {
      addresses,
      tokens: { rwt: "22".repeat(32) },
      initialHeight: 0,
      explorerUrl: "http://127.0.0.1:" + rpcPort,
      koiosUrl: "http://127.0.0.1:" + rpcPort,
      koiosAuthToken: "",
      esploraUrl: "http://127.0.0.1:" + rpcPort,
      rpc: { url: "http://127.0.0.1:" + rpcPort },
      rpcUrl: "http://127.0.0.1:" + rpcPort,
      rpcConnections: [],
      blockcypherUrl: "http://127.0.0.1:" + rpcPort,
      unisatUrl: "http://127.0.0.1:" + rpcPort,
      unisatApiKey: "",
      electrumx: { host: "127.0.0.1", port: rpcPort, reconnectDelay: 1000 },
    };
    config.calculator.addresses[chain] = [];
    if (chain !== "bitcoin-runes") {
      config.healthCheck[chain + "ScannerWarnDiff"] = 3;
      config.healthCheck[chain + "ScannerCriticalDiff"] = 5;
    }
  }

  if (phase === "repository") {
    const wasm = req("ergo-lib-wasm-nodejs"),
      tree = wasm.ErgoTree.from_base16_bytes("10010100d17300"),
      address = wasm.Address.recreate_from_ergo_tree(tree).to_base58(
        wasm.NetworkPrefix.Testnet,
      );
    assert.equal(
      wasm.Address.from_base58(address).to_ergo_tree().to_base16_bytes(),
      "10010100d17300",
    );
    for (const value of Object.values(config)) {
      if (value && value.addresses && typeof value.addresses === "object") {
        value.addresses = { ...value.addresses };
        for (const field of ["eventTrigger", "permit", "fraud", "commitment"])
          value.addresses[field] = address;
      }
    }
    config.ergo.addresses.lock = address;
    const btc = req("bitcoinjs-lib"),
      redeem = { output: Buffer.from("51", "hex") };
    config.bitcoin.addresses.lock = btc.payments.p2wsh({ redeem }).address;
    config["bitcoin-runes"].addresses.lock = config.bitcoin.addresses.lock;
    config.doge.addresses.lock = btc.payments.p2sh({
      redeem,
      network: { ...btc.networks.bitcoin, scriptHash: 0x16 },
    }).address;
    config.firo.addresses.lock = btc.payments.p2sh({
      redeem,
      network: { ...btc.networks.bitcoin, scriptHash: 0x07 },
    }).address;
    config.handshake.addresses.lock = btc.payments.p2wsh({
      redeem,
      network: { ...btc.networks.bitcoin, bech32: "hs" },
    }).address;
    config.ethereum.addresses.lock = lock;
    config.binance.addresses.lock = lock;
    fs.writeFileSync(
      out + "/repository-address-inputs-v5.json",
      JSON.stringify(
        {
          ergoTestnetTree: "10010100d17300",
          ergoAddress: address,
          legacyLocks: Object.fromEntries(
            [
              "ergo",
              "cardano",
              "bitcoin",
              "bitcoin-runes",
              "doge",
              "firo",
              "handshake",
              "ethereum",
              "binance",
            ].map((chain) => [chain, config[chain].addresses.lock]),
          ),
          scope:
            "Only direct repository registration fixture; actual installed WASM/bitcoinjs script address encoders, no keys/funds/live endpoints; main configuration unchanged",
        },
        null,
        2,
      ) + "\n",
      { flag: "wx" },
    );
  }
  return config;
};
/** Runs the actual unchanged npm start:prod and observes original producer/consumer state. */
const startNpm = async (phase, database = "avalanche_fixture", mutant = "") => {
  const config = configFor(phase, database);
  fs.writeFileSync(
    out + "/config-" + phase + ".json",
    JSON.stringify(
      {
        ...config,
        postgres: {
          ...config.postgres,
          url: config.postgres.url.replace(
            credential,
            "[ephemeral fixture credential]",
          ),
        },
      },
      null,
      2,
    ) + "\n",
    { flag: "wx" },
  );
  const nodeOptions =
      "--import " +
      pathToFileURL(own + "/network-guard.mjs").href +
      " --import " +
      pathToFileURL(fixture + "/node_modules/tsx/dist/loader.mjs").href +
      " --import " +
      pathToFileURL(own + "/bootstrap.mjs").href +
      " --import " +
      pathToFileURL(own + "/observer.mjs").href,
    env = {
      ...process.env,
      NODE_OPTIONS: nodeOptions,
      NODE_CONFIG: JSON.stringify(config),
      NODE_CONFIG_DIR: out + "/runtime-config-v5",
      NODE_ENV: "test",
      NODE_BACKEND: "js",
      SERVICE_FIXTURE_PORTS: pgPort + "," + rpcPort,
      SERVICE_FIXTURE_PHASE: phase,
      SERVICE_FIXTURE_ROOT: fixture,
      SERVICE_FIXTURE_OUTPUT: out,
      SERVICE_FIXTURE_MUTANT: mutant,
      SERVICE_FIXTURE_HEALTH_REPORT: config.healthCheck.reportPath,
      HTTP_PROXY: "",
      HTTPS_PROXY: "",
      ALL_PROXY: "",
      NO_PROXY: "127.0.0.1,localhost,::1",
      PATH: path.dirname(process.execPath) + ";" + process.env.PATH,
    };
  const result = await new Promise((resolve, reject) => {
    const child = cp.spawn(
      options["--node"],
      [options["--npm-cli"], "run", "start:prod"],
      {
        cwd: fixture,
        env,
        windowsHide: true,
        stdio: ["ignore", "pipe", "pipe"],
      },
    );
    activeChild = child;
    let log = "",
      ready = false,
      timedOut = false;
    const consume = (chunk) => {
      log += chunk;
      if (!ready && log.includes("SERVICE_FIXTURE_READY:" + phase)) {
        ready = true;
        track(child.pid);
        fs.writeFileSync(
          out + "/shutdown-" + phase,
          "owned graceful shutdown\n",
          { flag: "wx" },
        );
      }
    };
    child.stdout.on("data", consume);
    child.stderr.on("data", consume);
    track(child.pid);
    const timer = setTimeout(() => {
      timedOut = true;
      stopOwned(child);
    }, 45000);
    child.on("error", (error) => {
      clearTimeout(timer);
      reject(error);
    });
    child.on("exit", (exit, signal) => {
      clearTimeout(timer);
      try {
        stopOwned(child);
      } catch (error) {
        reject(error);
        return;
      }
      activeChild = undefined;
      resolve({ exit, signal, ready, timedOut, pid: child.pid, log });
    });
  });
  fs.writeFileSync(
    out + "/npm-" + phase + ".log",
    result.log.replaceAll(credential, "[ephemeral fixture credential]"),
    { flag: "wx" },
  );
  delete result.log;
  events.push({ name: "actual-npm-start-prod-" + phase, ...result });
  return result;
};
(async () => {
  try {
    pgPort = await freePort();
    let requests = 0;
    server = http.createServer({ maxHeaderSize: 16384 }, async (req, res) => {
      try {
        assert.ok(++requests <= 5000, "Fixture request bound");
        if (req.method === "GET") {
          calls.push({ method: "ergo-token-supply", path: req.url });
          res.setHeader("content-type", "application/json");
          const id = req.url.split("/").at(-1),
            set = tokens.find((set) => set.ergo?.tokenId === id);
          assert.ok(set);
          res.end(
            JSON.stringify({
              id,
              emissionAmount: 20000000000,
              name: set.ergo.name,
              decimals: set.ergo.decimals,
            }),
          );
          return;
        }
        let bytes = "",
          byteCount = 0;
        for await (const chunk of req) {
          byteCount += chunk.length;
          assert.ok(byteCount <= 131072, "Fixture body bound");
          bytes += chunk;
        }
        const body = JSON.parse(bytes);
        assert.ok(
          !Array.isArray(body) || body.length <= 64,
          "Fixture batch bound",
        );
        const respond = (request) => {
          calls.push({ method: request.method, params: request.params });
          let result;
          switch (request.method) {
            case "eth_chainId":
              result = quantity(manifest.chainId);
              break;
            case "eth_getBlockByNumber":
              assert.ok(["finalized", "0x1"].includes(request.params[0]));
              result = block(Boolean(request.params[1]));
              break;
            case "eth_getBlockByHash":
              assert.equal(request.params[0], hash);
              result = block(Boolean(request.params[1]));
              break;
            case "eth_getTransactionReceipt":
              assert.equal(request.params[0], signed.hash);
              result = receipt;
              break;
            case "eth_getBalance":
              assert.equal(request.params[0].toLowerCase(), balanceAddress);
              assert.equal(request.params[1], "0x1");
              result = quantity(3000000000000000000n);
              break;
            case "eth_call":
              assert.equal(
                request.params[0].to.toLowerCase(),
                joe.avalanche.tokenId,
              );
              assert.equal(request.params[1], "0x1");
              assert.equal(
                request.params[0].data.toLowerCase(),
                "0x70a08231" + balanceAddress.slice(2).padStart(64, "0"),
              );
              result =
                "0x" + 7000000000000000000n.toString(16).padStart(64, "0");
              break;
            default:
              throw Error("Unexpected RPC method " + request.method);
          }
          return { jsonrpc: "2.0", id: request.id, result };
        };
        res.setHeader("content-type", "application/json");
        res.end(
          JSON.stringify(
            Array.isArray(body) ? body.map(respond) : respond(body),
          ),
        );
      } catch (error) {
        events.push({
          name: "transport-fixture-error",
          message: String(error),
        });
        res.writeHead(500);
        res.end("fixture rejected request");
      }
    });
    server.maxConnections = 16;
    server.requestTimeout = 15000;
    server.headersTimeout = 15000;
    server.timeout = 15000;
    server.keepAliveTimeout = 1000;
    await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
    rpcPort = server.address().port;

    const password = out + "/ephemeral-password";
    fs.writeFileSync(password, credential + "\n", { flag: "wx" });
    try {
      command("pg-initdb", bin + "/initdb.exe", [
        "-D",
        data,
        "-U",
        "fixture",
        "--auth=scram-sha-256",
        "--encoding=UTF8",
        "--locale=C",
        "--pwfile=" + password,
      ]);
      initialized = true;
    } finally {
      fs.unlinkSync(password);
    }
    command("pg-start", bin + "/pg_ctl.exe", [
      "-D",
      data,
      "-l",
      out + "/v5-postgres.log",
      "-o",
      "-h 127.0.0.1 -p " + pgPort,
      "-w",
      "start",
    ]);
    running = true;
    track(
      Number(
        fs.readFileSync(data + "/postmaster.pid", "utf8").split(/\r?\n/)[0],
      ),
    );
    command(
      "pg-createdb",
      bin + "/createdb.exe",
      [
        "-h",
        "127.0.0.1",
        "-p",
        String(pgPort),
        "-U",
        "fixture",
        "avalanche_fixture",
      ],
      { ...process.env, PGPASSWORD: credential },
    );
    const repositoryConfig = configFor("repository", "avalanche_fixture"),
      repositoryEnv = {
        ...process.env,
        NODE_OPTIONS:
          "--import " +
          pathToFileURL(own + "/network-guard.mjs").href +
          " --import " +
          pathToFileURL(fixture + "/node_modules/tsx/dist/loader.mjs").href,
        NODE_CONFIG: JSON.stringify(repositoryConfig),
        NODE_CONFIG_DIR: out + "/runtime-config-v5",
        NODE_ENV: "test",
        NODE_BACKEND: "js",
        SERVICE_FIXTURE_PORTS: pgPort + "," + rpcPort,
      };
    events.push({
      name: "legacy-registration-outside-portable-process-scope",
      isolatedStarts: 8,
      claim: "No new full legacy job qualification",
    });
    const first = await startNpm("v5-first");
    assert.equal(first.exit, 0);
    assert.ok(first.ready && !first.timedOut);
    const firstResult = JSON.parse(
      fs.readFileSync(out + "/result-v5-first.json"),
    );
    const serverBefore = Number(
      fs.readFileSync(data + "/postmaster.pid", "utf8").split(/\r?\n/)[0],
    );
    command("pg-restart-stop", bin + "/pg_ctl.exe", [
      "-D",
      data,
      "-w",
      "-m",
      "fast",
      "stop",
    ]);
    running = false;
    command("pg-restart-start", bin + "/pg_ctl.exe", [
      "-D",
      data,
      "-l",
      out + "/v5-postgres-restart.log",
      "-o",
      "-h 127.0.0.1 -p " + pgPort,
      "-w",
      "start",
    ]);
    running = true;
    track(
      Number(
        fs.readFileSync(data + "/postmaster.pid", "utf8").split(/\r?\n/)[0],
      ),
    );
    const serverAfter = Number(
      fs.readFileSync(data + "/postmaster.pid", "utf8").split(/\r?\n/)[0],
    );
    assert.notEqual(serverBefore, serverAfter);
    const second = await startNpm("v5-second");
    assert.equal(second.exit, 0);
    assert.ok(second.ready && !second.timedOut);
    const secondResult = JSON.parse(
      fs.readFileSync(out + "/result-v5-second.json"),
    );
    assert.notEqual(firstResult.pid, secondResult.pid);
    for (const field of [
      "state",
      "blocks",
      "observations",
      "assets",
      "bridged",
      "tokens",
    ])
      assert.deepEqual(
        secondResult[field],
        firstResult[field],
        field + " durable restart",
      );
    events.push({
      name: "actual-PG-and-Service-process-restart",
      serverPids: [serverBefore, serverAfter],
      servicePids: [firstResult.pid, secondResult.pid],
    });
    const { Client } = req("pg"),
      db = new Client({ connectionString: repositoryConfig.postgres.url });
    await db.connect();
    try {
      for (const [field, value, pattern] of [
        ["holdReason", "fixture-held", /held/],
        ["chainId", "43113", /policy|identity|held/],
      ]) {
        const before = calls.length;
        await db.query(
          'UPDATE avalanche_safety_state SET "' +
            field +
            '"=$1 WHERE scanner=$2',
          [value, "avalanche"],
        );
        const negative = await startNpm("v5-poison-" + field);
        assert.equal(negative.exit, 1);
        assert.ok(!negative.ready && !negative.timedOut);
        const log = fs.readFileSync(
          out + "/npm-v5-poison-" + field + ".log",
          "utf8",
        );
        assert.ok(pattern.test(log));
        assert.ok(!log.includes("calculator service started successfully"));
        assert.equal(
          calls
            .slice(before)
            .filter((x) =>
              ["eth_getBalance", "eth_call", "ergo-token-supply"].includes(
                x.method,
              ),
            ).length,
          0,
        );
        assert.equal(
          (
            await db.query(
              "SELECT count(*)::int AS count FROM observation_entity",
            )
          ).rows[0].count,
          1,
        );
        const state = (
          await db.query(
            "SELECT * FROM avalanche_safety_state WHERE scanner=$1",
            ["avalanche"],
          )
        ).rows[0];
        assert.equal(state[field], value);
        await db.query(
          'UPDATE avalanche_safety_state SET "chainId"=$1,"holdReason"=$2 WHERE scanner=$3',
          [
            firstResult.state.chainId,
            firstResult.state.holdReason,
            "avalanche",
          ],
        );
        events.push({
          name: "isolated-persisted-" + field + "-refusal",
          exit: 1,
          newBalanceReads: 0,
          observations: 1,
        });
      }
    } finally {
      await db.end();
    }
    command(
      "pg-createdb-mutant",
      bin + "/createdb.exe",
      [
        "-h",
        "127.0.0.1",
        "-p",
        String(pgPort),
        "-U",
        "fixture",
        "avalanche_mutant",
      ],
      { ...process.env, PGPASSWORD: credential },
    );
    const before = calls.length,
      mutant = await startNpm(
        "v5-mutant",
        "avalanche_mutant",
        "scanner-update-noop",
      );
    assert.equal(mutant.exit, 1);
    assert.ok(!mutant.ready && !mutant.timedOut);
    const mutantLog = fs.readFileSync(out + "/npm-v5-mutant.log", "utf8");
    assert.ok(/unavailable|qualified|safety|frontier/i.test(mutantLog));
    assert.ok(!mutantLog.includes("calculator service started successfully"));
    assert.equal(
      calls
        .slice(before)
        .filter((x) =>
          ["eth_getBalance", "eth_call", "ergo-token-supply"].includes(
            x.method,
          ),
        ).length,
      0,
    );
    events.push({
      name: "one-actual-created-scanner-update-noop-refused",
      exit: 1,
      newBalanceReads: 0,
    });
    assert.equal(
      events.filter((x) => x.name === "transport-fixture-error").length,
      0,
    );
    passed = true;
    console.log(
      "Actual mainnet AVAX+JOE Service PG/start/restart/poison/mutant PASS",
    );
  } finally {
    stopOwned(activeChild);
    if (running || fs.existsSync(data + "/postmaster.pid")) {
      command("pg-final-stop", bin + "/pg_ctl.exe", [
        "-D",
        data,
        "-w",
        "-m",
        "fast",
        "stop",
      ]);
      running = false;
    }
    assert.ok(!initialized || !fs.existsSync(data + "/postmaster.pid"));
    if (server) {
      server.closeAllConnections();
      await new Promise((resolve) => server.close(resolve));
    }
    for (const row of tracked)
      assert.ok(!sameIdentity(row), "Owned process identity remains active");
    verifyInputs();
    const lifecycle = {
      events,
      calls,
      tracked,
      ownClusterStopped:
        initialized && !fs.existsSync(data + "/postmaster.pid"),
      ephemeralPasswordAbsent: !fs.existsSync(out + "/ephemeral-password"),
    };
    fs.writeFileSync(
      receiptTarget,
      JSON.stringify(
        {
          schema: "rosen-service-portable-process-replay.v1",
          pass: passed,
          lifecycle,
          sourcePins,
          dependencyPins,
          supportPins,
          generatedPins: generatedPins.filter(
            (p) => p.role !== "copied-preimage",
          ),
          copiedPreimages: generatedPins.filter(
            (p) => p.role === "copied-preimage",
          ),
          toolchainPins,
          sourceWrites: 0,
          dependencyWrites: 0,
          limits: [
            "Synthetic loopback mainnet-chain fixture",
            "Eight unrelated legacy starts isolated; their full jobs remain unqualified",
            "Prepared dependency closure, not normal registry installation",
            "No public actions, live signing, broadcast, deployment or funds",
          ],
        },
        null,
        2,
      ) + "\n",
      { flag: "wx" },
    );
    fs.writeFileSync(
      out + "/runtime-lifecycle-v5.json",
      JSON.stringify(
        {
          events,
          calls,
          ownClusterStopped:
            initialized && !fs.existsSync(data + "/postmaster.pid"),
          ephemeralPasswordAbsent: !fs.existsSync(out + "/ephemeral-password"),
          processScope:
            "Actual npm start:prod, original Avalanche/main/datasource/calculator/health; eight unrelated starts explicitly isolated",
        },
        null,
        2,
      ) + "\n",
      { flag: "wx" },
    );
  }
})().catch((error) => {
  console.error(
    String(error).replaceAll(credential, "[ephemeral fixture credential]"),
  );
  process.exitCode = 1;
});
