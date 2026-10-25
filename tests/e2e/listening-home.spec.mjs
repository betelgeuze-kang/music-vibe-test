import { test, expect } from '@playwright/test';
import { declineAnalytics } from './helpers.mjs';

test('editorial moments change real track links with keyboard focus retained', async ({ page }) => {
  await declineAnalytics(page);
  const analyticsRequests = [];
  page.on('request', (request) => {
    if (/google-analytics\.com|googletagmanager\.com/.test(request.url())) analyticsRequests.push(request.url());
  });
  await page.goto('/?lang=kr#/home');
  const panel = page.locator('[data-home-scene-panel]');
  await expect(panel).toContainText('Apocalypse');
  const scenes = [
    ['focus', 'River Flows in You', 'Yiruma'],
    ['lift', 'Love Lee', 'AKMU'],
    ['together', 'Best Part', 'Daniel Caesar'],
    ['night', 'Apocalypse', 'Cigarettes After Sex']
  ];
  for (const [id, title, artist] of scenes) {
    const button = page.locator(`[data-home-scene="${id}"]`);
    await button.focus();
    await page.keyboard.press('Enter');
    await expect(button).toBeFocused();
    await expect(button).toHaveAttribute('aria-pressed', 'true');
    await expect(page.locator('[data-home-scene][aria-pressed="true"]')).toHaveCount(1);
    await expect(panel.locator('.editorial-track')).toHaveCount(3);
    const row = panel.locator('.editorial-track').filter({ has: page.getByText(title, { exact: true }) });
    await expect(row).toContainText(artist);
    for (const link of await row.locator('a').all()) {
      const url = decodeURIComponent(await link.getAttribute('href'));
      expect(url).toContain(title);
      expect(url).toContain(artist);
      await expect(link).toHaveAttribute('rel', 'noopener noreferrer');
    }
  }
  expect(analyticsRequests).toEqual([]);
  await expect(page).toHaveURL(/#\/home$/);
});

test('home explains samples and playback in both languages while test entry remains usable', async ({ page }) => {
  await declineAnalytics(page);
  for (const [language, sample, question] of [
    ['kr', '아래는 이해를 돕는 예시예요.', '실제 노래를 여기서 들을 수 있나요?'],
    ['en', 'This is a sample.', 'Can I play the recommended songs here?']
  ]) {
    await page.goto(`/?lang=${language}#/home`);
    await expect(page.locator('.sample-disclaimer')).toContainText(sample);
    await page.getByText(question, { exact: true }).click();
    await expect(page.locator('details[open]')).toContainText('Spotify');
    await page.locator('.human-hero [data-action="focus-booth"]').click();
    await expect(page.locator('[data-action="home-preview"]').first()).toBeInViewport();
    await expect(page.locator('[data-action="home-preview"]').first()).toBeFocused();
    await page.locator('[data-action="home-choose"]').first().click();
    await expect(page.locator('.quiz-topline')).toContainText('2 / 10');
  }
});
