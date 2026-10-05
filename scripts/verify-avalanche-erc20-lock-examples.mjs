import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { relative, resolve } from "node:path";
import { pathToFileURL } from "node:url";

/** Select prepared source checkouts with explicit roots and no artifact defaults. */
const readRoots = () => {
  const values = new Map();
  const args = process.argv.slice(2);
  for (let index = 0; index < args.length; index += 2) {
    const flag = args[index];
    assert.ok(
      ["--ui-root", "--utils-root"].includes(flag),
      "Unknown root option",
    );
    assert.ok(
      args[index + 1] && !args[index + 1].startsWith("--"),
      "Missing root value",
    );
    assert.ok(!values.has(flag), "Duplicate root option");
    values.set(flag, resolve(args[index + 1]));
  }
  assert.equal(values.size, 2, "Supply --ui-root and --utils-root");
  return { ui: values.get("--ui-root"), utils: values.get("--utils-root") };
};

/** Resolve declared dependencies from the package that consumes them. */
const dependency = async (anchor, name) => {
  const imported = await import(
    pathToFileURL(createRequire(anchor).resolve(name)).href
  );
  return imported.default && Object.keys(imported).length === 1
    ? imported.default
    : imported;
};

/** Compare all nine request fields with the independent frozen example. */
const request = (actual, expected) => {
  assert.ok(actual, "Expected a decoded bridge request");
  const fields = [
    "toChain",
    "toAddress",
    "bridgeFee",
    "networkFee",
    "fromAddress",
    "sourceChainTokenId",
    "amount",
    "targetChainTokenId",
    "sourceTxId",
  ];
  const selected = Object.fromEntries(
    fields.map((field) => [field, actual[field]]),
  );
  assert.deepEqual(selected, expected);
  return selected;
};

let server;
try {
  const roots = readRoots();
  const fixtureFile = new URL(
    "./avalancheErc20LockTestData.json",
    import.meta.url,
  );
  const fixtureBytes = readFileSync(fixtureFile);
  const fixture = JSON.parse(fixtureBytes);
  assert.equal(fixture.chainId, 43114);
  assert.equal(fixture.counterpartDecimals, 8);
  const uiAnchor = resolve(roots.ui, "apps/rosen/package.json");
  const utilsAnchor = resolve(
    roots.utils,
    "packages/rosen-extractor/package.json",
  );
  const { ViteNodeServer } = await dependency(uiAnchor, "vite-node/server");
  const { ViteNodeRunner } = await dependency(uiAnchor, "vite-node/client");
  const { createServer } = await dependency(
    createRequire(uiAnchor).resolve("vite-node/server"),
    "vite",
  );
  server = await createServer({
    root: roots.ui,
    configFile: false,
    server: { middlewareMode: true, watch: null, hmr: false, ws: false },
    optimizeDeps: { noDiscovery: true, include: [] },
    resolve: {
      alias: [
        {
          find: "@rosen-network/avalanche/server",
          replacement: resolve(roots.ui, "networks/avalanche/src/server.ts"),
        },
        {
          find: "@rosen-network/avalanche",
          replacement: resolve(roots.ui, "networks/avalanche/src/index.ts"),
        },
      ],
    },
  });
  const pins = new Map();
  /** Pin consumed source and dependency bytes while keeping output paths relative. */
  const pin = (file) => {
    if (!existsSync(file)) return;
    const normalized = resolve(file);
    const repository = Object.keys(roots).find((name) => {
      const rel = relative(roots[name], normalized);
      return rel && !rel.startsWith("..") && !rel.includes(":");
    });
    if (!repository) return;
    const bytes = readFileSync(normalized);
    const key =
      repository +
      ":" +
      relative(roots[repository], normalized).replaceAll("\\", "/");
    const value = {
      repository,
      path: key.slice(repository.length + 1),
      bytes: bytes.length,
      sha256: createHash("sha256").update(bytes).digest("hex"),
    };
    if (pins.has(key))
      assert.deepEqual(value, pins.get(key), "Consumed input changed");
    pins.set(key, value);
  };
  const loader = new ViteNodeServer(server);
  const runner = new ViteNodeRunner({
    root: roots.ui,
    fetchModule: (id) => {
      pin(id.replace(/^\/@fs\//, ""));
      return loader.fetchModule(id);
    },
    resolveId: (id, importer) => loader.resolveId(id, importer),
  });
  /** Execute exact producer/extractor TypeScript through the existing Vite source loader. */
  const source = (repository, path) => {
    const file = resolve(roots[repository], path);
    pin(file);
    return runner.executeFile(file);
  };
  /** Keep WASM and singleton libraries in the same source runner module family. */
  const library = (anchor, name) => {
    const file = createRequire(anchor).resolve(name);
    pin(file);
    return runner.executeFile(file);
  };
  const { Transaction, Interface } = await library(uiAnchor, "ethers");
  const wasm = await library(uiAnchor, "ergo-lib-wasm-nodejs");
  const { TokenMap } = await library(uiAnchor, "@rosen-bridge/tokens");
  const { AddressManager } = await library(
    utilsAnchor,
    "@rosen-bridge/address-manager",
  );
  const codec = await source("utils", "packages/address-codec/lib/index.ts");
  const { EvmRpcRosenExtractor } = await source(
    "utils",
    "packages/rosen-extractor/lib/getRosenData/evm/evmRpcRosenExtractor.ts",
  );
  const { EvmRosenExtractor } = await source(
    "utils",
    "packages/rosen-extractor/lib/getRosenData/evm/evmRosenExtractor.ts",
  );
  const { ErgoNodeRosenExtractor } = await source(
    "utils",
    "packages/rosen-extractor/lib/getRosenData/ergo/ergoNodeRosenExtractor.ts",
  );
  const { createLockBox } = await source("ui", "networks/ergo/src/utils.ts");
  const { AvalancheNetwork } = await source(
    "ui",
    "networks/avalanche/src/client.ts",
  );
  const { createAvalancheAppActions } = await source(
    "ui",
    "apps/rosen/src/networks/avalanche/actions.ts",
  );
  const { createAvalancheAppProvider } = await source(
    "ui",
    "apps/rosen/src/networks/avalanche/provider.ts",
  );
  AddressManager.init(codec.chainValidators, codec.chainDecoders);
  const { token, lock, ergoLock, ergoDestination } = fixture;
  const counterpart = fixture.outbound.decoded.targetChainTokenId;
  const native = {
    tokenId: "avax",
    name: "AVAX",
    decimals: 18,
    type: "native",
    residency: "native",
    extra: {},
  };
  const tokens = new TokenMap();
  await tokens.updateConfigByJson([
    {
      avalanche: native,
      ergo: {
        ...native,
        tokenId: fixture.nativeCounterpart,
        decimals: 8,
        type: "token",
        residency: "wrapped",
      },
    },
    {
      avalanche: token,
      ergo: {
        ...token,
        tokenId: counterpart,
        decimals: 8,
        type: "token",
        residency: "wrapped",
      },
    },
  ]);
  let rpcCalls = 0;
  /** Permit in-memory chain identity reads only; no URL or transport is constructed. */
  const rpc = {
    send: async (method) => {
      assert.equal(method, "eth_chainId", "Unexpected RPC method");
      rpcCalls += 1;
      return "0xa86a";
    },
  };
  const config = {
    chainId: 43114,
    rosenChainIndex: 100,
    lockAddress: lock,
    nextHeightInterval: 50,
    gasReserveLimit: 30000n,
  };
  const provider = createAvalancheAppProvider(rpc, config.chainId);
  const actions = createAvalancheAppActions(
    config,
    provider,
    async () => tokens,
  );
  /** Construct the real facade, with optional isolated server-result faults for its own contract. */
  const network = (fault) =>
    new AvalancheNetwork({
      ...config,
      ...actions,
      getTokenMap: async () => tokens,
      getWalletChainId: async () => 43114n,
      ...(fault
        ? {
            generateTxParameters: async (...args) => ({
              ...(await actions.generateTxParameters(...args)),
              ...fault,
            }),
          }
        : {}),
    });
  const actualNetwork = network();
  const metadata = await actualNetwork.generateLockData(
    "ergo",
    ergoDestination,
    "3",
    "2",
  );
  assert.equal(metadata, fixture.outbound.metadata);
  const sender = fixture.outbound.decoded.fromAddress;
  const args = [token.tokenId, lock, sender, 10n, metadata, token, "avalanche"];
  const parameters = await actualNetwork.generateTxParameters(...args);
  assert.deepEqual(parameters, {
    to: token.tokenId,
    from: sender,
    data: fixture.outbound.calldata,
    chainId: "0xa86a",
  });
  const transfer = new Interface(["function transfer(address,uint256)"]);
  const transferFields = transfer.decodeFunctionData(
    "transfer",
    parameters.data.slice(0, 138),
  );
  assert.equal(transferFields[0].toLowerCase(), lock);
  assert.equal(transferFields[1], 100000000000n);
  assert.equal(transferFields[1].toString(), fixture.outbound.rawAmount);
  assert.equal(parameters.data.slice(138), metadata);
  // Frozen public signature components reconstruct bytes without invoking a signing key.
  const envelope = {
    type: 2,
    nonce: 10,
    gasLimit: 100000n,
    maxPriorityFeePerGas: 500000000n,
    maxFeePerGas: 48978500000n,
    chainId: 43114n,
    accessList: [],
    signature: {
      r: `0x${"01".repeat(32)}`,
      s: `0x${"02".repeat(32)}`,
      yParity: 0,
    },
  };
  const transaction = Transaction.from({
    ...envelope,
    to: parameters.to,
    data: parameters.data,
    value: 0n,
  });
  assert.equal(transaction.chainId, 43114n);
  assert.equal(transaction.serialized, fixture.outbound.serializedTransaction);
  const rpcExtractor = new EvmRpcRosenExtractor(
    lock,
    tokens,
    "avalanche",
    "avax",
  );
  const universalExtractor = new EvmRosenExtractor(
    lock,
    tokens,
    "avalanche",
    "avax",
  );
  const outbound = request(
    rpcExtractor.get(transaction),
    fixture.outbound.decoded,
  );
  request(
    universalExtractor.get(transaction.serialized.slice(2)),
    fixture.outbound.decoded,
  );
  const returnId = fixture.inbound.decoded.sourceTxId;
  const candidate = createLockBox(
    ergoLock,
    100,
    counterpart,
    100n,
    "avalanche",
    lock,
    ergoLock,
    2n,
    3n,
  );
  const box = wasm.ErgoBox.from_box_candidate(
    candidate,
    wasm.TxId.from_str(returnId),
    0,
  );
  const rawBox = JSON.parse(box.to_json());
  assert.equal(rawBox.boxId, fixture.inbound.boxId);
  assert.equal(rawBox.additionalRegisters.R4, fixture.inbound.r4);
  const returnTransaction = {
    id: returnId,
    inputs: [],
    dataInputs: [],
    outputs: [
      {
        ...rawBox,
        value: BigInt(rawBox.value),
        assets: rawBox.assets.map((asset) => ({
          ...asset,
          amount: BigInt(asset.amount),
        })),
      },
    ],
  };
  const returnExtractor = new ErgoNodeRosenExtractor(ergoLock, tokens);
  const inbound = request(
    returnExtractor.get(returnTransaction),
    fixture.inbound.decoded,
  );
  const negativeControlsPassed = [];
  /** Record each isolated refusal only after its actual owning consumer rejects. */
  const refuses = async (name, check) => {
    await check();
    negativeControlsPassed.push(name);
  };
  await refuses("UI wrong ERC20 target", () =>
    assert.rejects(
      network({ to: lock }).generateTxParameters(...args),
      /Invalid Avalanche transaction parameters/,
    ),
  );
  await refuses("UI nonzero ERC20 value", () =>
    assert.rejects(
      network({ value: "0x1" }).generateTxParameters(...args),
      /Invalid Avalanche transaction parameters/,
    ),
  );
  await refuses("UI wrong selected asset", () =>
    assert.rejects(
      actualNetwork.generateTxParameters("avax", ...args.slice(1)),
      /Invalid Avalanche asset or source chain/,
    ),
  );
  const malformed = Transaction.from({
    ...envelope,
    to: token.tokenId,
    data: "0x00",
    value: 0n,
  });
  await refuses("RPC extractor malformed ERC20 calldata", () =>
    assert.equal(rpcExtractor.get(malformed), undefined),
  );
  await refuses("universal extractor malformed ERC20 calldata", () =>
    assert.equal(
      universalExtractor.get(malformed.serialized.slice(2)),
      undefined,
    ),
  );
  const wrongAsset = structuredClone(returnTransaction);
  wrongAsset.outputs[0].assets[0].tokenId = "88".repeat(32);
  await refuses("Ergo extractor unknown counterpart", () =>
    assert.equal(returnExtractor.get(wrongAsset), undefined),
  );
  for (const value of pins.values())
    pin(resolve(roots[value.repository], value.path));
  assert.deepEqual(
    readFileSync(fixtureFile),
    fixtureBytes,
    "Fixture changed during replay",
  );
  console.log(
    JSON.stringify(
      {
        scope: "local mainnet JOE source producer and generic extractor joins",
        chainId: 43114,
        counterpartDecimals: 8,
        rpcCalls,
        sourcePins: [...pins.values()],
        fixture: {
          bytes: fixtureBytes.length,
          sha256: createHash("sha256").update(fixtureBytes).digest("hex"),
        },
        outbound: {
          parameters,
          rawAmount: transferFields[1].toString(),
          serializedTransaction: transaction.serialized,
          decoded: outbound,
        },
        inbound: {
          transactionId: returnId,
          boxId: rawBox.boxId,
          r4: rawBox.additionalRegisters.R4,
          decoded: inbound,
        },
        negativeControlsPassed,
        limits:
          "Generic extractors decode metadata; receipt removal/Transfer evidence belongs to the observation extractor. No signing, broadcast, registry-install or deployment qualification.",
      },
      null,
      2,
    ),
  );
} finally {
  await server?.close();
}
