import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { completeProfile, declineAnalytics, profileInvite } from './helpers.mjs';

const seriousViolations = (results) => results.violations.filter((violation) => ['serious', 'critical'].includes(violation.impact));

test.beforeEach(async ({ page }) => {
  await declineAnalytics(page);
});

test('keyboard onboarding creates, edits, and restores a profile', async ({ page }) => {
  await page.goto('/?lang=kr#/home');
  await page.locator('[data-route="discover"]').first().click();
  await page.keyboard.press('b');
  await page.waitForTimeout(270);
  await expect(page.locator('.quiz-topline')).toContainText('2 / 10');
  await page.keyboard.press('ArrowLeft');
  await expect(page.locator('.quiz-topline')).toContainText('1 / 10');
  await page.keyboard.press('a');
  await page.waitForTimeout(270);
  for (let index = 1; index < 10; index += 1) {
    await page.keyboard.press(index % 2 ? 'b' : 'a');
    await page.waitForTimeout(270);
  }
  await expect(page.locator('.profile-hero')).toBeVisible();
  await expect(page.locator('.vibe-glyph')).toBeVisible();
  await expect(page.locator('.bipolar-axis')).toHaveCount(6);
  await expect(page.locator('.profile-signature .track-card')).toHaveCount(3);
  const profileId = await page.locator('.profile-hero__copy small').textContent();
  await page.reload();
  await page.goto('/?lang=kr#/profile');
  await expect(page.locator('.profile-hero__copy small')).toContainText(profileId.split(' · ')[0]);
});

test('Vibe Now returns five diverse strategy slots', async ({ page }) => {
  await page.goto('/?lang=en#/home');
  await completeProfile(page, 'a');
  await page.locator('[data-route="now"]').first().click();
  await page.locator('[data-context-id="explore"]').click();
  await expect(page.locator('.recommendation-list .track-card')).toHaveCount(5);
  await expect(page.locator('.track-card[data-strategy="safe"]')).toHaveCount(3);
  await expect(page.locator('.track-card[data-strategy="adjacent"]')).toHaveCount(1);
  await expect(page.locator('.track-card[data-strategy="explore"]')).toHaveCount(1);
});

test('fragment invite completes a friend match without exposing the token in the query', async ({ browser }) => {
  const sender = await browser.newContext();
  const senderPage = await sender.newPage();
  await declineAnalytics(senderPage);
  await senderPage.goto('/?lang=en#/home');
  await completeProfile(senderPage, 'a');
  const invite = await profileInvite(senderPage);
  expect(new URL(invite).searchParams.has('compare')).toBeFalsy();
  expect(new URL(invite).hash).toContain('compare=');

  const friend = await browser.newContext();
  const friendPage = await friend.newPage();
  await declineAnalytics(friendPage);
  await friendPage.goto(invite);
  await friendPage.locator('[data-route="discover"]').first().click();
  for (let index = 0; index < 10; index += 1) {
    await friendPage.keyboard.press('b');
    await friendPage.waitForTimeout(270);
  }
  await expect(friendPage.locator('.quality-match-score')).toBeVisible();
  await expect(friendPage.locator('.quality-match-score')).toContainText('Resonance');
  await expect(friendPage.locator('.recommendation-list--bridge .track-card')).toHaveCount(5);
  await sender.close();
  await friend.close();
});

test('legacy referral remains compatible', async ({ page }) => {
  await page.goto('/?ref=ENFP&lang=en#/match');
  await expect(page.locator('.empty-state')).toBeVisible();
  await expect(page.locator('body')).toContainText(/Create your music identity|friend invited/i);
});

test('analytics rejection prevents GA script loading', async ({ page }) => {
  await page.goto('/?lang=en#/home');
  await expect(page.locator('#music-vibe-ga4')).toHaveCount(0);
  expect(await page.evaluate(() => localStorage.getItem('music-vibe-consent-v2'))).toBe('declined');
});

test('audio failure is recoverable and text choice still works', async ({ page }) => {
  await page.route('**/assets/audio/**', (route) => route.abort('failed'));
  await page.goto('/?lang=en#/home');
  await page.locator('[data-route="discover"]').first().click();
  await page.keyboard.press('1');
  await expect(page.locator('.audio-preview-state')).toContainText('Preview unavailable');
  await page.keyboard.press('a');
  await page.waitForTimeout(270);
  await expect(page.locator('.quiz-topline')).toContainText('2 / 10');
});

test('localStorage failure does not block the core session', async ({ page }) => {
  await page.addInitScript(() => {
    Storage.prototype.getItem = () => { throw new Error('blocked'); };
    Storage.prototype.setItem = () => { throw new Error('blocked'); };
    Storage.prototype.removeItem = () => { throw new Error('blocked'); };
  });
  await page.goto('/?lang=en#/home');
  await completeProfile(page, 'a');
  await expect(page.locator('.profile-hero')).toBeVisible();
});

test('home and profile pass automated accessibility checks', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'chromium', 'desktop accessibility pass');
  await page.goto('/?lang=en#/home');
  let results = await new AxeBuilder({ page }).disableRules(['color-contrast']).analyze();
  expect(seriousViolations(results)).toEqual([]);
  await completeProfile(page, 'a');
  results = await new AxeBuilder({ page }).disableRules(['color-contrast']).analyze();
  expect(seriousViolations(results)).toEqual([]);
});

test('mobile primary action is not hidden by the bottom navigation', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'mobile-chromium', 'mobile-only layout contract');
  await page.goto('/?lang=kr#/home');
  const cta = page.locator('[data-route="discover"]').first();
  await cta.scrollIntoViewIfNeeded();
  const ctaBox = await cta.boundingBox();
  const navBox = await page.locator('.site-nav').boundingBox();
  expect(ctaBox).not.toBeNull();
  expect(navBox).not.toBeNull();
  expect(ctaBox.y + ctaBox.height).toBeLessThanOrEqual(navBox.y - 4);
});
