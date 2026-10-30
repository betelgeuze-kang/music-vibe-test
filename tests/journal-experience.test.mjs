import assert from 'node:assert/strict';
import { AXIS_IDS } from '../src/v2/data/axes.mjs';
import { ARCHETYPES } from '../src/v2/data/archetypes.mjs';
import { profileFromArchetype } from '../src/v2/domain/profile.mjs';
import { buildWeeklyVibe, weeklyAlias } from '../src/v2/domain/weekly.mjs';
import { compareProfiles } from '../src/v2/domain/match.mjs';
import { TRACK_BY_ID } from '../src/v2/domain/recommendation.mjs';
import { buildWeeklyCardSvg } from '../src/v2/infrastructure/weekly-card.mjs';
import { listenerCard } from '../src/v2/ui/components/listener-card.mjs';
import { parseWeeklyAnchor } from '../src/v2/ui/helpers.mjs';

assert.equal(parseWeeklyAnchor('2028-02-29'), '2028-02-29T00:00:00.000Z');
for (const key of ['', '2026-02-29', '2026-04-31', '2026-10-30T00:00:00Z', 'constructor', '<script>', '2026-13-01']) assert.equal(parseWeeklyAnchor(key), null);

const anchor = '2026-10-30T12:00:00.000Z';
const track = Object.values(TRACK_BY_ID).find(item => item.platforms?.youtube);
for (const archetype of ARCHETYPES) for (const language of ['kr', 'en']) {
  const profile = profileFromArchetype(archetype.id);
  const vibe = buildWeeklyVibe({ profile, anchor, trackById: TRACK_BY_ID, interactions: [
    { type: 'context_select', contextId: 'night', createdAt: anchor },
    { type: 'track_click', contextId: 'night', trackId: track.id, createdAt: anchor },
    { type: 'feedback_more', contextId: 'night', trackId: track.id, createdAt: anchor }
  ] });
  const svg = buildWeeklyCardSvg(vibe, TRACK_BY_ID, language);
  assert(svg.includes('width="1200" height="1500"') && svg.includes('#f5f1e8'));
  assert(svg.includes(track.title));
  assert(svg.replace(/<[^>]+>/g, '').replace(/\s/g, '').includes(weeklyAlias(vibe, language).replace(/\s/g, '')), 'wrapped titles must keep every word');
  assert(!svg.includes(profile.id) && !svg.includes('compare=') && !svg.includes('<image '), 'public exports must contain neither IDs, invitation tokens nor remote images');
  const card = listenerCard(profile, language === 'kr' ? '내 취향' : 'Your taste', language);
  assert(!card.includes(profile.id), 'a visible listener card does not need a profile identifier');
}

const left = profileFromArchetype('midnight-dreamer');
const right = profileFromArchetype('golden-chorus');
const before = structuredClone(right);
const result = compareProfiles(left, right);
assert.equal(result.bridgeTracks.length, 5);
for (const candidate of result.bridgeTracks) assert.deepEqual(candidate.exactPlatforms, Object.keys(candidate.track.platforms || {}), 'direct/search labels must reflect each actual destination');
assert.deepEqual(right, before, 'rendering and recommending must not edit the invited taste');
assert(AXIS_IDS.every(key => Number.isFinite(result.midpoint[key])));
console.log('JN1: calendar anchors, bilingual cards for eight types, identifier privacy and shared destination labels PASS');
