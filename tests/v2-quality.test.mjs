import assert from 'node:assert/strict';
import { PROFILE_QUESTIONS } from '../src/v2/data/questions.mjs';
import { ARCHETYPES } from '../src/v2/data/archetypes.mjs';
import { TRACKS, CATALOG_STATS } from '../src/v2/data/tracks.mjs';
import { createProfile, decodeProfile, encodeProfile, profileFromArchetype } from '../src/v2/domain/profile.mjs';
import { recommendProfileTracks, recommendTracks } from '../src/v2/domain/recommendation.mjs';
import { compareProfiles } from '../src/v2/domain/match.mjs';
import { buildInviteUrl } from '../src/v2/infrastructure/share.mjs';
import { renderBipolarAxes, renderVibeGlyph } from '../src/v2/quality/visuals.mjs';

assert.equal(PROFILE_QUESTIONS.length, 10);
assert.equal(PROFILE_QUESTIONS.filter((question) => question.kind === 'audio').length, 4);
assert.equal(TRACKS.length, 160, 'quality catalog must contain 160 curated tracks');
assert(CATALOG_STATS.asian / CATALOG_STATS.total >= 0.35, 'Asian catalog coverage must be at least 35%');
assert(CATALOG_STATS.regions.length >= 12, 'catalog must cover at least twelve regions');
assert(CATALOG_STATS.decades.length >= 5, 'catalog must cover at least five decades');
assert(CATALOG_STATS.genres.length >= 50, 'catalog must cover broad genre variety');
assert(TRACKS.filter((track) => Object.keys(track.platforms).length).length >= 8, 'catalog needs verified direct links plus search fallbacks');

for (const archetype of ARCHETYPES) {
  const profile = profileFromArchetype(archetype.id);
  for (const contextId of ['focus', 'lift', 'night', 'reset', 'explore', 'together']) {
    const recommendations = recommendTracks(profile, contextId, { language: 'en', limit: 5 });
    assert.deepEqual(recommendations.map((item) => item.strategy), ['safe', 'safe', 'safe', 'adjacent', 'explore'], `${archetype.id}/${contextId} must preserve the exploration budget`);
    assert.equal(new Set(recommendations.map((item) => item.track.artist)).size, 5, 'artists must be unique');
    assert(new Set(recommendations.map((item) => item.track.region)).size >= 2, 'every list needs regional diversity');
    assert(recommendations.every((item) => item.reason && item.strategyLabel && item.urls.spotify && item.urls.youtube && item.urls.apple));
  }
  assert.deepEqual(recommendProfileTracks(profile, { language: 'en', limit: 3 }).map((item) => item.strategy), ['safe', 'safe', 'adjacent']);
}

const profile = createProfile({ scores: { energy: 18, warmth: 82, novelty: 66, organic: 44, complexity: 72, sociality: 22 } });
const token = encodeProfile(profile);
const decoded = decodeProfile(token);
assert(decoded && decoded.id === profile.id, 'checksummed token must round-trip');
const raw = JSON.parse(new TextDecoder().decode(Uint8Array.from(atob(token.replaceAll('-', '+').replaceAll('_', '/') + '='.repeat((4 - token.length % 4) % 4)), (char) => char.charCodeAt(0))));
raw.s[0] = Math.min(100, raw.s[0] + 1);
const tampered = btoa(JSON.stringify(raw)).replaceAll('+', '-').replaceAll('/', '_').replaceAll('=', '');
assert.equal(decodeProfile(tampered), null, 'checksum must reject tampered scores');

globalThis.window = { location: { origin: 'https://my-music-vibe.com' } };
const invite = buildInviteUrl(profile, 'kr');
assert(invite.includes('#/match?compare='), 'profile token must live in the URL fragment');
assert(!new URL(invite).searchParams.has('compare'), 'profile token must not be sent as a server query parameter');

const glyph = renderVibeGlyph(profile, 'kr', { id: 'test-glyph' });
assert(glyph.includes('role="img"') && glyph.includes('<desc') && glyph.includes('vibe-glyph__shape'), 'glyph must be accessible and visual');
const axes = renderBipolarAxes(profile, 'kr');
assert(axes.includes('전자적') && axes.includes('유기적') && axes.includes('aria-valuenow'), 'axes must display both bipolar endpoints');

const friend = createProfile({ scores: { energy: 82, warmth: 48, novelty: 78, organic: 20, complexity: 58, sociality: 76 } });
const match = compareProfiles(profile, friend, 'en');
assert(match.resonance >= 35 && match.resonance <= 98);
assert(match.discovery >= 38 && match.discovery <= 97);
assert.equal(match.bridgeTracks.length, 5);
assert.equal(new Set(match.bridgeTracks.map((item) => item.track.artist)).size, 5);
assert(match.bridgeTracks.every((item) => Number.isFinite(item.leftFit) && Number.isFinite(item.rightFit) && Number.isFinite(item.sharedFit)));

console.log('V2 quality domain checks passed.');
