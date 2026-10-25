import { test, expect } from '@playwright/test';
import { completeProfile } from './helpers.mjs';

const MEASUREMENT_ID = 'G-XJ8Z43C6LQ';
const FRAME_SELECTOR = '#music-vibe-ga4-frame';

// This is a deterministic transport double, not evidence that Google received data.
// It observes only its own window, including simulated enhanced-measurement History
// API/hash listeners. Live Google requests and the GA4 admin settings need separate
// verification. The clean same-origin frame isolates normal History API listeners;
// it is not a security boundary against code deliberately reading parent.location.
const TAG_DOUBLE = `(() => {
  const id = '${MEASUREMENT_ID}';
  let consent = {};
  let config = {};
  const commands = window.__ga4TestCommands = [];
  function emit(name, params = {}) {
    if (consent.analytics_storage !== 'granted' || window['ga-disable-' + id]) return;
    const url = new URL('https://www.google-analytics.com/g/collect');
    url.searchParams.set('v', '2');
    url.searchParams.set('tid', id);
    url.searchParams.set('en', name);
    url.searchParams.set('dl', params.page_location || config.page_location || location.href);
    url.searchParams.set('dr', params.page_referrer ?? config.page_referrer ?? document.referrer);
    url.searchParams.set('ep.test_payload', JSON.stringify(params));
    fetch(url, { mode: 'no-cors', credentials: 'omit', keepalive: true }).catch(() => {});
  }
  function consume(item) {
    const command = Array.from(item);
    commands.push(command);
    if (command[0] === 'consent') consent = { ...consent, ...command[2] };
    if (command[0] === 'config') {
      config = { ...config, ...command[2] };
      if (config.send_page_view !== false) emit('page_view', config);
    }
    if (command[0] === 'event') emit(command[1], command[2]);
  }
  const layer = window.dataLayer = window.dataLayer || [];
  const queued = Array.from(layer);
  layer.push = function (...items) {
    const count = Array.prototype.push.apply(this, items);
    items.forEach(consume);
    return count;
  };
  queued.forEach(consume);
  for (const method of ['pushState', 'replaceState']) {
    const original = history[method];
    history[method] = function (...args) {
      const result = original.apply(this, args);
      emit('page_view', { page_location: location.href, page_referrer: document.referrer });
      return result;
    };
  }
  addEventListener('hashchange', () => emit('page_view', {
    page_location: location.href, page_referrer: document.referrer
  }));
})();`;

async function instrumentTransport(page) {
  const hits = [];
  const tags = [];
  const advertisements = [];
  const frameRequests = [];
  page.on('request', (request) => {
    const url = request.url();
    if (/googlesyndication|doubleclick|adsbygoogle|adservice/i.test(url)) advertisements.push(url);
    if (new URL(url).pathname === '/analytics-frame.html') frameRequests.push(request);
  });
  await page.route('https://www.googletagmanager.com/gtag/js**', async (route) => {
    tags.push({ url: route.request().url(), frameUrl: route.request().frame().url() });
    await route.fulfill({ contentType: 'application/javascript', body: TAG_DOUBLE });
  });
  await page.route('https://www.google-analytics.com/g/collect**', async (route) => {
    hits.push(Object.fromEntries(new URL(route.request().url()).searchParams));
    await route.fulfill({ status: 204 });
  });
  return { hits, tags, advertisements, frameRequests };
}

async function snapshot(page) {
  return page.evaluate(() => window.MusicVibeAnalytics.getSnapshot());
}

async function setConsent(page, value) {
  await page.evaluate((consent) => window.MusicVibeAnalytics.setConsent(consent), value);
}

async function acceptAndWait(page, transport) {
  await setConsent(page, 'accepted');
  await expect(page.locator(FRAME_SELECTOR)).toHaveCount(1);
  await expect.poll(() => transport.hits.filter((hit) => hit.en === 'page_view').length).toBeGreaterThan(0);
}

async function frameState(page) {
  const frame = page.frames().find((item) => new URL(item.url()).pathname === '/analytics-frame.html');
  expect(frame).toBeTruthy();
  return frame.evaluate(() => ({
      url: location.href,
      referrer: document.referrer,
      commands: window.__ga4TestCommands || [],
      frameTagCount: document.querySelectorAll('#music-vibe-ga4').length
  }));
}

function expectCleanHits(hits, cleanPage, secrets = [], cleanReferrer = '') {
  expect(hits.length).toBeGreaterThan(0);
  for (const hit of hits) {
    expect(hit.dl).toBe(cleanPage);
    expect(hit.dr).toBe(cleanReferrer);
    for (const secret of secrets) expect(JSON.stringify(hit)).not.toContain(secret);
  }
}

test('unknown and rejected consent never load Google or retain analytics identifiers', async ({ page }) => {
  const transport = await instrumentTransport(page);
  await page.goto('/?lang=en&private_query=UNKNOWN_QUERY#/home?compare=UNKNOWN_FRAGMENT');
  await expect(page.getByRole('button', { name: 'Allow analytics' })).toBeVisible();
  const result = await page.evaluate((id) => {
    window.gtag('config', id, { send_page_view: true });
    window.gtag('event', 'before_consent', { page_location: location.href });
    return window.MusicVibeAnalytics.track('before_consent_direct');
  }, MEASUREMENT_ID);
  expect(result.status).toBe('discarded');
  expect(await snapshot(page)).toMatchObject({ consent: 'unknown', visitorId: null, sessionId: null, pendingCount: 0 });
  await expect(page.locator(FRAME_SELECTOR)).toHaveCount(0);
  await expect(page.locator('#music-vibe-ga4')).toHaveCount(0);

  await page.getByRole('button', { name: 'Essential only' }).click();
  await page.evaluate(() => window.MusicVibeAnalytics.track('after_rejection'));
  expect(await snapshot(page)).toMatchObject({ consent: 'declined', visitorId: null, sessionId: null, pendingCount: 0 });
  expect(await page.evaluate(() => ({
    visitor: localStorage.getItem('music-vibe-visitor-v1'),
    session: sessionStorage.getItem('music-vibe-session-v1')
  }))).toEqual({ visitor: null, session: null });
  expect(transport.tags).toEqual([]);
  expect(transport.hits).toEqual([]);
  expect(transport.advertisements).toEqual([]);
});

test('analytics opt-in loads the tag only in a clean frame and sends one initial page view', async ({ page }) => {
  const transport = await instrumentTransport(page);
  await page.goto('/?lang=en&private_query=OPTIN_QUERY#/home?compare=OPTIN_FRAGMENT');
  await page.evaluate(() => window.MusicVibeAnalytics.track('before_optin_probe'));
  await page.getByRole('button', { name: 'Allow analytics' }).click();
  await expect.poll(() => transport.hits.filter((hit) => hit.en === 'page_view').length).toBe(1);
  await page.evaluate(() => window.MusicVibeAnalytics.track('accepted_probe', {
    page_location: location.href, page_referrer: 'https://example.invalid/?private=REFERRER_SECRET#token'
  }));
  await expect.poll(() => transport.hits.some((hit) => hit.en === 'accepted_probe')).toBe(true);
  const state = await frameState(page);
  const cleanPage = new URL('/', page.url()).href;
  expect(state.url).toBe(new URL('/analytics-frame.html?version=ga4c3', page.url()).href);
  expect(state.referrer).toBe('');
  expect(state.frameTagCount).toBe(1);
  await expect(page.locator(FRAME_SELECTOR)).toHaveAttribute('referrerpolicy', 'no-referrer');
  await expect(page.locator('#music-vibe-ga4')).toHaveCount(0);
  expect(transport.tags).toHaveLength(1);
  expect(transport.frameRequests[0].headers().referer).toBeUndefined();
  const defaults = state.commands.findIndex((command) => command[0] === 'consent' && command[1] === 'default');
  const configure = state.commands.findIndex((command) => command[0] === 'config');
  expect(defaults).toBeGreaterThanOrEqual(0);
  expect(configure).toBeGreaterThan(defaults);
  expect(state.commands[defaults][2]).toMatchObject({
    analytics_storage: 'denied', ad_storage: 'denied', ad_user_data: 'denied', ad_personalization: 'denied'
  });
  for (const command of state.commands.filter((item) => item[0] === 'consent')) {
    expect(command[2]).toMatchObject({ ad_storage: 'denied', ad_user_data: 'denied', ad_personalization: 'denied' });
  }
  expectCleanHits(transport.hits, cleanPage, ['OPTIN_QUERY', 'OPTIN_FRAGMENT', 'REFERRER_SECRET']);
  expect(transport.hits.some((hit) => hit.en === 'before_optin_probe')).toBe(false);
  const freshVisit = state.commands.find((command) => command[0] === 'event' && command[1] === 'page_view_internal');
  expect(freshVisit?.[2].visitor_id).toBe((await snapshot(page)).visitorId);
  expect(transport.advertisements).toEqual([]);
});

test('owned share campaigns survive consent while arbitrary UTM values are excluded', async ({ page }) => {
  const transport = await instrumentTransport(page);
  await page.goto('/?lang=en&src=share&utm_source=music_vibe&utm_medium=share&utm_campaign=vibe_match_qg1&utm_content=PRIVATE_CONTENT&utm_term=PRIVATE_TERM#/home');
  await acceptAndWait(page, transport);
  const ownedConfig = (await frameState(page)).commands.find((command) => command[0] === 'config')?.[2];
  expect(ownedConfig).toMatchObject({
    campaign_source: 'music_vibe', campaign_medium: 'share', campaign_name: 'vibe_match_qg1'
  });
  expect(ownedConfig).not.toHaveProperty('campaign_content');
  expectCleanHits(transport.hits, new URL('/', page.url()).href, ['PRIVATE_CONTENT', 'PRIVATE_TERM']);

  transport.hits.length = 0;
  await page.goto('/?lang=en&src=ARBITRARY_SOURCE&utm_source=ARBITRARY_UTM_SOURCE&utm_medium=ARBITRARY_MEDIUM&utm_campaign=ARBITRARY_CAMPAIGN&utm_content=ARBITRARY_CONTENT&utm_term=ARBITRARY_TERM#/home');
  await expect.poll(() => transport.hits.filter((hit) => hit.en === 'page_view').length).toBe(1);
  const arbitraryConfig = (await frameState(page)).commands.find((command) => command[0] === 'config')?.[2];
  for (const key of ['campaign_source', 'campaign_medium', 'campaign_name', 'campaign_content']) {
    expect(arbitraryConfig).not.toHaveProperty(key);
  }
  await page.evaluate(() => window.MusicVibeAnalytics.track('campaign_filter_probe'));
  await expect.poll(() => transport.hits.some((hit) => hit.en === 'campaign_filter_probe')).toBe(true);
  expectCleanHits(transport.hits, new URL('/', page.url()).href, ['ARBITRARY_']);
});

test('remembered analytics consent reloads with one page view and no URL secrets', async ({ page }) => {
  const transport = await instrumentTransport(page);
  await page.goto('/?lang=en&secret=REMEMBER_QUERY#/home?compare=REMEMBER_FRAGMENT');
  await acceptAndWait(page, transport);
  const visitor = (await snapshot(page)).visitorId;
  transport.hits.length = 0;
  transport.tags.length = 0;
  await page.reload();
  await expect.poll(() => transport.hits.filter((hit) => hit.en === 'page_view').length).toBe(1);
  expect((await snapshot(page)).visitorId).toBe(visitor);
  expect(transport.tags).toHaveLength(1);
  await expect(page.getByRole('button', { name: 'Allow analytics' })).toHaveCount(0);
  expectCleanHits(transport.hits, new URL('/', page.url()).href, ['REMEMBER_QUERY', 'REMEMBER_FRAGMENT']);
});

test('referrer metadata keeps only origin and path, and the tag document has no referrer', async ({ page, baseURL }) => {
  const transport = await instrumentTransport(page);
  await page.goto('/?lang=en&private=LANDING_QUERY#/home?compare=LANDING_FRAGMENT', {
    referer: `${baseURL}/privacy/?private=REFERRER_QUERY`
  });
  await acceptAndWait(page, transport);
  expect((await frameState(page)).referrer).toBe('');
  expectCleanHits(transport.hits, new URL('/', page.url()).href,
    ['LANDING_QUERY', 'LANDING_FRAGMENT', 'REFERRER_QUERY'], `${baseURL}/privacy/`);
});

test('withdrawal destroys the tag context and cookies, blocks future events, and permits fresh opt-in', async ({ page, context }) => {
  const transport = await instrumentTransport(page);
  await page.goto('/?lang=en#/home');
  await acceptAndWait(page, transport);
  const originalVisitor = (await snapshot(page)).visitorId;
  await page.evaluate(() => {
    document.cookie = '_ga=GA1.1.regression; path=/';
    document.cookie = '_ga_XJ8Z43C6LQ=GS1.regression; path=/';
    document.cookie = 'music-vibe-unrelated=keep; path=/';
  });
  await setConsent(page, 'declined');
  await expect(page.locator(FRAME_SELECTOR)).toHaveCount(0);
  expect(await snapshot(page)).toMatchObject({ consent: 'declined', visitorId: null, sessionId: null, pendingCount: 0 });
  const cookies = await context.cookies();
  expect(cookies.filter((cookie) => /^_ga(?:_|$)/.test(cookie.name))).toEqual([]);
  expect(cookies.find((cookie) => cookie.name === 'music-vibe-unrelated')?.value).toBe('keep');
  await page.waitForTimeout(50);
  const hitsAfterWithdrawal = transport.hits.length;
  await page.evaluate(() => {
    window.gtag('event', 'after_withdrawal', { page_location: location.href });
    history.pushState({}, '', '/?private=WITHDRAWN_QUERY#/home?compare=WITHDRAWN_FRAGMENT');
    dispatchEvent(new Event('pagehide'));
    document.dispatchEvent(new Event('visibilitychange'));
  });
  await page.waitForTimeout(100);
  expect(transport.hits).toHaveLength(hitsAfterWithdrawal);
  expect(transport.hits.some((hit) => hit.en === 'after_withdrawal')).toBe(false);
  expect(transport.tags).toHaveLength(1);
  await acceptAndWait(page, transport);
  await expect.poll(() => transport.hits.filter((hit) => hit.en === 'page_view').length).toBe(2);
  expect((await snapshot(page)).visitorId).not.toBe(originalVisitor);
  expect(transport.tags).toHaveLength(2);
  expectCleanHits(transport.hits, new URL('/', page.url()).href, ['WITHDRAWN_QUERY', 'WITHDRAWN_FRAGMENT']);
});

test('withdrawal while the frame response is delayed never starts the tag', async ({ page }) => {
  const transport = await instrumentTransport(page);
  let releaseFrame;
  let markRequested;
  let markCompleted;
  const gate = new Promise((resolve) => { releaseFrame = resolve; });
  const requested = new Promise((resolve) => { markRequested = resolve; });
  const completed = new Promise((resolve) => { markCompleted = resolve; });
  await page.route('**/analytics-frame.html?version=ga4c3', async (route) => {
    markRequested();
    await gate;
    try { await route.continue(); } catch (_) { /* The removed frame may cancel its request. */ }
    markCompleted();
  });
  await page.goto('/?lang=en#/home');
  await setConsent(page, 'accepted');
  await requested;
  await setConsent(page, 'declined');
  releaseFrame();
  await completed;
  await expect(page.locator(FRAME_SELECTOR)).toHaveCount(0);
  await page.waitForTimeout(100);
  expect(transport.tags).toEqual([]);
  expect(transport.hits).toEqual([]);
  expect(await snapshot(page)).toMatchObject({ consent: 'declined', pendingCount: 0, visitorId: null, sessionId: null });
});

test('withdrawing consent in one tab stops analytics in every open tab', async ({ page, context }) => {
  const first = await instrumentTransport(page);
  await page.goto('/?lang=en#/home');
  await acceptAndWait(page, first);
  const secondPage = await context.newPage();
  const second = await instrumentTransport(secondPage);
  await secondPage.goto('/?lang=en&private=SECOND_QUERY#/home?compare=SECOND_FRAGMENT');
  await expect.poll(() => second.hits.filter((hit) => hit.en === 'page_view').length).toBe(1);

  await setConsent(page, 'declined');
  await expect(page.locator(FRAME_SELECTOR)).toHaveCount(0);
  await expect(secondPage.locator(FRAME_SELECTOR)).toHaveCount(0);
  expect(await snapshot(secondPage)).toMatchObject({ consent: 'declined', visitorId: null, sessionId: null, pendingCount: 0 });
  expect(await secondPage.evaluate(() => sessionStorage.getItem('music-vibe-session-v1'))).toBeNull();
  await secondPage.waitForTimeout(50);
  const initialHits = [first.hits.length, second.hits.length];
  for (const tab of [page, secondPage]) {
    const result = await tab.evaluate(() => {
      history.pushState({}, '', '/?private=REVOKED_TAB_QUERY#/home?compare=REVOKED_TAB_FRAGMENT');
      return window.MusicVibeAnalytics.track('cross_tab_revoked_probe');
    });
    expect(result.status).toBe('discarded');
  }
  await secondPage.waitForTimeout(100);
  expect([first.hits.length, second.hits.length]).toEqual(initialHits);
  expectCleanHits(second.hits, new URL('/', secondPage.url()).href, ['SECOND_QUERY', 'SECOND_FRAGMENT']);
  await secondPage.close();
});

test('parent SPA pushState, replaceState, and hash changes cannot leak into the tag frame', async ({ page }) => {
  const transport = await instrumentTransport(page);
  await page.goto('/?lang=en#/home');
  await acceptAndWait(page, transport);
  const initial = await frameState(page);
  await page.evaluate(() => {
    history.pushState({}, '', '/?secret=HISTORY_QUERY#/home?compare=HISTORY_FRAGMENT');
    history.replaceState({}, '', '/?secret=REPLACE_QUERY#/home?compare=REPLACE_FRAGMENT');
    location.hash = '/match?compare=HASH_FRAGMENT';
  });
  await expect(page.locator('body')).toHaveAttribute('data-route', 'match');
  await page.evaluate(() => window.MusicVibeAnalytics.track('spa_sanitization_probe', {
    page_location: location.href, page_referrer: location.href
  }));
  await expect.poll(() => transport.hits.some((hit) => hit.en === 'spa_sanitization_probe')).toBe(true);
  expect((await frameState(page)).url).toBe(initial.url);
  expect(transport.hits.filter((hit) => hit.en === 'page_view')).toHaveLength(1);
  expectCleanHits(transport.hits, new URL('/', page.url()).href, [
    'HISTORY_QUERY', 'HISTORY_FRAGMENT', 'REPLACE_QUERY', 'REPLACE_FRAGMENT', 'HASH_FRAGMENT'
  ]);
});

test('a shared fragment still decodes into a complete friend match after analytics opt-in', async ({ page }) => {
  const transport = await instrumentTransport(page);
  await page.goto('/?lang=en#/home');
  const invite = await page.evaluate(async () => {
    const { profileFromLegacyType } = await import('/src/v2/domain/profile.mjs?v=qg1');
    const { buildInviteUrl } = await import('/src/v2/infrastructure/share.mjs?v=qg1');
    const friend = profileFromLegacyType('ENFP');
    return { url: buildInviteUrl(friend, 'en'), id: friend.id, scores: friend.scores };
  });
  const token = new URLSearchParams(new URL(invite.url).hash.split('?')[1]).get('compare');
  expect(token).toBeTruthy();
  expect(new URL(invite.url).searchParams.has('compare')).toBe(false);
  await page.goto(invite.url);
  await page.getByRole('button', { name: 'Allow analytics' }).click();
  await expect.poll(() => transport.hits.filter((hit) => hit.en === 'page_view').length).toBe(1);
  expect(await page.evaluate(() => ({
    id: window.__musicVibeV2.friendProfile.id,
    scores: window.__musicVibeV2.friendProfile.scores
  }))).toEqual({ id: invite.id, scores: invite.scores });
  await completeProfile(page, 'b', { finalSelector: '.quality-match-score' });
  await expect(page.locator('.quality-match-score')).toContainText('Resonance');
  await expect(page.locator('.recommendation-list--bridge .track-card')).toHaveCount(5);
  await expect.poll(() => transport.hits.some((hit) => hit.en === 'match_view')).toBe(true);
  expectCleanHits(transport.hits, new URL('/', page.url()).href, [token, 'compare=']);
  expect(transport.advertisements).toEqual([]);
});
