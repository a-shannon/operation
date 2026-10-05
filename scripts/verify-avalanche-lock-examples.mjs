import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";

/** Resolve explicit checkout roots without relying on an author's artifact tree. */
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

let sourceServer;
let sourceRunner;

/** Transform original TypeScript sources without changing their package module formats. */
const source = (root, path) => sourceRunner.executeFile(resolve(root, path));

/** Load a declared installed dependency using its consuming package's resolver. */
const dependency = async (anchor, name) => {
  const require = createRequire(anchor);
  const imported = await import(pathToFileURL(require.resolve(name)).href);
  return imported.default && Object.keys(imported).length === 1
    ? imported.default
    : imported;
};

/** Select and assert every RCS-003 bridge-request field independently of raw metadata. */
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

/** Exercise real producers and both EVM extractors using non-broadcast synthetic envelopes. */
const verify = async () => {
  const roots = readRoots();
  const uiAnchor = resolve(roots.ui, "apps/rosen/package.json");
  const utilsAnchor = resolve(
    roots.utils,
    "packages/rosen-extractor/package.json",
  );
  const { ViteNodeServer } = await dependency(uiAnchor, "vite-node/server");
  const { ViteNodeRunner } = await dependency(uiAnchor, "vite-node/client");
  const viteAnchor = createRequire(uiAnchor).resolve("vite-node/server");
  const { createServer } = await dependency(viteAnchor, "vite");
  sourceServer = await createServer({
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
  const sourceLoader = new ViteNodeServer(sourceServer);
  sourceRunner = new ViteNodeRunner({
    root: roots.ui,
    fetchModule: (id) => sourceLoader.fetchModule(id),
    resolveId: (id, importer) => sourceLoader.resolveId(id, importer),
  });
  /** Use the source runner's module family for singleton and WASM dependencies too. */
  const fixtureDependency = (anchor, name) =>
    sourceRunner.executeFile(createRequire(anchor).resolve(name));
  const { Transaction } = await fixtureDependency(uiAnchor, "ethers");
  const wasm = await fixtureDependency(uiAnchor, "ergo-lib-wasm-nodejs");
  const { TokenMap } = await fixtureDependency(
    uiAnchor,
    "@rosen-bridge/tokens",
  );
  const { AddressManager } = await fixtureDependency(
    utilsAnchor,
    "@rosen-bridge/address-manager",
  );
  const codec = await source(
    roots.utils,
    "packages/address-codec/lib/index.ts",
  );
  const { EvmRpcRosenExtractor } = await source(
    roots.utils,
    "packages/rosen-extractor/lib/getRosenData/evm/evmRpcRosenExtractor.ts",
  );
  const { EvmRosenExtractor } = await source(
    roots.utils,
    "packages/rosen-extractor/lib/getRosenData/evm/evmRosenExtractor.ts",
  );
  const { ErgoNodeRosenExtractor } = await source(
    roots.utils,
    "packages/rosen-extractor/lib/getRosenData/ergo/ergoNodeRosenExtractor.ts",
  );
  const { createLockBox } = await source(
    roots.ui,
    "networks/ergo/src/utils.ts",
  );
  const { AvalancheNetwork } = await source(
    roots.ui,
    "networks/avalanche/src/client.ts",
  );
  const { createAvalancheAppActions } = await source(
    roots.ui,
    "apps/rosen/src/networks/avalanche/actions.ts",
  );
  const { createAvalancheAppProvider } = await source(
    roots.ui,
    "apps/rosen/src/networks/avalanche/provider.ts",
  );
  AddressManager.init(codec.chainValidators, codec.chainDecoders);

  const lock = `0x${"11".repeat(20)}`;
  const ergoLock =
    "2CBjjwbY9Rokj7Ue9qT2pbMR2WhLDmdcL2V9pRgCEEMks9QRXiQ7K73wNANLAczY1XLimkNBu6Nt3hW1zACrk4zQxu";
  const ergoDestination = "9iMjQx8PzwBKXRvsFUJFJAPoy31znfEeBUGz8DRkcnJX4rJYjVd";
  const counterpart = "55".repeat(32);
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
        tokenId: counterpart,
        decimals: 8,
        type: "token",
        residency: "wrapped",
      },
    },
  ]);
  let rpcCalls = 0;
  /** Permit only an in-memory identity read; no endpoint is constructed. */
  const rpc = {
    send: async (method) => {
      assert.equal(method, "eth_chainId", "Unexpected RPC method");
      rpcCalls += 1;
      return "0xa869";
    },
  };
  const config = {
    chainId: 43113,
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
  const network = new AvalancheNetwork({
    ...config,
    ...actions,
    getTokenMap: async () => tokens,
    getWalletChainId: async () => 43113n,
  });
  const calldata = await network.generateLockData(
    "ergo",
    ergoDestination,
    "3",
    "2",
  );

  // Fixed signature components are test data, not an invocation of a signing key.
  const envelope = {
    type: 2,
    nonce: 10,
    gasLimit: 21000n,
    maxPriorityFeePerGas: 500000000n,
    maxFeePerGas: 48978500000n,
    chainId: 43113n,
    accessList: [],
    signature: {
      r: `0x${"01".repeat(32)}`,
      s: `0x${"02".repeat(32)}`,
      yParity: 0,
    },
  };
  const preimage = Transaction.from({
    ...envelope,
    to: lock,
    data: `0x${calldata}`,
    value: 100000000000n,
  });
  const sender = preimage.from.toLowerCase();
  const parameters = await network.generateTxParameters(
    "avax",
    lock,
    sender,
    10n,
    calldata,
    native,
    "avalanche",
  );
  assert.deepEqual(parameters, {
    to: lock,
    from: sender,
    data: `0x${calldata}`,
    value: "0x174876e800",
    chainId: "0xa869",
  });
  const transaction = Transaction.from({
    ...envelope,
    to: parameters.to,
    data: parameters.data,
    value: BigInt(parameters.value),
    chainId: BigInt(parameters.chainId),
  });
  assert.equal(transaction.hash, preimage.hash);
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
  const outboundExpected = {
    toChain: "ergo",
    toAddress: ergoDestination,
    bridgeFee: "2",
    networkFee: "3",
    fromAddress: sender,
    sourceChainTokenId: "avax",
    amount: "10",
    targetChainTokenId: counterpart,
    sourceTxId: transaction.hash,
  };
  const outbound = request(rpcExtractor.get(transaction), outboundExpected);
  request(
    universalExtractor.get(transaction.serialized.slice(2)),
    outboundExpected,
  );

  const returnId = "66".repeat(32);
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
  const inbound = request(returnExtractor.get(returnTransaction), {
    toChain: "avalanche",
    toAddress: lock,
    bridgeFee: "2",
    networkFee: "3",
    fromAddress: ergoLock,
    sourceChainTokenId: counterpart,
    amount: "100",
    targetChainTokenId: "avax",
    sourceTxId: returnId,
  });
  const r4 = rawBox.additionalRegisters.R4;
  assert.deepEqual(
    wasm.Constant.decode_from_base16(r4)
      .to_coll_coll_byte()
      .map((part) => Buffer.from(part).toString()),
    ["avalanche", lock, "3", "2", ergoLock],
  );

  const negatives = [];
  /** Record a refusal only after an isolated control actually fails its consumer. */
  const refuses = async (name, check) => {
    await check();
    negatives.push(name);
  };
  await refuses("outbound wrong token", () =>
    assert.rejects(
      network.generateTxParameters(
        "other",
        lock,
        sender,
        10n,
        calldata,
        native,
        "avalanche",
      ),
    ),
  );
  await refuses("outbound wrong custody", () =>
    assert.rejects(
      network.generateTxParameters(
        "avax",
        `0x${"33".repeat(20)}`,
        sender,
        10n,
        calldata,
        native,
        "avalanche",
      ),
    ),
  );
  await refuses("outbound malformed metadata", () =>
    assert.rejects(
      network.generateTxParameters(
        "avax",
        lock,
        sender,
        10n,
        calldata.slice(2),
        native,
        "avalanche",
      ),
    ),
  );
  await refuses("outbound wrong source chain", () =>
    assert.rejects(
      network.generateTxParameters(
        "avax",
        lock,
        sender,
        10n,
        calldata,
        native,
        "ethereum",
      ),
    ),
  );
  await refuses("provider wrong chain identity", () =>
    assert.rejects(
      createAvalancheAppProvider(
        { send: async () => "0xa86a" },
        43113,
      ).getNetwork(),
    ),
  );
  await refuses("network-specific malformed calldata", () =>
    assert.equal(
      rpcExtractor.get(
        Transaction.from({
          ...envelope,
          to: lock,
          data: "0x00",
          value: transaction.value,
        }),
      ),
      undefined,
    ),
  );
  await refuses("universal wrong custody", () =>
    assert.equal(
      universalExtractor.get(
        Transaction.from({
          ...envelope,
          to: `0x${"33".repeat(20)}`,
          data: transaction.data,
          value: transaction.value,
        }).serialized.slice(2),
      ),
      undefined,
    ),
  );
  for (const fault of [
    "token",
    "custody",
    "metadata",
    "destination identity",
  ]) {
    const changed = structuredClone(returnTransaction);
    const output = changed.outputs[0];
    if (fault === "token") output.assets[0].tokenId = "77".repeat(32);
    if (fault === "custody") output.ergoTree = "00";
    if (fault === "metadata") output.additionalRegisters.R4 = "00";
    if (fault === "destination identity") {
      const parts = wasm.Constant.decode_from_base16(r4).to_coll_coll_byte();
      parts[0] = Buffer.from("ethereum");
      output.additionalRegisters.R4 =
        wasm.Constant.from_coll_coll_byte(parts).encode_to_base16();
    }
    await refuses(`return wrong ${fault}`, () =>
      assert.equal(returnExtractor.get(changed), undefined),
    );
  }
  console.log(
    JSON.stringify(
      {
        scope: "synthetic local source producer/extractor joins",
        chainId: 43113,
        rpcCalls,
        outbound: {
          parameters,
          serializedTransaction: transaction.serialized,
          calldata,
          decoded: outbound,
        },
        inbound: {
          transactionId: returnId,
          boxId: rawBox.boxId,
          r4,
          r4Fields: ["avalanche", lock, "3", "2", ergoLock],
          decoded: inbound,
        },
        negativeControlsPassed: negatives,
      },
      null,
      2,
    ),
  );
};

try {
  await verify();
} finally {
  await sourceServer?.close();
}
