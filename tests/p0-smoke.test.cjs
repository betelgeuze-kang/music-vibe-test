const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');

const index = read('index.html');
const fixes = read('p0-fixes.js');
const worker = read('sw.js');

assert(!index.includes('contact@example.com'), 'placeholder contact address must be removed');
assert(index.includes('music-vibe-test/issues/new'), 'a working contact channel must be present');
assert(!index.includes('googletagmanager.com'), 'GA4 must not load before consent');
assert(!index.includes('pagead2.googlesyndication.com'), 'AdSense must not load before consent');
assert(!index.includes('kakao_js_sdk'), 'Kakao SDK must not be loaded eagerly or twice');
assert(!index.includes("serviceWorker.register('./sw.js')"), 'new pages must not register the legacy worker');
assert(index.includes('p0-fixes.js'), 'P0 runtime fixes must be loaded');
assert(index.includes('export-qr-image'), 'the export card must contain a real QR image target');
assert(!index.includes('export-rarity-badge'), 'unsupported rarity must be removed from the export card');
assert(!index.includes('export-energy-value'), 'random energy must be removed from the export card');
assert(!index.includes('export-result-id'), 'random result IDs must be removed from the export card');

assert(fixes.includes("url.searchParams.set('ref'"), 'share URL must use URLSearchParams for ref');
assert(fixes.includes("url.searchParams.set('lang'"), 'share URL must retain the language');
assert(!fixes.includes('?ref ='), 'share URL must not contain spaced query syntax');
assert(fixes.includes('music-vibe-consent-v2'), 'explicit consent state must be persisted');
assert(fixes.includes('declineCookies'), 'the consent banner must provide a reject option');
assert(fixes.includes('qrcodejs@1.0.0'), 'QR generation must use a pinned library');
assert(fixes.includes('html2canvas@1.4.1'), 'image capture must use a pinned lazy-loaded library');
assert(fixes.includes('VIBE PROFILE'), 'unsupported rarity badges must be normalized');
assert(fixes.includes('hashString(window.getShareUrl())'), 'export identifiers must be deterministic');

assert(worker.includes('registration.unregister()'), 'cleanup worker must unregister itself');
assert(worker.includes("startsWith(LEGACY_CACHE_PREFIX)"), 'legacy caches must be deleted');
assert(!worker.includes('respondWith(caches.match'), 'cleanup worker must not use cache-first fetch handling');

// Parse browser scripts without executing them.
new Function(fixes);
new Function(worker);

console.log('P0 smoke checks passed.');
