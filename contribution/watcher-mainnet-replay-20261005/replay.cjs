const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const http = require('node:http');
const cp = require('node:child_process');
const crypto = require('node:crypto');
const assert = require('node:assert/strict');
const { pathToFileURL } = require('node:url');
const args = process.argv.slice(2);
const options = {};
for (let i = 0; i < args.length; i += 2) {
  assert.ok(['--watcher-root', '--npm-cli', '--work-root', '--receipt'].includes(args[i]), 'Unknown replay option');
  assert.ok(args[i + 1] && !options[args[i]], 'Missing or duplicate replay option');
  options[args[i]] = path.resolve(args[i + 1]);
}
assert.ok(options['--watcher-root'] && options['--npm-cli'], 'Provide --watcher-root and --npm-cli');
assert.equal(process.versions.node, '22.18.0', 'Replay is pinned to Node 22.18.0');
const root = options['--watcher-root'];
const npm = options['--npm-cli'];
const own = __dirname;
const workRoot = options['--work-root'] || os.tmpdir();
assert.ok(fs.existsSync(workRoot) && fs.existsSync(npm));
assert.ok(fs.statfsSync(workRoot).bavail * fs.statfsSync(workRoot).bsize >= 10 * 1024 ** 3, 'Replay needs 10 GiB free');
if (options['--receipt']) assert.ok(!fs.existsSync(options['--receipt']), 'Receipt target must be new');
const output = fs.mkdtempSync(path.join(workRoot, 'watcher-avalanche-replay-'));
const fixture = path.join(output, 'watcher');
fs.mkdirSync(fixture);
const read = file => JSON.parse(fs.readFileSync(file, 'utf8'));
const hash = file => crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
const sourcePins = [];
const copy = (relative) => {
  const source = path.join(root, relative);
  const target = path.join(fixture, relative);
  if (fs.statSync(source).isDirectory()) {
    fs.mkdirSync(target, { recursive: true });
    for (const name of fs.readdirSync(source)) copy(path.join(relative, name));
  } else {
    const sha256 = hash(source);
    fs.copyFileSync(source, target, fs.constants.COPYFILE_EXCL);
    assert.equal(hash(target), sha256);
    sourcePins.push({ path: relative.replaceAll('\\', '/'), sha256 });
  }
};
for (const name of ['src', 'config', 'package.json', 'tsconfig.json']) copy(name);
assert.equal(read(path.join(fixture, 'package.json')).scripts.start, 'tsx ./src/index.ts');
fs.symlinkSync(path.join(root, 'node_modules'), path.join(fixture, 'node_modules'), process.platform === 'win32' ? 'junction' : 'dir');
const pins = [];
const walk = (base, relative) => {
  for (const entry of fs.readdirSync(path.join(base, relative), { withFileTypes: true })) {
    const name = path.join(relative, entry.name);
    if (entry.isDirectory()) walk(base, name);
    else pins.push({ path: name.replaceAll('\\', '/'), sha256: hash(path.join(base, name)) });
  }
};
for (const pkg of ['@rosen-bridge/evm-scanner', '@rosen-bridge/evm-observation-extractor', '@rosen-bridge/tokens', '@rosen-bridge/address-codec', '@rosen-bridge/extended-typeorm', 'ethers']) {
  const base = 'node_modules/' + pkg;
  pins.push({ path: base + '/package.json', sha256: hash(path.join(root, base, 'package.json')) });
  walk(root, base + (pkg === 'ethers' ? '/lib.esm' : '/dist'));
}
pins.push({ path: 'node_modules/sqlite3/build/Release/node_sqlite3.node', sha256: hash(path.join(root, 'node_modules/sqlite3/build/Release/node_sqlite3.node')) });
const supportFiles = ['replay.cjs', 'preload.mjs', 'isolation.mjs', 'network-guard.mjs', 'contracts.json', 'tokens.json', 'rpc.json'];
const supportPins = supportFiles.map(file => ({ path: file, sha256: hash(path.join(own, file)) }));
assert.equal(hash(path.join(own, 'contracts.json')), '911236500cc3bd52a85895c1fc9ae3d04e70f52b746915933f0f19942315d280');
assert.equal(hash(path.join(own, 'tokens.json')), '6c2106bfb0aef7b9f5c6ce5536338a59ece5b762b075d4c5b872cd9067ad7cfb');
assert.equal(hash(path.join(own, 'rpc.json')), '663d840ca3045d9f5c61e4beb7cffd256c0d2cc686e9077c7b9ad7faad2e03cb');
const frozen = read(path.join(own, 'rpc.json'));
const phases = [];
const calls = [];
const tracked = [];
let server, rpcPort, active, mode = 'normal', failure;
const processRows = (parent) => {
  assert.equal(process.platform, 'win32', 'Process lifecycle probe currently supports Windows');
  const command = '$all=@(Get-CimInstance Win32_Process); $ids=@(' + parent + '); do {$old=$ids.Count; $ids=@($ids + @($all | Where-Object {$ids -contains $_.ParentProcessId} | ForEach-Object {$_.ProcessId}) | Select-Object -Unique)} while ($old -ne $ids.Count); @($all | Where-Object {$ids -contains $_.ProcessId} | Select-Object ProcessId,Name,@{n="created";e={$_.CreationDate.ToUniversalTime().ToString("o")}}) | ConvertTo-Json -Compress';
  const result = cp.spawnSync('powershell.exe', ['-NoProfile', '-Command', command], { windowsHide: true, encoding: 'utf8' });
  assert.equal(result.status, 0);
  return result.stdout.trim() ? [].concat(JSON.parse(result.stdout)) : [];
};
const stop = child => {
  if (child && child.exitCode === null && child.signalCode === null) cp.spawnSync('taskkill.exe', ['/PID', String(child.pid), '/T', '/F'], { windowsHide: true });
};
const freePort = () => new Promise(resolve => {
  const s = http.createServer();
  s.listen(0, '127.0.0.1', () => { const port = s.address().port; s.close(() => resolve(port)); });
});
const run = async phase => {
  const config = { network: 'avalanche', observation: { confirmation: 1, validThresholdBlocks: 100 }, avalanche: { chainId: 43114, sourceId: 'mainnet-process-fixture', initial: { height: 0 }, interval: 0.25, healthCheck: { blockTime: 2 }, rpc: { url: 'http://127.0.0.1:' + rpcPort + '/rpc', timeout: 2 } }, ergo: { network: 'testnet', secret: crypto.randomBytes(32).toString('hex'), initialHeight: 0, node: { url: 'http://127.0.0.1:' + rpcPort + '/ergo' }, explorer: { url: 'http://127.0.0.1:' + rpcPort + '/ergo' }, interval: { scanner: 600, revenue: 120 } }, path: { addresses: path.join(own, 'contracts.json'), tokens: path.join(own, 'tokens.json') }, database: { type: 'sqlite', path: path.join(output, phase.startsWith('negative') ? phase + '.sqlite' : 'positive.sqlite') }, api: { port: await freePort() }, logs: [{ type: 'console', level: 'debug' }], blockCleanup: { isActiveForNonErgoChains: false } };
  const nodeOptions = [path.join(own, 'network-guard.mjs'), path.join(fixture, 'node_modules/tsx/dist/loader.mjs'), path.join(own, 'preload.mjs')].map(file => '--import ' + pathToFileURL(file).href).join(' ');
  const env = { ...process.env, NODE_ENV: 'production', NODE_BACKEND: 'js', NODE_CONFIG_DIR: path.join(fixture, 'config'), NODE_CONFIG: JSON.stringify(config), NODE_OPTIONS: nodeOptions, SERVICE_FIXTURE_PORTS: rpcPort + ',' + config.api.port, WATCHER_REPLAY_ROOT: fixture, WATCHER_REPLAY_OUTPUT: output, WATCHER_REPLAY_PHASE: phase, HTTP_PROXY: '', HTTPS_PROXY: '', ALL_PROXY: '', NO_PROXY: '127.0.0.1,localhost,::1', PATH: path.dirname(process.execPath) + path.delimiter + process.env.PATH };
  const result = await new Promise((resolve, reject) => {
    const child = cp.spawn(process.execPath, [npm, 'start'], { cwd: fixture, env, windowsHide: true, stdio: ['ignore', 'pipe', 'pipe'] });
    active = child;
    let log = '', shutdown = false;
    const consume = chunk => {
      log += chunk;
      if (!shutdown && log.includes('WATCHER_FRONTIER_READY:' + phase) && log.includes('Service initialization finished successfully.')) {
        shutdown = true;
        try {
          tracked.push(...processRows(child.pid));
          fs.writeFileSync(path.join(output, 'shutdown-' + phase), 'owned shutdown\n', { flag: 'wx' });
        } catch (error) { failure = error; stop(child); }
      }
    };
    child.stdout.on('data', consume);
    child.stderr.on('data', consume);
    const timer = setTimeout(() => stop(child), 180000);
    child.on('error', error => { clearTimeout(timer); reject(error); });
    child.on('exit', (exit, signal) => { clearTimeout(timer); active = undefined; resolve({ exit, signal, log, npmPid: child.pid }); });
  });
  fs.writeFileSync(path.join(output, 'npm-' + phase + '.log'), result.log, { flag: 'wx' });
  assert.equal(result.exit, 0, result.log.slice(-2000));
  for (const marker of ['> tsx ./src/index.ts', 'WATCHER_FRONTIER_READY:' + phase, 'Service initialization finished successfully.', 'WATCHER_OWNED_DB_CLOSED:' + phase]) assert.ok(result.log.includes(marker), marker);
  assert.equal((result.log.match(/WATCHER_UNRELATED_JOB_ISOLATED/g) || []).length, 10);
  assert.ok(!result.log.includes('WATCHER_REPLAY_FATAL:'));
  const state = read(path.join(output, 'state-' + phase + '.json'));
  phases.push({ ...state, npmPid: result.npmPid, exit: result.exit, logSha256: hash(path.join(output, 'npm-' + phase + '.log')), databaseSha256: hash(config.database.path) });
  console.log('Passed ' + phase + ': frontier=1 observations=' + state.observations.length);
  return state;
};
(async () => {
  try {
    server = http.createServer(async (req, res) => {
      try {
        assert.equal(req.url, '/rpc');
        let text = '';
        for await (const chunk of req) text += chunk;
        const respond = request => {
          calls.push({ phase: mode, method: request.method, params: request.params });
          let result;
          switch (request.method) {
            case 'eth_chainId': result = '0xa86a'; break;
            case 'eth_getBlockByNumber': assert.ok(['finalized', '0x1'].includes(request.params[0])); result = structuredClone(frozen.block); if (!request.params[1]) result.transactions = result.transactions.map(tx => tx.hash); break;
            case 'eth_getBlockByHash': assert.equal(request.params[0], frozen.block.hash); result = structuredClone(frozen.block); if (!request.params[1]) result.transactions = result.transactions.map(tx => tx.hash); break;
            case 'eth_getTransactionReceipt': assert.equal(request.params[0], frozen.transaction.hash); result = structuredClone(frozen.receipt); if (mode === 'removed') result.logs[0].removed = true; if (mode === 'missing') delete result.logs[0].removed; break;
            default: throw Error('Unexpected RPC method');
          }
          return { jsonrpc: '2.0', id: request.id, result };
        };
        const body = JSON.parse(text);
        res.setHeader('content-type', 'application/json');
        res.end(JSON.stringify(Array.isArray(body) ? body.map(respond) : respond(body)));
      } catch (error) { failure = error; res.writeHead(500); res.end('Fixture refused'); }
    });
    await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
    rpcPort = server.address().port;
    const first = await run('positive-first');
    const restart = await run('positive-restart');
    assert.notEqual(first.pid, restart.pid);
    assert.deepEqual(first.observations, restart.observations);
    assert.deepEqual(first.safety, restart.safety);
    for (const phase of ['removed', 'missing']) { mode = phase; await run('negative-' + phase); assert.ok(calls.some(row => row.phase === phase && row.method === 'eth_getTransactionReceipt')); }
    assert.ok(!failure, String(failure));
  } catch (error) { failure = error; }
  finally {
    stop(active);
    if (active) await new Promise(resolve => active.once('exit', resolve));
    if (server) { server.closeAllConnections(); await new Promise(resolve => server.close(resolve)); }
    for (const pin of sourcePins) {
      assert.equal(hash(path.join(root, pin.path)), pin.sha256, 'Original source changed');
      assert.equal(hash(path.join(fixture, pin.path)), pin.sha256, 'Copied source changed');
    }
    for (const pin of pins) assert.equal(hash(path.join(root, pin.path)), pin.sha256, 'Dependency changed');
    for (const pin of supportPins) assert.equal(hash(path.join(own, pin.path)), pin.sha256, 'Replay support changed');
    const ids = tracked.map(row => row.ProcessId);
    const checked = cp.spawnSync('powershell.exe', ['-NoProfile', '-Command', '$ids=@(' + ids.join(',') + '); @(Get-CimInstance Win32_Process | Where-Object {$ids -contains $_.ProcessId} | Select-Object ProcessId,@{n="created";e={$_.CreationDate.ToUniversalTime().ToString("o")}}) | ConvertTo-Json -Compress'], { windowsHide: true, encoding: 'utf8' });
    assert.equal(checked.status, 0);
    const current = checked.stdout.trim() ? [].concat(JSON.parse(checked.stdout)) : [];
    const surviving = tracked.filter(row => current.some(now => now.ProcessId === row.ProcessId && now.created === row.created));
    assert.equal(surviving.length, 0, 'Owned process survived');
    const receipt = { status: failure ? 'failed' : 'passed', node: process.version, phases, calls, sourcePins, dependencyPins: pins, supportPins, trackedProcesses: tracked, ownedProcessesStopped: surviving.length === 0, rpcClosed: !server?.listening, failure: failure ? String(failure) : null, scope: 'Declared npm start and unchanged source init, config/map loaders, real SQLite migrations, Avalanche scanner, HTTP/SDK/extraction, qualified frontier and restart. Ten unrelated jobs, fee init and Ergo update isolated. Local installed dependency graph, not published registry or normal installation qualification.' };
    const serialized = JSON.stringify(receipt, null, 2) + '\n';
    fs.writeFileSync(path.join(output, 'receipt.json'), serialized, { flag: 'wx' });
    if (options['--receipt']) fs.writeFileSync(options['--receipt'], serialized, { flag: 'wx' });
    console.log('Replay ' + receipt.status + '; private runtime artifacts: ' + output);
    if (failure) { console.error(String(failure)); process.exitCode = 1; }
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
