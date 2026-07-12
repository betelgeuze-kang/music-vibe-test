import { PROFILE_VERSION } from '../domain/profile.mjs';
import { normalizeFeedbackRecords, normalizeFeedbackValue } from '../domain/feedback.mjs';

const PROFILE_KEY = 'music-vibe-v2-profile';
const HISTORY_KEY = 'music-vibe-v2-history';
const NOW_KEY = 'music-vibe-v2-now-history';
const LANGUAGE_KEY = 'music-vibe-v2-language';
const FEEDBACK_KEY = 'music-vibe-v2-feedback-v1';
const INTERACTIONS_KEY = 'music-vibe-v2-interactions-v1';
const VISITS_KEY = 'music-vibe-v2-visits-v1';
const MAX_HISTORY = 12;
const MAX_INTERACTIONS = 400;

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
  } catch (_) {
    // Storage is optional.
  }
}

function validProfile(profile) {
  return profile
    && Number(profile.version) === PROFILE_VERSION
    && typeof profile.id === 'string'
    && typeof profile.archetypeId === 'string'
    && profile.scores
    && typeof profile.scores === 'object';
}

function interactionId() {
  try {
    if (globalThis.crypto?.randomUUID) return `ix-${globalThis.crypto.randomUUID()}`;
  } catch (_) {
    // Fall through to a deterministic-enough local identifier.
  }
  return `ix-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
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
    const next = [profile, ...history.filter((item) => item.id !== profile.id)].slice(0, MAX_HISTORY);
    write(HISTORY_KEY, next);
  }
  return saved;
}

export function clearProfile() {
  remove(PROFILE_KEY);
}

export function loadProfileHistory() {
  const history = read(HISTORY_KEY, []);
  return Array.isArray(history) ? history.filter(validProfile).slice(0, MAX_HISTORY) : [];
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

export function registerVisit(at = new Date()) {
  const currentAt = at instanceof Date ? at.toISOString() : new Date(at).toISOString();
  const stored = read(VISITS_KEY, null);
  const firstVisitAt = String(stored?.firstVisitAt || currentAt);
  const previousVisitAt = stored?.currentVisitAt ? String(stored.currentVisitAt) : null;
  const state = Object.freeze({
    version: 1,
    firstVisitAt,
    previousVisitAt,
    currentVisitAt: currentAt,
    lastReturnEventAt: stored?.lastReturnEventAt || null
  });
  return { state, saved: write(VISITS_KEY, state) };
}

export function loadVisitState() {
  const stored = read(VISITS_KEY, null);
  return stored?.version === 1 ? stored : null;
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
