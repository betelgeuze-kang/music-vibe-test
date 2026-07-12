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
  read('src/v2/ui/actions.mjs'),
  read('src/v2/ui/weekly-actions.mjs'),
  read('src/v2/ui/screens/home.mjs'),
  read('src/v2/ui/screens/discover.mjs'),
  read('src/v2/ui/screens/profile.mjs'),
  read('src/v2/ui/screens/weekly.mjs'),
  read('src/v2/ui/screens/now.mjs'),
  read('src/v2/ui/screens/match.mjs')
].join('\n');
const layout = read('_layouts/result.html');
const workflow = read('.github/workflows/ci.yml');
const packageJson = JSON.parse(read('package.json'));

for (const file of [
  'docs/analytics/EVENTS.md',
  'docs/analytics/FUNNEL.md',
  'docs/analytics/GA4_SETUP.md',
  'docs/experiments/README.md',
  'docs/operations/WEEKLY_RUNBOOK.md',
  'docs/product/M4_WEEKLY.md'
]) assert(fs.existsSync(path.join(root, file)), `missing P2 operating document: ${file}`);

const analyticsScriptIndex = index.search(/<script src="p2-analytics\.js(?:\?[^\"]+)?"><\/script>/);
const appScriptIndex = index.search(/<script type="module" src="src\/v2\/main\.mjs(?:\?[^\"]+)?"><\/script>/);
assert(analyticsScriptIndex >= 0, 'analytics runtime must load in the canonical app');
assert(appScriptIndex >= 0 && analyticsScriptIndex < appScriptIndex, 'analytics must initialize before the module script');
assert(!index.includes('<script src="p2-operations.js"></script>'));

for (const token of ['visitor_id', 'session_id', 'visit_id', 'utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term', 'experiment_id', 'experiment_variant']) {
  assert(analytics.includes(token), `missing common analytics context: ${token}`);
}
assert(analytics.includes("const VISITOR_KEY = 'music-vibe-visitor-v1'"));
assert(analytics.includes("consentState === 'accepted'"));
assert(analytics.includes('pendingEvents'));
assert(analytics.includes('analytics-debug-panel'));
assert(analytics.includes('PerformanceObserver'));

for (const experimentId of ['landing_copy_v1', 'test_length_v1', 'result_delay_v1', 'share_placement_v1', 'export_card_v1', 'playlist_visibility_v1']) {
  assert(legacyOperations.includes(`${experimentId}:`), `legacy experiment definition missing: ${experimentId}`);
}

const requiredEvents = [
  'landing_view', 'start_test', 'question_answer', 'test_complete', 'result_view',
  'test_abandon', 'ref_visit', 'ref_complete', 'audio_play', 'playlist_click',
  'share_click', 'share_success', 'share_cancel', 'share_error',
  'image_save', 'image_save_success', 'vibe_now_generate', 'match_view', 'match_invite_created',
  'track_feedback', 'recommendation_refresh', 'profile_timeline_view', 'profile_restore',
  'profile_history_clear', 'weekly_vibe_view', 'weekly_vibe_share', 'weekly_vibe_continue', 'return_visit_7d'
];
const combinedRuntime = `${analytics}\n${v2App}\n${staticBindings}`;
for (const eventName of requiredEvents) assert(combinedRuntime.includes(`'${eventName}'`), `missing active analytics event: ${eventName}`);

assert(staticBindings.includes("track('static_result_view'"));
assert(staticBindings.includes('if (sharedEntry)'));
assert(layout.includes('data-page-type="static_result"'));
assert(layout.includes('<script src="/p2-analytics.js"></script>'));
assert(layout.includes('<script src="/p2-static.js"></script>'));

assert(workflow.includes('actions/checkout@v4'));
assert(workflow.includes('actions/setup-node@v4'));
assert(workflow.includes('npm ci'));
assert(workflow.includes('npm run ci'));
assert(packageJson.scripts.test.includes('p2-smoke.test.cjs'));
assert(packageJson.scripts.test.includes('v2-domain.test.mjs'));
assert(packageJson.scripts.test.includes('v2-weekly.test.mjs'));
assert.equal(packageJson.scripts.ci, 'npm run test:syntax && npm test');

new Function(analytics);
new Function(legacyOperations);
new Function(staticBindings);
console.log('P2 canonical compatibility checks passed through M4 Weekly Vibe.');
