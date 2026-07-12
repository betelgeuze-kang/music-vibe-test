import { AXES } from '../data/axes.mjs';
import { getProfileArchetype, localize } from './profile.mjs';

export const TIMELINE_DISPLAY_STEP = 10;
export const TIMELINE_MIN_VISIBLE_DELTA = 5;
export const TIMELINE_VISIBLE_LIMIT = 5;

function timestamp(value) {
  const time = new Date(value || 0).getTime();
  return Number.isFinite(time) ? time : 0;
}

function validSnapshot(profile) {
  return Boolean(profile?.id && profile?.scores && typeof profile.createdAt === 'string');
}

export function profileSnapshotKey(profile) {
  if (!validSnapshot(profile)) return '';
  return `${profile.id}::${profile.createdAt}`;
}

export function sortProfileSnapshots(profiles = []) {
  const seen = new Set();
  return [...profiles]
    .filter(validSnapshot)
    .sort((left, right) => timestamp(right.createdAt) - timestamp(left.createdAt) || profileSnapshotKey(left).localeCompare(profileSnapshotKey(right)))
    .filter((profile) => {
      const key = profileSnapshotKey(profile);
      if (!key || seen.has(key)) return false;
      seen.add(key);
      return true;
    });
}

export function formatProfileDate(profileOrDate, language = 'kr') {
  const value = typeof profileOrDate === 'string' ? profileOrDate : profileOrDate?.createdAt;
  const date = new Date(value || 0);
  if (!Number.isFinite(date.getTime())) return language === 'kr' ? '날짜 없음' : 'Date unavailable';
  const year = date.getUTCFullYear();
  const month = date.getUTCMonth();
  const day = date.getUTCDate();
  if (language === 'kr') return `${year}년 ${month + 1}월 ${day}일`;
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${months[month]} ${day}, ${year}`;
}

export function roundedTimelineDelta(rawDelta) {
  const value = Number(rawDelta) || 0;
  if (Math.abs(value) < TIMELINE_MIN_VISIBLE_DELTA) return 0;
  const magnitude = Math.max(TIMELINE_DISPLAY_STEP, Math.round(Math.abs(value) / TIMELINE_DISPLAY_STEP) * TIMELINE_DISPLAY_STEP);
  return value < 0 ? -magnitude : magnitude;
}

export function compareProfileSnapshots(current, reference, language = 'kr') {
  if (!current?.scores || !reference?.scores) {
    return Object.freeze({
      current,
      reference,
      archetypeChanged: false,
      changes: Object.freeze([]),
      visibleChanges: Object.freeze([]),
      summary: language === 'kr' ? '비교할 이전 기록이 아직 없어요.' : 'There is no earlier note to compare yet.'
    });
  }

  const changes = AXES.map((axis) => {
    const rawDelta = Number(current.scores[axis.id] || 0) - Number(reference.scores[axis.id] || 0);
    const displayDelta = roundedTimelineDelta(rawDelta);
    const direction = rawDelta >= 0 ? localize(axis.high, language) : localize(axis.low, language);
    return Object.freeze({
      axisId: axis.id,
      label: localize(axis.label, language),
      direction,
      rawDelta,
      displayDelta,
      magnitude: Math.abs(displayDelta),
      changed: displayDelta !== 0
    });
  }).sort((left, right) => Math.abs(right.rawDelta) - Math.abs(left.rawDelta) || left.axisId.localeCompare(right.axisId));

  const visibleChanges = changes.filter((item) => item.changed).slice(0, 2);
  const currentArchetype = getProfileArchetype(current);
  const referenceArchetype = getProfileArchetype(reference);
  const archetypeChanged = currentArchetype.id !== referenceArchetype.id;

  let summary;
  if (!visibleChanges.length) {
    summary = language === 'kr'
      ? '두 기록의 여섯 방향이 거의 같아요. 작은 차이는 과장하지 않고 그대로 두었습니다.'
      : 'The six directions are nearly the same. Small differences are intentionally left unamplified.';
  } else if (language === 'kr') {
    const movement = visibleChanges.map((item) => `${item.direction} 쪽으로 ${item.magnitude}`).join(', ');
    summary = archetypeChanged
      ? `${localize(referenceArchetype.name, 'kr')}에서 ${localize(currentArchetype.name, 'kr')} 쪽으로 장면이 달라졌어요. 이번 선택에서는 ${movement} 더 가까워졌습니다.`
      : `결과 이름은 같지만 이번 선택에서는 ${movement} 더 가까워졌어요.`;
  } else {
    const movement = visibleChanges.map((item) => `${item.magnitude} toward ${item.direction.toLowerCase()}`).join(' and ');
    summary = archetypeChanged
      ? `The scene moved from ${localize(referenceArchetype.name, 'en')} toward ${localize(currentArchetype.name, 'en')}. This set of choices moved ${movement}.`
      : `The result name stayed the same, while this set of choices moved ${movement}.`;
  }

  return Object.freeze({
    current,
    reference,
    archetypeChanged,
    currentArchetype,
    referenceArchetype,
    changes: Object.freeze(changes),
    visibleChanges: Object.freeze(visibleChanges),
    summary
  });
}

export function findReferenceSnapshot(activeProfile, history = []) {
  if (!activeProfile) return null;
  const activeKey = profileSnapshotKey(activeProfile);
  const activeTime = timestamp(activeProfile.createdAt);
  const candidates = sortProfileSnapshots(history).filter((profile) => profileSnapshotKey(profile) !== activeKey);
  if (!candidates.length) return null;

  const older = candidates
    .filter((profile) => timestamp(profile.createdAt) < activeTime)
    .sort((left, right) => timestamp(right.createdAt) - timestamp(left.createdAt))[0];
  if (older) return older;

  return candidates
    .filter((profile) => timestamp(profile.createdAt) > activeTime)
    .sort((left, right) => timestamp(left.createdAt) - timestamp(right.createdAt))[0]
    || candidates[0];
}

export function mergeActiveSnapshot(activeProfile, history = []) {
  return sortProfileSnapshots(activeProfile ? [activeProfile, ...history] : history);
}
