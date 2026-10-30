import assert from 'node:assert/strict';
import { ARCHETYPES } from '../src/v2/data/archetypes.mjs';
import { profileFromArchetype } from '../src/v2/domain/profile.mjs';
import { buildProfileCardSvg, PROFILE_CARD_FORMATS, profileCardFormat, wrapCardText } from '../src/v2/infrastructure/profile-card.mjs';
import { RECORD_THEMES, renderRecordArt } from '../src/v2/brand/record-art.mjs';

for (const archetype of ARCHETYPES) {
  assert(RECORD_THEMES[archetype.id], `${archetype.id} needs an original sleeve`);
  const profile = profileFromArchetype(archetype.id, 'card_test');
  for (const language of ['kr','en']) {
    const text = archetype.tagline[language];
    assert.equal(wrapCardText(text, 29).join('').replace(/\s/g,''), text.replace(/\s/g,''), 'wrapping must not drop the final words');
    for (const [format, {width,height}] of Object.entries(PROFILE_CARD_FORMATS)) {
      const svg = buildProfileCardSvg(profile,language,format,'https://my-music-vibe.com/#/match?compare=fixture');
      assert(svg.includes(`width="${width}" height="${height}"`));
      assert(svg.includes(archetype.name[language]));
      assert(!svg.includes(profile.id), 'anonymous profile IDs must not be printed on public cards');
      assert(!svg.includes('cdn.jsdelivr.net') && !svg.includes('<image '), 'card generation must have no remote image or encoder dependency');
    }
  }
}
assert.equal(profileCardFormat('toString'),'feed');
assert.equal(profileCardFormat('unknown'),'feed');
assert.equal(new Set(ARCHETYPES.map(a=>renderRecordArt(a.id))).size,8);
console.log('RS1 card copy, eight original sleeves, two languages and export dimensions passed.');
