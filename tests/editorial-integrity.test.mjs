import assert from 'node:assert/strict';
import { ARCHETYPES } from '../src/v2/data/archetypes.mjs';
import { CURATED_TRACK_COUNT, CURATED_TRACK_IDS, EDITORIAL_TRACKS } from '../src/v2/data/editorial-tracks.mjs';
import { HOME_SHOWCASE } from '../src/v2/data/home-showcase.mjs';
import { profileFromArchetype } from '../src/v2/domain/profile.mjs';
import { recommendProfileTracks, recommendTracks } from '../src/v2/domain/recommendation.mjs';
import { compareProfiles } from '../src/v2/domain/match.mjs';
import { matchBand, roundedScore, scoreBand } from '../src/v2/domain/presentation.mjs';

const expectedKoreanNames = [
  '밤의 잔향',
  '네온 주행',
  '따뜻한 레코드',
  '소리 설계자',
  '조용한 장면',
  '함께 타는 리듬',
  '전류를 따라',
  '함께 부르는 후렴'
];

assert.deepEqual(ARCHETYPES.map((item) => item.name.kr), expectedKoreanNames, 'all Korean archetype names must be human-edited listening scenes');
for (const archetype of ARCHETYPES) {
  assert(archetype.tagline.kr.length >= 18, `${archetype.id} needs a useful Korean tagline`);
  assert(archetype.description.kr.length >= 55, `${archetype.id} needs a substantial Korean description`);
  assert(!/(타입|리스너|캐릭터)/.test(archetype.description.kr), `${archetype.id} must avoid personality-test language`);
  assert(!/(드리머|러너|바이닐|아키텍트|시네마틱|커넥터|익스플로러|코러스)/.test(archetype.name.kr), `${archetype.id} must not use a transliterated Korean display name`);
}

assert.equal(CURATED_TRACK_COUNT, 60, 'E1 must contain sixty manually edited tracks');
assert.equal(new Set(CURATED_TRACK_IDS).size, 60, 'curated track IDs must be unique');
const notePairs = new Set();
for (const [id, track] of Object.entries(EDITORIAL_TRACKS)) {
  assert.deepEqual(Object.keys(track.profile), ['energy', 'warmth', 'novelty', 'organic', 'complexity', 'sociality'], `${id} needs all six profile axes`);
  assert(Object.values(track.profile).every((value) => Number.isInteger(value) && value >= 0 && value <= 100), `${id} profile scores must be integers in 0..100`);
  assert(Number.isInteger(track.vocality) && track.vocality >= 0 && track.vocality <= 100, `${id} needs vocality`);
  assert(Number.isInteger(track.danceability) && track.danceability >= 0 && track.danceability <= 100, `${id} needs danceability`);
  assert(Number.isInteger(track.pace) && track.pace >= 0 && track.pace <= 100, `${id} needs pace`);
  assert(track.scenes.length >= 2, `${id} needs at least two listening scenes`);
  assert(track.editorialNote.kr.length >= 55, `${id} needs a Korean liner note`);
  assert(track.editorialNote.en.length >= 80, `${id} needs an English liner note`);
  const pair = `${track.editorialNote.kr}\n${track.editorialNote.en}`;
  assert(!notePairs.has(pair), `${id} liner notes must not be duplicated`);
  notePairs.add(pair);
}

const showcaseGroups = [HOME_SHOWCASE.signature, HOME_SHOWCASE.night, HOME_SHOWCASE.match.bridgeTracks];
const showcaseIds = showcaseGroups.flatMap((group) => group.map((candidate) => candidate.track.id));
assert.equal(showcaseIds.length, 9, 'home showcase must contain exactly nine fixed editorial tracks');
assert.equal(new Set(showcaseIds).size, 9, 'home showcase tracks must be unique');
assert(showcaseIds.every((id) => EDITORIAL_TRACKS[id]), 'every home showcase track must come from the manually edited set');
assert.equal(HOME_SHOWCASE.match.resonanceLabel.kr, matchBand(HOME_SHOWCASE.match.resonance, 'kr'));
assert.equal(HOME_SHOWCASE.match.discoveryLabel.kr, matchBand(HOME_SHOWCASE.match.discovery, 'kr'));

for (const archetype of ARCHETYPES) {
  const profile = profileFromArchetype(archetype.id);
  const signature = recommendProfileTracks(profile, { language: 'kr', limit: 3 });
  assert(signature.filter((candidate) => candidate.editorial).length >= 2, `${archetype.id} signature should prioritize edited tracks`);
  assert(signature.filter((candidate) => candidate.reason.length >= 45).length === 3, `${archetype.id} signature needs substantial explanations`);
  for (const contextId of ['focus', 'lift', 'night', 'reset', 'explore', 'together']) {
    const recommendations = recommendTracks(profile, contextId, { language: 'kr', limit: 5 });
    assert(recommendations.filter((candidate) => candidate.editorial).length >= 3, `${archetype.id}/${contextId} should prioritize edited tracks`);
    assert(recommendations.every((candidate) => candidate.urls.spotify && candidate.urls.youtube && candidate.urls.apple), `${archetype.id}/${contextId} needs all platform destinations`);
  }
}

const left = profileFromArchetype('midnight-dreamer');
const right = profileFromArchetype('rhythm-connector');
const comparison = compareProfiles(left, right, 'kr');
assert(comparison.bridgeTracks.filter((candidate) => candidate.editorial).length >= 3, 'Bridge Playlist should prioritize edited tracks');
assert.equal(comparison.resonanceLabel, matchBand(comparison.resonance, 'kr'));
assert.equal(comparison.discoveryLabel, matchBand(comparison.discovery, 'kr'));

assert.equal(roundedScore(83), 80);
assert.equal(roundedScore(96), 100);
assert.equal(scoreBand(18, 'kr'), '매우 낮은 편');
assert.equal(scoreBand(54, 'kr'), '균형');
assert.equal(scoreBand(88, 'en'), 'Very high');

console.log('Editorial content integrity checks passed.');
