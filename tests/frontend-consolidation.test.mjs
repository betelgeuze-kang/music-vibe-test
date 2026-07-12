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
const timelineActions = read('src/v2/ui/timeline-actions.mjs');
const home = read('src/v2/ui/screens/home.mjs');
const profile = read('src/v2/ui/screens/profile.mjs');
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
  'src/v2/ui/timeline-actions.mjs',
  'src/v2/domain/feedback.mjs',
  'src/v2/domain/timeline.mjs',
  'v2-app.css',
  'v2-m4.css',
  'v2-m4-timeline.css'
]) assert(exists(file), `canonical UI module is missing: ${file}`);

assert.equal((index.match(/rel="stylesheet"/g) || []).length, 1, 'the HTML shell must load one CSS entry');
assert(index.includes('v2-app.css?timeline=m4t1'));
assert(index.includes('src/v2/main.mjs?timeline=m4t1'));
assert(!index.includes('src/v2/brand/install.mjs'), 'brand installer must be removed from runtime');
assert(!index.includes('src/v2/brand/interaction.mjs'), 'capture-phase interaction bridge must be removed from runtime');
assert(!index.includes('brand-pending'), 'canonical UI must not need a post-boot design mask');
assert(!index.includes('<script type="importmap">'), 'canonical relative imports do not need an import map');
assert(index.includes('data-ui-release="f1"'));
assert(index.includes('data-engagement-release="m4f1"'));
assert(index.includes('data-timeline-release="m4t1"'));

assert(!main.includes('installQualityGates'), 'quality behavior must be canonical, not installed by runtime mutation');
assert(!main.includes('quality/install.mjs'));
assert(main.includes('./ui/app.mjs?timeline=m4t1'));
assert(app.includes("import('./screens/profile.mjs?timeline=m4t1')"));
assert(app.includes("import('./screens/now.mjs?engagement=m4f1')"));
assert(app.includes("import('./screens/match.mjs?engagement=m4f1')"));
assert(app.includes('handleTimelineClick'));
assert(!app.includes('screenMethods'), 'screen prototype mixing must be removed');
assert(!app.includes('Object.assign(VibeApp.prototype, screenMethods'));
assert.equal((app.match(/document\.addEventListener\('click'/g) || []).length, 1, 'the application must install one click delegation layer');
assert(timelineActions.includes('restore-profile-snapshot'));
assert(timelineActions.includes('clear-profile-history'));
assert(profile.includes('profile-timeline'));

for (const staticSource of [main, app, actions, timelineActions, home]) {
  assert(!/from ['"].*domain\/recommendation\.mjs/.test(staticSource), 'home boot graph must not statically import the recommendation catalog');
  assert(!/from ['"].*domain\/match\.mjs/.test(staticSource), 'home boot graph must not statically import the match catalog');
  assert(!/from ['"].*data\/tracks\.mjs/.test(staticSource), 'home boot graph must not statically import all tracks');
}
assert(actions.includes("await import('../domain/recommendation.mjs?engagement=m4f1')"), 'context generation must lazy-load M4 recommendations');
assert(home.includes('HOME_SHOWCASE'), 'home must use the fixed lightweight showcase');

for (const layer of ['core', 'features', 'responsive', 'quality', 'editorial', 'stability', 'accessibility', 'engagement', 'timeline']) {
  assert(cssEntry.includes(`layer(${layer})`), `CSS entry is missing the ${layer} cascade layer`);
}
assert(cssEntry.includes('v2-m4.css?engagement=m4f1'));
assert(cssEntry.includes('v2-m4-timeline.css?timeline=m4t1'));
assert.equal(buildInfo.uiRelease, 'f1');
assert.equal(buildInfo.engagementRelease, 'm4f1');
assert.equal(buildInfo.timelineRelease, 'm4t1');
assert.equal(buildInfo.entry, '/src/v2/main.mjs?timeline=m4t1');
assert.equal(buildInfo.styleEntry, '/v2-app.css?timeline=m4t1');
assert.equal(buildInfo.runtimeOverrides, false);
assert.equal(buildInfo.lazyRoutes.length, 3);
assert.equal(buildInfo.timelineData.length, 4);

console.log('Frontend consolidation, feedback, and timeline layering checks passed.');
