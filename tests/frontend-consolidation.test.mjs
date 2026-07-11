import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');
const exists = (file) => fs.existsSync(path.join(root, file));

const index = read('index.html');
const main = read('src/v2/main.mjs');
const app = read('src/v2/ui/app.mjs');
const actions = read('src/v2/ui/actions.mjs');
const home = read('src/v2/ui/screens/home.mjs');
const cssEntry = read('v2-app.css');
const buildInfo = JSON.parse(read('build-info.json'));

for (const file of [
  'src/v2/ui/components/shell.mjs',
  'src/v2/ui/screens/home.mjs',
  'src/v2/ui/screens/discover.mjs',
  'src/v2/ui/screens/empty.mjs',
  'src/v2/ui/screens/profile.mjs',
  'src/v2/ui/screens/now.mjs',
  'src/v2/ui/screens/match.mjs',
  'v2-app.css'
]) assert(exists(file), `canonical UI module is missing: ${file}`);

assert.equal((index.match(/rel="stylesheet"/g) || []).length, 1, 'the HTML shell must load one CSS entry');
assert(index.includes('v2-app.css?ui=f1'));
assert(index.includes('src/v2/main.mjs?ui=f1'));
assert(!index.includes('src/v2/brand/install.mjs'), 'brand installer must be removed from runtime');
assert(!index.includes('src/v2/brand/interaction.mjs'), 'capture-phase interaction bridge must be removed from runtime');
assert(!index.includes('brand-pending'), 'canonical UI must not need a post-boot design mask');
assert(!index.includes('<script type="importmap">'), 'canonical relative imports do not need an import map');
assert(index.includes('data-ui-release="f1"'));

assert(!main.includes('installQualityGates'), 'quality behavior must be canonical, not installed by runtime mutation');
assert(!main.includes('quality/install.mjs'));
assert(main.includes("./ui/app.mjs?ui=f1"));
assert(app.includes("import('./screens/profile.mjs?ui=f1')"));
assert(app.includes("import('./screens/now.mjs?ui=f1')"));
assert(app.includes("import('./screens/match.mjs?ui=f1')"));
assert(!app.includes('screenMethods'), 'screen prototype mixing must be removed');
assert(!app.includes('Object.assign(VibeApp.prototype, screenMethods'));
assert.equal((app.match(/document\.addEventListener\('click'/g) || []).length, 1, 'the application must install one click delegation layer');

for (const staticSource of [main, app, actions, home]) {
  assert(!/from ['"].*domain\/recommendation\.mjs/.test(staticSource), 'home boot graph must not statically import the recommendation catalog');
  assert(!/from ['"].*domain\/match\.mjs/.test(staticSource), 'home boot graph must not statically import the match catalog');
  assert(!/from ['"].*data\/tracks\.mjs/.test(staticSource), 'home boot graph must not statically import all tracks');
}
assert(actions.includes("await import('../domain/recommendation.mjs?content=e1')"), 'context generation must lazy-load recommendations');
assert(home.includes('HOME_SHOWCASE'), 'home must use the fixed lightweight showcase');

for (const layer of ['core', 'features', 'responsive', 'quality', 'editorial', 'stability', 'accessibility']) {
  assert(cssEntry.includes(`layer(${layer})`), `CSS entry is missing the ${layer} cascade layer`);
}
assert.equal(buildInfo.uiRelease, 'f1');
assert.equal(buildInfo.entry, '/src/v2/main.mjs?ui=f1');
assert.equal(buildInfo.styleEntry, '/v2-app.css?ui=f1');
assert.equal(buildInfo.runtimeOverrides, false);
assert.equal(buildInfo.lazyRoutes.length, 3);

console.log('Frontend consolidation checks passed.');
