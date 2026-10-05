import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import cp from 'node:child_process';
import crypto from 'node:crypto';

const [sourceRoot, scratchRoot] = process.argv.slice(2);
assert(sourceRoot && scratchRoot, 'Usage: node verify.mjs <repository-parent> <fresh-scratch-directory>');
const sources = fs.realpathSync(path.resolve(sourceRoot));
const requestedScratch = path.resolve(scratchRoot);
const scratch = path.join(fs.realpathSync(path.dirname(requestedScratch)), path.basename(requestedScratch));
assert(!fs.existsSync(scratch), 'Scratch directory must be new; existing evidence is preserved');
const manifest = JSON.parse(fs.readFileSync(new URL('./manifest.json', import.meta.url), 'utf8'));
assert.equal(manifest.schema, 'rosen-producer-contribution-series.v1');
const hash = (bytes) => crypto.createHash('sha256').update(bytes).digest('hex');
const relative = (value) => {
  assert(typeof value === 'string' && value && !path.isAbsolute(value) && !/[\\:\x00-\x1f]/.test(value));
  assert(!value.split('/').some((part) => !part || part === '.' || part === '..'));
  return value;
};
const env = { ...process.env, GIT_OPTIONAL_LOCKS: '0' };
for (const key of Object.keys(env)) if (/^GIT_/i.test(key) && key !== 'GIT_OPTIONAL_LOCKS') delete env[key];
const git = (cwd, args, input) => {
  const result = cp.spawnSync('git', ['-c', 'core.autocrlf=false', '-c', 'core.quotePath=false', ...args], { cwd, env, input, windowsHide: true, encoding: null, timeout: 60000, maxBuffer: 128 * 1024 ** 2 });
  assert.equal(result.status, 0, 'Git verification failed: ' + result.stderr?.toString());
  return result.stdout;
};
const sourceState = (repo) => {
  const directory = path.join(sources, relative(repo));
  const head = git(directory, ['rev-parse', 'HEAD']).toString().trim();
  const index = git(directory, ['rev-parse', '--path-format=absolute', '--git-path', 'index']).toString().trim();
  return { repo, head, indexSha256: hash(fs.readFileSync(index)) };
};
assert(new Set(manifest.repositories.map(({ repo }) => repo)).size === manifest.repositories.length);
assert(new Set(manifest.groups.map(({ id }) => id)).size === manifest.groups.length);
for (const repo of manifest.repositories) {
  relative(repo.repo); assert(/^[0-9a-f]{40}$/.test(repo.head));
  const repository = fs.realpathSync(path.join(sources, repo.repo));
  const nesting = path.relative(repository, scratch);
  assert(nesting && (nesting === '..' || nesting.startsWith('..' + path.sep) || path.isAbsolute(nesting)), 'Scratch must be outside each original repository');
  const source = sourceState(repo.repo);
  assert.equal(source.head, repo.head, 'Source HEAD differs from pinned baseline: ' + repo.repo);
}
const before = manifest.repositories.map(({ repo }) => sourceState(repo));
for (const group of manifest.groups) {
  assert(manifest.repositories.some(({ repo }) => repo === group.repo));
  assert(/^[0-9a-f]{40}$/.test(group.beforeTree) && /^[0-9a-f]{40}$/.test(group.tree));
  const bytes = fs.readFileSync(new URL('./' + relative(group.patch.path), import.meta.url));
  assert.equal(bytes.length, group.patch.bytes);
  assert.equal(hash(bytes), group.patch.sha256, 'Patch changed: ' + group.id);
  for (const file of group.files) relative(file.path);
}
fs.mkdirSync(scratch, { recursive: true });
for (const repo of manifest.repositories) {
  const clone = path.join(scratch, repo.repo);
  git(undefined, ['clone', '--local', '--no-hardlinks', '--no-checkout', path.join(sources, repo.repo), clone]);
  git(clone, ['checkout', '--detach', repo.head]);
}
const applied = new Set();
const results = [];
for (const group of manifest.groups) {
  assert(group.dependencies.every((id) => applied.has(id)), 'Prerequisite missing: ' + group.id);
  const clone = path.join(scratch, group.repo);
  const tree = () => git(clone, ['write-tree']).toString().trim();
  assert.equal(tree(), group.beforeTree, 'Wrong patch base: ' + group.id);
  const patch = fs.readFileSync(new URL('./' + group.patch.path, import.meta.url));
  git(clone, ['apply', '--index', '--check', '--whitespace=nowarn', '-'], patch);
  git(clone, ['apply', '--index', '--whitespace=nowarn', '-'], patch);
  assert.equal(tree(), group.tree, 'Wrong applied tree: ' + group.id);
  const actualPaths = git(clone, ['diff', '--name-only', '--no-renames', group.beforeTree, group.tree]).toString().trim().split('\n').filter(Boolean).sort();
  assert.deepEqual(actualPaths, group.files.map(({ path: rel }) => rel).sort(), 'Incomplete changed-path inventory: ' + group.id);
  for (const file of group.files) {
    const target = path.join(clone, file.path);
    if (file.deleted) assert(!fs.existsSync(target), 'Deleted file reappeared: ' + file.path);
    else {
      const bytes = fs.readFileSync(target);
      assert.equal(bytes.length, file.bytes); assert.equal(hash(bytes), file.sha256);
    }
  }
  applied.add(group.id);
  results.push({ id: group.id, tree: group.tree, exactChangedPaths: group.files.length });
  console.log(JSON.stringify(results.at(-1)));
}
assert.deepEqual(before.map(({ repo }) => sourceState(repo)), before, 'Original source HEAD/index changed');
const receipt = { status: 'PASS exact source-series application', results, originalIndexWrites: 0, publicActions: 0 };
fs.writeFileSync(path.join(scratch, 'verification.json'), JSON.stringify(receipt, null, 2) + '\n', { flag: 'wx' });
console.log(JSON.stringify({ status: receipt.status, groups: results.length }));
