import { expect } from '@playwright/test';

export async function declineAnalytics(page) {
  await page.addInitScript(() => {
    try {
      localStorage.setItem('music-vibe-consent-v2', 'declined');
    } catch (_) {
      // Some resilience tests intentionally block Storage.
    }
  });
}

async function currentQuestionNumber(page) {
  const progress = await page.locator('.quiz-topline').textContent();
  const match = String(progress || '').match(/(\d+)\s*\/\s*10/);
  return match ? Number(match[1]) : 1;
}

export async function completeProfile(page, option = 'a', options = {}) {
  const {
    start = true,
    finalSelector = '.profile-hero'
  } = options;
  const choiceIndex = String(option).toLowerCase() === 'b' ? 1 : 0;

  if (start) {
    const homeChoice = page.locator('[data-action="brand-choose"]').nth(choiceIndex);
    if (await homeChoice.isVisible().catch(() => false)) {
      await homeChoice.click();
      await expect(page.locator('.quiz-topline')).toContainText('2 / 10');
    } else {
      await page.locator('[data-route="discover"]').first().click();
    }
  }

  let questionNumber = await currentQuestionNumber(page);
  for (; questionNumber <= 10; questionNumber += 1) {
    await expect(page.locator('.quiz-topline')).toContainText(`${questionNumber} / 10`);
    await page.locator('[data-action="choose-option"]').nth(choiceIndex).click();
    if (questionNumber < 10) {
      await expect(page.locator('.quiz-topline')).toContainText(`${questionNumber + 1} / 10`);
    }
  }

  await page.locator(finalSelector).waitFor({ state: 'visible' });
}

export async function profileInvite(page) {
  await page.locator('[data-route="match"]').first().click();
  await page.context().grantPermissions(['clipboard-read', 'clipboard-write'], { origin: 'http://127.0.0.1:4173' });
  await page.locator('[data-action="copy-invite"]').click();
  return page.evaluate(() => navigator.clipboard.readText());
}
