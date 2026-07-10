const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');

const index = read('index.html');
const analytics = read('p2-analytics.js');
const operations = read('p2-operations.js');
const staticBindings = read('p2-static.js');
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

assert(index.includes('<script src="p2-analytics.js"></script>'), 'analytics runtime must load in the app');
assert(index.includes('<script src="p2-operations.js"></script>'), 'operations runtime must load in the app');
assert(index.indexOf('p2-analytics.js') < index.indexOf('p1-experience.js'), 'analytics must preserve the legacy flow before P1 overrides it');
assert(index.indexOf('p2-operations.js') > index.indexOf('p1-experience.js'), 'funnel wrappers must load after P1');

for (const token of [
  'visitor_id', 'session_id', 'visit_id', 'utm_source', 'utm_medium',
  'utm_campaign', 'utm_content', 'utm_term', 'experiment_id', 'experiment_variant'
]) {
  assert(analytics.includes(token), `missing common analytics context: ${token}`);
}
assert(analytics.includes("const VISITOR_KEY = 'music-vibe-visitor-v1'"), 'visitor assignment must persist across sessions');
assert(analytics.includes("consentState === 'accepted'"), 'GA4 sending must be consent gated');
assert(analytics.includes('pendingEvents'), 'pre-consent events must be queued in memory');
assert(analytics.includes('standalone-cookie-banner'), 'static pages need their own consent UI');
assert(analytics.includes('analytics-debug-panel'), 'analytics debug panel must be available');
assert(analytics.includes('PerformanceObserver'), 'Web Vitals monitoring must be installed');
assert(analytics.includes("trackEvent('performance_summary'"), 'performance summary event must be emitted');
assert(analytics.includes("trackEvent('test_error'"), 'runtime and resource errors must be measured');

const experimentIds = [
  'landing_copy_v1',
  'test_length_v1',
  'result_delay_v1',
  'share_placement_v1',
  'export_card_v1',
  'playlist_visibility_v1'
];
for (const experimentId of experimentIds) {
  assert(operations.includes(`${experimentId}:`), `missing experiment definition: ${experimentId}`);
}
assert.equal((operations.match(/status:\s*'active'/g) || []).length, 1, 'exactly one production experiment must be active');
assert(operations.includes('analyticsSnapshot().visitorId'), 'experiment assignment must use the stable visitor ID');
assert(operations.includes("source: 'preview'"), 'query-string experiment preview must not overwrite production assignment');
assert(operations.includes('disabled_invalid_config'), 'invalid multi-active configuration must fail closed');
assert(operations.includes('30000'), 'background abandonment must wait 30 seconds');
assert(operations.includes("track('result_abandon'"), 'result-wait abandonment must be distinct');
assert(operations.includes("track('sample_result_click'"), 'sample previews must be separated from completed tests');
assert(operations.includes("url.searchParams.set('src', 'share')"), 'shared result URLs must include internal attribution');
assert(operations.includes("url.searchParams.set('utm_medium', 'share')"), 'shared result URLs must include UTM medium');

const requiredEvents = [
  'landing_view', 'start_test', 'question_answer', 'test_complete', 'result_view',
  'test_abandon', 'result_abandon', 'ref_visit', 'ref_complete', 'audio_play',
  'share_click', 'share_success', 'share_cancel', 'share_intent_open', 'share_error',
  'image_save', 'image_save_success', 'sample_result_click', 'experiment_exposure'
];
const combinedRuntime = `${analytics}\n${operations}\n${staticBindings}`;
for (const eventName of requiredEvents) {
  assert(combinedRuntime.includes(`'${eventName}'`), `missing P2 event: ${eventName}`);
}

assert(staticBindings.includes("track('static_result_view'"), 'static result views must be measured');
assert(staticBindings.includes('if (sharedEntry)'), 'organic static views must not be counted as referrals');
assert(staticBindings.includes("track('ref_cta_click'"), 'static-to-app CTA must be measured');
assert(staticBindings.includes("url.searchParams.set('src', 'share')"), 'static shares must carry attribution');
assert(staticBindings.includes("track('playlist_click'"), 'static playlist clicks must be measured');

assert(layout.includes('data-page-type="static_result"'), 'static pages must declare page context');
assert(layout.includes('data-analytics-consent-ui="standalone"'), 'static pages must request standalone consent UI');
assert(layout.includes('<script src="/p2-analytics.js"></script>'), 'static pages must load analytics');
assert(layout.includes('<script src="/p2-static.js"></script>'), 'static pages must load static bindings');
assert(layout.includes('src=static_result'), 'static result CTA must preserve source attribution');

assert(workflow.includes('actions/checkout@v4'), 'CI must check out the repository');
assert(workflow.includes('actions/setup-node@v4'), 'CI must install the pinned Node runtime');
assert(workflow.includes('npm ci'), 'CI must install from the lockfile');
assert(workflow.includes('npm run ci'), 'CI must run syntax and regression checks');
assert(packageJson.scripts.test.includes('p2-smoke.test.cjs'), 'npm test must include the P2 suite');
assert.equal(packageJson.scripts.ci, 'npm run test:syntax && npm test', 'CI script must include syntax and smoke checks');

new Function(analytics);
new Function(operations);
new Function(staticBindings);
console.log('P2 smoke checks passed.');
