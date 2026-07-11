import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { BRAND_COPY } from '../src/v2/brand/copy.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');

const index = read('index.html');
const installer = read('src/v2/brand/install.mjs');
const css = read('v2-editorial.css');
const buildInfo = JSON.parse(read('build-info.json'));
const koreanCopy = JSON.stringify(BRAND_COPY.kr);

assert.equal(buildInfo.brandRelease, 'bd1', 'brand release must be explicit');
assert(index.includes('v2-editorial.css?brand=bd1'), 'editorial stylesheet must be release-locked');
assert(index.includes('src/v2/brand/install.mjs?brand=bd1'), 'brand installer must load after the core app');
assert(index.indexOf('src/v2/main.mjs?v=qg1') < index.indexOf('src/v2/brand/install.mjs?brand=bd1'), 'brand layer must stack after the quality core');
assert(index.includes('data-brand-release="bd1"'), 'brand release must be visible in the app shell');
assert(index.includes('class="brand-pending"'), 'initial render must avoid flashing the previous design');

for (const banned of ['MUSIC IDENTITY, NOT ANOTHER MBTI', 'Vibe Profile', 'Bridge Playlist', '왜 이 Vibe인가요?']) {
  assert(!koreanCopy.includes(banned), `Korean brand copy must avoid planning-language phrase: ${banned}`);
}
assert.equal(BRAND_COPY.kr.homeTitle, '내가 좋아하는 소리엔\n이유가 있어요.');
assert.equal(BRAND_COPY.kr.beginProfile, '첫 번째 소리 듣기');
assert.equal(BRAND_COPY.kr.navProfile, '내 취향');
assert.equal(BRAND_COPY.kr.navNow, '오늘의 선곡');
assert.equal(BRAND_COPY.kr.navMatch, '같이 듣기');

for (const required of ['listening-booth', 'editorial-spread', 'editorial-section--today', 'editorial-section--together', 'editorial-privacy']) {
  assert(installer.includes(required), `editorial home is missing: ${required}`);
}
for (const removed of ['orbit--outer', 'product-grid', 'dimension-preview__bars', 'floating-label']) {
  assert(!installer.includes(removed), `AI-template home structure must not return: ${removed}`);
}
assert(installer.includes("entry_point: 'home_listening_booth'"), 'home audio choice must seed the real onboarding funnel');
assert(installer.includes('app.quizIndex = 1'), 'home choice must continue at the second question');
assert(installer.includes('app.answers = [{ questionId: question.id, optionId: option.id }]'), 'home choice must become the first real answer');

for (const token of ['--paper: #f1ede4', '--signal: #ff5a45', '.editorial-track', '.sample-sleeve', '.listening-booth']) {
  assert(css.includes(token), `editorial design token or component is missing: ${token}`);
}
assert(!css.includes('.hero__glow'), 'editorial layer must not recreate neon hero glows');
assert(!css.includes('.product-card::before'), 'editorial layer must not recreate bento-card glow blobs');
assert(css.includes('border-radius: 8px'), 'buttons must use restrained radii');
assert(css.includes('font-family: "IBM Plex Mono"'), 'metadata needs a distinct editorial mono voice');

console.log('V2 brand design checks passed.');
