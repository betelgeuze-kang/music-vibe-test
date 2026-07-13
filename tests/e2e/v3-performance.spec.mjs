import fs from 'node:fs';
import { test, expect } from '@playwright/test';
import { declineAnalytics, completeProfile } from './helpers.mjs';

const budget = JSON.parse(fs.readFileSync('performance-budget.json', 'utf8'));

test.beforeEach(async ({ page }) => {
  await declineAnalytics(page);
});

test('PERF1 generates listening audio in a worker and reaches first sound within budget', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'chromium', 'performance budget is measured once in desktop Chromium');
  await page.goto('/?lang=en#/home');
  await page.locator('[data-action="home-preview"]').first().click();
  await expect.poll(() => page.evaluate(() => window.__musicVibeAudioFirstSound || null), { timeout: budget.browserMs.audioFirstSound + 3000 }).not.toBeNull();
  const snapshot = await page.evaluate(() => ({
    runtime: window.__musicVibeAudioRuntime || null,
    first: window.__musicVibeAudioFirstSound || null,
    source: window.__musicVibeV2?.homePreviewAudio?.src || ''
  }));
  expect(snapshot.runtime?.release).toBe('perf1');
  expect(snapshot.runtime?.workerUsed).toBe(true);
  expect(snapshot.runtime?.audioGenerateMs).toBeLessThanOrEqual(budget.browserMs.audioGenerate);
  expect(snapshot.first?.audioFirstSoundMs).toBeLessThanOrEqual(budget.browserMs.audioFirstSound);
  expect(snapshot.source.startsWith('blob:')).toBe(true);
});

test('PERF1 prefetches and measures lazy product routes', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'chromium', 'route timings are measured once in desktop Chromium');
  await page.goto('/?lang=en#/home');
  await completeProfile(page, 'a');
  const events = [];
  await page.exposeFunction('captureRouteTiming', (detail) => events.push(detail));
  await page.evaluate(() => {
    document.addEventListener('musicvibe:analytics', (event) => {
      if (event.detail?.name === 'route_module_load') window.captureRouteTiming(event.detail);
    });
  });
  const nowButton = page.locator('[data-route="now"]').first();
  await nowButton.hover();
  await page.waitForTimeout(150);
  await nowButton.click();
  await expect(page.locator('body')).toHaveAttribute('data-route', 'now');
  await expect.poll(() => events.length, { timeout: 5000 }).toBeGreaterThan(0);
  expect(events.every((event) => Number(event.params?.route_module_load_ms) <= budget.browserMs.routeModuleLoad)).toBe(true);
});
