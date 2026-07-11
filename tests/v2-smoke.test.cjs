const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');

const index = read('index.html');
const main = read('src/v2/main.mjs');
const app = [
  read('src/v2/ui/app.mjs'),
  read('src/v2/ui/screens.mjs'),
  read('src/v2/ui/actions.mjs'),
  read('src/v2/quality/install.mjs'),
  read('src/v2/quality/visuals.mjs')
].join('\n');
const profile = read('src/v2/domain/profile.mjs');
const presentation = read('src/v2/domain/presentation.mjs');
const recommendation = read('src/v2/domain/recommendation.mjs');
const match = read('src/v2/domain/match.mjs');
const roadmap = read('docs/product/V2_ROADMAP.md');
const architecture = read('docs/product/V2_ARCHITECTURE.md');
const qualityGates = read('docs/product/QUALITY_GATES.md');
const packageJson = JSON.parse(read('package.json'));
const buildInfo = JSON.parse(read('build-info.json'));

for (const file of [
  'v2-core.css',
  'v2-features.css',
  'v2-responsive.css',
  'v2-quality.css',
  'src/v2/data/axes.mjs',
  'src/v2/data/archetypes.mjs',
  'src/v2/data/questions.mjs',
  'src/v2/data/contexts.mjs',
  'src/v2/data/tracks.mjs',
  'src/v2/data/editorial-tracks.mjs',
  'src/v2/data/home-showcase.mjs',
  'src/v2/data/copy.mjs',
  'src/v2/domain/profile.mjs',
  'src/v2/domain/presentation.mjs',
  'src/v2/domain/recommendation.mjs',
  'src/v2/domain/match.mjs',
  'src/v2/infrastructure/storage.mjs',
  'src/v2/infrastructure/share.mjs',
  'src/v2/ui/helpers.mjs',
  'src/v2/ui/app.mjs',
  'src/v2/ui/screens.mjs',
  'src/v2/ui/actions.mjs',
  'src/v2/quality/install.mjs',
  'src/v2/quality/visuals.mjs',
  'src/v2/main.mjs',
  'build-info.json'
]) {
  assert(fs.existsSync(path.join(root, file)), `missing V2 file: ${file}`);
}

assert(index.includes('src/v2/main.mjs?v=qg1'), 'versioned V2 module entry must load');
for (const stylesheet of ['v2-core.css', 'v2-features.css', 'v2-responsive.css', 'v2-quality.css']) {
  assert(index.includes(`${stylesheet}?v=qg1`), `V2 stylesheet must be release-locked: ${stylesheet}`);
}
assert(index.includes('p2-analytics.js?v=qg1'), 'consent-aware analytics infrastructure must remain');
assert(index.includes('Version Check: P2 Growth Analytics & Experiments'), 'Pages deployment compatibility marker must remain');
assert(index.includes('V2 Quality Gates QG1'), 'quality-gate deployment marker must be explicit');
assert(index.includes('Editorial Content E1'), 'editorial content deployment marker must be explicit');
assert(index.includes('data-release-id="qg1"'), 'body must expose the release ID');
assert(index.includes('data-content-release="e1"'), 'body must expose the content release ID');
assert.equal(buildInfo.release, 'qg1', 'build contract must match the HTML release');
assert.equal(buildInfo.contentRelease, 'e1', 'build contract must match the editorial content release');
assert(!index.includes('logic.js'), 'legacy application runtime must not load on the V2 home');
assert(!index.includes('p1-experience.js'), 'P1 overrides must not load on the V2 home');
assert(!index.includes('p2-operations.js'), 'legacy funnel wrappers must not load on the V2 home');
assert(index.includes('data-analytics-consent-ui="standalone"'), 'the V2 app must use the standalone consent UI');

assert(main.includes('retireLegacyRuntime'), 'V2 bootstrap must clean up stale workers and caches');
assert(main.includes('installQualityGates'), 'quality runtime must install before app start');
assert(main.includes('build-info.json?v=qg1'), 'runtime build contract must be cache-safe');
assert(app.includes("this.navigate('discover')"), 'V2 must provide profile onboarding');
assert(app.includes('renderMatch()'), 'V2 must provide friend matching');
assert(app.includes("track('vibe_now_generate'"), 'Vibe Now generation must be measured');
assert(app.includes("track('match_view'"), 'Vibe Match must be measured');
assert(app.includes("track('ref_complete'"), 'shared comparison completion must be measured');
assert(app.includes('renderBipolarAxes'), 'quality profile must expose bipolar dimensions');
assert(app.includes('renderVibeGlyph'), 'quality profile must expose the Vibe Glyph');
assert(profile.includes('PROFILE_VERSION = 2'), 'the profile contract must remain versioned');
assert(profile.includes('PROFILE_TOKEN_VERSION = 3'), 'share tokens must have the checksummed token version');
assert(profile.includes('tokenChecksum'), 'share profiles must reject tampering');
assert(recommendation.includes('editorialBonus'), 'recommendation weighting must prioritize manually edited tracks');
assert(recommendation.includes('candidate.track.editorialNote'), 'recommendation reasons must prefer liner notes');
assert(recommendation.includes('selectDiverseCandidates'), 'recommendations must include MMR diversity');
assert(match.includes('bridgeTrackScore'), 'Vibe Match must have a dedicated bridge ranking model');
assert(match.includes('resonanceLabel') && match.includes('discoveryLabel'), 'Vibe Match must expose human-readable match bands');
assert(presentation.includes('SCORE_BANDS') && presentation.includes('MATCH_BANDS'), 'presentation must soften precise scores with bands');

for (const phrase of ['My Vibe', 'Vibe Now', 'Vibe Match', 'North Star Metric', 'Milestone 4']) {
  assert(roadmap.includes(phrase), `roadmap is missing: ${phrase}`);
}
assert(architecture.includes('VibeProfile v2'), 'architecture must define the V2 profile schema');
assert(architecture.includes('Share token'), 'architecture must document the share boundary');
assert(architecture.includes('ui/screens.mjs'), 'architecture must document the split UI layer');
for (const phrase of ['Deployment reliability', 'Core UX', 'Measurement validity', 'Recommendation quality', 'Browser and accessibility']) {
  assert(qualityGates.includes(phrase), `quality-gate documentation is missing: ${phrase}`);
}
assert(packageJson.description.includes('music identity'), 'package metadata must describe the V2 product');
assert(packageJson.scripts.test.includes('v2-domain.test.mjs'), 'V2 domain tests must run in npm test');
assert(packageJson.scripts.test.includes('v2-quality.test.mjs'), 'V2 quality domain tests must run in npm test');
assert(packageJson.scripts.test.includes('editorial-integrity.test.mjs'), 'editorial integrity tests must run in npm test');
assert(packageJson.scripts.test.includes('profile-audit.test.mjs'), 'profile audit must run in npm test');

console.log('V2 smoke checks passed.');
