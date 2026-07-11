import { PROFILE_VERSION } from '../domain/profile.mjs?v=qg1';

const PROFILE_KEY = 'music-vibe-v2-profile';
const HISTORY_KEY = 'music-vibe-v2-history';
const NOW_KEY = 'music-vibe-v2-now-history';
const FEEDBACK_KEY = 'music-vibe-v2-feedback';
const INTERACTION_KEY = 'music-vibe-v2-interactions';
const VISIT_KEY = 'music-vibe-v2-visit';
const WEEKLY_KEY = 'music-vibe-v2-weekly';
const LANGUAGE_KEY = 'music-vibe-v2-language';
const MAX_HISTORY = 12;
const MAX_NOW_HISTORY = 40;
const MAX_FEEDBACK = 240;
const MAX_INTERACTIONS = 500;

function safeParse(value, fallback) {
  if (!value) return fallback;
  try { return JSON.parse(value); } catch (_) { return fallback; }
}

function read(key, fallback = null) {
  try { return safeParse(window.localStorage.getItem(key), fallback); } catch (_) { return fallback; }
}

function write(key, value) {
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch (_) {
    return false;
  }
}

function remove(key) {
  try { window.localStorage.removeItem(key); } catch (_) { /* Storage is optional. */ }
}

function validProfile(profile) {
  return profile
    && Number(profile.version) === PROFILE_VERSION
    && typeof profile.id === 'string'
    && typeof profile.archetypeId === 'string'
    && profile.scores
    && typeof profile.scores === 'object';
}

function timestamp(value = new Date().toISOString()) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? new Date().toISOString() : date.toISOString();
}

function interactionId(record) {
  return record.id || `${record.type || 'activity'}-${record.trackId || record.contextId || 'general'}-${record.createdAt}`;
}

export function loadProfile() {
  const profile = read(PROFILE_KEY);
  return validProfile(profile) ? profile : null;
}

export function saveProfile(profile) {
  if (!validProfile(profile)) return false;
  const saved = write(PROFILE_KEY, profile);
  if (saved) {
    const history = loadProfileHistory();
    const snapshot = {
      ...profile,
      snapshotId: profile.snapshotId || `${profile.id}-${timestamp(profile.createdAt).replaceAll(/[-:.TZ]/g, '')}`,
      createdAt: timestamp(profile.createdAt)
    };
    const next = [snapshot, ...history.filter((item) => item.snapshotId !== snapshot.snapshotId)].slice(0, MAX_HISTORY);
    write(HISTORY_KEY, next);
    recordInteraction({ type: 'profile_snapshot', profileId: profile.id, archetypeId: profile.archetypeId, createdAt: snapshot.createdAt });
  }
  return saved;
}

export function clearProfile() {
  remove(PROFILE_KEY);
}

export function loadProfileHistory() {
  const history = read(HISTORY_KEY, []);
  return Array.isArray(history)
    ? history.filter(validProfile).map((profile, index) => ({
        ...profile,
        snapshotId: profile.snapshotId || `${profile.id}-legacy-${index}`,
        createdAt: timestamp(profile.createdAt)
      })).slice(0, MAX_HISTORY)
    : [];
}

export function restoreProfileSnapshot(snapshotId) {
  const snapshot = loadProfileHistory().find((item) => item.snapshotId === snapshotId || item.id === snapshotId);
  if (!snapshot) return null;
  const restored = { ...snapshot, source: 'timeline_restore', restoredAt: new Date().toISOString() };
  delete restored.snapshotId;
  return write(PROFILE_KEY, restored) ? restored : null;
}

export function clearProfileHistory() {
  remove(HISTORY_KEY);
  return true;
}

export function saveNowSession(session) {
  const history = loadNowHistory();
  const normalized = { ...session, createdAt: timestamp(session.createdAt) };
  return write(NOW_KEY, [normalized, ...history].slice(0, MAX_NOW_HISTORY));
}

export function loadNowHistory() {
  const history = read(NOW_KEY, []);
  return Array.isArray(history) ? history.map((item) => ({ ...item, createdAt: timestamp(item.createdAt) })).slice(0, MAX_NOW_HISTORY) : [];
}

export function saveTrackFeedback(feedback) {
  if (!feedback?.trackId || !['more', 'less'].includes(feedback.direction)) return false;
  const createdAt = timestamp(feedback.createdAt);
  const key = `${feedback.trackId}|${feedback.contextId || 'all'}|${feedback.placement || 'unknown'}`;
  const record = {
    ...feedback,
    id: key,
    createdAt,
    updatedAt: createdAt,
    tags: Array.isArray(feedback.tags) ? [...new Set(feedback.tags)] : []
  };
  const current = loadTrackFeedback();
  const existing = current.find((item) => item.id === key);
  if (existing?.direction === record.direction) {
    const next = current.filter((item) => item.id !== key);
    write(FEEDBACK_KEY, next);
    recordInteraction({ ...record, type: 'track_feedback', direction: 'clear', createdAt });
    return true;
  }
  const next = [record, ...current.filter((item) => item.id !== key)].slice(0, MAX_FEEDBACK);
  const saved = write(FEEDBACK_KEY, next);
  if (saved) recordInteraction({ ...record, type: 'track_feedback' });
  return saved;
}

export function loadTrackFeedback() {
  const items = read(FEEDBACK_KEY, []);
  return Array.isArray(items)
    ? items.filter((item) => item?.trackId && ['more', 'less'].includes(item.direction)).slice(0, MAX_FEEDBACK)
    : [];
}

export function feedbackDirectionFor(trackId, contextId = '', placement = '') {
  const feedback = loadTrackFeedback();
  return feedback.find((item) => item.trackId === trackId && (!contextId || item.contextId === contextId) && (!placement || item.placement === placement))?.direction
    || feedback.find((item) => item.trackId === trackId)?.direction
    || '';
}

export function recordInteraction(interaction) {
  if (!interaction?.type) return false;
  const createdAt = timestamp(interaction.createdAt);
  const record = { ...interaction, createdAt };
  record.id = interactionId(record);
  const current = loadInteractions();
  return write(INTERACTION_KEY, [record, ...current.filter((item) => item.id !== record.id)].slice(0, MAX_INTERACTIONS));
}

export function loadInteractions({ since = '', until = '' } = {}) {
  const items = read(INTERACTION_KEY, []);
  if (!Array.isArray(items)) return [];
  const sinceTime = since ? new Date(since).getTime() : -Infinity;
  const untilTime = until ? new Date(until).getTime() : Infinity;
  return items
    .filter((item) => item?.type && item.createdAt)
    .filter((item) => {
      const time = new Date(item.createdAt).getTime();
      return Number.isFinite(time) && time >= sinceTime && time <= untilTime;
    })
    .slice(0, MAX_INTERACTIONS);
}

export function clearActivityHistory() {
  remove(NOW_KEY);
  remove(FEEDBACK_KEY);
  remove(INTERACTION_KEY);
  remove(WEEKLY_KEY);
  return true;
}

export function clearAllVibeData() {
  [PROFILE_KEY, HISTORY_KEY, NOW_KEY, FEEDBACK_KEY, INTERACTION_KEY, VISIT_KEY, WEEKLY_KEY].forEach(remove);
  return true;
}

export function registerVisit(now = new Date().toISOString()) {
  const currentAt = timestamp(now);
  const previous = read(VISIT_KEY, {});
  const previousAt = previous?.lastVisitAt || '';
  const daysSince = previousAt ? Math.floor((new Date(currentAt).getTime() - new Date(previousAt).getTime()) / 86_400_000) : 0;
  const returnKey = currentAt.slice(0, 10);
  const shouldEmit7d = daysSince >= 7 && previous.lastReturn7dKey !== returnKey;
  const next = {
    firstVisitAt: previous.firstVisitAt || currentAt,
    lastVisitAt: currentAt,
    previousVisitAt: previousAt,
    lastReturn7dKey: shouldEmit7d ? returnKey : previous.lastReturn7dKey || ''
  };
  write(VISIT_KEY, next);
  return Object.freeze({ previousAt, currentAt, daysSince, return7d: shouldEmit7d });
}

export function loadVisitState() {
  return read(VISIT_KEY, {});
}

export function saveWeeklySnapshot(snapshot) {
  if (!snapshot?.id) return false;
  const current = loadWeeklySnapshots();
  return write(WEEKLY_KEY, [snapshot, ...current.filter((item) => item.id !== snapshot.id)].slice(0, 12));
}

export function loadWeeklySnapshots() {
  const items = read(WEEKLY_KEY, []);
  return Array.isArray(items) ? items.slice(0, 12) : [];
}

export function saveLanguage(language) {
  try {
    window.localStorage.setItem(LANGUAGE_KEY, language === 'en' ? 'en' : 'kr');
    return true;
  } catch (_) {
    return false;
  }
}

export function loadLanguage() {
  try {
    const value = window.localStorage.getItem(LANGUAGE_KEY);
    return value === 'en' ? 'en' : value === 'kr' ? 'kr' : null;
  } catch (_) {
    return null;
  }
}
