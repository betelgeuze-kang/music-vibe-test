import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');

const index = read('index.html');
const buildInfo = JSON.parse(read('build-info.json'));
const copy = read('src/v2/brand/copy.mjs');
const home = read('src/v2/ui/screens/home.mjs');
const cssEntry = read('v2-app.css');
const humanCss = read('v2-human-editorial.css');
const main = read('src/v2/main.mjs');
const app = read('src/v2/ui/app.mjs');

assert.equal(buildInfo.humanEditorialRelease, 'he1');
assert.equal(buildInfo.commercialReadinessRelease, 'cr1');
assert.equal(buildInfo.entry, '/src/v2/main.mjs?commercial=cr1');
assert.equal(buildInfo.styleEntry, '/v2-app.css?commercial=cr1');
assert.equal(buildInfo.canonicalCopy, '/src/v2/brand/copy.mjs?home=he1');
assert.equal(buildInfo.homeScreen, '/src/v2/ui/screens/home.mjs?home=he1');
assert.deepEqual(buildInfo.humanEditorialData, [
  '/src/v2/brand/copy.mjs?home=he1',
  '/src/v2/ui/screens/home.mjs?home=he1',
  '/v2-human-editorial.css?home=he1'
]);

assert(index.includes('music-vibe-human-editorial-release" content="he1"'));
assert(index.includes('data-human-editorial-release="he1"'));
assert(index.includes('data-commercial-readiness-release="cr1"'));
assert(index.includes('Human Editorial HE1'));
assert(index.includes('v2-app.css?commercial=cr1'));
assert(index.includes('src/v2/main.mjs?commercial=cr1'));
assert(main.includes('./ui/app.mjs?commercial=cr1'));
assert(main.includes('build-info.json?commercial=cr1'));
assert(app.includes('../brand/copy.mjs?home=he1'));
assert(app.includes('./screens/home.mjs?home=he1'));
assert(app.includes("HUMAN_EDITORIAL_RELEASE = 'he1'"));

for (const phrase of [
  '설명하기 어려운 노래도',
  '마음은 먼저 알아봐요',
  '귀에 남는 쪽이면 충분해요',
  '오늘의 마음에는, 오늘의 순서가 있어요',
  '취향이 달라도, 같은 순간에 멈추는 곡이 있어요',
  '둘 사이에 남는 소리',
  '이 기록은 당신의 브라우저 안에 머물러요'
]) assert(copy.includes(phrase), `human editorial copy is missing: ${phrase}`);

for (const token of ['human-editorial-home', 'human-hero__whisper', 'human-match__person', 'human-match__bridge', 'human-match__meter', 'human-together__tracks']) {
  assert(home.includes(token), `human editorial home structure is missing: ${token}`);
}
assert(!home.includes('sample-match__scores'));
assert(!home.includes('resonanceLabel'));
assert(cssEntry.includes('v2-human-editorial.css?home=he1'));
assert(cssEntry.includes('layer(human-editorial)'));
assert(cssEntry.includes('layer(commercial-readiness)'));
assert(humanCss.includes('body[data-route="home"] .site-header'));
assert(humanCss.includes('position: static'));
assert(humanCss.includes('grid-template-columns: minmax(0, .82fr) minmax(390px, 1.34fr) minmax(0, .82fr)'));
assert(humanCss.includes('@media (max-width: 1179px)'));
assert(humanCss.includes('@media (max-width: 920px)'));
assert(humanCss.includes('@media (max-width: 680px)'));
assert(humanCss.includes('word-break: keep-all'));
assert(humanCss.includes('overflow-x: clip'));
assert(!humanCss.includes('grid-template-columns: 1fr 220px 1fr'));

console.log('HE1 home remains intact under CR1 commercial readiness.');
