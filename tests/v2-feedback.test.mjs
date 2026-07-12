import assert from 'node:assert/strict';
import {
  FEEDBACK_ADJUSTMENT_LIMIT,
  feedbackAdjustmentForTrack,
  feedbackCount,
  toggleFeedbackValue
} from '../src/v2/domain/feedback.mjs';
import { compareProfiles } from '../src/v2/domain/match.mjs';
import { profileFromArchetype } from '../src/v2/domain/profile.mjs';
import { recommendTracks } from '../src/v2/domain/recommendation.mjs';
import {
  loadInteractions,
  loadTrackFeedback,
  recordInteraction,
  setTrackFeedback
} from '../src/v2/infrastructure/storage.mjs';

class MemoryStorage {
  constructor() { this.values = new Map(); }
  getItem(key) { return this.values.has(key) ? this.values.get(key) : null; }
  setItem(key, value) { this.values.set(key, String(value)); }
  removeItem(key) { this.values.delete(key); }
  clear() { this.values.clear(); }
}

globalThis.window = { localStorage: new MemoryStorage() };

assert.equal(toggleFeedbackValue(null, 'more'), 'more');
assert.equal(toggleFeedbackValue('more', 'more'), null);
assert.equal(toggleFeedbackValue('more', 'less'), 'less');
assert.equal(toggleFeedbackValue('less', 'less'), null);

const midnight = profileFromArchetype('midnight-dreamer');
const baseline = recommendTracks(midnight, 'night', { language: 'en', limit: 5 });
assert.deepEqual(baseline.map((item) => item.strategy), ['safe', 'safe', 'safe', 'adjacent', 'explore']);
const target = baseline[0].track;
const targetRecord = {
  [target.id]: {
    trackId: target.id,
    value: 'less',
    artist: target.artist,
    tags: target.tags,
    contexts: target.contexts,
    contextId: 'night',
    placement: 'vibe_now'
  }
};
assert.equal(feedbackAdjustmentForTrack(target, 'night', targetRecord), -FEEDBACK_ADJUSTMENT_LIMIT);

const adjusted = recommendTracks(midnight, 'night', { language: 'en', limit: 5, feedbackRecords: targetRecord });
assert.deepEqual(adjusted.map((item) => item.strategy), ['safe', 'safe', 'safe', 'adjacent', 'explore'], 'feedback must not remove the 3/1/1 exploration budget');
assert.equal(new Set(adjusted.map((item) => item.track.artist)).size, 5, 'feedback must not break artist diversity');
assert.deepEqual(
  recommendTracks(midnight, 'night', { language: 'en', limit: 5, feedbackRecords: targetRecord }).map((item) => item.track.id),
  adjusted.map((item) => item.track.id),
  'identical profiles and feedback must remain deterministic'
);
const adjustedTarget = adjusted.find((item) => item.track.id === target.id);
if (adjustedTarget) {
  assert.equal(adjustedTarget.feedbackAdjustment, -8);
  assert.equal(adjustedTarget.score, Math.max(0, adjustedTarget.baseScore - 8));
}

const stored = setTrackFeedback({
  trackId: target.id,
  value: 'more',
  artist: target.artist,
  tags: target.tags,
  contexts: target.contexts,
  contextId: 'night',
  placement: 'vibe_now',
  profileId: midnight.id,
  updatedAt: '2026-07-12T00:00:00.000Z'
});
assert.equal(stored.saved, true);
assert.equal(loadTrackFeedback()[target.id].value, 'more');
assert.equal(feedbackCount(loadTrackFeedback()), 1);
setTrackFeedback({ trackId: target.id, value: null });
assert.equal(feedbackCount(loadTrackFeedback()), 0, 'clearing feedback must remove the stored record');

recordInteraction({
  type: 'feedback_more',
  value: 'more',
  trackId: target.id,
  artist: target.artist,
  contextId: 'night',
  placement: 'vibe_now',
  profileId: midnight.id,
  createdAt: '2026-07-12T00:00:00.000Z'
});
const interactions = loadInteractions();
assert.equal(interactions.length, 1);
assert.equal(interactions[0].type, 'feedback_more');
assert.equal(interactions[0].trackId, target.id);

const friend = profileFromArchetype('rhythm-connector');
const bridge = compareProfiles(midnight, friend, 'en');
const bridgeTarget = bridge.bridgeTracks[0].track;
const bridgeFeedback = {
  [bridgeTarget.id]: {
    trackId: bridgeTarget.id,
    value: 'less',
    artist: bridgeTarget.artist,
    tags: bridgeTarget.tags,
    contexts: bridgeTarget.contexts,
    contextId: 'together',
    placement: 'bridge_playlist'
  }
};
const adjustedBridge = compareProfiles(midnight, friend, 'en', { feedbackRecords: bridgeFeedback });
assert.equal(adjustedBridge.bridgeTracks.length, 5);
assert.equal(new Set(adjustedBridge.bridgeTracks.map((item) => item.track.artist)).size, 5);
const adjustedBridgeTarget = adjustedBridge.bridgeTracks.find((item) => item.track.id === bridgeTarget.id);
if (adjustedBridgeTarget) assert.equal(adjustedBridgeTarget.feedbackAdjustment, -8);

console.log('M4 bounded feedback and persistence checks passed.');
