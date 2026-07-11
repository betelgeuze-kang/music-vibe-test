const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');

const index = read('index.html');
const legacyFixes = read('p0-fixes.js');
const worker = read('sw.js');
const analytics = read('p2-analytics.js');

assert(!index.includes('contact@example.com'), 'placeholder contact address must remain removed');
assert(!index.includes('googletagmanager.com'), 'GA4 must not load eagerly in HTML');
assert(!index.includes('pagead2.googlesyndication.com'), 'AdSense must not load eagerly in HTML');
assert(!index.includes('kakao_js_sdk'), 'Kakao SDK must not load eagerly');
assert(!index.includes("serviceWorker.register('./sw.js')"), 'V2 must not register the legacy worker');
assert(index.includes('p2-analytics.js'), 'consent-aware analytics must load');
assert(index.includes('data-analytics-consent-ui="standalone"'), 'the app must expose a real accept/decline consent UI');
assert(index.includes('src/v2/main.mjs'), 'the V2 entry point must be explicit');

assert(legacyFixes.includes('music-vibe-consent-v2'), 'legacy rollback still retains explicit consent state');
assert(legacyFixes.includes('declineCookies'), 'legacy rollback still provides a reject option');
assert(worker.includes('registration.unregister()'), 'cleanup worker must unregister itself');
assert(worker.includes("startsWith(LEGACY_CACHE_PREFIX)"), 'legacy caches must be removable');
assert(!worker.includes('respondWith(caches.match'), 'cleanup worker must not restore cache-first behavior');

assert(analytics.includes("const CONSENT_KEY = 'music-vibe-consent-v2'"), 'active analytics must use the explicit consent key');
assert(analytics.includes("consentState === 'accepted'"), 'active analytics must remain consent gated');
assert(analytics.includes('standalone-cookie-banner'), 'active analytics must provide standalone consent controls');

new Function(legacyFixes);
new Function(worker);
new Function(analytics);
console.log('P0 compatibility checks passed.');
