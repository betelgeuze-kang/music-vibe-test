const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const source = fs.readFileSync(path.resolve(__dirname, '../p2-analytics.js'), 'utf8');
const CONSENT_KEY = 'music-vibe-consent-v2';
const VISITOR_KEY = 'music-vibe-visitor-v1';
const SESSION_KEY = 'music-vibe-session-v1';

function storage(map) {
  return {
    getItem(key) { return map.has(key) ? map.get(key) : null; },
    setItem(key, value) { map.set(key, String(value)); },
    removeItem(key) { map.delete(key); }
  };
}

function boot(initialConsent = null) {
  const local = new Map(initialConsent ? [[CONSENT_KEY, initialConsent]] : []);
  const session = new Map();
  const scripts = [];
  const documentListeners = new Map();
  const origin = 'https://my-music-vibe.com';
  const window = {
    localStorage: storage(local),
    sessionStorage: storage(session),
    location: {
      origin, hostname: 'my-music-vibe.com', pathname: '/', search: '?ref=ENFP',
      href: origin + '/?ref=ENFP#/match?profile=PRIVATE'
    },
    addEventListener() {},
    setTimeout() { return 1; }
  };
  const document = {
    title: 'My Music Vibe',
    body: {
      dataset: { pageType: 'app', analyticsConsentUi: 'standalone' },
      appendChild(element) { scripts.push(element); }
    },
    documentElement: { lang: 'ko', dataset: {} },
    addEventListener(name, callback) { documentListeners.set(name, callback); },
    dispatchEvent() {},
    getElementById() { return null; },
    head: { appendChild(element) { scripts.push(element); } },
    createElement() {
      const events = new Map();
      return {
        dataset: {}, style: {}, events,
        setAttribute() {}, remove() {},
        addEventListener(name, callback) { events.set(name, callback); },
        querySelector() { return { addEventListener() {} }; }
      };
    }
  };

  vm.runInNewContext(source, {
    window, document, console, URL, URLSearchParams, Map, Math, Date,
    Uint32Array,
    performance: { getEntriesByType() { return []; } },
    CustomEvent: class CustomEvent { constructor(name, options) { this.name = name; this.detail = options.detail; } }
  }, { filename: 'p2-analytics.js' });
  return { window, documentListeners, scripts, local, session };
}

function commands(harness) {
  return (harness.window.dataLayer || []).map((item) => Array.from(item));
}

const fresh = boot();
assert.equal(fresh.window.MusicVibeAnalytics.getSnapshot().visitId, null);
assert.equal(fresh.session.has('music-vibe-attribution-v2'), false);
assert.equal(fresh.scripts.length, 0, 'unknown consent must not load GA4');
assert.equal(fresh.local.has(VISITOR_KEY), false, 'unknown consent must not persist visitor ID');
assert.equal(fresh.session.has(SESSION_KEY), false, 'unknown consent must not persist session ID');
const defaults = commands(fresh).find(([type, action]) => type === 'consent' && action === 'default');
assert(defaults, 'denied consent defaults must precede tag loading');
for (const key of ['analytics_storage', 'ad_storage', 'ad_user_data', 'ad_personalization']) {
  assert.equal(defaults[2][key], 'denied', key + ' defaults denied');
}
assert.equal(fresh.window.trackEvent('start_test', {}).status, 'discarded');
assert.equal(fresh.scripts.length, 0);

fresh.window.MusicVibeAnalytics.setConsent('declined');
assert.equal(fresh.scripts.length, 0, 'rejection must not load GA4');
assert.equal(fresh.local.get(CONSENT_KEY), 'declined');
assert.equal(fresh.local.has(VISITOR_KEY), false);

fresh.window.MusicVibeAnalytics.setConsent('accepted');
assert.equal(fresh.local.get(CONSENT_KEY), 'accepted');
assert.equal(fresh.scripts.length, 1, 'acceptance must load exactly one GA4 script');
assert.equal(fresh.scripts[0].src, '/analytics-frame.html?version=ga4c3');
assert.equal(fresh.scripts[0].referrerPolicy, 'no-referrer');
assert.equal(fresh.local.has(VISITOR_KEY), true, 'ID created only after acceptance');
assert.equal(fresh.session.has(SESSION_KEY), true);
const updates = commands(fresh).filter(([type, action]) => type === 'consent' && action === 'update');
assert(updates.length >= 1, 'consent update required on acceptance');
const granted = updates.at(-1)[2];
assert.equal(granted.analytics_storage, 'granted');
for (const key of ['ad_storage', 'ad_user_data', 'ad_personalization']) {
  assert.equal(granted[key], 'denied', 'analytics consent must never grant advertising');
}
const config = commands(fresh).find(([type, id]) => type === 'config' && id === 'G-XJ8Z43C6LQ');
assert(config, 'existing GA4 data stream configured');
assert.equal(config[2].send_page_view, true, 'standard GA4 first page view enabled');
assert.equal(config[2].page_location, 'https://my-music-vibe.com/');
assert.equal(config[2].allow_google_signals, false);
assert.equal(config[2].allow_ad_personalization_signals, false);

fresh.documentListeners.get('DOMContentLoaded')();
const pageView = fresh.window.MusicVibeAnalytics.getSnapshot().events.find((item) => item.name === 'page_view_internal');
assert(pageView, 'internal page event should still be emitted');
assert.equal(pageView.params.page_location, 'https://my-music-vibe.com/', 'query and fragment must not go to GA4');

fresh.window.MusicVibeAnalytics.setConsent('declined');
assert.equal(fresh.local.has(VISITOR_KEY), false, 'revoking consent erases our visitor identifier');
assert.equal(fresh.session.has(SESSION_KEY), false, 'revoking consent erases our session identifier');
const before = commands(fresh).length;
assert.equal(fresh.window.MusicVibeAnalytics.getSnapshot().visitId, null);
assert.equal(fresh.session.has('music-vibe-attribution-v2'), false);
assert.equal(fresh.window.trackEvent('playlist_click').status, 'discarded');
assert.equal(commands(fresh).length, before, 'no analytics event after decline');

const returningAccepted = boot('accepted');
assert.equal(returningAccepted.scripts.length, 1, 'saved consent restores GA4');
assert.equal(returningAccepted.local.has(VISITOR_KEY), true);

const returningDeclined = boot('declined');
assert.equal(returningDeclined.scripts.length, 0, 'saved decline must not load GA4');
assert.equal(returningDeclined.local.has(VISITOR_KEY), false);

console.log('GA4 consent gating, advertising denial, safe page view and revocation checks passed.');
