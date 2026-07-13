import { test, expect } from '@playwright/test';
import { completeProfile, declineAnalytics } from './helpers.mjs';

test.beforeEach(async ({ page }) => {
  await declineAnalytics(page);
});

test('DATA1 exports local product notes without analytics identity', async ({ page }) => {
  await page.goto('/?lang=kr#/home');
  await completeProfile(page, 'a');
  await page.evaluate(() => {
    localStorage.setItem('music-vibe-visitor-v1', 'private-analytics-id');
  });
  await page.locator('[data-route="settings"]').first().click();
  await expect(page.locator('.data-settings')).toBeVisible();
  const downloadPromise = page.waitForEvent('download');
  await page.locator('[data-action="export-user-data"]').click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toMatch(/^my-music-vibe-\d{4}-\d{2}-\d{2}\.json$/);
  const stream = await download.createReadStream();
  let text = '';
  for await (const chunk of stream) text += chunk.toString('utf8');
  const bundle = JSON.parse(text);
  expect(bundle.product).toBe('my-music-vibe');
  expect(bundle.schema).toBe(1);
  expect(bundle.data.profile.id).toBeTruthy();
  expect(text).not.toContain('private-analytics-id');
  expect(text).not.toContain('music-vibe-consent-v2');
});

test('DATA1 imports a prior export without importing privacy choices or analytics identity', async ({ page }) => {
  await page.goto('/?lang=en#/home');
  await completeProfile(page, 'b');
  const bundle = await page.evaluate(async () => {
    localStorage.setItem('music-vibe-visitor-v1', 'keep-current-identity');
    localStorage.setItem('music-vibe-consent-v2', JSON.stringify({ version: 3, decided: true, analytics: false, adMeasurement: false, personalizedAds: false }));
    const module = await import('/src/v2/infrastructure/data-portability.mjs?data=data1');
    return module.exportUserData();
  });
  const profileId = bundle.data.profile.id;
  await page.evaluate(() => {
    for (const key of Object.keys(localStorage)) {
      if (key.startsWith('music-vibe-v2-')) localStorage.removeItem(key);
    }
  });
  await page.goto('/?lang=en#/settings');
  const input = page.locator('[data-user-data-file]');
  await input.setInputFiles({ name: 'my-music-vibe.json', mimeType: 'application/json', buffer: Buffer.from(JSON.stringify(bundle)) });
  const dialog = page.getByRole('dialog', { name: /Replace this browser’s notes/ });
  await expect(dialog).toBeVisible();
  await dialog.locator('[data-dialog-confirm]').click();
  await page.waitForLoadState('domcontentloaded');
  await expect.poll(() => page.evaluate(() => JSON.parse(localStorage.getItem('music-vibe-v2-profile') || 'null')?.id || '')).toBe(profileId);
  expect(await page.evaluate(() => localStorage.getItem('music-vibe-visitor-v1'))).toBe('keep-current-identity');
  const consent = JSON.parse(await page.evaluate(() => localStorage.getItem('music-vibe-consent-v2')));
  expect(consent.analytics).toBe(false);
});

test('DATA1 category deletion and complete deletion use accessible confirmation', async ({ page }) => {
  await page.goto('/?lang=kr#/home');
  await completeProfile(page, 'a');
  await page.evaluate(() => {
    localStorage.setItem('music-vibe-v2-feedback-v1', JSON.stringify({ version: 1, tracks: { 'space-song': { value: 'more' } } }));
  });
  await page.goto('/?lang=kr#/settings');
  await page.locator('[data-action="clear-data-category"][data-category="feedback"]').click();
  const feedbackDialog = page.getByRole('dialog', { name: /곡에 남긴 반응을 지울까요/ });
  await expect(feedbackDialog).toBeVisible();
  await feedbackDialog.locator('[data-dialog-confirm]').click();
  await page.waitForLoadState('domcontentloaded');
  await expect.poll(() => page.evaluate(() => localStorage.getItem('music-vibe-v2-feedback-v1'))).toBeNull();

  await page.goto('/?lang=kr#/settings');
  await page.locator('[data-action="clear-all-user-data"]').click();
  const allDialog = page.getByRole('dialog', { name: /모든 기록을 지울까요/ });
  await expect(allDialog).toBeVisible();
  await allDialog.locator('[data-dialog-confirm]').click();
  await page.waitForLoadState('domcontentloaded');
  const remaining = await page.evaluate(() => Object.keys(localStorage).filter((key) => key.startsWith('music-vibe-v2-') || key === 'music-vibe-visitor-v1'));
  expect(remaining).toEqual([]);
});
