import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const inputs = JSON.parse(fs.readFileSync(path.join(here, 'input-pins.json'), 'utf8'));
const hash = (bytes) => crypto.createHash('sha256').update(bytes).digest('hex');
const inside = (parent, child) => {
  const relative = path.relative(parent, child);
  return relative === '' || (!relative.startsWith('..' + path.sep) && relative !== '..' && !path.isAbsolute(relative));
};
const assertPins = (root, pins) => {
  for (const pin of pins) {
    const file = path.resolve(root, pin.path);
    if (!inside(root, file)) throw new Error(`Unsafe input path: ${pin.path}`);
    const bytes = fs.readFileSync(file);
    if (bytes.length !== pin.bytes || hash(bytes) !== pin.sha256) throw new Error(`Input drift: ${pin.path}`);
  }
};

const args = process.argv.slice(2);
if (args.length !== 2 || args.some((arg) => arg.startsWith('--'))) {
  throw new Error('Usage: node replay.mjs <guard-repository-root> <fresh-output-directory>');
}
if (process.version !== inputs.nodeVersion) throw new Error(`Use Node ${inputs.nodeVersion}`);
const source = fs.realpathSync(path.resolve(args[0]));
const output = path.resolve(args[1]);
const parent = fs.realpathSync(path.dirname(output));
if (fs.existsSync(output) || inside(source, parent)) throw new Error('Output must be fresh and outside the Guard repository');
const disk = fs.statfsSync(parent);
if (Number(disk.bavail) * Number(disk.bsize) < 10 * 1024 ** 3) throw new Error('Output volume requires 10 GiB free');
assertPins(source, inputs.sourceFiles);
assertPins(source, inputs.toolFiles);
const service = path.join(source, 'services/guard-service');
const modules = path.join(source, 'node_modules');
const dependencyRoots = ['vitest', 'vite', 'reflect-metadata'].map((name) => ({
  name, target: fs.realpathSync(path.join(modules, name)),
}));
if (dependencyRoots.some(({ target }) => inside(target, parent))) throw new Error('Output must be outside dependency packages');
fs.mkdirSync(output);
fs.mkdirSync(path.join(output, 'node_modules'));
for (const { name, target } of dependencyRoots) {
  fs.symlinkSync(target, path.join(output, 'node_modules', name), process.platform === 'win32' ? 'junction' : 'dir');
}

const config = `import 'reflect-metadata';
import { defineConfig } from 'vitest/config';
import path from 'node:path';
const source = ${JSON.stringify(source)};
export default defineConfig({
  root: path.join(source, 'services/guard-service'),
  cacheDir: ${JSON.stringify(path.join(output, 'vite-cache'))},
  resolve: { alias: {
    '@rosen-chains/ergo': path.join(source, 'packages/chains/ergo/lib/index.ts'),
    '@rosen-chains/ergo-node-network': path.join(source, 'packages/networks/ergo-node/lib/index.ts'),
    '@rosen-chains/ergo-explorer-network': path.join(source, 'packages/networks/ergo-explorer/lib/index.ts'),
  } },
  test: {
    globals: true, cache: false, reporters: ['default', 'json'],
    outputFile: { json: ${JSON.stringify(path.join(output, 'tests.json'))} },
    pool: 'forks', maxWorkers: 1, minWorkers: 1, testTimeout: 10000,
    setupFiles: ['./tests/setup/setupTests.ts', './tests/setup/mockChainHandler.ts'],
  },
});
`;
const configFile = path.join(output, 'replay.config.mts');
fs.writeFileSync(configFile, config);
const started = Date.now();
const run = spawnSync(process.execPath, [path.join(modules, 'vitest/vitest.mjs'), 'run', '--config', configFile, ...inputs.tests.map(({ path: test }) => test)], {
  cwd: service,
  env: { ...process.env, NODE_OPTIONS: '--import tsx', NODE_BACKEND: 'js', NODE_ENV: 'test', NODE_CONFIG_DIR: path.join(service, 'config'), NO_COLOR: '1' },
  stdio: ['ignore', 'pipe', 'pipe'], encoding: 'utf8', maxBuffer: 16 * 1024 * 1024,
  timeout: 240000,
});
fs.writeFileSync(path.join(output, 'stdout.log'), run.stdout ?? '');
fs.writeFileSync(path.join(output, 'stderr.log'), run.stderr ?? '');
assertPins(source, inputs.sourceFiles);
assertPins(source, inputs.toolFiles);
const resultsFile = path.join(output, 'tests.json');
const results = fs.existsSync(resultsFile) ? JSON.parse(fs.readFileSync(resultsFile, 'utf8')) : null;
const resultsByPath = new Map((results?.testResults ?? []).map((result) => [path.relative(service, result.name).replaceAll('\\', '/'), result]));
const files = inputs.tests.map((test) => {
  const result = resultsByPath.get(test.path);
  return { path: test.path, expected: test.cases, actual: result?.assertionResults?.length ?? null, passed: result?.assertionResults?.filter((item) => item.status === 'passed').length ?? null, status: result?.status ?? (results ? 'not-in-final-report' : 'final-report-unavailable') };
});
const pass = run.status === 0 && !run.error && resultsByPath.size === 6 && files.every((file) => file.status === 'passed' && file.actual === file.expected && file.passed === file.expected);
const receipt = {
  schema: 'rosen-guard-focused-runtime-replay.v1', status: pass ? 'PASS' : 'FAIL', elapsedMs: Date.now() - started,
  exitCode: run.status, signal: run.signal, processErrorCode: run.error?.code ?? null,
  timeoutMs: 240000, sourceManifestSha256: inputs.sourceManifestSha256,
  finalTree: inputs.finalTree, sourceFilesUnchanged: inputs.sourceFiles.length, toolFilesUnchanged: inputs.toolFiles.length,
  nodeVersion: process.version, files, passed: results ? files.reduce((total, file) => total + (file.passed ?? 0), 0) : null,
  cache: { resultCache: false, configTemporaryDirectory: 'adjacent to private replay.config.mts; Vite5.4.18 timestamp module is unlinked after loading', viteCacheDirectory: 'vite-cache', dependencyJunctions: dependencyRoots.map(({ name }) => name) },
  limits: ['Six selected source-owned suites; overlaps prior 529 scoped controls.', 'Prepared installed dependency graph and three Ergo source aliases; ordinary registry qualification remains separate.', 'SQLite fixtures and mocked network/TSS transports; no complete Guard-job or production-signing qualification.'],
};
fs.writeFileSync(path.join(output, 'receipt.json'), JSON.stringify(receipt, null, 2) + '\n');
console.log(JSON.stringify({ status: receipt.status, files: files.length, passed: receipt.passed, sourceFilesUnchanged: receipt.sourceFilesUnchanged }));
process.exitCode = pass ? 0 : 1;
