import { mergeActiveSnapshot } from '../domain/timeline.mjs?timeline=m4t1';
import {
  clearProfile,
  clearProfileHistory,
  findProfileSnapshot,
  loadProfileHistory,
  recordInteraction,
  restoreProfileSnapshot
} from '../infrastructure/storage.mjs?timeline=m4t1';
import { showConfirmDialog } from './dialogs.mjs?weekly=m4w1';
import { track } from './helpers.mjs?engagement=m4f1';

const PRODUCT_VERSION = 'v2-m4t1';

function resetProfileDependents(app) {
  app.selectedContextId = '';
  app.recommendations = [];
  app.feedbackChangesSinceRefresh = 0;
  app.matchResult = null;
}

async function restoreSnapshot(app, target) {
  const snapshotKey = String(target.dataset.snapshotKey || '');
  const snapshot = findProfileSnapshot(snapshotKey);
  if (!snapshot) {
    app.setNotice(app.language === 'kr' ? '이 기록을 찾지 못했어요.' : 'This listening note could not be found.', 'error');
    return;
  }

  app.clearNotice?.();
  const confirmed = await showConfirmDialog({
    title: app.language === 'kr' ? '이 기록으로 돌아갈까요?' : 'Restore this listening note?',
    description: app.language === 'kr'
      ? '현재 취향만 이 기록으로 바뀝니다. 최근 기록과 곡 반응은 지워지지 않아요.'
      : 'Only the current taste will change. Newer notes and track feedback will remain.',
    confirmLabel: app.language === 'kr' ? '이 기록으로 돌아가기' : 'Restore this note',
    cancelLabel: app.language === 'kr' ? '취소' : 'Cancel',
    tone: 'primary',
    opener: target
  });
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

async function clearTimeline(app, target) {
  const history = mergeActiveSnapshot(app.profile, loadProfileHistory());
  if (history.length <= 1) return;
  app.clearNotice?.();
  const confirmed = await showConfirmDialog({
    title: app.language === 'kr' ? '과거 취향 기록을 지울까요?' : 'Clear earlier taste notes?',
    description: app.language === 'kr'
      ? '과거 기록만 삭제합니다. 현재 취향과 곡 반응은 그대로 유지돼요.'
      : 'Only earlier notes will be removed. Your current taste and track feedback will remain.',
    confirmLabel: app.language === 'kr' ? '과거 기록 지우기' : 'Clear earlier notes',
    cancelLabel: app.language === 'kr' ? '취소' : 'Cancel',
    tone: 'danger',
    opener: target
  });
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

async function deleteAllProfileData(app, target) {
  app.clearNotice?.();
  const confirmed = await showConfirmDialog({
    title: app.language === 'kr' ? '저장된 취향과 기록을 모두 지울까요?' : 'Delete saved taste notes and history?',
    description: app.language === 'kr'
      ? '현재 취향과 과거 타임라인을 삭제합니다. 이 작업은 되돌릴 수 없어요.'
      : 'This removes the current taste and profile timeline. This action cannot be undone.',
    confirmLabel: app.language === 'kr' ? '모두 삭제하기' : 'Delete everything',
    cancelLabel: app.language === 'kr' ? '취소' : 'Cancel',
    tone: 'danger',
    opener: target
  });
  if (!confirmed) return;

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
  if (action === 'restore-profile-snapshot') void restoreSnapshot(app, target);
  else if (action === 'clear-profile-history') void clearTimeline(app, target);
  else void deleteAllProfileData(app, target);
  return true;
}
