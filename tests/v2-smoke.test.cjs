const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');

const index = read('index.html');
const main = read('src/v2/main.mjs');
const app = [
  read('src/v2/ui/app.mjs'),
  read('src/v2/ui/actions.mjs'),
  read('src/v2/ui/timeline-actions.mjs'),
  read('src/v2/ui/components/shell.mjs'),
  read('src/v2/ui/screens/home.mjs'),
  read('src/v2/ui/screens/discover.mjs'),
  read('src/v2/ui/screens/profile.mjs'),
  read('src/v2/ui/screens/now.mjs'),
  read('src/v2/ui/screens/match.mjs'),
  read('src/v2/quality/visuals.mjs')
].join('\n');
const profile = read('src/v2/domain/profile.mjs');
const presentation = read('src/v2/domain/presentation.mjs');
const feedback = read('src/v2/domain/feedback.mjs');
const timeline = read('src/v2/domain/timeline.mjs');
const recommendation = read('src/v2/domain/recommendation.mjs');
const match = read('src/v2/domain/match.mjs');
const roadmap = read('docs/product/V2_ROADMAP.md');
const architecture = read('docs/product/V2_ARCHITECTURE.md');
const qualityGates = read('docs/product/QUALITY_GATES.md');
const packageJson = JSON.parse(read('package.json'));
const buildInfo = JSON.parse(read('build-info.json'));

for (const file of [
  'v2-app.css',
  'v2-core.css',
  'v2-features.css',
  'v2-responsive.css',
  'v2-quality.css',
  'v2-editorial.css',
  'v2-stabilization.css',
  'v2-stabilization-a11y.css',
  'v2-m4.css',
  'v2-m4-timeline.css',
  'src/v2/data/axes.mjs',
  'src/v2/data/archetypes.mjs',
  'src/v2/data/questions.mjs',
  'src/v2/data/contexts.mjs',
  'src/v2/data/tracks.mjs',
  'src/v2/data/editorial-tracks.mjs',
  'src/v2/data/home-showcase.mjs',
  'src/v2/domain/profile.mjs',
  'src/v2/domain/presentation.mjs',
  'src/v2/domain/feedback.mjs',
  'src/v2/domain/timeline.mjs',
  'src/v2/domain/recommendation.mjs',
  'src/v2/domain/match.mjs',
  'src/v2/infrastructure/storage.mjs',
  'src/v2/infrastructure/share.mjs',
  'src/v2/ui/helpers.mjs',
  'src/v2/ui/app.mjs',
  'src/v2/ui/actions.mjs',
  'src/v2/ui/timeline-actions.mjs',
  'src/v2/ui/components/shell.mjs',
  'src/v2/ui/screens/home.mjs',
  'src/v2/ui/screens/discover.mjs',
  'src/v2/ui/screens/empty.mjs',
  'src/v2/ui/screens/profile.mjs',
  'src/v2/ui/screens/now.mjs',
  'src/v2/ui/screens/match.mjs',
  'src/v2/quality/visuals.mjs',
  'src/v2/main.mjs',
  'build-info.json'
]) {
  assert(fs.existsSync(path.join(root, file)), `missing V2 file: ${file}`);
}

assert.equal((index.match(/rel="stylesheet"/g) || []).length, 1, 'canonical HTML must load one stylesheet entry');
assert(index.includes('v2-app.css?timeline=m4t1'), 'timeline-versioned stylesheet must load');
assert(index.includes('src/v2/main.mjs?timeline=m4t1'), 'timeline-versioned module entry must load');
assert(index.includes('p2-analytics.js?v=qg1'), 'consent-aware analytics infrastructure must remain');
assert(index.includes('Version Check: P2 Growth Analytics & Experiments'), 'Pages deployment compatibility marker must remain');
assert(index.includes('Canonical UI F1'), 'canonical UI deployment marker must remain');
assert(index.includes('M4 Feedback M4F1'), 'M4 feedback deployment marker must remain');
assert(index.includes('Profile Timeline M4T1'), 'M4 timeline deployment marker must be explicit');
assert(index.includes('data-release-id="qg1"'));
assert(index.includes('data-content-release="e1"'));
assert(index.includes('data-ui-release="f1"'));
assert(index.includes('data-engagement-release="m4f1"'));
assert(index.includes('data-timeline-release="m4t1"'));
assert.equal(buildInfo.release, 'qg1');
assert.equal(buildInfo.contentRelease, 'e1');
assert.equal(buildInfo.uiRelease, 'f1');
assert.equal(buildInfo.engagementRelease, 'm4f1');
assert.equal(buildInfo.timelineRelease, 'm4t1');
assert.equal(buildInfo.runtimeOverrides, false);
assert(!index.includes('logic.js'));
assert(!index.includes('p1-experience.js'));
assert(!index.includes('p2-operations.js'));
assert(!index.includes('src/v2/brand/install.mjs'));
assert(!index.includes('src/v2/brand/interaction.mjs'));
assert(!index.includes('brand-pending'));
assert(!index.includes('type="importmap"'));
assert(index.includes('data-analytics-consent-ui="standalone"'));

assert(main.includes('retireLegacyRuntime'));
assert(!main.includes('installQualityGates'));
assert(main.includes('build-info.json?timeline=m4t1'));
assert(app.includes("this.navigate('discover')"));
assert(app.includes("import('./screens/profile.mjs?timeline=m4t1')"));
assert(app.includes("import('./screens/now.mjs?engagement=m4f1')"));
assert(app.includes("import('./screens/match.mjs?engagement=m4f1')"));
assert(app.includes("track('vibe_now_generate'"));
assert(app.includes("track('match_view'"));
assert(app.includes("track('ref_complete'"));
assert(app.includes("track('track_feedback'"));
assert(app.includes("track('profile_restore'"));
assert(app.includes('profile-timeline'));
assert(app.includes('renderBipolarAxes'));
assert(app.includes('renderVibeGlyph'));
assert(profile.includes('PROFILE_VERSION = 2'));
assert(profile.includes('PROFILE_TOKEN_VERSION = 3'));
assert(profile.includes('tokenChecksum'));
assert(feedback.includes('FEEDBACK_ADJUSTMENT_LIMIT = 8'));
assert(feedback.includes('feedbackAdjustmentForTrack'));
assert(timeline.includes('compareProfileSnapshots'));
assert(timeline.includes('roundedTimelineDelta'));
assert(timeline.includes('profileSnapshotKey'));
assert(recommendation.includes('editorialBonus'));
assert(recommendation.includes('candidate.track.editorialNote'));
assert(recommendation.includes('feedbackAdjustmentForTrack'));
assert(recommendation.includes('selectDiverseCandidates'));
assert(match.includes('bridgeTrackScore'));
assert(match.includes('feedbackAdjustmentForTrack'));
assert(match.includes('resonanceLabel') && match.includes('discoveryLabel'));
assert(presentation.includes('SCORE_BANDS') && presentation.includes('MATCH_BANDS'));

for (const phrase of ['My Vibe', 'Vibe Now', 'Vibe Match', 'North Star Metric', 'Milestone 4']) {
  assert(roadmap.includes(phrase), `roadmap is missing: ${phrase}`);
}
assert(architecture.includes('VibeProfile v2'));
assert(architecture.includes('Share token'));
for (const phrase of ['Deployment reliability', 'Core UX', 'Measurement validity', 'Recommendation quality', 'Browser and accessibility']) {
  assert(qualityGates.includes(phrase), `quality-gate documentation is missing: ${phrase}`);
}
assert(packageJson.description.includes('music identity'));
assert(packageJson.scripts.test.includes('v2-domain.test.mjs'));
assert(packageJson.scripts.test.includes('v2-quality.test.mjs'));
assert(packageJson.scripts.test.includes('editorial-integrity.test.mjs'));
assert(packageJson.scripts.test.includes('frontend-consolidation.test.mjs'));
assert(packageJson.scripts.test.includes('v2-feedback.test.mjs'));
assert(packageJson.scripts.test.includes('v2-timeline.test.mjs'));
assert(packageJson.scripts.test.includes('profile-audit.test.mjs'));

console.log('V2 canonical M4 timeline smoke checks passed.');
