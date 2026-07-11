const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');

const index = read('index.html');
const analytics = read('p2-analytics.js');
const legacyOperations = read('p2-operations.js');
const staticBindings = read('p2-static.js');
const v2App = [
  read('src/v2/ui/app.mjs'),
  read('src/v2/ui/screens.mjs'),
  read('src/v2/ui/actions.mjs'),
  read('src/v2/quality/install.mjs')
].join('\n');
const layout = read('_layouts/result.html');
const workflow = read('.github/workflows/ci.yml');
const packageJson = JSON.parse(read('package.json'));

for (const file of [
  'docs/analytics/EVENTS.md',
  'docs/analytics/FUNNEL.md',
  'docs/analytics/GA4_SETUP.md',
  'docs/experiments/README.md',
  'docs/operations/WEEKLY_RUNBOOK.md'
]) {
  assert(fs.existsSync(path.join(root, file)), `missing P2 operating document: ${file}`);
}

const analyticsScriptIndex = index.search(/<script src="p2-analytics\.js(?:\?v=[^"]+)?"><\/script>/);
const appScriptIndex = index.search(/<script type="module" src="src\/v2\/main\.mjs(?:\?v=[^"]+)?"><\/script>/);
assert(analyticsScriptIndex >= 0, 'analytics runtime must load in the V2 app');
assert(appScriptIndex >= 0 && analyticsScriptIndex < appScriptIndex, 'analytics must initialize before the V2 module script');
assert(!index.includes('<script src="p2-operations.js"></script>'), 'legacy funnel wrappers must not double-instrument V2');

for (const token of [
  'visitor_id', 'session_id', 'visit_id', 'utm_source', 'utm_medium',
  'utm_campaign', 'utm_content', 'utm_term', 'experiment_id', 'experiment_variant'
]) {
  assert(analytics.includes(token), `missing common analytics context: ${token}`);
}
assert(analytics.includes("const VISITOR_KEY = 'music-vibe-visitor-v1'"), 'visitor assignment must persist across sessions');
assert(analytics.includes("consentState === 'accepted'"), 'GA4 sending must be consent gated');
assert(analytics.includes('pendingEvents'), 'pre-consent events must be queued in memory');
assert(analytics.includes('analytics-debug-panel'), 'analytics debug panel must remain available');
assert(analytics.includes('PerformanceObserver'), 'Web Vitals monitoring must remain installed');

for (const experimentId of ['landing_copy_v1', 'test_length_v1', 'result_delay_v1', 'share_placement_v1', 'export_card_v1', 'playlist_visibility_v1']) {
  assert(legacyOperations.includes(`${experimentId}:`), `legacy experiment definition missing: ${experimentId}`);
}

const requiredEvents = [
  'landing_view', 'start_test', 'question_answer', 'test_complete', 'result_view',
  'test_abandon', 'ref_visit', 'ref_complete', 'audio_play', 'playlist_click',
  'share_click', 'share_success', 'share_cancel', 'share_error',
  'image_save', 'image_save_success', 'vibe_now_generate', 'match_view', 'match_invite_created'
];
const combinedRuntime = `${analytics}\n${v2App}\n${staticBindings}`;
for (const eventName of requiredEvents) {
  assert(combinedRuntime.includes(`'${eventName}'`), `missing active analytics event: ${eventName}`);
}

assert(staticBindings.includes("track('static_result_view'"), 'static result views must remain measured');
assert(staticBindings.includes('if (sharedEntry)'), 'organic static views must not be counted as referrals');
assert(layout.includes('data-page-type="static_result"'), 'static pages must declare page context');
assert(layout.includes('<script src="/p2-analytics.js"></script>'), 'static pages must load analytics');
assert(layout.includes('<script src="/p2-static.js"></script>'), 'static pages must load static bindings');

assert(workflow.includes('actions/checkout@v4'), 'CI must check out the repository');
assert(workflow.includes('actions/setup-node@v4'), 'CI must install the pinned Node runtime');
assert(workflow.includes('npm ci'), 'CI must install from the lockfile');
assert(workflow.includes('npm run ci'), 'CI must run syntax and regression checks');
assert(packageJson.scripts.test.includes('p2-smoke.test.cjs'), 'npm test must include the P2 suite');
assert(packageJson.scripts.test.includes('v2-domain.test.mjs'), 'npm test must include V2 domain checks');
assert.equal(packageJson.scripts.ci, 'npm run test:syntax && npm test', 'CI script must include syntax and smoke checks');

new Function(analytics);
new Function(legacyOperations);
new Function(staticBindings);
console.log('P2 compatibility checks passed.');
