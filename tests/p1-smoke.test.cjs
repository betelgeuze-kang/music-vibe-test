const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const root = path.resolve(__dirname, '..');
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');

const index = read('index.html');
const quickSource = read('quick-questions.js');
const playlistSource = read('playlists.js');
const experience = read('p1-experience.js');
const sitemap = read('sitemap.xml');
const layout = read('_layouts/result.html');
const staticData = JSON.parse(read('_data/results.json'));

const quickContext = {};
vm.createContext(quickContext);
vm.runInContext(`${quickSource}\nglobalThis.__quick = QUICK_QUESTIONS;`, quickContext);
const quick = JSON.parse(JSON.stringify(quickContext.__quick));

assert.equal(quick.length, 12, 'quick test must contain exactly 12 questions');
assert(quick.slice(0, 4).every((question) => question.kind === 'audio'), 'first four questions must be audio A/B');
assert(quick.slice(4).every((question) => question.kind === 'choice'), 'remaining questions must be choice questions');
assert(quick.every((question) => question.options.length === 2), 'every quick question must be A/B');
assert(quick.every((question) => question.options.every((option) => option.score > 0)), 'quick questions must avoid neutral ties');

const axisCounts = quick.reduce((counts, question) => {
  counts[question.axis] = (counts[question.axis] || 0) + 1;
  return counts;
}, {});
assert.deepEqual(axisCounts, { EI: 3, SN: 3, TF: 3, JP: 3 }, 'each scoring axis must have three questions');

const playlistContext = {};
vm.createContext(playlistContext);
vm.runInContext(`${playlistSource}\nglobalThis.__playlists = RESULT_PLAYLISTS;`, playlistContext);
const playlists = JSON.parse(JSON.stringify(playlistContext.__playlists));
const resultTypes = ['ISTJ','ISFJ','INFJ','INTJ','ISTP','ISFP','INFP','INTP','ESTP','ESFP','ENFP','ENTP','ESTJ','ESFJ','ENFJ','ENTJ'];

assert.deepEqual(Object.keys(playlists).sort(), resultTypes.slice().sort(), 'all 16 result types need playlists');
assert(Object.values(playlists).every((tracks) => tracks.length === 4), 'each result must contain four recommendations');

assert(index.includes('<script src="quick-questions.js"></script>'), 'quick questions must load');
assert(index.includes('<script src="playlists.js"></script>'), 'playlist data must load');
assert(index.includes('<script src="p1-experience.js"></script>'), 'P1 runtime must load');
assert(index.indexOf('quick-questions.js') < index.indexOf('logic.js'), 'quick data must load before app logic');
assert(index.indexOf('p1-experience.js') > index.indexOf('p0-fixes.js'), 'P1 overrides must load after P0');
assert(index.includes('12 questions'), 'landing metadata must communicate the short test');

assert(experience.includes("test_mode: 'quick_12'"), 'quick-test analytics mode must be explicit');
assert(experience.includes('finalizeQuickResult'), 'last answer must finalize directly');
assert(!experience.includes("renderScreen('loading')"), 'P1 flow must not show the legacy loading screen');
assert(!experience.includes('2500'), 'P1 flow must not retain the legacy 2.5 second wait');
assert(experience.includes('/results/${safeType}/'), 'shared results must use static result routes');
assert(experience.includes('result-share-panel'), 'share controls must be placed near the result summary');
assert(experience.includes('result-playlist'), 'result view must include a playlist');

assert(layout.includes('property="og:image"'), 'static layout must emit OG images');
assert(layout.includes('copy.tracks'), 'static layout must render recommendation tracks');
assert(layout.includes('ref={{ page.type }}'), 'static layout must preserve friend referral context');

for (const type of resultTypes) {
  const slug = type.toLowerCase();
  const ogPath = path.join(root, 'assets', 'og', `${slug}.svg`);
  assert(fs.existsSync(ogPath), `missing OG card for ${type}`);
  const svg = fs.readFileSync(ogPath, 'utf8');
  assert(svg.includes('width="1200"') && svg.includes('height="630"'), `OG card dimensions invalid for ${type}`);

  assert(staticData[type], `static result data missing for ${type}`);
  assert.equal(staticData[type].og_image, `/assets/og/${slug}.svg`, `static OG mapping missing for ${type}`);
  assert.equal(staticData[type].ko.tracks.length, 4, `Korean static playlist mismatch for ${type}`);
  assert.equal(staticData[type].en.tracks.length, 4, `English static playlist mismatch for ${type}`);

  for (const language of ['ko', 'en']) {
    const pagePath = path.join(root, language, 'results', slug, 'index.md');
    assert(fs.existsSync(pagePath), `missing ${language} source page for ${type}`);
    const page = fs.readFileSync(pagePath, 'utf8');
    assert(page.includes(`lang: ${language}`), `language front matter mismatch for ${language}/${type}`);
    assert(page.includes(`type: ${type}`), `type front matter mismatch for ${language}/${type}`);
    assert(page.includes(`permalink: /${language}/results/${slug}/`), `permalink mismatch for ${language}/${type}`);
  }
}

const sitemapUrlCount = (sitemap.match(/<url>/g) || []).length;
assert.equal(sitemapUrlCount, 33, 'sitemap must include root plus 32 static result pages');

new Function(experience);
console.log('P1 smoke checks passed.');
