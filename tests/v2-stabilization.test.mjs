import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');

const index = read('index.html');
const css = read('v2-stabilization.css');
const a11yCss = read('v2-stabilization-a11y.css');
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
assert(a11yCss.includes('body[data-route="profile"] .editorial-nav.site-nav'));

assert(!qualitySpec.includes("disableRules(['color-contrast'])"), 'color contrast must be part of axe');
for (const route of ['home', 'discover', 'profile', 'today listen', 'listen together']) {
  assert(qualitySpec.includes(`'${route}'`), `accessibility gate is missing ${route}`);
}
assert(qualitySpec.includes('mobile navigation changes mode by route'));
assert(qualitySpec.includes('expectAboveFixedNavigation'));
assert(qualitySpec.includes("expect(contract.overflowWrap).toBe('normal')"));
assert(qualitySpec.includes("getComputedStyle(node).position)).not.toBe('fixed')"));

for (const screen of ['home.png', 'discover.png', 'profile.png', 'now.png', 'match.png']) {
  assert(visualSpec.includes(screen), `visual regression is missing ${screen}`);
}
assert(visualSpec.includes('tests/e2e/snapshots/.ready'), 'visual baseline marker must remain explicit');

console.log('BD1 stabilization checks passed.');
