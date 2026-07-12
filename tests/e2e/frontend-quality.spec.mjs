import { test, expect } from '@playwright/test';
import { completeProfile, declineAnalytics } from './helpers.mjs';

async function expectNoHorizontalOverflow(page, label) {
  const metrics = await page.evaluate(() => ({
    clientWidth: document.documentElement.clientWidth,
    scrollWidth: document.documentElement.scrollWidth,
    bodyWidth: document.body.scrollWidth
  }));
  expect(metrics.scrollWidth, `${label}: document overflows horizontally`).toBeLessThanOrEqual(metrics.clientWidth + 1);
  expect(metrics.bodyWidth, `${label}: body overflows horizontally`).toBeLessThanOrEqual(metrics.clientWidth + 1);
}

async function expectTouchTargets(page, selectors, label) {
  const undersized = await page.evaluate((requestedSelectors) => {
    const results = [];
    requestedSelectors.forEach((selector) => {
      document.querySelectorAll(selector).forEach((element) => {
        const style = getComputedStyle(element);
        const rect = element.getBoundingClientRect();
        if (style.display === 'none' || style.visibility === 'hidden' || rect.width === 0 || rect.height === 0) return;
        if (rect.height < 44 || rect.width < 44) {
          results.push({ selector, text: element.textContent.trim().slice(0, 50), width: Math.round(rect.width), height: Math.round(rect.height) });
        }
      });
    });
    return results;
  }, selectors);
  expect(undersized, `${label}: undersized interactive targets`).toEqual([]);
}

async function createReadyWeekly(page) {
  await completeProfile(page, 'a');
  await page.locator('[data-route="now"]').first().click();
  await page.locator('[data-context-id="night"]').click();
  await page.locator('[data-action="track-feedback"][data-feedback-value="more"]').nth(0).click();
  await page.locator('[data-action="track-feedback"][data-feedback-value="more"]').nth(2).click();
  await page.locator('[data-route="weekly"]').first().click();
  await expect(page.locator('.weekly-hero')).toBeVisible();
}

test('privacy dialog has an accessible name, keyboard close, and focus restoration', async ({ page }) => {
  await declineAnalytics(page);
  await page.goto('/?lang=kr#/home');
  const trigger = page.locator('.editorial-privacy [data-action="privacy"]');
  await trigger.scrollIntoViewIfNeeded();
  await trigger.click();

  const dialog = page.getByRole('dialog', { name: '취향 기록은 어떻게 저장되나요?' });
  await expect(dialog).toBeVisible();
  await expect(dialog).toHaveAttribute('aria-describedby', /privacy-description/);
  await expect(page.locator(':focus')).toHaveAttribute('data-dialog-primary', '');
  await page.keyboard.press('Escape');
  await expect(dialog).toHaveCount(0);
  await expect(trigger).toBeFocused();
});

test('destructive actions use the application confirm dialog instead of window.confirm', async ({ page }) => {
  await declineAnalytics(page);
  await page.addInitScript(() => {
    window.confirm = () => { throw new Error('Native confirm must not be called'); };
  });
  await page.goto('/?lang=kr#/home');
  await completeProfile(page, 'a');

  const deleteButton = page.locator('[data-action="clear-profile"]').last();
  await deleteButton.scrollIntoViewIfNeeded();
  await deleteButton.click();
  const dialog = page.getByRole('dialog', { name: '저장된 취향과 기록을 모두 지울까요?' });
  await expect(dialog).toBeVisible();
  await expect(page.locator(':focus')).toHaveAttribute('data-dialog-cancel', '');
  await page.keyboard.press('Escape');
  await expect(dialog).toHaveCount(0);
  await expect(page.locator('.profile-hero')).toBeVisible();

  await deleteButton.click();
  await page.locator('[data-dialog-confirm]').click();
  await expect(page.locator('body')).toHaveAttribute('data-route', 'home');
  expect(await page.evaluate(() => localStorage.getItem('music-vibe-v2-profile'))).toBeNull();
});

test('optional analytics consent is a non-blocking labelled region with keyboard-operable buttons', async ({ page }) => {
  await page.addInitScript(() => {
    try { localStorage.removeItem('music-vibe-consent-v2'); } catch (_) {}
  });
  await page.goto('/?lang=en#/home');
  const banner = page.getByRole('region', { name: 'Optional analytics cookies' });
  await expect(banner).toBeVisible();
  await expect(banner).toHaveAttribute('aria-describedby', 'analytics-consent-description');
  const essential = banner.getByRole('button', { name: 'Essential only' });
  await essential.focus();
  await expect(essential).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(banner).toHaveCount(0);
  expect(await page.evaluate(() => localStorage.getItem('music-vibe-consent-v2'))).toBe('declined');
});

test('route changes clear transient notices before mobile navigation renders', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'mobile-chromium', 'mobile overlap contract');
  await declineAnalytics(page);
  await page.goto('/?lang=kr#/home');
  await createReadyWeekly(page);

  const notice = page.locator('.app-notice');
  await expect(notice).toBeEmpty();
  const nav = page.locator('.site-nav');
  await expect(nav).toBeVisible();
  const navBox = await nav.boundingBox();
  const noticeBox = await notice.boundingBox();
  if (noticeBox && navBox) {
    const overlaps = !(noticeBox.y + noticeBox.height <= navBox.y || navBox.y + navBox.height <= noticeBox.y);
    expect(overlaps).toBe(false);
  }
});

test('weekly context layout uses its real card count and hides internal tags', async ({ page }) => {
  await declineAnalytics(page);
  await page.goto('/?lang=kr#/home');
  await createReadyWeekly(page);
  await expect(page.locator('.weekly-context-grid')).toHaveClass(/is-count-1/);
  await expect(page.locator('.weekly-tags__list')).not.toContainText('editorial-curated');
});

test('responsive matrix has no horizontal overflow at 390, 768, 1024, and 1440 pixels', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'chromium', 'single Chromium matrix');
  test.setTimeout(120_000);
  await declineAnalytics(page);

  for (const width of [390, 768, 1024, 1440]) {
    await page.setViewportSize({ width, height: width <= 768 ? 900 : 1000 });
    await page.goto(`/?lang=kr&matrix=${width}#/home`);
    await expectNoHorizontalOverflow(page, `${width}px home`);

    await completeProfile(page, 'a');
    await expectNoHorizontalOverflow(page, `${width}px profile`);

    await page.locator('[data-route="weekly"]').first().click();
    await expectNoHorizontalOverflow(page, `${width}px weekly`);

    await page.locator('[data-route="now"]').first().click();
    await expectNoHorizontalOverflow(page, `${width}px now`);

    await page.locator('[data-route="match"]').first().click();
    await expectNoHorizontalOverflow(page, `${width}px match`);

    await page.evaluate(() => {
      localStorage.removeItem('music-vibe-v2-profile');
      localStorage.removeItem('music-vibe-v2-history');
      window.location.hash = '#/home';
    });
  }
});

test('mobile primary controls meet the 44px hit-target contract', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'mobile-chromium', 'mobile hit-target contract');
  await declineAnalytics(page);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/?lang=kr#/home');
  await expectTouchTargets(page, [
    '.editorial-button',
    '.listening-choice__choose',
    '.listening-choice__transport button',
    '.editorial-track__links a',
    '.editorial-text-link',
    '.editorial-footer button'
  ], '390px home');

  await completeProfile(page, 'a');
  await expectTouchTargets(page, ['.site-nav__link', '.button', '.utility-actions button'], '390px profile');

  await page.locator('[data-route="weekly"]').first().click();
  await expectTouchTargets(page, ['.site-nav__link', '.button', '.editorial-text-link'], '390px weekly');
});
