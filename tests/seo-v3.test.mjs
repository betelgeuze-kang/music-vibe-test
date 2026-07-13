import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');
const exists = (file) => fs.existsSync(path.join(root, file));

const data = JSON.parse(read('_data/v3_static.json'));
const sitemap = read('sitemap.xml');
const layout = read('_layouts/v3-editorial.html');
const legacyLayout = read('_layouts/result.html');
const styles = read('v3-static.css');
const vibes = Object.keys(data.vibes);
const moments = Object.keys(data.moments);

assert.equal(data.release, 'seo1');
assert.equal(vibes.length, 8);
assert.equal(moments.length, 6);
assert.equal(Object.keys(data.legacy_map).length, 16);
assert.equal((sitemap.match(/<url>/g) || []).length, 67, 'sitemap must contain root, 6 policy pages, 28 V3 pages, and 32 preserved legacy pages');

for (const language of ['ko', 'en']) {
  for (const vibe of vibes) {
    const file = `${language}/vibes/${vibe}/index.md`;
    assert(exists(file), `missing V3 vibe source: ${file}`);
    assert(read(file).includes(`item_id: ${vibe}`));
    assert(sitemap.includes(`https://my-music-vibe.com/${language}/vibes/${vibe}/`));
  }
  for (const moment of moments) {
    const file = `${language}/moments/${moment}/index.md`;
    assert(exists(file), `missing V3 moment source: ${file}`);
    assert(read(file).includes(`item_id: ${moment}`));
    assert(sitemap.includes(`https://my-music-vibe.com/${language}/moments/${moment}/`));
  }
  for (const policy of ['about', 'privacy', 'audio-credits']) {
    assert(exists(`${language === 'ko' ? '' : 'en/'}${policy}/index.html`), `missing ${language} ${policy}`);
  }
}

for (const token of ['rel="canonical"', 'hreflang="ko"', 'hreflang="en"', 'hreflang="x-default"', 'og:image', 'data-page-type="static_editorial"', '열 번의 선택은 이름표가 아니라 연필 자국']) {
  assert(layout.includes(token), `V3 static layout is missing: ${token}`);
}
for (const token of ['data-legacy-result="true"', '이전 버전 결과', '현재 방식으로 열 번 들어보기', 'site.data.v3_static.legacy_map', 'hreflang="x-default"']) {
  assert(legacyLayout.includes(token), `legacy migration layout is missing: ${token}`);
}
assert(!legacyLayout.includes('12-CHOICE RESULT'));
assert(!legacyLayout.includes('60초 테스트'));
assert(styles.includes('@media (max-width:820px)'));
assert(styles.includes('@media (max-width:620px)'));
assert(exists('assets/og/v3/vibe.svg'));
assert(exists('assets/og/v3/moment.svg'));

console.log('SEO1 bilingual vibe, moment, legacy migration, hreflang, OG, and sitemap checks passed.');
