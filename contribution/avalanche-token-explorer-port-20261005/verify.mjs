import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {pathToFileURL} from 'node:url';

const [workspace, output] = process.argv.slice(2);
assert(workspace && output, 'Usage: node verify.mjs <ui-root> <fresh-output-directory>');
const hash = b => crypto.createHash('sha256').update(b).digest('hex');
const own = import.meta.dirname;
assert(!fs.existsSync(output));
const space = fs.statfsSync(own, {bigint: true});
assert(space.bavail * space.bsize >= 10n * 1024n ** 3n);
const predecessor = fs.readFileSync(new URL('./input-pins.json', import.meta.url));
const old = JSON.parse(predecessor);
assert.equal(old.schema, 'rosen-ui-token-explorer-inputs.v1');
for (const p of old.inputs) {
  assert(!path.isAbsolute(p.path) && !/[\\:\x00-\x1f]/.test(p.path));
  assert(!p.path.split('/').some(part => !part || part === '.' || part === '..'));
  const bytes = fs.readFileSync(path.join(workspace, p.path));
  assert.equal(hash(bytes), p.sha256, p.path);
  assert.equal(bytes.length, p.bytes, p.path);
}
const pins = old.inputs.slice(0, 3);
const ts = createRequire(path.join(workspace, 'package.json'))('typescript');
const declarations = fs.readFileSync(path.join(workspace, 'node_modules/@rosen-bridge/ui-kit/dist/index.d.ts'), 'utf8');
const runtime = fs.readFileSync(path.join(workspace, 'node_modules/@rosen-bridge/ui-kit/dist/index.js'), 'utf8');
const source = ts.createSourceFile('ui-kit.js', runtime, ts.ScriptTarget.Latest, true, ts.ScriptKind.JS);
const functions = new Map();
const visit = node => {
  if (ts.isVariableDeclaration(node) && ts.isIdentifier(node.name) && ['TokensCard', 'TokensList'].includes(node.name.text)) functions.set(node.name.text, node.initializer);
  ts.forEachChild(node, visit);
};
visit(source);
assert.equal(functions.size, 2);
const card = functions.get('TokensCard').getText(source);
const list = functions.get('TokensList').getText(source);
assert(card.includes('children: "See All"') && card.includes('jsx(TokensList, {'));
assert(list.includes('href: token.isNativeToken ? void 0 : getTokenUrl(chain, token.tokenId),'));
assert(!/token\.(?:href|tokenUrl)|chainId/.test(list));
const cardDecl = declarations.slice(declarations.indexOf('type TokensCardOwnProps ='), declarations.indexOf('type TokensCardBaseProps ='));
const listDecl = declarations.slice(declarations.indexOf('type TokensListOwnProps ='), declarations.indexOf('type TokensListBaseProps ='));
assert(cardDecl.includes('href?: string;') && !cardDecl.includes('chainId'));
assert(!/chainId|href|tokenUrl/.test(listDecl));
const probe = path.join(own, 'installed-signature-probe.ts');
const options = {target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext, moduleResolution: ts.ModuleResolutionKind.Bundler, strict: true, noEmit: true, skipLibCheck: true, types: [], baseUrl: own, paths: {'@rosen-bridge/ui-kit': [path.join(workspace, 'node_modules/@rosen-bridge/ui-kit/dist/index.d.ts')], 'installed-token-url': [path.join(workspace, 'packages/utils/dist/getTokenUrl.d.ts')]}};
const program = ts.createProgram([probe], options);
const diagnostics = ts.getPreEmitDiagnostics(program);
assert.equal(diagnostics.length, 0, ts.formatDiagnosticsWithColorAndContext(diagnostics, {getCanonicalFileName: p => p, getCurrentDirectory: () => own, getNewLine: () => '\n'}));
const helper = await import(pathToFileURL(path.join(workspace, 'packages/utils/dist/getTokenUrl.js')));
const explorer = await import(pathToFileURL(path.join(workspace, 'packages/utils/dist/avalancheExplorerUrl.js')));
const reader = await import(pathToFileURL(path.join(workspace, 'networks/avalanche/dist/guardAssetsBalance.js')));
assert.equal(helper.getTokenUrl.length, 2);
const fixtures = JSON.parse(fs.readFileSync(path.join(own, 'fixtures.json')));
const observations = [];
for (const fixture of fixtures.cases) {
  const current = helper.getTokenUrl(fixture.chain, fixture.tokenId, fixture.chainId);
  if (fixture.chain === 'avalanche') assert.equal(current, undefined);
  if (fixture.producerOutcome === 'existing-helper') assert.equal(current, fixture.expectedHref);
  let produced = null;
  if (['decoded', 'rejected'].includes(fixture.producerOutcome)) {
    const row = {chain: fixture.chain, address: '0x2222222222222222222222222222222222222222', balance: {amount: '3000000000', decimals: 9, name: 'Synthetic token', tokenId: fixture.tokenId, isNativeToken: fixture.isNativeToken}};
    const response = {chainId: fixture.chainId, hot: {items: [row], total: 1}, cold: {items: [row], total: 1}};
    if (fixture.producerOutcome === 'rejected') assert.throws(() => reader.avalancheGuardAssetsReader.decode(response, 0, 1));
    else {
      for (const custody of ['hot', 'cold']) {
        const actual = reader.avalancheGuardAssetsReader.decode(response, 0, 1, custody).items[0];
        assert.equal(actual.tokenUrl ?? null, fixture.expectedHref);
        assert.equal(actual.amount, 3000000000n);
        assert.equal(actual.decimals, 9);
        produced = actual.tokenUrl ?? null;
      }
    }
  }
  if (fixture.id === 'native-explicit-href') assert(list.includes('token.isNativeToken ? void 0'));
  observations.push({id: fixture.id, expectedProposedHref: fixture.expectedHref, installedHelperHref: current ?? null, existingProducerHref: produced, producerOutcome: fixture.producerOutcome});
}
assert.equal(explorer.avalancheExplorerUrl(43114), 'https://snowtrace.io');
assert.equal(explorer.avalancheExplorerUrl(43113), 'https://testnet.snowtrace.io');
assert.equal(explorer.avalancheExplorerUrl(), undefined);
assert.equal(explorer.avalancheExplorerUrl(1), undefined);
const additional = ['packages/utils/src/getTokenUrl.ts', 'packages/utils/dist/getTokenUrl.d.ts', 'packages/utils/dist/getTokenUrl.js', 'packages/utils/src/avalancheExplorerUrl.ts', 'packages/utils/dist/avalancheExplorerUrl.js', 'networks/avalanche/src/guardAssetsBalance.ts', 'networks/avalanche/dist/guardAssetsBalance.js', 'apps/guard/src/app/(dashboard)/@tokens/page.tsx', 'apps/guard/src/hooks/useBalance.ts', 'apps/guard/src/types/api.ts'].map(rel => {const b=fs.readFileSync(path.join(workspace, rel)); return {path:rel,bytes:b.length,sha256:hash(b)};});
for (const p of [...pins, ...additional]) assert.equal(hash(fs.readFileSync(path.join(workspace, p.path))), p.sha256);
fs.mkdirSync(output, {recursive: true});
fs.writeFileSync(path.join(output, 'receipt.json'), JSON.stringify({status:'PASS installed port absence and existing producer fixtures',packageVersion:old.packageVersion,inputPinsSha256:hash(predecessor),typescriptVersion:ts.version,signatureNegativeControls:5,signaturePositiveControls:2,unexpectedTypeDiagnostics:0,runtimeAst:{cardHref:'See All only',tokenHref:'native ? undefined : getTokenUrl(chain, tokenId)',perTokenHrefRead:false,chainIdForwarded:false},observations,inputs:[...pins,...additional],fixtureSha256:hash(fs.readFileSync(path.join(own,'fixtures.json'))),probeSha256:hash(fs.readFileSync(probe)),verifierSha256:hash(fs.readFileSync(new URL(import.meta.url))),scope:'Installed declarations/JavaScript and existing prepared URL producer only; proposed component port is not implemented or approved; no network requests or UI edits.'},null,2)+'\n',{flag:'wx'});
console.log(JSON.stringify({status:'PASS',fixtures:observations.length,signatureNegativeControls:5,unexpectedTypeDiagnostics:0}));
