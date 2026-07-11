import fs from 'node:fs';
import path from 'node:path';
import { test, expect } from '@playwright/test';
import { completeProfile, declineAnalytics } from './helpers.mjs';

const baselinesReady = fs.existsSync(path.resolve('tests/e2e/snapshots/.ready'));

async function captureOrCompare(page, name) {
  if (baselinesReady) {
    await expect(page).toHaveScreenshot(name, { fullPage: true });
    return;
  }
  const output = path.resolve('test-results/visual-capture', name);
  fs.mkdirSync(path.dirname(output), { recursive: true });
  await page.screenshot({ path: output, fullPage: true, animations: 'disabled' });
  expect(fs.statSync(output).size).toBeGreaterThan(20_000);
}

test('home visual snapshot', async ({ page }) => {
  await declineAnalytics(page);
  await page.goto('/?lang=ko#/home');
  await page.evaluate(() => document.fonts?.ready);
  await captureOrCompare(page, 'home.png');
});

test('profile visual snapshot', async ({ page }) => {
  await declineAnalytics(page);
  await page.goto('/?lang=ko#/home');
  await completeProfile(page, 'a');
  await page.evaluate(() => document.fonts?.ready);
  await captureOrCompare(page, 'profile.png');
});
