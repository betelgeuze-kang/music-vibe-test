import assert from 'node:assert/strict';
import fs from 'node:fs';
import { execFileSync } from 'node:child_process';
import { LISTENING_GUIDES, guidePath } from '../src/v2/data/listening-guides.mjs';
import { VERIFIED_TRACK_LINKS, trackLinks } from '../src/v2/data/verified-track-links.mjs';
import { ARCHETYPES } from '../src/v2/data/archetypes.mjs';
import { profileFromArchetype } from '../src/v2/domain/profile.mjs';
import { EDITORIAL_CATALOG, recommendTracks } from '../src/v2/domain/recommendation.mjs';
assert.equal(Object.keys(VERIFIED_TRACK_LINKS).length,13);
assert.equal(EDITORIAL_CATALOG.filter((t)=>t.platforms.youtube).length,22);
for (const guide of LISTENING_GUIDES) {
  assert.equal(guide.tracks.length,3);
  for (const c of guide.tracks) {
    assert.equal(c.urls.youtube,VERIFIED_TRACK_LINKS[c.track.id].platforms.youtube);
    assert(!c.urls.youtube.includes('search'));
    for (const lang of ['kr','en']) assert(guide.points[c.track.id][lang].length > 55);
  }
  for (const lang of ['kr','en']) {
    const file = `.${guidePath(guide.id,lang)}index.html`;
    const html = fs.readFileSync(file,'utf8');
    assert(html.includes(`rel="canonical" href="https://my-music-vibe.com${guidePath(guide.id,lang)}"`));
    assert(html.includes('hreflang="ko"') && html.includes('hreflang="en"'));
    assert(html.includes('<script type="application/ld+json">'));
    assert(html.includes('name="referrer" content="no-referrer"'));
    assert(!/<iframe|googlesyndication/.test(html));
    const sitemap=fs.readFileSync('sitemap.xml','utf8');
    assert(sitemap.includes(`https://my-music-vibe.com${guidePath(guide.id,lang)}</loc>`));
  }
}
for (const archetype of ARCHETYPES) for (const lang of ['kr','en']) {
  const result=recommendTracks(profileFromArchetype(archetype.id),'night',{language:lang});
  assert.equal(result.length,5);
  assert.equal(result.filter(c=>c.strategy==='safe').length,3);
  assert(result.every(c=>c.listeningNote && c.tasteNote));
}
assert(trackLinks({id:'unknown',title:'A&B',artist:'C/D'}).youtube.includes('A%26B%20C%2FD'));
execFileSync(process.execPath,['scripts/build-listening-guides.mjs','--check'],{stdio:'inherit'});
console.log('LN1: 13 reviewed links, 22 catalog direct links, bilingual static content, metadata, sitemap, original notes and recommendation explanations PASS');
