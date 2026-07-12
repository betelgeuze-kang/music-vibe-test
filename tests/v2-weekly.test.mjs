import assert from 'node:assert/strict';
import { AXIS_IDS } from '../src/v2/data/axes.mjs';
import { profileFromArchetype } from '../src/v2/domain/profile.mjs';
import { TRACK_BY_ID } from '../src/v2/domain/recommendation.mjs';
import {
  WEEKLY_MIN_INTERACTIONS,
  buildWeeklyVibe,
  formatWeeklyRange,
  qualifyingWeeklyInteractions,
  sevenDayReturnStatus,
  weeklyActivityStatus,
  weeklyAlias,
  weeklySnapshotKey
} from '../src/v2/domain/weekly.mjs';
import {
  loadLatestWeeklyVibe,
  loadWeeklyVibes,
  markReturnVisitTracked,
  registerVisit,
  returnVisitAlreadyTracked,
  saveWeeklyVibe
} from '../src/v2/infrastructure/storage.mjs';
import { createWeeklyVibeCardSvg } from '../src/v2/infrastructure/share.mjs';

class MemoryStorage {
  constructor() { this.values = new Map(); }
  getItem(key) { return this.values.has(key) ? this.values.get(key) : null; }
  setItem(key, value) { this.values.set(key, String(value)); }
  removeItem(key) { this.values.delete(key); }
  clear() { this.values.clear(); }
}

globalThis.window = { localStorage: new MemoryStorage(), location: { origin: 'https://my-music-vibe.com' } };
globalThis.navigator = {};

const anchor = new Date('2026-07-12T12:00:00.000Z');
const profile = profileFromArchetype('midnight-dreamer');
const tracks = Object.values(TRACK_BY_ID);
const firstTrack = tracks.find((track) => track.tags.includes('night')) || tracks[0];
const secondTrack = tracks.find((track) => track.id !== firstTrack.id) || tracks[1];
const interactions = [
  { id: 'i1', type: 'context_select', value: 'night', contextId: 'night', createdAt: '2026-07-07T08:00:00.000Z' },
  { id: 'i2', type: 'track_click', trackId: firstTrack.id, contextId: 'night', createdAt: '2026-07-08T08:00:00.000Z' },
  { id: 'i3', type: 'feedback_more', value: 'more', trackId: firstTrack.id, contextId: 'night', createdAt: '2026-07-09T08:00:00.000Z' },
  { id: 'i4', type: 'feedback_less', value: 'less', trackId: secondTrack.id, contextId: 'night', createdAt: '2026-07-10T08:00:00.000Z' },
  { id: 'old', type: 'track_click', trackId: secondTrack.id, contextId: 'focus', createdAt: '2026-07-01T08:00:00.000Z' }
];

assert.equal(WEEKLY_MIN_INTERACTIONS, 3);
assert.equal(qualifyingWeeklyInteractions(interactions, anchor).length, 4, 'interactions outside the rolling seven-day window must be excluded');
assert.equal(weeklyActivityStatus(interactions.slice(0, 2), anchor).ready, false);
assert.equal(weeklyActivityStatus(interactions, anchor).ready, true);

const weekly = buildWeeklyVibe({ profile, interactions, trackById: TRACK_BY_ID, anchor });
const weeklyAgain = buildWeeklyVibe({ profile, interactions, trackById: TRACK_BY_ID, anchor });
assert.deepEqual(weeklyAgain, weekly, 'identical weekly inputs must remain deterministic');
assert.equal(weekly.sufficientData, true);
assert.equal(weekly.interactionCount, 4);
assert.equal(weekly.dominantContextId, 'night');
assert.equal(weekly.topTracks[0].trackId, firstTrack.id);
assert(weekly.topTags.length >= 1);
assert.equal(weeklySnapshotKey(weekly), `${profile.id}::2026-07-12`);
assert(weeklyAlias(weekly, 'kr').length > 0);
assert(formatWeeklyRange(weekly, 'kr').includes('7월'));
assert(AXIS_IDS.every((axisId) => weekly.scores[axisId] >= 0 && weekly.scores[axisId] <= 100));
assert(weekly.changes.length <= 2);

assert.equal(saveWeeklyVibe(weekly), true);
assert.equal(loadWeeklyVibes({ profileId: profile.id }).length, 1);
assert.equal(loadLatestWeeklyVibe(profile.id).weekKey, weekly.weekKey);
assert.equal(saveWeeklyVibe(weeklyAgain), true, 'saving the same profile/week must replace instead of duplicate');
assert.equal(loadWeeklyVibes({ profileId: profile.id }).length, 1);

const svg = await createWeeklyVibeCardSvg(weekly, profile, TRACK_BY_ID, 'kr');
assert(svg.includes('width="1200" height="1500"'));
assert(svg.includes('MY MUSIC VIBE · WEEKLY'));
assert(svg.includes(weeklyAlias(weekly, 'kr')));

window.localStorage.clear();
const firstVisit = registerVisit(new Date('2026-07-01T09:00:00.000Z'));
assert.equal(firstVisit.isNewDay, true);
const sameDay = registerVisit(new Date('2026-07-01T18:00:00.000Z'));
assert.equal(sameDay.isNewDay, false);
const returnVisit = registerVisit(new Date('2026-07-09T09:00:00.000Z'));
assert.equal(returnVisit.isNewDay, true);
assert.equal(returnVisit.daysSincePrevious, 8);
const returnStatus = sevenDayReturnStatus(returnVisit, weekly);
assert.equal(returnStatus.eligible, true);
assert.equal(returnVisitAlreadyTracked(returnStatus.eventKey), false);
assert.equal(markReturnVisitTracked(returnStatus.eventKey, new Date('2026-07-09T09:01:00.000Z')), true);
assert.equal(returnVisitAlreadyTracked(returnStatus.eventKey), true);
const repeatedSameDay = registerVisit(new Date('2026-07-09T10:00:00.000Z'));
assert.equal(sevenDayReturnStatus(repeatedSameDay, weekly).eligible, false, 'same-day reloads must not emit another seven-day return');

console.log('M4 Weekly Vibe, card, storage, and return-loop checks passed.');
