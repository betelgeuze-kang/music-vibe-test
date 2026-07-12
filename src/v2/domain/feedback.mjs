import { clamp } from './profile.mjs';

export const FEEDBACK_VALUES = Object.freeze(['more', 'less']);
export const FEEDBACK_ADJUSTMENT_LIMIT = 8;

export function normalizeFeedbackValue(value) {
  return FEEDBACK_VALUES.includes(value) ? value : null;
}

export function toggleFeedbackValue(currentValue, requestedValue) {
  const current = normalizeFeedbackValue(currentValue);
  const requested = normalizeFeedbackValue(requestedValue);
  if (!requested) return current;
  return current === requested ? null : requested;
}

export function normalizeFeedbackRecords(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {};
  return Object.fromEntries(Object.entries(value).flatMap(([trackId, record]) => {
    const feedbackValue = normalizeFeedbackValue(record?.value);
    if (!trackId || !feedbackValue) return [];
    return [[trackId, Object.freeze({
      trackId,
      value: feedbackValue,
      artist: String(record.artist || ''),
      tags: Object.freeze(Array.isArray(record.tags) ? [...new Set(record.tags.map(String).filter(Boolean))] : []),
      contexts: Object.freeze(Array.isArray(record.contexts) ? [...new Set(record.contexts.map(String).filter(Boolean))] : []),
      contextId: String(record.contextId || ''),
      placement: String(record.placement || ''),
      profileId: String(record.profileId || ''),
      updatedAt: String(record.updatedAt || '')
    })]];
  }));
}

function direction(value) {
  return value === 'more' ? 1 : value === 'less' ? -1 : 0;
}

function sharedCount(left = [], right = []) {
  const rightSet = new Set(right);
  return left.filter((item) => rightSet.has(item)).length;
}

export function feedbackAdjustmentForTrack(track, contextId, feedbackRecords = {}) {
  if (!track?.id) return 0;
  const records = Object.values(normalizeFeedbackRecords(feedbackRecords));
  let adjustment = 0;

  for (const record of records) {
    const sign = direction(record.value);
    if (!sign) continue;

    if (record.trackId === track.id) {
      adjustment += FEEDBACK_ADJUSTMENT_LIMIT * sign;
      continue;
    }

    if (record.artist && record.artist === track.artist) adjustment += 3 * sign;
    adjustment += Math.min(2, sharedCount(record.tags, track.tags || [])) * sign;

    const sameContext = contextId
      && record.contextId === contextId
      && (track.contexts?.includes(contextId) || track.scenes?.includes(contextId));
    if (sameContext) adjustment += 2 * sign;
  }

  return Math.round(clamp(adjustment, -FEEDBACK_ADJUSTMENT_LIMIT, FEEDBACK_ADJUSTMENT_LIMIT));
}

export function feedbackCount(feedbackRecords = {}) {
  return Object.keys(normalizeFeedbackRecords(feedbackRecords)).length;
}

export function feedbackForTrack(feedbackRecords, trackId) {
  return normalizeFeedbackRecords(feedbackRecords)[trackId]?.value || null;
}
