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
const dialogs = read('src/v2/ui/dialogs.mjs');
const consent = read('src/v2/ui/consent-a11y.mjs');
const timelineActions = read('src/v2/ui/timeline-actions.mjs');
const weeklyActions = read('src/v2/ui/weekly-actions.mjs');
const home = read('src/v2/ui/screens/home.mjs');
const profile = read('src/v2/ui/screens/profile.mjs');
const weekly = read('src/v2/ui/screens/weekly.mjs');
const cssEntry = read('v2-app.css');
const buildInfo = JSON.parse(read('build-info.json'));

for (const file of [
  'src/v2/ui/components/shell.mjs',
  'src/v2/ui/dialogs.mjs',
  'src/v2/ui/consent-a11y.mjs',
  'src/v2/ui/screens/home.mjs',
  'src/v2/ui/screens/discover.mjs',
  'src/v2/ui/screens/empty.mjs',
  'src/v2/ui/screens/profile.mjs',
  'src/v2/ui/screens/weekly.mjs',
  'src/v2/ui/screens/now.mjs',
  'src/v2/ui/screens/match.mjs',
  'src/v2/ui/timeline-actions.mjs',
  'src/v2/ui/weekly-actions.mjs',
  'src/v2/domain/feedback.mjs',
  'src/v2/domain/timeline.mjs',
  'src/v2/domain/tag-visibility.mjs',
  'src/v2/domain/weekly.mjs',
  'v2-app.css',
  'v2-m4.css',
  'v2-m4-timeline.css',
  'v2-m4-weekly.css',
  'v2-frontend-quality.css',
  'v2-human-editorial.css'
]) assert(exists(file), `canonical UI module is missing: ${file}`);

assert.equal((index.match(/rel="stylesheet"/g) || []).length, 1, 'the HTML shell must load one CSS entry');
assert(index.includes('v2-app.css?home=he1'));
assert(index.includes('src/v2/main.mjs?home=he1'));
assert(!index.includes('src/v2/brand/install.mjs'), 'brand installer must be removed from runtime');
assert(!index.includes('src/v2/brand/interaction.mjs'), 'capture-phase interaction bridge must be removed from runtime');
assert(!index.includes('brand-pending'), 'canonical UI must not need a post-boot design mask');
assert(!index.includes('<script type="importmap">'), 'canonical relative imports do not need an import map');
assert(index.includes('data-ui-release="f1"'));
assert(index.includes('data-engagement-release="m4f1"'));
assert(index.includes('data-timeline-release="m4t1"'));
assert(index.includes('data-weekly-release="m4w1"'));
assert(index.includes('data-frontend-quality-release="fq1"'));
assert(index.includes('data-human-editorial-release="he1"'));

assert(!main.includes('installQualityGates'), 'quality behavior must be canonical, not installed by runtime mutation');
assert(!main.includes('quality/install.mjs'));
assert(main.includes('./ui/app.mjs?home=he1'));
assert(main.includes('./ui/consent-a11y.mjs?frontend=fq1'));
assert(app.includes("../brand/copy.mjs?home=he1"));
assert(app.includes("./screens/home.mjs?home=he1"));
assert(app.includes("import('./screens/profile.mjs?timeline=m4t1')"));
assert(app.includes("import('./screens/weekly.mjs?frontend=fq1')"));
assert(app.includes("import('./screens/now.mjs?engagement=m4f1')"));
assert(app.includes("import('./screens/match.mjs?engagement=m4f1')"));
assert(app.includes('handleTimelineClick'));
assert(app.includes('handleWeeklyClick'));
assert(app.includes('closeOpenAppDialogs'));
assert(app.includes('clearNotice()'));
assert(app.includes("HUMAN_EDITORIAL_RELEASE = 'he1'"));
assert(!app.includes('screenMethods'), 'screen prototype mixing must be removed');
assert(!app.includes('Object.assign(VibeApp.prototype, screenMethods'));
assert.equal((app.match(/document\.addEventListener\('click'/g) || []).length, 1, 'the application must install one click delegation layer');
assert(timelineActions.includes('restore-profile-snapshot'));
assert(timelineActions.includes('clear-profile-history'));
assert(timelineActions.includes('showConfirmDialog'));
assert(!timelineActions.includes('window.confirm'));
assert(dialogs.includes('data-dialog-cancel'));
assert(dialogs.includes('data-dialog-confirm'));
assert(consent.includes("banner.setAttribute('role', 'region')"));
assert(weeklyActions.includes('share-weekly-card'));
assert(weeklyActions.includes('weekly-listen'));
assert(profile.includes('profile-timeline'));
assert(weekly.includes('weekly-hero'));
assert(weekly.includes('visibleWeeklyTags'));
assert(home.includes('human-editorial-home'));
assert(home.includes('human-match__bridge'));

for (const staticSource of [main, app, actions, timelineActions, home]) {
  assert(!/from ['"].*domain\/recommendation\.mjs/.test(staticSource), 'home boot graph must not statically import the recommendation catalog');
  assert(!/from ['"].*domain\/match\.mjs/.test(staticSource), 'home boot graph must not statically import the match catalog');
  assert(!/from ['"].*data\/tracks\.mjs/.test(staticSource), 'home boot graph must not statically import all tracks');
}
assert(actions.includes("await import('../domain/recommendation.mjs?engagement=m4f1')"), 'context generation must lazy-load M4 recommendations');
assert(home.includes('HOME_SHOWCASE'), 'home must use the fixed lightweight showcase');
assert(home.includes('weeklyActivityStatus'), 'home must expose the lightweight return-loop state without loading the catalog');

for (const layer of ['core', 'features', 'responsive', 'quality', 'editorial', 'stability', 'accessibility', 'engagement', 'timeline', 'weekly', 'frontend-quality', 'human-editorial']) {
  assert(cssEntry.includes(`layer(${layer})`), `CSS entry is missing the ${layer} cascade layer`);
}
assert(cssEntry.includes('v2-m4.css?engagement=m4f1'));
assert(cssEntry.includes('v2-m4-timeline.css?timeline=m4t1'));
assert(cssEntry.includes('v2-m4-weekly.css?frontend=fq1'));
assert(cssEntry.includes('v2-frontend-quality.css?frontend=fq1'));
assert(cssEntry.includes('v2-human-editorial.css?home=he1'));
assert.equal(buildInfo.uiRelease, 'f1');
assert.equal(buildInfo.engagementRelease, 'm4f1');
assert.equal(buildInfo.timelineRelease, 'm4t1');
assert.equal(buildInfo.weeklyRelease, 'm4w1');
assert.equal(buildInfo.frontendQualityRelease, 'fq1');
assert.equal(buildInfo.humanEditorialRelease, 'he1');
assert.equal(buildInfo.entry, '/src/v2/main.mjs?home=he1');
assert.equal(buildInfo.styleEntry, '/v2-app.css?home=he1');
assert.equal(buildInfo.runtimeOverrides, false);
assert.equal(buildInfo.lazyRoutes.length, 4);
assert.equal(buildInfo.timelineData.length, 4);
assert.equal(buildInfo.weeklyData.length, 6);
assert.equal(buildInfo.frontendQualityData.length, 4);
assert.equal(buildInfo.humanEditorialData.length, 3);

console.log('Frontend consolidation, feedback, timeline, Weekly Vibe, FQ1, and HE1 layering checks passed.');
