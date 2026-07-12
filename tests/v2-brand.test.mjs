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
const audioActions = read('src/v2/ui/commercial-audio-actions.mjs');
const timelineActions = read('src/v2/ui/timeline-actions.mjs');
const weeklyActions = read('src/v2/ui/weekly-actions.mjs');
const shell = read('src/v2/ui/components/shell.mjs');
const css = read('v2-editorial.css');
const humanCss = read('v2-human-editorial.css');
const commercialCss = read('v2-commercial-readiness.css');
const cssEntry = read('v2-app.css');
const buildInfo = JSON.parse(read('build-info.json'));
const koreanCopy = JSON.stringify(BRAND_COPY.kr);

assert.equal(buildInfo.brandRelease, 'bd1');
assert.equal(buildInfo.uiRelease, 'f1');
assert.equal(buildInfo.engagementRelease, 'm4f1');
assert.equal(buildInfo.timelineRelease, 'm4t1');
assert.equal(buildInfo.weeklyRelease, 'm4w1');
assert.equal(buildInfo.frontendQualityRelease, 'fq1');
assert.equal(buildInfo.humanEditorialRelease, 'he1');
assert.equal(buildInfo.commercialReadinessRelease, 'cr1');
assert(index.includes('data-commercial-readiness-release="cr1"'));
assert(index.includes('v2-app.css?commercial=cr1'));
assert(cssEntry.includes('v2-editorial.css?brand=bd1'));
assert(cssEntry.includes('v2-human-editorial.css?home=he1'));
assert(cssEntry.includes('v2-commercial-readiness.css?commercial=cr1'));
assert(!index.includes('src/v2/brand/install.mjs'));
assert(!index.includes('src/v2/brand/interaction.mjs'));

for (const banned of ['MUSIC IDENTITY, NOT ANOTHER MBTI', 'Vibe Profile', 'Bridge Playlist', '왜 이 Vibe인가요?']) {
  assert(!koreanCopy.includes(banned), `Korean brand copy must avoid planning-language phrase: ${banned}`);
}
assert.equal(BRAND_COPY.kr.homeTitle, '설명하기 어려운 노래도,\n마음은 먼저 알아봐요.');
assert.equal(BRAND_COPY.kr.beginProfile, '첫 소리부터 들어보기');
assert.equal(BRAND_COPY.kr.boothContinue, '이 소리를 따라가볼게요');
assert.equal(BRAND_COPY.kr.togetherEaseLabel, '함께 편안한 정도');
assert.equal(BRAND_COPY.kr.togetherDiscoveryLabel, '새 곡을 건넬 여지');

for (const required of ['listening-booth', 'editorial-spread', 'editorial-section--today', 'editorial-section--together', 'editorial-privacy', 'home-weekly-band', 'human-editorial-home', 'human-match__bridge']) {
  assert(home.includes(required), `canonical editorial home is missing: ${required}`);
}
for (const removed of ['orbit--outer', 'product-grid', 'dimension-preview__bars', 'floating-label', 'sample-match__scores']) {
  assert(!home.includes(removed), `AI-template home structure must not return: ${removed}`);
}
assert(home.includes('HOME_SHOWCASE'));
assert(actions.includes("entry_point: 'home_listening_booth'"));
assert(actions.includes('this.quizIndex = 1'));
assert(actions.includes("action === 'track-feedback'"));
assert(audioActions.includes('createOriginalAudioUrl'));
assert(audioActions.includes('rights_release: \'cr1\''));
assert(timelineActions.includes('showConfirmDialog'));
assert(!timelineActions.includes('window.confirm'));
assert(weeklyActions.includes('share-weekly-card'));
assert(shell.includes('/privacy/') && shell.includes('/audio-credits/') && shell.includes('/about/'));

for (const token of ['--paper: #f1ede4', '--signal: #ff5a45', '.editorial-track', '.sample-sleeve', '.listening-booth']) assert(css.includes(token));
for (const token of ['.human-hero', '.human-hero__whisper', '.human-match', '.human-match__meter', 'body[data-route="home"] .site-header']) assert(humanCss.includes(token));
for (const token of ['.commercial-footer__links', '.app-dialog__legal-links', '.ad-slot', '[data-ads-enabled="false"]']) assert(commercialCss.includes(token));
assert(!css.includes('.hero__glow'));
assert(!css.includes('.product-card::before'));

console.log('V2 brand and CR1 commercial transparency layering checks passed.');
