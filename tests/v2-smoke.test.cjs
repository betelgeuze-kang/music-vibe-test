const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');
const exists = (file) => fs.existsSync(path.join(root, file));

const index = read('index.html');
const main = read('src/v2/main.mjs');
const app = [
  read('src/v2/ui/app.mjs'), read('src/v2/ui/actions.mjs'), read('src/v2/ui/commercial-audio-actions.mjs'),
  read('src/v2/ui/dialogs.mjs'), read('src/v2/ui/consent-a11y.mjs'), read('src/v2/ui/timeline-actions.mjs'),
  read('src/v2/ui/weekly-actions.mjs'), read('src/v2/ui/components/shell.mjs'), read('src/v2/ui/screens/home.mjs'),
  read('src/v2/ui/screens/discover.mjs'), read('src/v2/ui/screens/profile.mjs'), read('src/v2/ui/screens/weekly.mjs'),
  read('src/v2/ui/screens/now.mjs'), read('src/v2/ui/screens/match.mjs'), read('src/v2/quality/visuals.mjs')
].join('\n');
const packageJson = JSON.parse(read('package.json'));
const buildInfo = JSON.parse(read('build-info.json'));

for (const file of [
  'v2-app.css', 'v2-commercial-readiness.css', 'legal.css', 'ads.txt', 'src/v2/main.mjs', 'src/v2/ui/app.mjs',
  'src/v2/ui/commercial-audio-actions.mjs', 'src/v2/audio/original-clips.mjs', 'src/v2/ads/policy.mjs',
  'src/v2/data/questions.mjs', 'src/v2/data/editorial-tracks.mjs', 'src/v2/domain/recommendation.mjs',
  'src/v2/domain/match.mjs', 'src/v2/domain/weekly.mjs', 'src/v2/domain/timeline.mjs',
  'src/v2/infrastructure/storage.mjs', 'src/v2/infrastructure/share.mjs', 'assets/audio/rights-manifest.json',
  'about/index.html', 'privacy/index.html', 'audio-credits/index.html', 'build-info.json'
]) assert(exists(file), `missing V2/CR1 file: ${file}`);

assert.equal((index.match(/rel="stylesheet"/g) || []).length, 1);
assert(index.includes('v2-app.css?commercial=cr1'));
assert(index.includes('src/v2/main.mjs?commercial=cr1'));
assert(index.includes('Commercial Readiness CR1'));
assert(index.includes('data-commercial-readiness-release="cr1"'));
assert(index.includes('data-ads-enabled="false"'));
assert(!/pagead2\.googlesyndication\.com|adsbygoogle|doubleclick\.net/i.test(index));
assert(!index.includes('src/v2/brand/install.mjs'));
assert(!index.includes('src/v2/brand/interaction.mjs'));
assert(!index.includes('brand-pending'));
assert(!index.includes('type="importmap"'));
assert(index.includes('data-analytics-consent-ui="standalone"'));

assert(main.includes('retireLegacyRuntime'));
assert(main.includes('build-info.json?commercial=cr1'));
assert(main.includes('./ui/app.mjs?commercial=cr1'));
assert(!main.includes('installQualityGates'));
assert(app.includes("COMMERCIAL_READINESS_RELEASE = 'cr1'"));
assert(app.includes('commercialAudioMethods'));
assert(app.includes('createOriginalAudioUrl'));
assert(app.includes('profile-timeline'));
assert(app.includes('weekly-hero'));
assert(app.includes('human-editorial-home'));
assert(app.includes('showConfirmDialog'));
assert(app.includes("role', 'region"));
assert(app.includes("track('track_feedback'"));
assert(app.includes("track('weekly_vibe_view'"));
assert(app.includes("track('return_visit_7d'"));

assert.equal(buildInfo.release, 'qg1');
assert.equal(buildInfo.contentRelease, 'e1');
assert.equal(buildInfo.uiRelease, 'f1');
assert.equal(buildInfo.engagementRelease, 'm4f1');
assert.equal(buildInfo.timelineRelease, 'm4t1');
assert.equal(buildInfo.weeklyRelease, 'm4w1');
assert.equal(buildInfo.frontendQualityRelease, 'fq1');
assert.equal(buildInfo.humanEditorialRelease, 'he1');
assert.equal(buildInfo.commercialReadinessRelease, 'cr1');
assert.equal(buildInfo.adsEnabled, false);
assert.equal(buildInfo.adProvider, 'google-adsense');
assert.equal(buildInfo.adPublisherId, 'pub-1386368370627622');
assert.equal(buildInfo.adsTxt, '/ads.txt');
assert.equal(buildInfo.runtimeOverrides, false);
assert.equal(buildInfo.entry, '/src/v2/main.mjs?commercial=cr1');
assert.equal(buildInfo.styleEntry, '/v2-app.css?commercial=cr1');
assert.equal(buildInfo.commercialReadinessData.length, 9);
assert.equal(read('ads.txt').trim(), 'google.com, pub-1386368370627622, DIRECT, f08c47fec0942fa0');

assert.equal(packageJson.version, '2.0.0');
assert(packageJson.description.includes('Commercial-ready'));
for (const test of ['v2-domain.test.mjs', 'v2-quality.test.mjs', 'editorial-integrity.test.mjs', 'frontend-consolidation.test.mjs', 'frontend-quality.test.mjs', 'human-editorial-home.test.mjs', 'commercial-readiness.test.mjs', 'v2-feedback.test.mjs', 'v2-timeline.test.mjs', 'v2-weekly.test.mjs', 'profile-audit.test.mjs']) {
  assert(packageJson.scripts.test.includes(test), `test suite is missing ${test}`);
}

console.log('V2 canonical CR1 commercial-ready smoke checks passed.');
