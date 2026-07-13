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
const frontendCss = read('v2-frontend-quality.css');
const humanCss = read('v2-human-editorial.css');
const commercialCss = read('v2-commercial-readiness.css');
const cssEntry = read('v2-app.css');
const helpers = read('src/v2/ui/helpers.mjs');
const nowScreen = read('src/v2/ui/screens/now.mjs');
const profileScreen = read('src/v2/ui/screens/profile.mjs');
const weeklyScreen = read('src/v2/ui/screens/weekly.mjs');
const qualitySpec = read('tests/e2e/v2-quality.spec.mjs');
const weeklySpec = read('tests/e2e/m4-weekly.spec.mjs');
const frontendSpec = read('tests/e2e/frontend-quality.spec.mjs');
const commercialSpec = exists('tests/e2e/commercial-readiness.spec.mjs') ? read('tests/e2e/commercial-readiness.spec.mjs') : '';
const visualSpec = read('tests/e2e/visual.spec.mjs');
const buildInfo = JSON.parse(read('build-info.json'));

assert.equal(buildInfo.stabilityRelease, 'sr1');
assert.equal(buildInfo.uiRelease, 'f1');
assert.equal(buildInfo.engagementRelease, 'm4f1');
assert.equal(buildInfo.timelineRelease, 'm4t1');
assert.equal(buildInfo.weeklyRelease, 'm4w1');
assert.equal(buildInfo.frontendQualityRelease, 'fq1');
assert.equal(buildInfo.humanEditorialRelease, 'he1');
assert.equal(buildInfo.commercialReadinessRelease, 'cr1');
assert(index.includes('data-stability-release="sr1"'));
assert(index.includes('data-human-editorial-release="he1"'));
assert(index.includes('data-commercial-readiness-release="cr1"'));
assert(index.includes('v2-app.css?commercial=cr1'));
assert(cssEntry.includes('v2-stabilization.css?stability=sr1'));
assert(cssEntry.includes('v2-stabilization-a11y.css?stability=sr1'));
assert(cssEntry.includes('v2-m4.css?engagement=m4f1'));
assert(cssEntry.includes('v2-m4-timeline.css?timeline=m4t1'));
assert(cssEntry.includes('v2-m4-weekly.css?frontend=fq1'));
assert(cssEntry.includes('v2-frontend-quality.css?frontend=fq1'));
assert(cssEntry.includes('v2-human-editorial.css?home=he1'));
assert(cssEntry.includes('v2-commercial-readiness.css?commercial=cr1'));

for (const token of ['body[data-route="home"] .editorial-nav.site-nav', 'body[data-route="discover"] .editorial-nav.site-nav', 'env(safe-area-inset-bottom)', '.profile-hero__radar.quality-glyph-shell', '.editorial-hero h1 br', 'word-break: keep-all', '--muted: #b5b0a7', 'font-size: 15px']) assert(css.includes(token));
assert(!css.includes('Pretendard'));
assert(!css.includes('SUIT'));
assert(a11yCss.includes('.editorial-button--ink'));
assert(a11yCss.includes('.sr-only'));
for (const route of ['profile', 'now', 'match']) {
  assert(a11yCss.includes(`body[data-route="${route}"] .site-header`));
  assert(a11yCss.includes(`body[data-route="${route}"] .editorial-nav.site-nav`));
}
assert(weeklyCss.includes('body[data-route="weekly"] .site-header'));
assert(helpers.includes('role="group" aria-label='));
assert(nowScreen.includes('now-hero__symbol" aria-hidden="true"'));
assert(profileScreen.includes('aria-current="true"'));
assert(weeklyScreen.includes('role="progressbar"'));
assert(timelineCss.includes('.timeline-entry__restore'));
assert(weeklyCss.includes('.weekly-context-grid.is-count-1'));
assert(frontendCss.includes('Frontend Quality Sweep FQ1'));
assert(frontendCss.includes('min-height: 44px'));
assert(humanCss.includes('Human Editorial Home HE1'));
assert(humanCss.includes('body[data-route="home"] .site-header'));
assert(humanCss.includes('position: static'));
assert(commercialCss.includes('Commercial Readiness CR1'));
assert(commercialCss.includes('[data-ads-enabled="false"] .ad-slot'));
assert(commercialCss.includes('.listening-booth .ad-slot'));
assert(commercialCss.includes('.commercial-footer__links'));

assert(!qualitySpec.includes("disableRules(['color-contrast'])"));
for (const route of ['home', 'discover', 'profile', 'today listen', 'listen together']) assert(qualitySpec.includes(`'${route}'`));
assert(weeklySpec.includes('Weekly Vibe passes accessibility including color contrast'));
for (const phrase of ['privacy dialog has an accessible name', 'destructive actions use the application confirm dialog', 'optional analytics consent is a non-blocking labelled region', 'responsive matrix has no horizontal overflow', 'mobile primary controls meet the 44px hit-target contract', 'HE1 home header never covers section titles and shared-listening copy stays readable']) assert(frontendSpec.includes(phrase));
if (commercialSpec) {
  for (const phrase of ['CR1 serves no advertising code by default', 'original commercial audio renders without MP3 requests', 'CR1 public legal pages pass accessibility']) assert(commercialSpec.includes(phrase));
}

const snapshotNames = [
  'chromium-home.png', 'chromium-discover.png', 'chromium-profile.png', 'chromium-weekly.png', 'chromium-now.png', 'chromium-match.png',
  'mobile-chromium-home.png', 'mobile-chromium-discover.png', 'mobile-chromium-profile.png', 'mobile-chromium-weekly.png', 'mobile-chromium-now.png', 'mobile-chromium-match.png'
];
for (const screen of ['home.png', 'discover.png', 'profile.png', 'weekly.png', 'now.png', 'match.png']) assert(visualSpec.includes(screen));
assert(visualSpec.includes("const baselineMarker = path.join(snapshotDir, '.ready')"));
assert(visualSpec.includes("path.join(snapshotDir, '.refresh')"));
assert(visualSpec.includes("scale: 'css'"));

const refreshing = exists('tests/e2e/snapshots/.refresh');
if (!refreshing) {
  assert(/CR1 visual baselines approved by Browser Quality/.test(read('tests/e2e/snapshots/.ready').trim()));
  for (const snapshot of snapshotNames) {
    const relative = `tests/e2e/snapshots/${snapshot}`;
    assert(exists(relative), `approved visual baseline is missing: ${snapshot}`);
    assert(fs.statSync(path.join(root, relative)).size > 20_000, `visual baseline is unexpectedly small: ${snapshot}`);
  }
}

console.log('CR1 retains SR1/FQ1/HE1 frontend and visual quality contracts.');
