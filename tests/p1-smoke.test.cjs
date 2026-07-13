const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const root = path.resolve(__dirname, '..');
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');

const index = read('index.html');
const quickSource = read('quick-questions.js');
const playlistSource = read('playlists.js');
const sitemap = read('sitemap.xml');
const layout = read('_layouts/result.html');
const staticData = JSON.parse(read('_data/results.json'));
const v2Questions = read('src/v2/data/questions.mjs');

const quickContext = {};
vm.createContext(quickContext);
vm.runInContext(`${quickSource}\nglobalThis.__quick = QUICK_QUESTIONS;`, quickContext);
const quick = JSON.parse(JSON.stringify(quickContext.__quick));
assert.equal(quick.length, 12, 'legacy quick-test rollback data must remain intact');
assert(quick.slice(0, 4).every((question) => question.kind === 'audio'), 'legacy rollback keeps four audio questions');

const playlistContext = {};
vm.createContext(playlistContext);
vm.runInContext(`${playlistSource}\nglobalThis.__playlists = RESULT_PLAYLISTS;`, playlistContext);
const playlists = JSON.parse(JSON.stringify(playlistContext.__playlists));
const resultTypes = ['ISTJ','ISFJ','INFJ','INTJ','ISTP','ISFP','INFP','INTP','ESTP','ESFP','ENFP','ENTP','ESTJ','ESFJ','ENFJ','ENTJ'];
assert.deepEqual(Object.keys(playlists).sort(), resultTypes.slice().sort(), 'all legacy static result types must remain available');
assert(Object.values(playlists).every((tracks) => tracks.length === 4), 'legacy static results retain four recommendations');

assert(!index.includes('<script src="quick-questions.js"></script>'), 'legacy quiz data must no longer load on the V2 home');
assert(!index.includes('<script src="p1-experience.js"></script>'), 'legacy P1 runtime must no longer own the entry point');
assert(index.includes('src/v2/main.mjs'), 'V2 must replace the legacy entry point');
assert(v2Questions.includes("kind: 'audio'"), 'V2 keeps audio-first onboarding');
assert((v2Questions.match(/kind: 'audio'/g) || []).length === 4, 'V2 contains four audio A/B questions');

assert(layout.includes('property="og:image"'), 'legacy static pages must retain OG images');
assert(layout.includes('copy.tracks'), 'legacy static pages must retain recommendation tracks');
assert(layout.includes('src=static_result'), 'legacy static pages must retain referral context');

for (const type of resultTypes) {
  const slug = type.toLowerCase();
  const ogPath = path.join(root, 'assets', 'og', `${slug}.svg`);
  assert(fs.existsSync(ogPath), `missing legacy OG card for ${type}`);
  assert(staticData[type], `static result data missing for ${type}`);
  for (const language of ['ko', 'en']) {
    const pagePath = path.join(root, language, 'results', slug, 'index.md');
    assert(fs.existsSync(pagePath), `missing ${language} static source page for ${type}`);
  }
}

assert.equal((sitemap.match(/<url>/g) || []).length, 36, 'sitemap must preserve root, 32 legacy result pages, and 3 CR1 transparency pages');
for (const required of ['/about/', '/privacy/', '/audio-credits/']) {
  assert(sitemap.includes(`<loc>https://my-music-vibe.com${required}</loc>`), `sitemap is missing CR1 page: ${required}`);
}
console.log('P1 continuity checks passed.');
