import fs from 'node:fs';
import path from 'node:path';
import { test, expect } from '@playwright/test';
import { completeProfile, declineAnalytics } from './helpers.mjs';

const baselinesReady = fs.existsSync(path.resolve('tests/e2e/snapshots/.ready'));

async function stabilize(page) {
  await page.evaluate(async () => {
    await document.fonts?.ready;
    document.documentElement.style.scrollBehavior = 'auto';
    document.querySelectorAll('audio').forEach((audio) => audio.pause());
    window.scrollTo(0, 0);
  });
  await page.waitForTimeout(150);
}

async function captureOrCompare(page, testInfo, baseName) {
  const name = `${testInfo.project.name}-${baseName}`;
  await stabilize(page);
  if (baselinesReady) {
    await expect(page).toHaveScreenshot(name, { fullPage: true });
    return;
  }
  const output = path.resolve('test-results/visual-capture', name);
  fs.mkdirSync(path.dirname(output), { recursive: true });
  await page.screenshot({ path: output, fullPage: true, animations: 'disabled' });
  expect(fs.statSync(output).size).toBeGreaterThan(20_000);
}

test.beforeEach(async ({ page }) => {
  await declineAnalytics(page);
});

test('home visual snapshot', async ({ page }, testInfo) => {
  await page.goto('/?lang=ko#/home');
  await captureOrCompare(page, testInfo, 'home.png');
});

test('discover visual snapshot', async ({ page }, testInfo) => {
  await page.goto('/?lang=ko#/home');
  await page.locator('[data-action="brand-choose"]').first().click();
  await expect(page.locator('.quiz-topline')).toContainText('2 / 10');
  await captureOrCompare(page, testInfo, 'discover.png');
});

test('profile visual snapshot', async ({ page }, testInfo) => {
  await page.goto('/?lang=ko#/home');
  await completeProfile(page, 'a');
  await captureOrCompare(page, testInfo, 'profile.png');
});

test('today-listen visual snapshot', async ({ page }, testInfo) => {
  await page.goto('/?lang=ko#/home');
  await completeProfile(page, 'a');
  await page.locator('[data-route="now"]').first().click();
  await page.locator('[data-context-id="night"]').click();
  await expect(page.locator('.recommendation-list .track-card')).toHaveCount(5);
  await captureOrCompare(page, testInfo, 'now.png');
});

test('listen-together visual snapshot', async ({ page }, testInfo) => {
  await page.goto('/?lang=ko#/home');
  await completeProfile(page, 'a');
  await page.locator('[data-route="match"]').first().click();
  await expect(page.locator('.invite-builder')).toBeVisible();
  await captureOrCompare(page, testInfo, 'match.png');
});
