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

assert.equal(buildInfo.humanEditorialRelease, 'he2');
assert.equal(buildInfo.commercialReadinessRelease, 'cr1');
assert.equal(buildInfo.entry, '/src/v2/main.mjs?commercial=cr1&home=he2');
assert.equal(buildInfo.styleEntry, '/v2-app.css?commercial=cr1&home=he2');
assert.equal(buildInfo.canonicalCopy, '/src/v2/brand/copy.mjs?home=he2');
assert.equal(buildInfo.homeScreen, '/src/v2/ui/screens/home.mjs?home=he2');
assert.deepEqual(buildInfo.humanEditorialData, [
  '/src/v2/brand/copy.mjs?home=he2',
  '/src/v2/ui/screens/home.mjs?home=he2',
  '/v2-human-editorial.css?home=he2',
  '/assets/images/listening-room.svg'
]);

assert(index.includes('music-vibe-human-editorial-release" content="he2"'));
assert(index.includes('data-human-editorial-release="he2"'));
assert(index.includes('data-commercial-readiness-release="cr1"'));
assert(index.includes('Human Editorial HE2'));
assert(index.includes('v2-app.css?commercial=cr1&home=he2'));
assert(index.includes('src/v2/main.mjs?commercial=cr1&home=he2'));
assert(main.includes('./ui/app.mjs?commercial=cr1'));
assert(main.includes('build-info.json?commercial=cr1'));
assert(app.includes('../brand/copy.mjs?home=he2'));
assert(app.includes('./screens/home.mjs?home=he2'));
assert(app.includes("HUMAN_EDITORIAL_RELEASE = 'he2'"));

for (const phrase of [
  '좋아하는 소리에서',
  '나다운 음악으로',
  '내 취향을 닮은',
  '지금 이 장면에',
  '너의 취향과 나의 취향',
  '둘 사이에 남는 소리',
  '내 기록은 가까이에'
]) assert(copy.includes(phrase), `human editorial copy is missing: ${phrase}`);

for (const token of ['human-editorial-home', 'human-hero__whisper', 'human-match__person', 'human-match__bridge', 'human-match__meter', 'human-together__tracks']) {
  assert(home.includes(token), `human editorial home structure is missing: ${token}`);
}
assert(!home.includes('sample-match__scores'));
assert(!home.includes('resonanceLabel'));
assert(cssEntry.includes('v2-human-editorial.css?home=he2'));
assert(cssEntry.includes('layer(human-editorial)'));
assert(cssEntry.includes('layer(commercial-readiness)'));
assert(humanCss.includes('body[data-route="home"] .site-header'));
assert(humanCss.includes('position: static'));
assert(humanCss.includes('grid-template-columns: minmax(0,.8fr) minmax(350px,1.4fr) minmax(0,.8fr)'));
assert(humanCss.includes('@media (max-width: 1179px)'));
assert(humanCss.includes('@media (max-width: 920px)'));
assert(humanCss.includes('@media (max-width: 680px)'));
assert(humanCss.includes('word-break: keep-all'));
assert(humanCss.includes('overflow-x: clip'));
assert(!humanCss.includes('grid-template-columns: 1fr 220px 1fr'));

console.log('HE2 home remains intact under CR1 commercial readiness.');
