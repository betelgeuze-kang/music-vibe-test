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
  read('src/v2/ui/actions.mjs')
].join('\n');
const profile = read('src/v2/domain/profile.mjs');
const recommendation = read('src/v2/domain/recommendation.mjs');
const match = read('src/v2/domain/match.mjs');
const roadmap = read('docs/product/V2_ROADMAP.md');
const architecture = read('docs/product/V2_ARCHITECTURE.md');
const packageJson = JSON.parse(read('package.json'));

for (const file of [
  'v2-core.css',
  'v2-features.css',
  'v2-responsive.css',
  'src/v2/data/axes.mjs',
  'src/v2/data/archetypes.mjs',
  'src/v2/data/questions.mjs',
  'src/v2/data/contexts.mjs',
  'src/v2/data/tracks.mjs',
  'src/v2/data/copy.mjs',
  'src/v2/domain/profile.mjs',
  'src/v2/domain/recommendation.mjs',
  'src/v2/domain/match.mjs',
  'src/v2/infrastructure/storage.mjs',
  'src/v2/infrastructure/share.mjs',
  'src/v2/ui/helpers.mjs',
  'src/v2/ui/app.mjs',
  'src/v2/ui/screens.mjs',
  'src/v2/ui/actions.mjs',
  'src/v2/main.mjs'
]) {
  assert(fs.existsSync(path.join(root, file)), `missing V2 file: ${file}`);
}

assert(index.includes('src/v2/main.mjs'), 'V2 module entry must load');
for (const stylesheet of ['v2-core.css', 'v2-features.css', 'v2-responsive.css']) {
  assert(index.includes(stylesheet), `V2 stylesheet must load: ${stylesheet}`);
}
assert(index.includes('p2-analytics.js'), 'consent-aware analytics infrastructure must remain');
assert(index.includes('Version Check: P2 Growth Analytics & Experiments'), 'Pages deployment compatibility marker must remain');
assert(index.includes('V2 Product Foundation'), 'V2 deployment marker must be explicit');
assert(!index.includes('logic.js'), 'legacy application runtime must not load on the V2 home');
assert(!index.includes('p1-experience.js'), 'P1 overrides must not load on the V2 home');
assert(!index.includes('p2-operations.js'), 'legacy funnel wrappers must not load on the V2 home');
assert(index.includes('data-analytics-consent-ui="standalone"'), 'the V2 app must use the standalone consent UI');

assert(main.includes('retireLegacyRuntime'), 'V2 bootstrap must clean up stale workers and caches');
assert(app.includes("this.navigate('discover')"), 'V2 must provide profile onboarding');
assert(app.includes('renderMatch()'), 'V2 must provide friend matching');
assert(app.includes("track('vibe_now_generate'"), 'Vibe Now generation must be measured');
assert(app.includes("track('match_view'"), 'Vibe Match must be measured');
assert(app.includes("track('ref_complete'"), 'shared comparison completion must be measured');
assert(profile.includes('PROFILE_VERSION = 2'), 'the profile contract must be versioned');
assert(profile.includes('toBase64Url'), 'share profiles must use URL-safe encoding');
assert(recommendation.includes('profileFit * 0.58'), 'recommendation weighting must be explicit');
assert(match.includes('bridgeTrackScore'), 'Vibe Match must have a dedicated bridge ranking model');

for (const phrase of ['My Vibe', 'Vibe Now', 'Vibe Match', 'North Star Metric', 'Milestone 4']) {
  assert(roadmap.includes(phrase), `roadmap is missing: ${phrase}`);
}
assert(architecture.includes('VibeProfile v2'), 'architecture must define the V2 profile schema');
assert(architecture.includes('Share token'), 'architecture must document the share boundary');
assert(architecture.includes('ui/screens.mjs'), 'architecture must document the split UI layer');
assert(packageJson.description.includes('music identity'), 'package metadata must describe the V2 product');
assert(packageJson.scripts.test.includes('v2-domain.test.mjs'), 'V2 domain tests must run in npm test');

console.log('V2 smoke checks passed.');
