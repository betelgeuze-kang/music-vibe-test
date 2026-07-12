import assert from 'node:assert/strict';
import { createProfile } from '../src/v2/domain/profile.mjs';
import {
  compareProfileSnapshots,
  findReferenceSnapshot,
  formatProfileDate,
  mergeActiveSnapshot,
  profileSnapshotKey,
  roundedTimelineDelta,
  sortProfileSnapshots
} from '../src/v2/domain/timeline.mjs';

const memory = new Map();
global.window = {
  localStorage: {
    getItem(key) { return memory.has(key) ? memory.get(key) : null; },
    setItem(key, value) { memory.set(key, String(value)); },
    removeItem(key) { memory.delete(key); }
  }
};

const {
  clearProfileHistory,
  findProfileSnapshot,
  loadProfile,
  loadProfileHistory,
  restoreProfileSnapshot,
  saveProfile
} = await import('../src/v2/infrastructure/storage.mjs?timeline-test=1');

const first = createProfile({
  scores: { energy: 30, warmth: 45, novelty: 35, organic: 70, complexity: 55, sociality: 20 },
  source: 'timeline_test',
  createdAt: '2026-06-28T12:00:00.000Z'
});
const second = createProfile({
  scores: { energy: 60, warmth: 65, novelty: 55, organic: 60, complexity: 65, sociality: 50 },
  source: 'timeline_test',
  createdAt: '2026-07-12T12:00:00.000Z'
});
const sameResultLater = createProfile({
  scores: first.scores,
  source: 'timeline_test',
  createdAt: '2026-07-05T12:00:00.000Z'
});

assert.equal(first.id, sameResultLater.id, 'identical score shapes keep a stable profile ID');
assert.notEqual(profileSnapshotKey(first), profileSnapshotKey(sameResultLater), 'timeline identity includes the creation timestamp');
assert.equal(formatProfileDate(second, 'kr'), '2026년 7월 12일');
assert.equal(formatProfileDate(second, 'en'), 'Jul 12, 2026');
assert.equal(roundedTimelineDelta(4), 0);
assert.equal(roundedTimelineDelta(5), 10);
assert.equal(roundedTimelineDelta(-14), -10);
assert.equal(roundedTimelineDelta(26), 30);

const sorted = sortProfileSnapshots([first, second, first, sameResultLater]);
assert.deepEqual(sorted.map(profileSnapshotKey), [profileSnapshotKey(second), profileSnapshotKey(sameResultLater), profileSnapshotKey(first)]);
assert.equal(findReferenceSnapshot(second, sorted)?.createdAt, sameResultLater.createdAt, 'latest profile compares with the nearest older note');
assert.equal(findReferenceSnapshot(first, sorted)?.createdAt, sameResultLater.createdAt, 'oldest restored profile compares with the nearest newer note');

const comparison = compareProfileSnapshots(second, sameResultLater, 'kr');
assert.equal(comparison.visibleChanges.length, 2);
assert(comparison.visibleChanges[0].magnitude >= comparison.visibleChanges[1].magnitude);
assert(comparison.summary.includes('이번 선택에서는') || comparison.summary.includes('장면이 달라졌어요'));
const stableComparison = compareProfileSnapshots(first, sameResultLater, 'kr');
assert.equal(stableComparison.visibleChanges.length, 0);
assert(stableComparison.summary.includes('거의 같아요'));

memory.clear();
assert.equal(saveProfile(first), true);
assert.equal(saveProfile(sameResultLater), true);
assert.equal(saveProfile(second), true);
let history = loadProfileHistory();
assert.equal(history.length, 3, 'same profile ID on different dates remains three immutable snapshots');
assert.deepEqual(history.map((profile) => profile.createdAt), [second.createdAt, sameResultLater.createdAt, first.createdAt]);
assert.equal(loadProfile()?.createdAt, second.createdAt);

const restoredKey = profileSnapshotKey(first);
assert.equal(findProfileSnapshot(restoredKey)?.createdAt, first.createdAt);
assert.equal(restoreProfileSnapshot(first), true);
assert.equal(loadProfile()?.createdAt, first.createdAt, 'restoring changes the active profile only');
assert.equal(loadProfileHistory().length, 3, 'restoring does not delete or duplicate timeline entries');

const merged = mergeActiveSnapshot(first, loadProfileHistory());
assert.equal(merged.length, 3);
assert.equal(clearProfileHistory(first), true);
history = loadProfileHistory();
assert.equal(history.length, 1, 'clearing history keeps the current profile as the only note');
assert.equal(profileSnapshotKey(history[0]), restoredKey);

console.log('M4 profile timeline checks passed.');
