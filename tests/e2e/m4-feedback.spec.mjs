import { test, expect } from '@playwright/test';
import { completeProfile, declineAnalytics } from './helpers.mjs';

test.beforeEach(async ({ page }) => {
  await declineAnalytics(page);
});

test('track feedback persists and refresh preserves the 3/1/1 recommendation budget', async ({ page }) => {
  await page.goto('/?lang=en#/home');
  await completeProfile(page, 'a');
  await page.locator('[data-route="now"]').first().click();
  await page.locator('[data-context-id="night"]').click();
  await expect(page.locator('.recommendation-list .track-card')).toHaveCount(5);

  const firstCard = page.locator('.recommendation-list .track-card').nth(0);
  const secondCard = page.locator('.recommendation-list .track-card').nth(1);
  const firstTrackId = await firstCard.getAttribute('data-track-id');
  const secondTrackId = await secondCard.getAttribute('data-track-id');

  const moreButton = firstCard.locator('[data-feedback-value="more"]');
  await moreButton.click();
  await expect(moreButton).toHaveAttribute('aria-pressed', 'true');
  await expect(page.locator('.app-notice')).toContainText('next selection');

  const lessButton = secondCard.locator('[data-feedback-value="less"]');
  await lessButton.click();
  await expect(lessButton).toHaveAttribute('aria-pressed', 'true');
  await expect(page.locator('[data-action="refresh-recommendations"]')).toBeVisible();

  const persisted = await page.evaluate(() => JSON.parse(localStorage.getItem('music-vibe-v2-feedback-v1')));
  expect(persisted.version).toBe(1);
  expect(persisted.tracks[firstTrackId].value).toBe('more');
  expect(persisted.tracks[secondTrackId].value).toBe('less');

  await page.locator('[data-action="refresh-recommendations"]').click();
  await expect(page.locator('.recommendation-list .track-card')).toHaveCount(5);
  await expect(page.locator('.track-card[data-strategy="safe"]')).toHaveCount(3);
  await expect(page.locator('.track-card[data-strategy="adjacent"]')).toHaveCount(1);
  await expect(page.locator('.track-card[data-strategy="explore"]')).toHaveCount(1);
  await expect(page.locator('[data-action="refresh-recommendations"]')).toHaveCount(0);

  const interactions = await page.evaluate(() => JSON.parse(localStorage.getItem('music-vibe-v2-interactions-v1')));
  expect(interactions.items.some((item) => item.type === 'feedback_more' && item.trackId === firstTrackId)).toBeTruthy();
  expect(interactions.items.some((item) => item.type === 'feedback_less' && item.trackId === secondTrackId)).toBeTruthy();
  expect(interactions.items.some((item) => item.type === 'recommendation_refresh')).toBeTruthy();

  await page.reload();
  await page.locator('[data-action="restore-context"]').click();
  const restoredCard = page.locator(`.track-card[data-track-id="${firstTrackId}"]`);
  await expect(restoredCard).toHaveCount(1);
  await expect(restoredCard.locator('[data-feedback-value="more"]')).toHaveAttribute('aria-pressed', 'true');
});

test('clicking the selected feedback again clears it', async ({ page }) => {
  await page.goto('/?lang=ko#/home');
  await completeProfile(page, 'a');
  await page.locator('[data-route="now"]').first().click();
  await page.locator('[data-context-id="focus"]').click();

  const button = page.locator('.track-card').first().locator('[data-feedback-value="more"]');
  await button.click();
  await expect(button).toHaveAttribute('aria-pressed', 'true');
  await button.click();
  await expect(button).toHaveAttribute('aria-pressed', 'false');
  await expect(page.locator('.app-notice')).toContainText('반응을 지웠어요');
});
