import fs from 'node:fs';
import path from 'node:path';
import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { encodeProfile, profileFromArchetype } from '../../src/v2/domain/profile.mjs';
import { completeProfile, declineAnalytics } from './helpers.mjs';

const friend = profileFromArchetype('golden-chorus', 'synthetic_review');
const token = encodeProfile(friend);
const invitation = `/?lang=kr#/match?compare=${token}&lang=kr`;
async function capture(page, testInfo, name) {
  if (!process.env.MUSIC_VIBE_REVIEW_DIR) return;
  await page.evaluate(async () => {
    await document.fonts.ready;
    window.__musicVibeV2.clearNotice();
    document.documentElement.style.scrollBehavior = 'auto';
    window.scrollTo(0, 0);
  });
  await page.waitForTimeout(180);
  fs.mkdirSync(process.env.MUSIC_VIBE_REVIEW_DIR, { recursive: true });
  await page.screenshot({ path: path.join(process.env.MUSIC_VIBE_REVIEW_DIR, `${testInfo.project.name}-${name}.png`), fullPage: true, scale: 'css', animations: 'disabled' });
  if (name === 'invite-friend') await page.locator('.match-invitation').screenshot({ path: path.join(process.env.MUSIC_VIBE_REVIEW_DIR, `${testInfo.project.name}-preview.png`), scale: 'css', animations: 'disabled' });
}
async function accessible(page) {
  const result = await new AxeBuilder({ page }).analyze();
  expect(result.violations.filter(item => ['serious', 'critical'].includes(item.impact))).toEqual([]);
}
async function readyWeekly(page) {
  await page.locator('[data-route="now"]').first().click();
  await page.locator('[data-context-id="night"]').click();
  await page.locator('[data-action="track-feedback"][data-feedback-value="more"]').nth(0).click();
  await page.locator('[data-action="track-feedback"][data-feedback-value="more"]').nth(1).click();
  await page.locator('[data-route="weekly"]').first().click();
  await expect(page.locator('.weekly-hero')).toBeVisible();
}

test.beforeEach(async ({ page }) => { await declineAnalytics(page); });

test('received invitation survives a test refresh without a query token or new storage', async ({ page }, testInfo) => {
  await page.goto(invitation);
  await expect(page.locator('.match-welcome')).toBeVisible();
  await expect(page.locator('.listener-card')).not.toContainText(friend.id);
  await accessible(page);
  await capture(page, testInfo, 'received-invitation');
  await page.locator('.match-welcome [data-route="discover"]').click();
  await page.locator('[data-action="choose-option"]').nth(1).click();
  await expect(page.locator('.quiz-topline')).toContainText('2 / 10');
  expect(new URL(page.url()).hash).toContain(`compare=${token}`);
  expect(new URL(page.url()).searchParams.has('compare')).toBe(false);
  await page.reload();
  await expect(page.locator('.quiz-topline')).toContainText('2 / 10');
  expect(await page.evaluate(() => window.__musicVibeV2.friendProfile.scores)).toEqual(friend.scores);
  await page.locator('[data-action="quit-quiz"]').click();
  await expect(page.locator('.home-resume-note')).toBeVisible();
  await page.reload();
  await page.locator('[data-action="resume-quiz"]').click();
  await expect(page.locator('.quiz-topline')).toContainText('2 / 10');
  await completeProfile(page, 'b', { start: false, finalSelector: '.quality-match-score' });
  await expect(page.locator('.recommendation-list--bridge .track-card')).toHaveCount(5);
  await page.reload();
  await expect(page.locator('.quality-match-score')).toBeVisible();
  expect(await page.evaluate(() => Object.keys(localStorage).some(key => /friend|invite/.test(key)))).toBe(false);
  await expect(page.locator('#music-vibe-ga4')).toHaveCount(0);
});

test('pasted links have persistent inline errors and shared clicks keep their context', async ({ page }, testInfo) => {
  await page.goto('/?lang=kr#/home');
  await completeProfile(page, 'a');
  await page.locator('[data-route="now"]').first().click();
  await page.locator('[data-context-id="focus"]').click();
  await page.locator('[data-route="match"]').first().click();
  await expect(page.locator('.invite-code')).toHaveCount(0);
  await capture(page, testInfo, 'invite-friend');
  const input = page.locator('#invite-input');
  await input.fill('https://example.com/#/match?compare=invalid');
  await input.press('Enter');
  await expect(input).toBeFocused();
  await expect(input).toHaveAttribute('aria-invalid', 'true');
  await expect(page.locator('#invite-error')).not.toBeEmpty();
  await accessible(page);
  await input.fill(`http://127.0.0.1:4173${invitation}`);
  await input.press('Enter');
  await expect(page.locator('.quality-match-score')).toBeVisible();
  await expect(page.locator('.listener-card')).toHaveCount(2);
  await page.locator('[data-action="focus-bridge"]').click();
  await expect(page.locator('#match-playlist-title')).toBeFocused();
  const links = page.locator('.recommendation-list--bridge [data-track-link]');
  for (const link of await links.all()) {
    const href = await link.getAttribute('href');
    const direct = await link.getAttribute('data-link-kind') === 'direct';
    expect(href).not.toContain(token);
    if (direct) expect(href).not.toContain('search');
    else expect(href).toContain('search');
  }
  await page.context().route(/https:\/\/(open\.spotify\.com|www\.youtube\.com|music\.apple\.com)\//, route => route.fulfill({ body: '<p>External service fixture</p>', contentType: 'text/html' }));
  const popup = page.waitForEvent('popup');
  await links.first().click();
  await (await popup).close();
  const interaction = await page.evaluate(() => JSON.parse(localStorage.getItem('music-vibe-v2-interactions-v1')).items.filter(item => item.type === 'track_click').at(-1));
  expect(interaction.contextId).toBe('together');
  await page.reload();
  await expect(page.locator('.quality-match-score')).toBeVisible();
  await accessible(page);
  await capture(page, testInfo, 'shared-selection');
});

test('friend feedback keeps the invited taste intact and dismissal removes the URL token', async ({ page }) => {
  await page.goto('/?lang=en#/home');
  await completeProfile(page, 'a');
  await page.goto(invitation.replace('lang=kr', 'lang=en').replace('&lang=kr', '&lang=en'));
  await expect(page.locator('.quality-match-score')).toBeVisible();
  const own = await page.evaluate(() => window.__musicVibeV2.profile.id);
  await page.locator('[data-action="track-feedback"][data-feedback-value="more"]').nth(0).click();
  await page.locator('[data-action="track-feedback"][data-feedback-value="more"]').nth(1).click();
  await page.locator('[data-action="refresh-recommendations"]').click();
  await expect(page.locator('.recommendation-list--bridge .track-card')).toHaveCount(5);
  expect(await page.evaluate(() => window.__musicVibeV2.friendProfile.scores)).toEqual(friend.scores);
  await page.locator('[data-action="clear-friend"]').click();
  await expect(page.locator('.invite-builder')).toBeVisible();
  await expect(page.locator('h1')).toBeFocused();
  expect(page.url()).not.toContain('compare=');
  expect(await page.evaluate(() => window.__musicVibeV2.profile.id)).toBe(own);
  await page.reload();
  await expect(page.locator('.invite-builder')).toBeVisible();
});

test('saved weekly dates reopen exactly after refresh and expose no playback claims', async ({ page }, testInfo) => {
  await page.goto('/?lang=kr#/home');
  await completeProfile(page, 'a');
  await page.locator('[data-route="weekly"]').first().click();
  await expect(page.locator('.weekly-empty')).toContainText('세 종류를 모두 할 필요는 없어요');
  await accessible(page);
  await capture(page, testInfo, 'weekly-getting-started');
  await readyWeekly(page);
  await expect(page.locator('.weekly-data-note')).toContainText('청취 시간은 측정하지 않아요');
  await expect(page.locator('.weekly-disclosure')).not.toHaveAttribute('open', '');
  await capture(page, testInfo, 'weekly-note');
  const saved = await page.evaluate(() => window.__musicVibeV2.latestWeeklyVibe);
  await page.clock.setFixedTime(new Date(Date.now() + 14 * 86_400_000));
  await page.goto('/?lang=kr&journal-return=1#/weekly');
  await expect(page.locator('.weekly-empty')).toBeVisible();
  await page.locator('.weekly-history [data-weekly-anchor]').click();
  await expect(page.locator('.weekly-hero')).toBeVisible();
  expect(new URL(page.url()).hash).toContain(`week=${saved.weekKey}`);
  await page.reload();
  await expect(page.locator('.weekly-hero')).toBeVisible();
  expect(await page.evaluate(() => window.__musicVibeV2.latestWeeklyVibe.weekKey)).toBe(saved.weekKey);
  await expect(page.locator('.weekly-history [data-weekly-anchor]')).toHaveAttribute('aria-pressed', 'true');
  await page.locator('.weekly-disclosure > summary').click();
  await accessible(page);
  await page.locator('.weekly-history button').first().click();
  await expect(page.locator('.weekly-empty')).toBeVisible();
  await page.goto('/?lang=kr#/weekly?week=2026-02-30');
  await expect(page.locator('.weekly-empty')).toBeVisible();
});

test('journal layouts fit narrow phones and English with usable primary controls', async ({ page }, testInfo) => {
  await page.goto('/?lang=en#/weekly');
  await expect(page.locator('.empty-state')).toBeVisible();
  await accessible(page);
  await completeProfile(page, 'a');
  await page.locator('[data-route="match"]').first().click();
  for (const width of [320, 768, 1280]) {
    await page.setViewportSize({ width, height: 900 });
    const bounds = await page.evaluate(() => ({ width: document.documentElement.clientWidth, scroll: document.documentElement.scrollWidth }));
    expect(bounds.scroll).toBeLessThanOrEqual(bounds.width + 1);
    const controls = await page.locator('.invite-builder__actions button,.load-invite input,.load-invite button').evaluateAll(els => els.map(el => ({ w: el.getBoundingClientRect().width, h: el.getBoundingClientRect().height })));
    expect(controls.every(box => box.w >= 44 && box.h >= 44)).toBe(true);
  }
  await accessible(page);
  await readyWeekly(page);
  for (const width of [320, 768, 1280]) {
    await page.setViewportSize({ width, height: 900 });
    const bounds = await page.evaluate(() => ({ width: document.documentElement.clientWidth, scroll: document.documentElement.scrollWidth }));
    expect(bounds.scroll).toBeLessThanOrEqual(bounds.width + 1);
  }
  await accessible(page);
  if (testInfo.project.name === 'chromium') {
    const pending = page.waitForEvent('download');
    await page.locator('[data-action="share-weekly-card"]').click();
    const download = await pending;
    expect(download.suggestedFilename()).toMatch(/my-music-vibe-weekly-.*\.png$/);
    const file = testInfo.outputPath('weekly-card-en.png');
    await download.saveAs(file);
    if (process.env.MUSIC_VIBE_REVIEW_DIR) fs.copyFileSync(file, path.join(process.env.MUSIC_VIBE_REVIEW_DIR, 'weekly-card-en.png'));
  }
});
