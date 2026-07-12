import { PROFILE_VERSION } from '../domain/profile.mjs';
import { normalizeFeedbackRecords, normalizeFeedbackValue } from '../domain/feedback.mjs';
import { profileSnapshotKey, sortProfileSnapshots } from '../domain/timeline.mjs?timeline=m4t1';
import { weeklySnapshotKey } from '../domain/weekly.mjs?weekly=m4w1';

const PROFILE_KEY = 'music-vibe-v2-profile';
const HISTORY_KEY = 'music-vibe-v2-history';
const NOW_KEY = 'music-vibe-v2-now-history';
const LANGUAGE_KEY = 'music-vibe-v2-language';
const FEEDBACK_KEY = 'music-vibe-v2-feedback-v1';
const INTERACTIONS_KEY = 'music-vibe-v2-interactions-v1';
const VISITS_KEY = 'music-vibe-v2-visits-v1';
const WEEKLY_KEY = 'music-vibe-v2-weekly-v1';
const MAX_HISTORY = 12;
const MAX_INTERACTIONS = 400;
const MAX_WEEKLY_VIBES = 12;
const MAX_VISIT_DAYS = 45;

function safeParse(value, fallback) {
  if (!value) return fallback;
  try {
    return JSON.parse(value);
  } catch (_) {
    return fallback;
  }
}

function read(key, fallback = null) {
  try {
    return safeParse(window.localStorage.getItem(key), fallback);
  } catch (_) {
    return fallback;
  }
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
  try {
    window.localStorage.removeItem(key);
    return true;
  } catch (_) {
    return false;
  }
}

function timestamp(value) {
  const time = new Date(value || 0).getTime();
  return Number.isFinite(time) ? time : 0;
}

function dayKey(value) {
  const date = new Date(value || 0);
  return Number.isFinite(date.getTime()) ? date.toISOString().slice(0, 10) : '';
}

function dayDistance(left, right) {
  const leftDay = timestamp(`${dayKey(left)}T00:00:00.000Z`);
  const rightDay = timestamp(`${dayKey(right)}T00:00:00.000Z`);
  if (!leftDay || !rightDay) return null;
  return Math.floor((rightDay - leftDay) / 86_400_000);
}

function validProfile(profile) {
  return profile
    && Number(profile.version) === PROFILE_VERSION
    && typeof profile.id === 'string'
    && typeof profile.archetypeId === 'string'
    && profile.scores
    && typeof profile.scores === 'object';
}

function validWeeklyVibe(vibe) {
  return Boolean(
    vibe
    && Number(vibe.version) === 1
    && typeof vibe.profileId === 'string'
    && typeof vibe.weekKey === 'string'
    && vibe.scores
    && typeof vibe.scores === 'object'
  );
}

function interactionId() {
  try {
    if (globalThis.crypto?.randomUUID) return `ix-${globalThis.crypto.randomUUID()}`;
  } catch (_) {
    // Fall through to a deterministic-enough local identifier.
  }
  return `ix-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function normalizeVisitState(stored) {
  if (!stored || typeof stored !== 'object') return null;
  const currentVisitAt = String(stored.currentVisitAt || stored.lastSeenAt || stored.firstVisitAt || '');
  if (!timestamp(currentVisitAt)) return null;
  const firstVisitAt = String(stored.firstVisitAt || currentVisitAt);
  const currentDay = String(stored.currentDay || dayKey(currentVisitAt));
  const visitDays = [...new Set([
    ...(Array.isArray(stored.visitDays) ? stored.visitDays.map(String) : []),
    dayKey(firstVisitAt),
    currentDay
  ].filter(Boolean))].sort().slice(-MAX_VISIT_DAYS);
  return {
    version: 2,
    firstVisitAt,
    previousVisitAt: stored.previousVisitAt ? String(stored.previousVisitAt) : null,
    currentVisitAt,
    currentDay,
    lastSeenAt: String(stored.lastSeenAt || currentVisitAt),
    visitDays,
    lastReturnEventKey: stored.lastReturnEventKey ? String(stored.lastReturnEventKey) : '',
    lastReturnEventAt: stored.lastReturnEventAt ? String(stored.lastReturnEventAt) : null
  };
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
    const next = sortProfileSnapshots([profile, ...history]).slice(0, MAX_HISTORY);
    write(HISTORY_KEY, next);
  }
  return saved;
}

export function restoreProfileSnapshot(profile) {
  if (!validProfile(profile)) return false;
  return write(PROFILE_KEY, profile);
}

export function clearProfile() {
  return remove(PROFILE_KEY);
}

export function loadProfileHistory() {
  const history = read(HISTORY_KEY, []);
  if (!Array.isArray(history)) return [];
  return sortProfileSnapshots(history.filter(validProfile)).slice(0, MAX_HISTORY);
}

export function clearProfileHistory(keepProfile = null) {
  if (validProfile(keepProfile)) return write(HISTORY_KEY, [keepProfile]);
  return remove(HISTORY_KEY);
}

export function findProfileSnapshot(snapshotKey) {
  const key = String(snapshotKey || '');
  if (!key) return null;
  return loadProfileHistory().find((profile) => profileSnapshotKey(profile) === key) || null;
}

export function saveNowSession(session) {
  const history = loadNowHistory();
  return write(NOW_KEY, [session, ...history].slice(0, MAX_HISTORY));
}

export function loadNowHistory() {
  const history = read(NOW_KEY, []);
  return Array.isArray(history) ? history.slice(0, MAX_HISTORY) : [];
}

export function loadTrackFeedback() {
  const stored = read(FEEDBACK_KEY, { version: 1, tracks: {} });
  const source = stored?.version === 1 ? stored.tracks : stored;
  return normalizeFeedbackRecords(source);
}

export function setTrackFeedback(record) {
  const trackId = String(record?.trackId || '');
  if (!trackId) return { records: loadTrackFeedback(), saved: false };

  const records = { ...loadTrackFeedback() };
  const value = normalizeFeedbackValue(record?.value);
  if (!value) {
    delete records[trackId];
  } else {
    records[trackId] = {
      trackId,
      value,
      artist: String(record.artist || ''),
      tags: Array.isArray(record.tags) ? [...new Set(record.tags.map(String).filter(Boolean))] : [],
      contexts: Array.isArray(record.contexts) ? [...new Set(record.contexts.map(String).filter(Boolean))] : [],
      contextId: String(record.contextId || ''),
      placement: String(record.placement || ''),
      profileId: String(record.profileId || ''),
      updatedAt: String(record.updatedAt || new Date().toISOString())
    };
  }

  const normalized = normalizeFeedbackRecords(records);
  const saved = write(FEEDBACK_KEY, { version: 1, tracks: normalized });
  return { records: normalized, saved };
}

export function clearTrackFeedback() {
  remove(FEEDBACK_KEY);
}

export function recordInteraction(interaction) {
  const createdAt = String(interaction?.createdAt || new Date().toISOString());
  const entry = Object.freeze({
    id: String(interaction?.id || interactionId()),
    type: String(interaction?.type || 'unknown'),
    value: interaction?.value == null ? null : String(interaction.value),
    trackId: String(interaction?.trackId || ''),
    artist: String(interaction?.artist || ''),
    contextId: String(interaction?.contextId || ''),
    placement: String(interaction?.placement || ''),
    strategy: String(interaction?.strategy || ''),
    profileId: String(interaction?.profileId || ''),
    createdAt
  });
  const current = loadInteractions();
  const next = [entry, ...current].slice(0, MAX_INTERACTIONS);
  return { entry, saved: write(INTERACTIONS_KEY, { version: 1, items: next }) };
}

export function loadInteractions(options = {}) {
  const stored = read(INTERACTIONS_KEY, { version: 1, items: [] });
  const items = Array.isArray(stored?.items) ? stored.items : Array.isArray(stored) ? stored : [];
  const since = options.since ? new Date(options.since).getTime() : null;
  const limit = Math.max(1, Math.min(MAX_INTERACTIONS, Number(options.limit || MAX_INTERACTIONS)));
  return items
    .filter((item) => item && typeof item === 'object' && typeof item.type === 'string')
    .filter((item) => !since || new Date(item.createdAt).getTime() >= since)
    .slice(0, limit);
}

export function saveWeeklyVibe(vibe) {
  if (!validWeeklyVibe(vibe) || !vibe.sufficientData) return false;
  const key = weeklySnapshotKey(vibe);
  if (!key) return false;
  const current = loadWeeklyVibes();
  const next = [vibe, ...current.filter((item) => weeklySnapshotKey(item) !== key)]
    .sort((left, right) => timestamp(right.generatedAt) - timestamp(left.generatedAt) || weeklySnapshotKey(left).localeCompare(weeklySnapshotKey(right)))
    .slice(0, MAX_WEEKLY_VIBES);
  return write(WEEKLY_KEY, { version: 1, items: next });
}

export function loadWeeklyVibes(options = {}) {
  const stored = read(WEEKLY_KEY, { version: 1, items: [] });
  const items = Array.isArray(stored?.items) ? stored.items : Array.isArray(stored) ? stored : [];
  const profileId = String(options.profileId || '');
  return items
    .filter(validWeeklyVibe)
    .filter((item) => !profileId || item.profileId === profileId)
    .sort((left, right) => timestamp(right.generatedAt) - timestamp(left.generatedAt) || weeklySnapshotKey(left).localeCompare(weeklySnapshotKey(right)))
    .slice(0, MAX_WEEKLY_VIBES);
}

export function loadLatestWeeklyVibe(profileId = '') {
  return loadWeeklyVibes({ profileId })[0] || null;
}

export function clearWeeklyVibes() {
  return remove(WEEKLY_KEY);
}

export function registerVisit(at = new Date()) {
  const date = at instanceof Date ? at : new Date(at);
  const currentAt = Number.isFinite(date.getTime()) ? date.toISOString() : new Date().toISOString();
  const currentDay = dayKey(currentAt);
  const stored = normalizeVisitState(read(VISITS_KEY, null));
  let state;
  let isNewDay = true;
  let daysSincePrevious = null;

  if (!stored) {
    state = {
      version: 2,
      firstVisitAt: currentAt,
      previousVisitAt: null,
      currentVisitAt: currentAt,
      currentDay,
      lastSeenAt: currentAt,
      visitDays: [currentDay],
      lastReturnEventKey: '',
      lastReturnEventAt: null
    };
  } else if (stored.currentDay === currentDay) {
    isNewDay = false;
    state = { ...stored, lastSeenAt: currentAt };
    daysSincePrevious = stored.previousVisitAt ? dayDistance(stored.previousVisitAt, stored.currentVisitAt) : null;
  } else {
    daysSincePrevious = dayDistance(stored.currentVisitAt, currentAt);
    state = {
      ...stored,
      previousVisitAt: stored.currentVisitAt,
      currentVisitAt: currentAt,
      currentDay,
      lastSeenAt: currentAt,
      visitDays: [...new Set([...stored.visitDays, currentDay])].sort().slice(-MAX_VISIT_DAYS)
    };
  }

  const saved = write(VISITS_KEY, state);
  return Object.freeze({ state: Object.freeze(state), saved, isNewDay, daysSincePrevious });
}

export function loadVisitState() {
  return normalizeVisitState(read(VISITS_KEY, null));
}

export function markReturnVisitTracked(eventKey, at = new Date()) {
  const key = String(eventKey || '');
  const stored = normalizeVisitState(read(VISITS_KEY, null));
  if (!stored || !key) return false;
  return write(VISITS_KEY, {
    ...stored,
    lastReturnEventKey: key,
    lastReturnEventAt: at instanceof Date ? at.toISOString() : new Date(at).toISOString()
  });
}

export function returnVisitAlreadyTracked(eventKey) {
  const state = loadVisitState();
  return Boolean(eventKey && state?.lastReturnEventKey === String(eventKey));
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
