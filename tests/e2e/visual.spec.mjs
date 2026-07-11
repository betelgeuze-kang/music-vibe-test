import fs from 'node:fs';
import path from 'node:path';
import { test, expect } from '@playwright/test';
import { completeProfile, declineAnalytics } from './helpers.mjs';

const snapshotDir = path.resolve('tests/e2e/snapshots');
const baselineMarker = path.join(snapshotDir, '.ready');
const refreshMarkers = [
  path.join(snapshotDir, '.refresh'),
  path.join(snapshotDir, '.refresh-css-scale')
];
const baselinesReady = fs.existsSync(baselineMarker) && !refreshMarkers.some((marker) => fs.existsSync(marker));
const screenshotOptions = Object.freeze({
  fullPage: true,
  animations: 'disabled',
  scale: 'css'
});

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
    await expect(page).toHaveScreenshot(name, screenshotOptions);
    return;
  }
  const output = path.resolve('test-results/visual-capture', name);
  fs.mkdirSync(path.dirname(output), { recursive: true });
  await page.screenshot({ path: output, ...screenshotOptions });
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
  await page.locator('[data-action="home-choose"]').first().click();
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
