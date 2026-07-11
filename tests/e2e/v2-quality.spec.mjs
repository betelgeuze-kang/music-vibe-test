import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { completeProfile, declineAnalytics, profileInvite } from './helpers.mjs';

const seriousViolations = (results) => results.violations.filter((violation) => ['serious', 'critical'].includes(violation.impact));

async function expectAccessible(page, label) {
  const results = await new AxeBuilder({ page }).analyze();
  expect(seriousViolations(results), `${label} has serious accessibility violations`).toEqual([]);
}

async function expectAboveFixedNavigation(page, selector) {
  const element = page.locator(selector).last();
  await element.scrollIntoViewIfNeeded();
  const nav = page.locator('.site-nav');
  await expect(nav).toBeVisible();
  const elementBox = await element.boundingBox();
  const navBox = await nav.boundingBox();
  expect(elementBox, `${selector} must have a layout box`).not.toBeNull();
  expect(navBox, 'bottom navigation must have a layout box').not.toBeNull();
  expect(elementBox.y + elementBox.height, `${selector} is covered by bottom navigation`).toBeLessThanOrEqual(navBox.y - 4);
}

test.beforeEach(async ({ page }) => {
  await declineAnalytics(page);
});

test('home listening booth, keyboard editing, and profile persistence work together', async ({ page }) => {
  await page.goto('/?lang=kr#/home');
  await expect(page.locator('.listening-booth')).toBeVisible();
  await page.locator('[data-action="brand-choose"]').nth(1).click();
  await expect(page.locator('.quiz-topline')).toContainText('2 / 10');
  await page.keyboard.press('ArrowLeft');
  await expect(page.locator('.quiz-topline')).toContainText('1 / 10');
  await page.keyboard.press('a');
  await expect(page.locator('.quiz-topline')).toContainText('2 / 10');

  for (let questionNumber = 2; questionNumber <= 10; questionNumber += 1) {
    await page.keyboard.press(questionNumber % 2 ? 'a' : 'b');
    if (questionNumber < 10) {
      await expect(page.locator('.quiz-topline')).toContainText(`${questionNumber + 1} / 10`);
    }
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

test('fragment invite completes a friend match without exposing the token in the query', async ({ browser }, testInfo) => {
  test.skip(testInfo.project.name !== 'chromium', 'cross-context referral contract is viewport-independent');

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
  await completeProfile(friendPage, 'b', { finalSelector: '.quality-match-score' });
  await expect(friendPage.locator('.quality-match-score')).toContainText('Resonance');
  await expect(friendPage.locator('.recommendation-list--bridge .track-card')).toHaveCount(5);

  await sender.close();
  await friend.close();
});

test('legacy referral remains compatible', async ({ page }) => {
  await page.goto('/?ref=ENFP&lang=en#/match');
  await expect(page.locator('.empty-state')).toBeVisible();
  await expect(page.locator('body')).toContainText(/Create your music identity|music you can share|friend invited/i);
});

test('analytics rejection prevents GA script loading', async ({ page }) => {
  await page.goto('/?lang=en#/home');
  await expect(page.locator('#music-vibe-ga4')).toHaveCount(0);
  expect(await page.evaluate(() => localStorage.getItem('music-vibe-consent-v2'))).toBe('declined');
});

test('audio failure is recoverable from the home listening booth', async ({ page }) => {
  await page.route('**/assets/audio/**', (route) => route.abort('failed'));
  await page.goto('/?lang=en#/home');
  await page.locator('[data-action="brand-preview"]').first().click();
  await expect(page.locator('.listening-choice.has-error').first()).toBeVisible();
  await page.locator('[data-action="brand-choose"]').first().click();
  await expect(page.locator('.quiz-topline')).toContainText('2 / 10');
});

test('localStorage failure does not block the core session', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'chromium', 'storage resilience is viewport-independent');

  await page.addInitScript(() => {
    Storage.prototype.getItem = () => { throw new Error('blocked'); };
    Storage.prototype.setItem = () => { throw new Error('blocked'); };
    Storage.prototype.removeItem = () => { throw new Error('blocked'); };
  });
  await page.goto('/?lang=en#/home');

  const essentialOnly = page.getByRole('button', { name: 'Essential only' });
  if (await essentialOnly.isVisible().catch(() => false)) {
    await essentialOnly.click();
  }

  await completeProfile(page, 'a');
  await expect(page.locator('.profile-hero')).toBeVisible();
});

test('all five editorial routes pass axe including color contrast', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'chromium', 'desktop accessibility pass');

  await page.goto('/?lang=en#/home');
  await expectAccessible(page, 'home');

  await page.locator('[data-action="brand-choose"]').first().click();
  await expect(page.locator('.quiz-topline')).toContainText('2 / 10');
  await expectAccessible(page, 'discover');

  await completeProfile(page, 'a', { start: false });
  await expectAccessible(page, 'profile');

  await page.locator('[data-route="now"]').first().click();
  await page.locator('[data-context-id="night"]').click();
  await expectAccessible(page, 'today listen');

  await page.locator('[data-route="match"]').first().click();
  await expectAccessible(page, 'listen together');
});

test('mobile navigation is hidden during discovery and never covers product content', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'mobile-chromium', 'mobile-only layout contract');

  await page.goto('/?lang=kr#/home');
  await expect(page.locator('.site-nav')).toBeHidden();
  await expect(page.locator('[data-action="brand-focus-booth"]')).toBeVisible();

  await page.locator('[data-action="brand-choose"]').first().click();
  await expect(page.locator('.site-nav')).toBeHidden();
  await completeProfile(page, 'a', { start: false });

  await expectAboveFixedNavigation(page, '.profile-hero__radar');
  await expectAboveFixedNavigation(page, '.utility-actions button');

  await page.locator('[data-route="now"]').first().click();
  await expectAboveFixedNavigation(page, '.context-card');
  await page.locator('[data-context-id="night"]').click();
  await expectAboveFixedNavigation(page, '.track-card__actions a');

  await page.locator('[data-route="match"]').first().click();
  await expectAboveFixedNavigation(page, '[data-action="copy-invite"]');
});

test('mobile Korean headings keep words intact', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'mobile-chromium', 'mobile-only typography contract');
  await page.goto('/?lang=kr#/home');

  const title = page.locator('.editorial-hero h1');
  await expect(title).toBeVisible();
  const lines = await title.evaluate((element) => {
    const range = document.createRange();
    const textNode = [...element.childNodes].find((node) => node.nodeType === Node.TEXT_NODE && node.textContent.trim());
    if (!textNode) return [];
    return [...textNode.textContent.trim()].map((character, index) => {
      range.setStart(textNode, index);
      range.setEnd(textNode, index + 1);
      const rect = range.getBoundingClientRect();
      return { character, top: Math.round(rect.top) };
    });
  });

  const compact = lines.filter((item) => item.character !== ' ');
  for (let index = 1; index < compact.length; index += 1) {
    if (compact[index - 1].top !== compact[index].top) {
      const previousCharacter = compact[index - 1].character;
      const currentCharacter = compact[index].character;
      expect(`${previousCharacter}${currentCharacter}`).not.toMatch(/[가-힣]{2}/);
    }
  }
});
