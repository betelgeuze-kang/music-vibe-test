import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');
const exists = (file) => fs.existsSync(path.join(root, file));

const index = read('index.html');
const css = read('v2-stabilization.css');
const a11yCss = read('v2-stabilization-a11y.css');
const timelineCss = read('v2-m4-timeline.css');
const weeklyCss = read('v2-m4-weekly.css');
const cssEntry = read('v2-app.css');
const helpers = read('src/v2/ui/helpers.mjs');
const nowScreen = read('src/v2/ui/screens/now.mjs');
const profileScreen = read('src/v2/ui/screens/profile.mjs');
const weeklyScreen = read('src/v2/ui/screens/weekly.mjs');
const qualitySpec = read('tests/e2e/v2-quality.spec.mjs');
const weeklySpec = read('tests/e2e/m4-weekly.spec.mjs');
const visualSpec = read('tests/e2e/visual.spec.mjs');
const buildInfo = JSON.parse(read('build-info.json'));

assert.equal(buildInfo.stabilityRelease, 'sr1');
assert.equal(buildInfo.uiRelease, 'f1');
assert.equal(buildInfo.engagementRelease, 'm4f1');
assert.equal(buildInfo.timelineRelease, 'm4t1');
assert.equal(buildInfo.weeklyRelease, 'm4w1');
assert(index.includes('music-vibe-stability-release" content="sr1"'));
assert(index.includes('data-stability-release="sr1"'));
assert(index.includes('data-timeline-release="m4t1"'));
assert(index.includes('data-weekly-release="m4w1"'));
assert(index.includes('v2-app.css?weekly=m4w1'));
assert(cssEntry.includes('v2-stabilization.css?stability=sr1'));
assert(cssEntry.includes('v2-stabilization-a11y.css?stability=sr1'));
assert(cssEntry.includes('v2-m4.css?engagement=m4f1'));
assert(cssEntry.includes('v2-m4-timeline.css?timeline=m4t1'));
assert(cssEntry.includes('v2-m4-weekly.css?weekly=m4w1'));

for (const token of [
  'body[data-route="home"] .editorial-nav.site-nav',
  'body[data-route="discover"] .editorial-nav.site-nav',
  'env(safe-area-inset-bottom)',
  '.profile-hero__radar.quality-glyph-shell',
  '.editorial-hero h1 br',
  'word-break: keep-all',
  '--muted: #b5b0a7',
  'font-size: 15px'
]) assert(css.includes(token), `stability stylesheet is missing: ${token}`);
assert(!css.includes('Pretendard'));
assert(!css.includes('SUIT'));
assert(a11yCss.includes('.editorial-button--ink'));
assert(a11yCss.includes('color: var(--ink) !important'));
assert(a11yCss.includes('.editorial-section--together'));
for (const route of ['profile', 'now', 'match']) {
  assert(a11yCss.includes(`body[data-route="${route}"] .site-header`));
  assert(a11yCss.includes(`body[data-route="${route}"] .editorial-nav.site-nav`));
}
assert(weeklyCss.includes('body[data-route="weekly"] .site-header'));
assert(weeklyCss.includes('body[data-route="weekly"] .editorial-nav.site-nav'));
assert(a11yCss.includes('.now-hero .text-button'));
assert(a11yCss.includes('.sr-only'));
assert(helpers.includes('role="group" aria-label='));
assert(!helpers.includes('track-card__score" aria-label='));
assert(nowScreen.includes('now-hero__symbol" aria-hidden="true"'));
assert(profileScreen.includes('aria-current="true"'));
assert(weeklyScreen.includes('role="progressbar"'));
assert(timelineCss.includes('@media (max-width: 680px)'));
assert(timelineCss.includes('.timeline-entry__restore'));
assert(weeklyCss.includes('@media (max-width: 680px)'));
assert(weeklyCss.includes('.weekly-hero'));

assert(!qualitySpec.includes("disableRules(['color-contrast'])"));
for (const route of ['home', 'discover', 'profile', 'today listen', 'listen together']) {
  assert(qualitySpec.includes(`'${route}'`), `accessibility gate is missing ${route}`);
}
assert(weeklySpec.includes('Weekly Vibe passes accessibility including color contrast'));
assert(weeklySpec.includes('mobile Weekly Vibe navigation stays in document flow'));
assert(qualitySpec.includes('mobile navigation is hidden during discovery and stays above all product content'));
assert(qualitySpec.includes('expectStaticNavigationBefore'));
assert(qualitySpec.includes("expect(contract.overflowWrap).toBe('normal')"));
assert(qualitySpec.includes("await expect(nav).toHaveCSS('position', 'static')"));

const snapshotNames = [
  'chromium-home.png', 'chromium-discover.png', 'chromium-profile.png', 'chromium-weekly.png', 'chromium-now.png', 'chromium-match.png',
  'mobile-chromium-home.png', 'mobile-chromium-discover.png', 'mobile-chromium-profile.png', 'mobile-chromium-weekly.png', 'mobile-chromium-now.png', 'mobile-chromium-match.png'
];
for (const screen of ['home.png', 'discover.png', 'profile.png', 'weekly.png', 'now.png', 'match.png']) {
  assert(visualSpec.includes(screen), `visual regression is missing ${screen}`);
}
assert(visualSpec.includes("const baselineMarker = path.join(snapshotDir, '.ready')"));
assert(visualSpec.includes("path.join(snapshotDir, '.refresh')"));
assert(visualSpec.includes("scale: 'css'"));
assert(visualSpec.includes('window.scrollTo(0, 0)'));

const refreshing = exists('tests/e2e/snapshots/.refresh');
if (!refreshing) {
  assert(/M4W1 visual baselines approved by Browser Quality/.test(read('tests/e2e/snapshots/.ready').trim()));
  for (const snapshot of snapshotNames) {
    const relative = `tests/e2e/snapshots/${snapshot}`;
    assert(exists(relative), `approved visual baseline is missing: ${snapshot}`);
    assert(fs.statSync(path.join(root, relative)).size > 20_000, `visual baseline is unexpectedly small: ${snapshot}`);
  }
} else {
  for (const snapshot of snapshotNames.filter((name) => !name.includes('weekly'))) {
    const relative = `tests/e2e/snapshots/${snapshot}`;
    assert(exists(relative), `existing visual baseline is missing during refresh: ${snapshot}`);
  }
}

console.log('F1 stabilization with M4 feedback, timeline, and Weekly Vibe checks passed.');
