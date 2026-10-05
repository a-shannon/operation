import { register } from 'node:module';
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import { pathToFileURL } from 'node:url';
register('./isolation.mjs', import.meta.url);

if (process.argv.some(arg => arg.replaceAll('\\', '/').endsWith('/src/index.ts'))) {
  const root = process.env.WATCHER_REPLAY_ROOT;
  const output = process.env.WATCHER_REPLAY_OUTPUT;
  const phase = process.env.WATCHER_REPLAY_PHASE;
  const load = file => import(pathToFileURL(path.join(root, file)).href);
  await load('src/bootstrap.ts');
  const { CreateScanner } = await load('src/utils/scanner.ts');
  const { dataSource } = await load('config/dataSource.ts');
  const { default: MinimumFeeHandler } = await load('src/utils/MinimumFeeHandler.ts');
  MinimumFeeHandler.init = async () => console.log('WATCHER_UNRELATED_FEE_INIT_ISOLATED');
  const initialize = CreateScanner.init;
  CreateScanner.init = async () => {
    await initialize();
    CreateScanner.getInstance().getErgoScanner().update = async () => console.log('WATCHER_UNRELATED_ERGO_UPDATE_ISOLATED');
  };
  let ending = false;
  let polling = false;
  let qualificationBusyRetries = 0;
  const timer = setInterval(async () => {
    if (ending || polling || !dataSource.isInitialized) return;
    polling = true;
    try {
      const safety = await dataSource.query('SELECT * FROM avalanche_safety_state');
      if (safety.length !== 1 || safety[0].finalizedHeight !== 1 || safety[0].holdReason !== null) return;
      await CreateScanner.getInstance().getObservationScanner().assertObservation(1, '0x' + 'aa'.repeat(32));
      const frontier = await dataSource.query('SELECT * FROM extractor_status_entity');
      if (!frontier.some(row => row.scannerId === 'avalanche' && row.extractorId === 'avalanche-rpc-extractor' && row.updateHeight === 1)) return;
      const observations = await dataSource.query('SELECT * FROM observation_entity');
      assert.equal(observations.length, phase.startsWith('negative') ? 0 : 1);
      if (observations.length) {
        const obs = observations[0];
        assert.equal(obs.sourceChainTokenId, '0x6e84a6216ea6dacc71ee8e6b0a5b7322eebc0fdd');
        assert.equal(obs.targetChainTokenId, '0c'.repeat(32));
        assert.equal(obs.amount, '100');
        assert.equal(obs.bridgeFee, '2');
        assert.equal(obs.networkFee, '3');
        assert.equal(obs.fromChain, 'avalanche');
        assert.equal(obs.toChain, 'ergo');
      }
      const blocks = await dataSource.query('SELECT * FROM block_entity');
      const migrations = await dataSource.query('SELECT * FROM migrations');
      fs.writeFileSync(path.join(output, 'state-' + phase + '.json'), JSON.stringify({ phase, pid: process.pid, safety, frontier, observations, blocks, migrationCount: migrations.length, qualificationBusyRetries }, null, 2) + '\n', { flag: 'wx' });
      ending = true;
      clearInterval(timer);
      console.log('WATCHER_FRONTIER_READY:' + phase);
    } catch (error) {
      if (String(error).includes('no such table')) return;
      if (String(error) === 'Error: Avalanche scanner update is still running') { qualificationBusyRetries++; return; }
      console.error('WATCHER_REPLAY_FATAL:' + String(error));
      clearInterval(timer);
      process.exit(1);
    } finally { polling = false; }
  }, 100);
  setInterval(async () => {
    if (!fs.existsSync(path.join(output, 'shutdown-' + phase))) return;
    clearInterval(timer);
    if (dataSource.isInitialized) await dataSource.destroy();
    console.log('WATCHER_OWNED_DB_CLOSED:' + phase);
    process.exit(0);
  }, 100);
}
