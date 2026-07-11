import { clamp } from './profile.mjs?v=qg1';

const DIRECTION_VALUE = Object.freeze({ more: 1, less: -1 });
const MAX_ADJUSTMENT = 8;

function sharedCount(left = [], right = []) {
  const set = new Set(left);
  return right.reduce((count, value) => count + (set.has(value) ? 1 : 0), 0);
}

export function feedbackAdjustment(track, feedback = [], contextId = '') {
  if (!track || !Array.isArray(feedback) || !feedback.length) return 0;
  let adjustment = 0;
  for (const record of feedback) {
    const direction = DIRECTION_VALUE[record?.direction] || 0;
    if (!direction) continue;
    if (record.trackId === track.id) adjustment += direction * 8;
    else {
      if (record.artist && record.artist === track.artist) adjustment += direction * 2.5;
      adjustment += direction * Math.min(3, sharedCount(record.tags, track.tags)) * 0.8;
      if (contextId && record.contextId === contextId && track.contexts?.includes(contextId)) adjustment += direction * 1.2;
    }
  }
  return Math.round(clamp(adjustment, -MAX_ADJUSTMENT, MAX_ADJUSTMENT));
}

export function feedbackDirection(trackId, feedback = [], contextId = '', placement = '') {
  return feedback.find((item) => item.trackId === trackId && (!contextId || item.contextId === contextId) && (!placement || item.placement === placement))?.direction
    || feedback.find((item) => item.trackId === trackId)?.direction
    || '';
}

export function feedbackSummary(feedback = []) {
  const summary = { more: 0, less: 0, artists: new Map(), tags: new Map(), contexts: new Map() };
  for (const item of feedback) {
    if (!DIRECTION_VALUE[item?.direction]) continue;
    summary[item.direction] += 1;
    const amount = DIRECTION_VALUE[item.direction];
    if (item.artist) summary.artists.set(item.artist, (summary.artists.get(item.artist) || 0) + amount);
    for (const tag of item.tags || []) summary.tags.set(tag, (summary.tags.get(tag) || 0) + amount);
    if (item.contextId) summary.contexts.set(item.contextId, (summary.contexts.get(item.contextId) || 0) + amount);
  }
  return summary;
}

export function feedbackLabel(direction, language = 'kr') {
  if (language === 'kr') {
    if (direction === 'more') return '더 듣고 싶어요';
    if (direction === 'less') return '덜 듣고 싶어요';
    return '아직 반응 없음';
  }
  if (direction === 'more') return 'More like this';
  if (direction === 'less') return 'Less like this';
  return 'No feedback yet';
}

export const FEEDBACK_ADJUSTMENT_CAP = MAX_ADJUSTMENT;
