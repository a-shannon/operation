import fs from "node:fs";
import path from "node:path";
import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { fileURLToPath, pathToFileURL } from "node:url";
const own = path.dirname(fileURLToPath(import.meta.url)).replaceAll("\\", "/"),
  out = process.env.SERVICE_FIXTURE_OUTPUT,
  fixture = process.env.SERVICE_FIXTURE_ROOT;
if (process.argv[1]?.replaceAll("\\", "/").endsWith("/src/main.ts")) {
  const req = createRequire(fixture + "/package.json"),
    phase = process.env.SERVICE_FIXTURE_PHASE,
    expected = JSON.parse(fs.readFileSync(out + "/expected.json"));
  let polling = false;
  const timer = setInterval(async () => {
    if (polling) return;
    polling = true;
    try {
      const logModule = await import(
        pathToFileURL(req.resolve("@rosen-bridge/abstract-logger")).href
      );
      try {
        logModule.DefaultLogger.getInstance();
      } catch (error) {
        if (String(error).includes("DefaultLogger.init")) return;
        throw error;
      }
      const scannerService = (
          await import(
            pathToFileURL(fixture + "/src/scanner/scanner-service.ts").href
          )
        ).default,
        scanner = scannerService.getAvalancheScanner();
      if (!scanner) return;
      const source = (
          await import(pathToFileURL(fixture + "/src/data-source.ts").href)
        ).default,
        evm = await import(
          pathToFileURL(req.resolve("@rosen-bridge/evm-scanner")).href
        ),
        core = await import(
          pathToFileURL(req.resolve("@rosen-bridge/abstract-scanner")).href
        ),
        obs = await import(
          pathToFileURL(
            req.resolve("@rosen-bridge/abstract-observation-extractor"),
          ).href
        ),
        calc = await import(
          pathToFileURL(req.resolve("@rosen-ui/asset-calculator")).href
        );
      assert.ok(scanner instanceof evm.AvalancheRpcScanner);
      await scanner.assertUsable();
      const state = await source
          .getRepository(evm.AvalancheSafetyState)
          .findOneByOrFail({ scanner: "avalanche" }),
        blocks = await source
          .getRepository(core.BlockEntity)
          .findBy({ scanner: "avalanche" }),
        observations = await source.getRepository(obs.ObservationEntity).find(),
        assets = (
          await source.getRepository(calc.LockedAssetEntity).find()
        ).sort((a, b) => a.tokenId.localeCompare(b.tokenId)),
        bridged = (
          await source.getRepository(calc.BridgedAssetEntity).find()
        ).sort((a, b) => a.tokenId.localeCompare(b.tokenId)),
        tokens = (await source.getRepository(calc.TokenEntity).find()).sort(
          (a, b) => a.id.localeCompare(b.id),
        );
      if (
        !fs.existsSync(process.env.SERVICE_FIXTURE_HEALTH_REPORT) ||
        assets.length !== 2 ||
        bridged.length !== 2
      )
        return;
      const health = JSON.parse(
        fs.readFileSync(process.env.SERVICE_FIXTURE_HEALTH_REPORT),
      );
      if (health.avalanche_scanner !== "Healthy") return;
      assert.equal(state.chainId, "43114");
      assert.equal(state.sourceId, "provider-a");
      assert.equal(state.initialHeight, 0);
      assert.equal(state.holdReason, null);
      assert.equal(state.finalizedHeight, 1);
      assert.equal(state.finalizedHash, "0x" + "aa".repeat(32));
      assert.equal(blocks.length, 1, "block count");
      assert.equal(blocks[0].status, core.PROCEED, "block status");
      assert.equal(observations.length, 1, "observation count");
      const observation = observations[0];
      for (const [key, value] of Object.entries({
        fromChain: "avalanche",
        toChain: "ergo",
        sourceChainTokenId: expected.joe.avalanche.tokenId,
        targetChainTokenId: expected.joe.ergo.tokenId,
        amount: "100",
        bridgeFee: "2",
        networkFee: "3",
        fromAddress: expected.transactionFrom.toLowerCase(),
        toAddress: "9iMjQx8PzwBKXRvsFUJFJAPoy31znfEeBUGz8DRkcnJX4rJYjVd",
        height: 1,
        extractor: "avalanche-rpc-extractor",
        sourceTxId: expected.transactionHash,
        sourceBlockId: "0x" + "aa".repeat(32),
      }))
        assert.equal(observation[key], value, key);
      for (const [id, amount] of [
        ["avax", 3000000000n],
        [expected.joe.avalanche.tokenId, 7000000000n],
      ]) {
        const asset = assets.find((row) => row.tokenId === id);
        assert.equal(asset.address.toLowerCase(), expected.balanceAddress);
        assert.equal(asset.amount, amount);
        const token = tokens.find((row) => row.id === id);
        assert.equal(token.decimal, 18);
        assert.equal(token.significantDecimal, 9);
        assert.equal(
          token.ergoSideTokenId,
          id === "avax" ? "0b".repeat(32) : expected.joe.ergo.tokenId,
        );
        const bridge = bridged.find((row) => row.tokenId === id);
        assert.equal(bridge.chain, "ergo");
        assert.equal(bridge.bridgedTokenId, token.ergoSideTokenId);
        assert.equal(bridge.amount, 20000000000n);
      }
      const result = {
        phase,
        pid: process.pid,
        actualNpmMain: true,
        entities: source.entityMetadatas.length,
        migrations: (await source.query("SELECT name FROM migrations")).length,
        state,
        blocks,
        observations,
        assets,
        bridged,
        tokens,
        health,
        assetAmountTypes: assets.map((row) => typeof row.amount),
      };
      assert.equal(result.entities, 22);
      assert.equal(result.migrations, 40);
      fs.writeFileSync(
        out + "/result-" + phase + ".json",
        JSON.stringify(
          result,
          (_k, v) => (typeof v === "bigint" ? v.toString() : v),
          2,
        ) + "\n",
        { flag: "wx" },
      );
      clearInterval(timer);
      console.log("SERVICE_FIXTURE_READY:" + phase);
      const shutdown = setInterval(() => {
        if (fs.existsSync(out + "/shutdown-" + phase)) {
          clearInterval(shutdown);
          process.emit("SIGTERM");
        }
      }, 50);
    } catch (error) {
      clearInterval(timer);
      console.error("SERVICE_FIXTURE_PROBE_FAILURE:" + String(error));
      process.exit(1);
    } finally {
      polling = false;
    }
  }, 100);
}
