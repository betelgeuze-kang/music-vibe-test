import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { BRAND_COPY } from '../src/v2/brand/copy.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');

const index = read('index.html');
const home = read('src/v2/ui/screens/home.mjs');
const actions = read('src/v2/ui/actions.mjs');
const timelineActions = read('src/v2/ui/timeline-actions.mjs');
const weeklyActions = read('src/v2/ui/weekly-actions.mjs');
const css = read('v2-editorial.css');
const cssEntry = read('v2-app.css');
const buildInfo = JSON.parse(read('build-info.json'));
const koreanCopy = JSON.stringify(BRAND_COPY.kr);

assert.equal(buildInfo.brandRelease, 'bd1', 'brand release must remain explicit');
assert.equal(buildInfo.uiRelease, 'f1', 'brand must be served by the canonical UI');
assert.equal(buildInfo.engagementRelease, 'm4f1', 'M4 feedback must layer on the canonical brand UI');
assert.equal(buildInfo.timelineRelease, 'm4t1', 'M4 timeline must layer on the canonical brand UI');
assert.equal(buildInfo.weeklyRelease, 'm4w1', 'M4 Weekly Vibe must layer on the canonical brand UI');
assert(index.includes('data-brand-release="bd1"'));
assert(index.includes('data-ui-release="f1"'));
assert(index.includes('data-engagement-release="m4f1"'));
assert(index.includes('data-timeline-release="m4t1"'));
assert(index.includes('data-weekly-release="m4w1"'));
assert(index.includes('v2-app.css?weekly=m4w1'));
assert(cssEntry.includes('v2-editorial.css?brand=bd1'));
assert(cssEntry.includes('v2-m4-timeline.css?timeline=m4t1'));
assert(cssEntry.includes('v2-m4-weekly.css?weekly=m4w1'));
assert(!index.includes('src/v2/brand/install.mjs'));
assert(!index.includes('src/v2/brand/interaction.mjs'));
assert(!index.includes('brand-pending'));

for (const banned of ['MUSIC IDENTITY, NOT ANOTHER MBTI', 'Vibe Profile', 'Bridge Playlist', '왜 이 Vibe인가요?']) {
  assert(!koreanCopy.includes(banned), `Korean brand copy must avoid planning-language phrase: ${banned}`);
}
assert.equal(BRAND_COPY.kr.homeTitle, '내가 좋아하는 소리엔\n이유가 있어요.');
assert.equal(BRAND_COPY.kr.beginProfile, '첫 번째 소리 듣기');
assert.equal(BRAND_COPY.kr.navProfile, '내 취향');
assert.equal(BRAND_COPY.kr.navNow, '오늘의 선곡');
assert.equal(BRAND_COPY.kr.navMatch, '같이 듣기');

for (const required of ['listening-booth', 'editorial-spread', 'editorial-section--today', 'editorial-section--together', 'editorial-privacy', 'home-weekly-band']) {
  assert(home.includes(required), `canonical editorial home is missing: ${required}`);
}
for (const removed of ['orbit--outer', 'product-grid', 'dimension-preview__bars', 'floating-label']) {
  assert(!home.includes(removed), `AI-template home structure must not return: ${removed}`);
}
assert(home.includes('HOME_SHOWCASE'), 'home must use the fixed editorial showcase');
assert(actions.includes("entry_point: 'home_listening_booth'"), 'home audio choice must seed the real onboarding funnel');
assert(actions.includes('this.quizIndex = 1'), 'home choice must continue at the second question');
assert(actions.includes('this.answers = [{ questionId: question.id, optionId: option.id }]'), 'home choice must become the first real answer');
assert(actions.includes("action === 'choose-option'"));
assert(actions.includes("action === 'select-context'"));
assert(actions.includes("action === 'copy-invite'"));
assert(actions.includes("action === 'track-feedback'"));
assert(timelineActions.includes('restore-profile-snapshot'));
assert(weeklyActions.includes('open-weekly'));
assert(weeklyActions.includes('share-weekly-card'));
assert.equal((actions.match(/handleClick\(event\)/g) || []).length, 1, 'one canonical delegated action handler is required');

for (const token of ['--paper: #f1ede4', '--signal: #ff5a45', '.editorial-track', '.sample-sleeve', '.listening-booth']) {
  assert(css.includes(token), `editorial design token or component is missing: ${token}`);
}
assert(!css.includes('.hero__glow'));
assert(!css.includes('.product-card::before'));
assert(css.includes('border-radius: 8px'));
assert(css.includes('font-family: "IBM Plex Mono"'));

console.log('V2 canonical brand, feedback, timeline, and Weekly Vibe layering checks passed.');
