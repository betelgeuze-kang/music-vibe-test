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
const audioActions = read('src/v2/ui/commercial-audio-actions.mjs');
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
  'src/v2/ui/components/shell.mjs', 'src/v2/ui/dialogs.mjs', 'src/v2/ui/consent-a11y.mjs',
  'src/v2/ui/commercial-audio-actions.mjs', 'src/v2/ui/screens/home.mjs', 'src/v2/ui/screens/discover.mjs',
  'src/v2/ui/screens/empty.mjs', 'src/v2/ui/screens/profile.mjs', 'src/v2/ui/screens/weekly.mjs',
  'src/v2/ui/screens/now.mjs', 'src/v2/ui/screens/match.mjs', 'src/v2/ui/timeline-actions.mjs',
  'src/v2/ui/weekly-actions.mjs', 'src/v2/domain/feedback.mjs', 'src/v2/domain/timeline.mjs',
  'src/v2/domain/tag-visibility.mjs', 'src/v2/domain/weekly.mjs', 'src/v2/audio/original-clips.mjs',
  'src/v2/ads/policy.mjs', 'v2-app.css', 'v2-m4.css', 'v2-m4-timeline.css', 'v2-m4-weekly.css',
  'v2-frontend-quality.css', 'v2-human-editorial.css', 'v2-commercial-readiness.css', 'ads.txt'
]) assert(exists(file), `canonical UI module is missing: ${file}`);

assert.equal((index.match(/rel="stylesheet"/g) || []).length, 1);
assert(index.includes('v2-app.css?commercial=cr1'));
assert(index.includes('src/v2/main.mjs?commercial=cr1'));
assert(index.includes('data-commercial-readiness-release="cr1"'));
assert(!index.includes('src/v2/brand/install.mjs'));
assert(!index.includes('src/v2/brand/interaction.mjs'));
assert(!index.includes('brand-pending'));
assert(!index.includes('<script type="importmap">'));

assert(!main.includes('installQualityGates'));
assert(main.includes('./ui/app.mjs?commercial=cr1'));
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
assert(app.includes('commercialAudioMethods'));
assert(app.includes("COMMERCIAL_READINESS_RELEASE = 'cr1'"));
assert(!app.includes('screenMethods'));
assert.equal((app.match(/document\.addEventListener\('click'/g) || []).length, 1);

assert(timelineActions.includes('showConfirmDialog'));
assert(!timelineActions.includes('window.confirm'));
assert(dialogs.includes('/privacy/') && dialogs.includes('/audio-credits/'));
assert(consent.includes("banner.setAttribute('role', 'region')"));
assert(weeklyActions.includes('share-weekly-card'));
assert(profile.includes('profile-timeline'));
assert(weekly.includes('weekly-hero'));
assert(home.includes('human-editorial-home'));
assert(audioActions.includes('createOriginalAudioUrl'));
assert(audioActions.includes('isCommercialAudioClip'));

for (const staticSource of [main, app, actions, timelineActions, home]) {
  assert(!/from ['"].*domain\/recommendation\.mjs/.test(staticSource));
  assert(!/from ['"].*domain\/match\.mjs/.test(staticSource));
  assert(!/from ['"].*data\/tracks\.mjs/.test(staticSource));
}
assert(actions.includes("await import('../domain/recommendation.mjs?engagement=m4f1')"));
assert(home.includes('HOME_SHOWCASE'));
assert(home.includes('weeklyActivityStatus'));

for (const layer of ['core', 'features', 'responsive', 'quality', 'editorial', 'stability', 'accessibility', 'engagement', 'timeline', 'weekly', 'frontend-quality', 'human-editorial', 'commercial-readiness']) {
  assert(cssEntry.includes(`layer(${layer})`), `CSS entry is missing ${layer}`);
}
assert(cssEntry.includes('v2-commercial-readiness.css?commercial=cr1'));
assert.equal(buildInfo.uiRelease, 'f1');
assert.equal(buildInfo.humanEditorialRelease, 'he1');
assert.equal(buildInfo.commercialReadinessRelease, 'cr1');
assert.equal(buildInfo.entry, '/src/v2/main.mjs?commercial=cr1');
assert.equal(buildInfo.styleEntry, '/v2-app.css?commercial=cr1');
assert.equal(buildInfo.runtimeOverrides, false);
assert.equal(buildInfo.adsEnabled, false);
assert.equal(buildInfo.adProvider, 'google-adsense');
assert.equal(buildInfo.adPublisherId, 'pub-1386368370627622');
assert.equal(buildInfo.adsTxt, '/ads.txt');
assert.equal(buildInfo.lazyRoutes.length, 4);
assert.equal(buildInfo.commercialReadinessData.length, 9);

console.log('Frontend consolidation through CR1 commercial readiness checks passed.');
