import { test, expect } from '@playwright/test';
import { completeProfile, declineAnalytics } from './helpers.mjs';

test.beforeEach(async ({ page }) => {
  await declineAnalytics(page);
});

test('profile timeline compares two notes, restores one, and clears earlier history', async ({ page }) => {
  await page.goto('/?lang=ko#/home');
  await completeProfile(page, 'a');

  await expect(page.locator('.profile-timeline')).toBeVisible();
  await expect(page.locator('[data-timeline-entry]')).toHaveCount(1);
  await expect(page.locator('.timeline-empty')).toBeVisible();

  const firstProfile = await page.evaluate(() => JSON.parse(localStorage.getItem('music-vibe-v2-profile')));
  await page.locator('[data-action="retake-profile"]').click();
  await expect(page.locator('.quiz-topline')).toContainText('1 / 10');
  await completeProfile(page, 'b', { start: false });

  await expect(page.locator('.profile-timeline')).toBeVisible();
  await expect(page.locator('[data-timeline-entry]')).toHaveCount(2);
  await expect(page.locator('.timeline-comparison')).toBeVisible();
  await expect(page.locator('.timeline-change')).toHaveCount(2);
  await expect(page.locator('[data-timeline-entry].is-current')).toHaveCount(1);

  const restoreButton = page.locator('[data-action="restore-profile-snapshot"]').first();
  const restoreKey = await restoreButton.getAttribute('data-snapshot-key');
  expect(restoreKey).toContain(firstProfile.createdAt);
  await restoreButton.click();
  const restoreDialog = page.getByRole('dialog', { name: '이 기록으로 돌아갈까요?' });
  await expect(restoreDialog).toBeVisible();
  await restoreDialog.locator('[data-dialog-confirm]').click();
  await expect(page.locator('.app-notice')).toContainText('현재 취향으로 열었어요');

  const restored = await page.evaluate(() => JSON.parse(localStorage.getItem('music-vibe-v2-profile')));
  expect(`${restored.id}::${restored.createdAt}`).toBe(restoreKey);
  await expect(page.locator('[data-timeline-entry].is-current')).toHaveAttribute('data-snapshot-key', restoreKey);
  await expect(page.locator('[data-timeline-entry]')).toHaveCount(2);

  await page.locator('[data-action="clear-profile-history"]').click();
  const clearDialog = page.getByRole('dialog', { name: '과거 취향 기록을 지울까요?' });
  await expect(clearDialog).toBeVisible();
  await clearDialog.locator('[data-dialog-confirm]').click();
  await expect(page.locator('.app-notice')).toContainText('현재 취향은 유지됩니다');
  await expect(page.locator('[data-timeline-entry]')).toHaveCount(1);
  await expect(page.locator('[data-action="clear-profile-history"]')).toBeDisabled();

  const storedAfterClear = await page.evaluate(() => ({
    active: JSON.parse(localStorage.getItem('music-vibe-v2-profile')),
    history: JSON.parse(localStorage.getItem('music-vibe-v2-history'))
  }));
  expect(storedAfterClear.history).toHaveLength(1);
  expect(storedAfterClear.history[0].createdAt).toBe(storedAfterClear.active.createdAt);

  await page.reload();
  await expect(page.locator('.profile-timeline')).toBeVisible();
  await expect(page.locator('[data-timeline-entry]')).toHaveCount(1);
  await expect(page.locator('[data-timeline-entry].is-current')).toHaveCount(1);
});
