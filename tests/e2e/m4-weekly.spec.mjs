import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { completeProfile, declineAnalytics } from './helpers.mjs';

async function createReadyWeeklyVibe(page) {
  await completeProfile(page, 'a');
  await page.locator('[data-route="now"]').first().click();
  await page.locator('[data-context-id="night"]').click();
  await expect(page.locator('.recommendation-list .track-card')).toHaveCount(5);
  await page.locator('[data-action="track-feedback"][data-feedback-value="more"]').nth(0).click();
  await page.locator('[data-action="track-feedback"][data-feedback-value="more"]').nth(2).click();
  await page.locator('[data-route="weekly"]').first().click();
  await expect(page.locator('.weekly-hero')).toBeVisible();
}

test.beforeEach(async ({ page }) => {
  await declineAnalytics(page);
});

test('Weekly Vibe requires three meaningful listening actions', async ({ page }) => {
  await page.goto('/?lang=kr#/home');
  await completeProfile(page, 'a');
  await page.locator('[data-route="weekly"]').first().click();
  await expect(page.locator('.weekly-empty')).toBeVisible();
  await expect(page.locator('.weekly-progress__label')).toContainText('0 / 3');
  await expect(page.locator('.weekly-empty [data-route="now"]')).toContainText('오늘');
});

test('Weekly Vibe aggregates listening, persists, shares, and continues into five tracks', async ({ page }, testInfo) => {
  await page.goto('/?lang=kr#/home');
  await createReadyWeeklyVibe(page);

  await expect(page.locator('.weekly-context-card').first()).toContainText('밤 산책');
  await expect(page.locator('.weekly-track')).toHaveCount(2);
  await expect(page.locator('.weekly-hero__meta')).toContainText('3개 행동');
  const stored = await page.evaluate(() => JSON.parse(localStorage.getItem('music-vibe-v2-weekly-v1') || '{}'));
  expect(stored.items).toHaveLength(1);
  expect(stored.items[0].sufficientData).toBeTruthy();
  expect(stored.items[0].dominantContextId).toBe('night');

  if (testInfo.project.name === 'chromium') {
    const downloadPromise = page.waitForEvent('download');
    await page.locator('[data-action="share-weekly-card"]').click();
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toContain('my-music-vibe-weekly-');
  }

  await page.locator('[data-action="weekly-listen"]').click();
  await expect(page.locator('body')).toHaveAttribute('data-route', 'now');
  await expect(page.locator('.recommendation-list .track-card')).toHaveCount(5);
  await expect(page.locator('.now-hero')).toContainText('밤 산책');
});

test('Weekly Vibe passes accessibility including color contrast', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'chromium', 'desktop accessibility pass');
  await page.goto('/?lang=en#/home');
  await createReadyWeeklyVibe(page);
  const results = await new AxeBuilder({ page }).analyze();
  const serious = results.violations.filter((violation) => ['serious', 'critical'].includes(violation.impact));
  expect(serious).toEqual([]);
});

test('seven-day return CTA and analytics interaction are deduplicated', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'chromium', 'return timing is viewport-independent');
  await page.goto('/?lang=kr#/home');
  await completeProfile(page, 'a');

  await page.evaluate(() => {
    const old = new Date(Date.now() - 8 * 86_400_000);
    localStorage.setItem('music-vibe-v2-visits-v1', JSON.stringify({
      version: 2,
      firstVisitAt: old.toISOString(),
      previousVisitAt: null,
      currentVisitAt: old.toISOString(),
      currentDay: old.toISOString().slice(0, 10),
      lastSeenAt: old.toISOString(),
      visitDays: [old.toISOString().slice(0, 10)],
      lastReturnEventKey: '',
      lastReturnEventAt: null
    }));
    localStorage.setItem('music-vibe-v2-interactions-v1', JSON.stringify({ version: 1, items: [] }));
  });

  // Changing the query forces a new document load. A hash-only navigation would
  // stay inside the existing SPA and would not represent a genuine return visit.
  await page.goto('/?lang=kr&return-test=1#/home');
  await expect(page.locator('.home-weekly-band--return')).toContainText('다시 왔네요');
  let returns = await page.evaluate(() => {
    const data = JSON.parse(localStorage.getItem('music-vibe-v2-interactions-v1') || '{"items":[]}');
    return data.items.filter((item) => item.type === 'return_visit_7d').length;
  });
  expect(returns).toBe(1);

  await page.reload();
  returns = await page.evaluate(() => {
    const data = JSON.parse(localStorage.getItem('music-vibe-v2-interactions-v1') || '{"items":[]}');
    return data.items.filter((item) => item.type === 'return_visit_7d').length;
  });
  expect(returns).toBe(1);
});

test('mobile Weekly Vibe navigation stays in document flow', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'mobile-chromium', 'mobile-only layout contract');
  await page.goto('/?lang=kr#/home');
  await createReadyWeeklyVibe(page);
  await expect(page.locator('body')).toHaveAttribute('data-route', 'weekly');
  await expect(page.locator('.site-nav')).toHaveCSS('position', 'static');
  await expect(page.locator('.weekly-hero h1')).toBeVisible();
  const navBox = await page.locator('.site-nav').boundingBox();
  const heroBox = await page.locator('.weekly-hero').boundingBox();
  expect(navBox).not.toBeNull();
  expect(heroBox).not.toBeNull();
  expect(navBox.y + navBox.height).toBeLessThanOrEqual(heroBox.y);
});
