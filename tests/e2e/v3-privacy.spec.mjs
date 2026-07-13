import { test, expect } from '@playwright/test';

async function freshPrivacyPage(page, language = 'en') {
  await page.addInitScript(() => {
    localStorage.removeItem('music-vibe-consent-v2');
    localStorage.removeItem('music-vibe-visitor-v1');
  });
  await page.goto(`/?lang=${language === 'ko' ? 'kr' : 'en'}#/home`);
}

test('PV1 defaults every Google storage permission to denied before any choice', async ({ page }) => {
  const commands = [];
  await page.addInitScript(() => {
    const records = [];
    Object.defineProperty(window, 'dataLayer', {
      configurable: true,
      get: () => records,
      set: (value) => { if (Array.isArray(value)) records.push(...value); }
    });
    window.__consentRecords = records;
  });
  await freshPrivacyPage(page);
  const snapshot = await page.evaluate(() => ({
    preferences: window.MusicVibeConsent.getPreferences(),
    visitor: localStorage.getItem('music-vibe-visitor-v1'),
    scriptCount: document.querySelectorAll('#music-vibe-ga4').length,
    dataLayer: Array.from(window.dataLayer || []).map((entry) => Array.from(entry))
  }));
  expect(snapshot.preferences.analytics).toBe(false);
  expect(snapshot.preferences.adMeasurement).toBe(false);
  expect(snapshot.preferences.personalizedAds).toBe(false);
  expect(snapshot.visitor).toBeNull();
  expect(snapshot.scriptCount).toBe(0);
  const defaultConsent = snapshot.dataLayer.find((entry) => entry[0] === 'consent' && entry[1] === 'default');
  expect(defaultConsent?.[2]).toMatchObject({ analytics_storage: 'denied', ad_storage: 'denied', ad_user_data: 'denied', ad_personalization: 'denied' });
});

test('PV1 anonymous analytics grants analytics storage only', async ({ page }) => {
  await freshPrivacyPage(page);
  const banner = page.getByRole('region', { name: /Choose what this visit leaves behind/ });
  await banner.getByRole('button', { name: 'Allow anonymous analytics' }).click();
  await expect(banner).toHaveCount(0);
  const snapshot = await page.evaluate(() => ({
    preferences: window.MusicVibeConsent.getPreferences(),
    visitor: localStorage.getItem('music-vibe-visitor-v1'),
    consent: Array.from(window.dataLayer || []).map((entry) => Array.from(entry)).filter((entry) => entry[0] === 'consent').at(-1)?.[2]
  }));
  expect(snapshot.preferences).toMatchObject({ analytics: true, adMeasurement: false, personalizedAds: false });
  expect(snapshot.visitor).toMatch(/^mvu_/);
  expect(snapshot.consent).toMatchObject({ analytics_storage: 'granted', ad_storage: 'denied', ad_user_data: 'denied', ad_personalization: 'denied' });
});

test('PV1 privacy settings reopen and revocation removes the persistent analytics identity', async ({ page }) => {
  await freshPrivacyPage(page, 'ko');
  await page.getByRole('region', { name: /어떤 흔적을 남길지/ }).getByRole('button', { name: '익명 분석 허용' }).click();
  await expect.poll(() => page.evaluate(() => localStorage.getItem('music-vibe-visitor-v1'))).not.toBeNull();
  await page.locator('[data-consent-settings]').last().click();
  const dialog = page.getByRole('dialog', { name: /남길 것과 남기지 않을 것을 고르세요/ });
  await expect(dialog).toBeVisible();
  await expect(dialog.locator('input[name="adMeasurement"]')).toBeDisabled();
  await expect(dialog.locator('input[name="personalizedAds"]')).toBeDisabled();
  await dialog.locator('input[name="analytics"]').uncheck();
  await dialog.getByRole('button', { name: '선택 저장' }).click();
  await expect(dialog).toHaveCount(0);
  const state = await page.evaluate(() => ({
    preferences: window.MusicVibeConsent.getPreferences(),
    visitor: localStorage.getItem('music-vibe-visitor-v1')
  }));
  expect(state.preferences.analytics).toBe(false);
  expect(state.visitor).toBeNull();
});

test('PV1 essential-only choice never creates a persistent visitor ID', async ({ page }) => {
  await freshPrivacyPage(page);
  await page.getByRole('region', { name: /Choose what this visit leaves behind/ }).getByRole('button', { name: 'Essential only' }).click();
  expect(await page.evaluate(() => localStorage.getItem('music-vibe-visitor-v1'))).toBeNull();
  const preferences = await page.evaluate(() => window.MusicVibeConsent.getPreferences());
  expect(preferences).toMatchObject({ analytics: false, adMeasurement: false, personalizedAds: false });
});
