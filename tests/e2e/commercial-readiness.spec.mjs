import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { declineAnalytics } from './helpers.mjs';

const seriousViolations = (results) => results.violations.filter((violation) => ['serious', 'critical'].includes(violation.impact));
const SELLER_RECORD = 'google.com, pub-1386368370627622, DIRECT, f08c47fec0942fa0';

async function expectAccessible(page, label) {
  const results = await new AxeBuilder({ page }).analyze();
  expect(seriousViolations(results), `${label} has serious accessibility violations`).toEqual([]);
}

test.beforeEach(async ({ page }) => {
  await declineAnalytics(page);
});

test('CR1 serves no advertising code by default while preserving the authorized seller record', async ({ page }) => {
  const advertisingRequests = [];
  page.on('request', (request) => {
    if (/googlesyndication|doubleclick|adsbygoogle|adservice|amazon-adsystem/i.test(request.url())) advertisingRequests.push(request.url());
  });
  await page.goto('/?lang=kr#/home');
  await expect(page.locator('body')).toHaveAttribute('data-ads-enabled', 'false');
  await expect(page.locator('body')).toHaveAttribute('data-commercial-readiness-release', 'cr1');
  await expect(page.locator('.ad-slot:visible')).toHaveCount(0);
  await expect(page.locator('script[src*="googlesyndication"], script[src*="doubleclick"], ins.adsbygoogle')).toHaveCount(0);
  expect(advertisingRequests).toEqual([]);

  const adsResponse = await page.request.get('/ads.txt');
  expect(adsResponse.ok()).toBe(true);
  expect((await adsResponse.text()).trim()).toBe(SELLER_RECORD);

  const buildResponse = await page.request.get('/build-info.json');
  const build = await buildResponse.json();
  expect(build.adsEnabled).toBe(false);
  expect(build.adProvider).toBe('google-adsense');
  expect(build.adPublisherId).toBe('pub-1386368370627622');
  expect(build.adsTxt).toBe('/ads.txt');
});

test('original commercial audio renders without MP3 requests', async ({ page }) => {
  const legacyAudioRequests = [];
  page.on('request', (request) => {
    if (/\/assets\/audio\/.*\.mp3(?:\?|$)/i.test(request.url())) legacyAudioRequests.push(request.url());
  });
  await page.goto('/?lang=en#/home');
  await page.locator('[data-action="home-preview"]').first().click();
  await expect.poll(() => page.evaluate(() => {
    const audio = window.__musicVibeV2?.homePreviewAudio;
    return {
      id: window.__musicVibeV2?.homePreviewOptionId || '',
      srcIsBlob: Boolean(audio?.src?.startsWith('blob:')),
      playing: Boolean(audio && !audio.paused),
      durationReady: Boolean(audio && Number.isFinite(audio.duration) && audio.duration > 10)
    };
  }), { timeout: 10_000 }).toEqual({ id: 'groove', srcIsBlob: true, playing: true, durationReady: true });
  expect(legacyAudioRequests).toEqual([]);
  await expect(page.locator('.listening-choice.has-error')).toHaveCount(0);
});

test('unregistered or failed CR1 audio remains recoverable through text choice', async ({ page }) => {
  await page.addInitScript(() => { globalThis.__musicVibeTestAudioFailure = true; });
  await page.goto('/?lang=en#/home');
  await page.locator('[data-action="home-preview"]').first().click();
  await expect(page.locator('.listening-choice.has-error').first()).toBeVisible();
  await page.locator('[data-action="home-choose"]').first().click();
  await expect(page.locator('.quiz-topline')).toContainText('2 / 10');
});

test('CR1 public legal pages pass accessibility and publish the current state', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'chromium', 'public policy pages are viewport-independent');
  const pages = [
    ['/about/', /음악을 진단하기보다/],
    ['/privacy/', /취향 기록은 브라우저에/],
    ['/audio-credits/', /테스트에서 들리는 소리는/]
  ];
  for (const [url, heading] of pages) {
    await page.goto(url);
    await expect(page.locator('body')).toHaveAttribute('data-commercial-readiness-release', 'cr1');
    await expect(page.getByRole('heading', { level: 1 })).toContainText(heading);
    await expect(page.locator('a[href="/privacy/"]')).toBeVisible();
    await expect(page.locator('a[href="/audio-credits/"]')).toBeVisible();
    await expectAccessible(page, url);
  }
  await page.goto('/privacy/');
  await expect(page.locator('main')).toContainText('pub-1386368370627622');

  const manifestResponse = await page.request.get('/assets/audio/rights-manifest.json');
  const manifest = await manifestResponse.json();
  expect(manifest.release).toBe('cr1');
  expect(manifest.thirdPartySamplesUsed).toBe(false);
  expect(manifest.clips).toHaveLength(8);
});

test('application footer and privacy dialog expose commercial transparency links', async ({ page }) => {
  await page.goto('/?lang=kr#/home');
  const footer = page.locator('.commercial-footer');
  await expect(footer.locator('a[href="/about/"]')).toBeVisible();
  await expect(footer.locator('a[href="/privacy/"]')).toBeVisible();
  await expect(footer.locator('a[href="/audio-credits/"]')).toBeVisible();

  await footer.locator('[data-action="privacy"]').click();
  const dialog = page.getByRole('dialog', { name: '취향 기록과 광고는 어떻게 다뤄지나요?' });
  await expect(dialog).toBeVisible();
  await expect(dialog).toContainText('현재 광고 스크립트와 광고 쿠키는 비활성 상태입니다.');
  await expect(dialog.locator('a[href="/privacy/"]')).toBeVisible();
  await expect(dialog.locator('a[href="/audio-credits/"]')).toBeVisible();
  await expect(dialog.locator('a[href="/about/"]')).toBeVisible();
});
