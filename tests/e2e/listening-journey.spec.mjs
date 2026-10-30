import fs from 'node:fs';
import path from 'node:path';
import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { completeProfile, declineAnalytics } from './helpers.mjs';
async function reviewCapture(page, testInfo, name) {
  const dir = process.env.MUSIC_VIBE_REVIEW_DIR;
  if (!dir) return;
  fs.mkdirSync(dir, { recursive:true });
  await page.screenshot({ path:path.join(dir,`${testInfo.project.name}-${name}.png`),fullPage:true,animations:'disabled',scale:'css' });
}
const draftKey = 'music-vibe-v2-quiz-draft-v1';
test.beforeEach(async ({ page }) => { await declineAnalytics(page); });

test('choices resume after refresh, can be edited, and clear on completion', async ({ page }, testInfo) => {
  await page.goto('/?lang=kr#/home');
  await page.locator('[data-action="home-choose"]').first().click();
  await expect(page.locator('.quiz-topline')).toContainText('2 / 10');
  await page.locator('[data-action="choose-option"]').nth(1).click();
  await expect(page.locator('.quiz-topline')).toContainText('3 / 10');
  await page.reload();
  await expect(page.locator('.quiz-topline')).toContainText('3 / 10');
  await reviewCapture(page,testInfo,'quiz-resumed');
  await expect(page.locator('[data-action="preview"][aria-pressed="true"]')).toHaveCount(0);
  await page.locator('[data-action="previous-question"]').click();
  await expect(page.locator('[data-option-card="synthetic-layers"]')).toHaveClass(/is-selected/);
  await page.locator('[data-action="choose-option"]').first().click();
  await expect(page.locator('.quiz-topline')).toContainText('3 / 10');
  await page.locator('[data-action="quit-quiz"]').click();
  await expect(page.locator('.home-resume-note')).toBeVisible();
  await page.reload();
  await page.locator('[data-action="resume-quiz"]').click();
  await expect(page.locator('.quiz-topline')).toContainText('3 / 10');
  await completeProfile(page, 'a', { start: false });
  expect(await page.evaluate((key) => localStorage.getItem(key), draftKey)).toBeNull();
  await page.locator('[data-route="home"]').first().click();
  await expect(page.locator('.home-resume-note')).toHaveCount(0);
});

test('saved choices can be deleted or restarted, with no analytics consent needed', async ({ page }) => {
  await page.goto('/?lang=en#/home');
  await page.locator('[data-action="home-choose"]').first().click();
  await expect(page.locator('.quiz-topline')).toContainText('2 / 10');
  await page.locator('[data-action="retake-profile"]').click();
  await expect(page.locator('.quiz-topline')).toContainText('1 / 10');
  expect(await page.evaluate((key) => JSON.parse(localStorage.getItem(key)).answers, draftKey)).toEqual([]);
  await page.locator('[data-action="choose-option"]').first().click();
  await expect(page.locator('.quiz-topline')).toContainText('2 / 10');
  await page.locator('[data-action="quit-quiz"]').click();
  await page.locator('[data-action="clear-quiz-draft"]').click();
  await expect(page.locator('.home-resume-note')).toHaveCount(0);
  expect(await page.evaluate((key) => localStorage.getItem(key), draftKey)).toBeNull();
});

test('test controls remain accessible and work without storage', async ({ page }) => {
  await page.addInitScript(() => { Storage.prototype.setItem = () => { throw Error('blocked storage'); }; });
  await page.goto('/?lang=kr#/discover');
  await expect(page.locator('.quiz-save-note')).toContainText('브라우저 저장소를 사용할 수 없어요');
  await page.locator('[data-action="choose-option"]').first().click();
  await expect(page.locator('.quiz-topline')).toContainText('2 / 10');
  await expect(page.locator('#question-title')).toBeFocused();
  const result = await new AxeBuilder({ page }).analyze();
  expect(result.violations.filter((v) => ['serious','critical'].includes(v.impact))).toEqual([]);
  const boxes = await page.locator('[data-action="preview"], [data-action="choose-option"]').evaluateAll((els) => els.map((el) => ({ w: el.getBoundingClientRect().width, h: el.getBoundingClientRect().height })));
  expect(boxes.every((b) => b.w >= 44 && b.h >= 44)).toBe(true);
});

test('song actions distinguish direct links, explanations and a ready weekly note', async ({ page }, testInfo) => {
  await page.goto('/?lang=kr#/home');
  await completeProfile(page,'a');
  await page.locator('[data-route="home"]').first().click();
  await expect(page.locator('.editorial-hero__actions > button').first()).toContainText('오늘 들을 음악');
  await expect(page.locator('.home-weekly-band--first')).toBeVisible();
  await page.locator('.editorial-hero__actions > button').first().click();
  await page.locator('[data-context-id="night"]').click();
  await expect(page.locator('.recommendation-list .track-card')).toHaveCount(5);
  await expect(page.locator('.track-card__taste-note')).toHaveCount(5);
  for (const link of await page.locator('.recommendation-list [data-track-link]').all()) {
    const kind = await link.getAttribute('data-link-kind');
    const href = await link.getAttribute('href');
    if (kind === 'direct') expect(href).toMatch(/youtube.com\/watch\?v=/);
    else expect(href).toContain('search');
    await expect(link).toContainText(kind === 'direct'?'곡 열기':'검색');
  }
  await reviewCapture(page,testInfo,'music-for-today');
  const accessibility = await new AxeBuilder({page}).analyze();
  expect(accessibility.violations.filter(v=>['serious','critical'].includes(v.impact))).toEqual([]);
  await page.locator('[data-action="track-feedback"][data-feedback-value="more"]').nth(0).click();
  await page.locator('[data-action="track-feedback"][data-feedback-value="more"]').nth(1).click();
  await page.locator('[data-route="home"]').first().click();
  await expect(page.locator('.editorial-hero__actions > button').first()).toContainText('이번 주 기록');
  await reviewCapture(page,testInfo,'returning-home');
  await page.locator('.editorial-hero__actions > button').first().click();
  await expect(page.locator('.weekly-hero')).toBeVisible();
});

test('all listening essays are readable without JavaScript and link to real destinations', async ({ browser },testInfo) => {
  const context = await browser.newContext({ javaScriptEnabled:false,viewport:testInfo.project.use.viewport });
  const page = await context.newPage();
  for (const prefix of ['', '/en']) for (const slug of ['night-walk','focused-afternoon','a-little-lift','between-conversations']) {
    await page.goto(`http://127.0.0.1:4173${prefix}/listening/${slug}/`);
    await expect(page.locator('h1')).toBeVisible();
    await expect(page.locator('.guide-track')).toHaveCount(3);
    await expect(page.locator('.guide-listening-point')).toHaveCount(3);
    await expect(page.locator('[data-guide-personalize]')).toHaveAttribute('href',/#\/discover$/);
    const bounds=await page.evaluate(()=>({width:document.documentElement.clientWidth,scroll:document.documentElement.scrollWidth}));
    expect(bounds.scroll).toBeLessThanOrEqual(bounds.width + 1);
    if (!prefix && ['night-walk','focused-afternoon'].includes(slug)) await reviewCapture(page,testInfo,`guide-${slug}`);
    const urls=await page.locator('[data-platform="youtube"]').evaluateAll(els=>els.map(e=>e.href));
    expect(urls.every(url=>/^https:\/\/www.youtube.com\/watch\?v=/.test(url))).toBe(true);
  }
  await context.close();
});

test('listening note connects a saved taste to the correct context and preserves consent', async ({ page }) => {
  const analytics=[];
  page.on('request',r=>{if(/googletagmanager|google-analytics.com/.test(r.url())) analytics.push(r.url());});
  await page.goto('/?lang=en#/home');
  await completeProfile(page,'b');
  await page.goto('/en/listening/focused-afternoon/');
  await expect(page.locator('[data-guide-personalize]')).toContainText('Find five songs');
  await expect(page.locator('[data-guide-personalize]')).toHaveAttribute('href',/now\?context=focus$/);
  const accessibility=await new AxeBuilder({page}).analyze();
  expect(accessibility.violations.filter(v=>['serious','critical'].includes(v.impact))).toEqual([]);
  await page.locator('[data-guide-personalize]').click();
  await expect(page.locator('.recommendation-list .track-card')).toHaveCount(5);
  await expect(page.locator('.now-hero h1')).toContainText('focus');
  expect(analytics).toEqual([]);
});


test('bilingual listening pages pass accessibility in the normal browser', async ({page})=>{
  test.setTimeout(120_000);
  for (const prefix of ['', '/en']) for (const slug of ['', 'night-walk/', 'focused-afternoon/', 'a-little-lift/', 'between-conversations/']) {
    await page.goto(`${prefix}/listening/${slug}`);
    const result=await new AxeBuilder({page}).analyze();
    expect(result.violations.filter(v=>['serious','critical'].includes(v.impact)),`${prefix}/listening/${slug}`).toEqual([]);
  }
});

test('returning home opens the saved weekly window when this week has no activity', async ({page})=>{
  await page.goto('/?lang=kr#/home');
  await completeProfile(page,'a');
  await page.locator('[data-route="now"]').first().click();
  await page.locator('[data-context-id="night"]').click();
  await page.locator('[data-action="track-feedback"][data-feedback-value="more"]').nth(0).click();
  await page.locator('[data-action="track-feedback"][data-feedback-value="more"]').nth(1).click();
  await page.locator('[data-route="weekly"]').first().click();
  await expect(page.locator('.weekly-hero')).toBeVisible();
  const saved=await page.evaluate(()=>JSON.parse(localStorage.getItem('music-vibe-v2-weekly-v1')).items[0]);
  await page.clock.setFixedTime(new Date(Date.now()+14*86_400_000));
  await page.goto('/?lang=kr#/home');
  const primary=page.locator('.editorial-hero__actions > button').first();
  await expect(primary).toContainText('지난 기록');
  await expect(primary).toHaveAttribute('data-weekly-anchor',saved.windowEndAt);
  await primary.click();
  await expect(page.locator('.weekly-hero')).toBeVisible();
  await expect(page.locator('.weekly-empty')).toHaveCount(0);
  expect(await page.evaluate(()=>window.__musicVibeV2.latestWeeklyVibe.weekKey)).toBe(saved.weekKey);
});
