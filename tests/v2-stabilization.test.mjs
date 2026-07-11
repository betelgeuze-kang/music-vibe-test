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
const helpers = read('src/v2/ui/helpers.mjs');
const screens = read('src/v2/ui/screens.mjs');
const qualitySpec = read('tests/e2e/v2-quality.spec.mjs');
const visualSpec = read('tests/e2e/visual.spec.mjs');
const buildInfo = JSON.parse(read('build-info.json'));

assert.equal(buildInfo.stabilityRelease, 'sr1');
assert.deepEqual(buildInfo.stabilityStyles, [
  '/v2-stabilization.css?stability=sr1',
  '/v2-stabilization-a11y.css?stability=sr1'
]);
assert(index.includes('music-vibe-stability-release" content="sr1"'));
assert(index.includes('v2-stabilization.css?stability=sr1'));
assert(index.includes('v2-stabilization-a11y.css?stability=sr1'));
assert(index.includes('data-stability-release="sr1"'));
assert(index.includes('Stability SR1'));

for (const token of [
  'body[data-route="home"] .editorial-nav.site-nav',
  'body[data-route="discover"] .editorial-nav.site-nav',
  'env(safe-area-inset-bottom)',
  '.profile-hero__radar.quality-glyph-shell',
  '.editorial-hero h1 br',
  'word-break: keep-all',
  '--muted: #b5b0a7',
  'font-size: 15px'
]) {
  assert(css.includes(token), `stability stylesheet is missing: ${token}`);
}
assert(!css.includes('Pretendard'), 'stability layer must use an intentional system-font stack');
assert(!css.includes('SUIT'), 'stability layer must not name unloaded fonts');
assert(a11yCss.includes('.editorial-button--ink'));
assert(a11yCss.includes('color: var(--ink) !important'));
assert(a11yCss.includes('.editorial-section--together'));
for (const route of ['profile', 'now', 'match']) {
  assert(a11yCss.includes(`body[data-route="${route}"] .site-header`), `mobile ${route} header must return to document flow`);
  assert(a11yCss.includes(`body[data-route="${route}"] .editorial-nav.site-nav`), `mobile ${route} navigation must be static in the header`);
}
assert(a11yCss.includes('.now-hero .text-button'));
assert(a11yCss.includes('.sr-only'));
assert(helpers.includes('role="group" aria-label='), 'track service links must use a labelled group role');
assert(!helpers.includes('track-card__score" aria-label='), 'generic score containers must not use prohibited aria-label attributes');
assert(screens.includes('now-hero__symbol" aria-hidden="true"'), 'decorative moment symbols must be hidden from assistive technology');

assert(!qualitySpec.includes("disableRules(['color-contrast'])"), 'color contrast must be part of axe');
for (const route of ['home', 'discover', 'profile', 'today listen', 'listen together']) {
  assert(qualitySpec.includes(`'${route}'`), `accessibility gate is missing ${route}`);
}
assert(qualitySpec.includes('mobile navigation is hidden during discovery and stays above all product content'));
assert(qualitySpec.includes('expectStaticNavigationBefore'));
assert(!qualitySpec.includes('expectAboveFixedNavigation'));
assert(qualitySpec.includes("expect(contract.overflowWrap).toBe('normal')"));
assert(qualitySpec.includes("await expect(nav).toHaveCSS('position', 'static')"));

const snapshotNames = [
  'chromium-home.png',
  'chromium-discover.png',
  'chromium-profile.png',
  'chromium-now.png',
  'chromium-match.png',
  'mobile-chromium-home.png',
  'mobile-chromium-discover.png',
  'mobile-chromium-profile.png',
  'mobile-chromium-now.png',
  'mobile-chromium-match.png'
];
for (const screen of ['home.png', 'discover.png', 'profile.png', 'now.png', 'match.png']) {
  assert(visualSpec.includes(screen), `visual regression is missing ${screen}`);
}
assert(visualSpec.includes("const baselineMarker = path.join(snapshotDir, '.ready')"), 'visual baseline marker must remain explicit');
assert(visualSpec.includes("path.join(snapshotDir, '.refresh')"), 'generic intentional visual refresh contract must remain explicit');
assert(visualSpec.includes("path.join(snapshotDir, '.refresh-css-scale')"), 'legacy CSS-scale refresh contract must remain supported');
assert(visualSpec.includes("scale: 'css'"), 'capture and comparison must use the same CSS-pixel scale');
assert(visualSpec.includes('window.scrollTo(0, 0)'), 'visual captures must begin at the real page top');
assert(!exists('tests/e2e/snapshots/.refresh-css-scale'), 'legacy visual refresh marker must be removed');
assert(/visual baselines approved by Browser Quality/.test(read('tests/e2e/snapshots/.ready').trim()), 'visual baseline approval marker must remain valid');
for (const snapshot of snapshotNames) {
  const relative = `tests/e2e/snapshots/${snapshot}`;
  assert(exists(relative), `approved visual baseline is missing: ${snapshot}`);
  assert(fs.statSync(path.join(root, relative)).size > 20_000, `visual baseline is unexpectedly small: ${snapshot}`);
}

console.log('BD1 stabilization checks passed.');
