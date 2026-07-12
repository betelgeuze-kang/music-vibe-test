import { mergeActiveSnapshot } from '../domain/timeline.mjs?timeline=m4t1';
import {
  clearProfile,
  clearProfileHistory,
  findProfileSnapshot,
  loadProfileHistory,
  recordInteraction,
  restoreProfileSnapshot
} from '../infrastructure/storage.mjs?timeline=m4t1';
import { track } from './helpers.mjs?engagement=m4f1';

const PRODUCT_VERSION = 'v2-m4t1';

function resetProfileDependents(app) {
  app.selectedContextId = '';
  app.recommendations = [];
  app.feedbackChangesSinceRefresh = 0;
  app.matchResult = null;
}

function restoreSnapshot(app, target) {
  const snapshotKey = String(target.dataset.snapshotKey || '');
  const snapshot = findProfileSnapshot(snapshotKey);
  if (!snapshot) {
    app.setNotice(app.language === 'kr' ? '이 기록을 찾지 못했어요.' : 'This listening note could not be found.', 'error');
    return;
  }

  const confirmed = window.confirm(app.language === 'kr'
    ? '이 기록을 현재 취향으로 다시 열까요? 최근 기록은 지워지지 않아요.'
    : 'Restore this note as the current taste? Newer notes will remain in the timeline.');
  if (!confirmed) return;

  const saved = restoreProfileSnapshot(snapshot);
  app.profile = snapshot;
  app.profileHistory = mergeActiveSnapshot(snapshot, loadProfileHistory());
  resetProfileDependents(app);
  recordInteraction({ type: 'profile_restore', value: snapshotKey, profileId: snapshot.id, placement: 'profile_timeline' });
  track('profile_restore', {
    product_version: PRODUCT_VERSION,
    profile_id: snapshot.id,
    snapshot_key: snapshotKey,
    created_at: snapshot.createdAt,
    stored: saved
  });
  app.setNotice(app.language === 'kr' ? '선택한 기록을 현재 취향으로 열었어요.' : 'The selected note is now your current taste.', 'success');
  void app.render();
}

function clearTimeline(app) {
  const history = mergeActiveSnapshot(app.profile, loadProfileHistory());
  if (history.length <= 1) return;
  const confirmed = window.confirm(app.language === 'kr'
    ? '과거 취향 기록을 모두 지울까요? 현재 취향은 그대로 유지됩니다.'
    : 'Clear all earlier taste notes? Your current taste will remain.');
  if (!confirmed) return;

  const saved = clearProfileHistory(app.profile);
  app.profileHistory = mergeActiveSnapshot(app.profile, loadProfileHistory());
  recordInteraction({ type: 'profile_history_clear', value: String(history.length - 1), profileId: app.profile?.id || '', placement: 'profile_timeline' });
  track('profile_history_clear', {
    product_version: PRODUCT_VERSION,
    profile_id: app.profile?.id || '',
    removed_count: Math.max(0, history.length - 1),
    stored: saved
  });
  app.setNotice(app.language === 'kr' ? '과거 기록을 지웠어요. 현재 취향은 유지됩니다.' : 'Earlier notes were cleared. Your current taste remains.', 'success');
  void app.render();
}

function deleteAllProfileData(app) {
  if (!window.confirm(app.copy().resetConfirm)) return;
  clearProfile();
  clearProfileHistory();
  app.profile = null;
  app.profileHistory = [];
  resetProfileDependents(app);
  track('profile_deleted', { product_version: PRODUCT_VERSION, timeline_cleared: true });
  app.setNotice(app.copy().profileCleared, 'success');
  app.navigate('home');
}

export function handleTimelineClick(app, event) {
  const target = event.target?.closest?.('[data-action]');
  const action = target?.dataset?.action;
  if (!['restore-profile-snapshot', 'clear-profile-history', 'clear-profile'].includes(action)) return false;

  event.preventDefault();
  if (action === 'restore-profile-snapshot') restoreSnapshot(app, target);
  else if (action === 'clear-profile-history') clearTimeline(app);
  else deleteAllProfileData(app);
  return true;
}
