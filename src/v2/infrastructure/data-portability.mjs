import { PROFILE_VERSION } from '../domain/profile.mjs?v=qg1';

export const DATA_EXPORT_SCHEMA = 1;
export const DATA_EXPORT_MAX_BYTES = 1_000_000;

const KEYS = Object.freeze({
  profile: 'music-vibe-v2-profile',
  profileHistory: 'music-vibe-v2-history',
  nowHistory: 'music-vibe-v2-now-history',
  language: 'music-vibe-v2-language',
  feedback: 'music-vibe-v2-feedback-v1',
  interactions: 'music-vibe-v2-interactions-v1',
  visits: 'music-vibe-v2-visits-v1',
  weeklyVibes: 'music-vibe-v2-weekly-v1'
});

const CATEGORIES = Object.freeze({
  profile: ['profile'],
  timeline: ['profileHistory'],
  recommendations: ['nowHistory'],
  feedback: ['feedback'],
  activity: ['interactions', 'visits'],
  weekly: ['weeklyVibes'],
  language: ['language'],
  all: Object.keys(KEYS)
});

function readRaw(key) {
  try { return window.localStorage.getItem(key); } catch (_) { return null; }
}

function writeRaw(key, value) {
  try {
    if (value == null) window.localStorage.removeItem(key);
    else window.localStorage.setItem(key, value);
    return true;
  } catch (_) {
    return false;
  }
}

function parse(value, fallback = null) {
  if (!value) return fallback;
  try { return JSON.parse(value); } catch (_) { return fallback; }
}

function safeClone(value, depth = 0) {
  if (depth > 14) throw new Error('Imported data is nested too deeply.');
  if (value == null || typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') return value;
  if (Array.isArray(value)) return value.slice(0, 500).map((item) => safeClone(item, depth + 1));
  if (typeof value !== 'object') return null;
  const output = {};
  for (const [key, item] of Object.entries(value)) {
    if (['__proto__', 'prototype', 'constructor'].includes(key)) continue;
    output[String(key).slice(0, 80)] = safeClone(item, depth + 1);
  }
  return output;
}

function validProfile(profile) {
  return Boolean(
    profile
    && Number(profile.version) === PROFILE_VERSION
    && typeof profile.id === 'string'
    && typeof profile.archetypeId === 'string'
    && profile.scores
    && typeof profile.scores === 'object'
  );
}

function normalizeData(data = {}) {
  const source = safeClone(data);
  const profile = validProfile(source.profile) ? source.profile : null;
  const profileHistory = Array.isArray(source.profileHistory) ? source.profileHistory.filter(validProfile).slice(0, 12) : [];
  const nowHistory = Array.isArray(source.nowHistory) ? source.nowHistory.slice(0, 12) : [];
  const feedback = source.feedback && typeof source.feedback === 'object' ? source.feedback : { version: 1, tracks: {} };
  const interactions = source.interactions && typeof source.interactions === 'object' ? source.interactions : { version: 1, items: [] };
  const visits = source.visits && typeof source.visits === 'object' ? source.visits : null;
  const weeklyVibes = source.weeklyVibes && typeof source.weeklyVibes === 'object' ? source.weeklyVibes : { version: 1, items: [] };
  const language = source.language === 'en' ? 'en' : source.language === 'kr' ? 'kr' : null;
  return { profile, profileHistory, nowHistory, feedback, interactions, visits, weeklyVibes, language };
}

export function productDataSnapshot() {
  return {
    profile: parse(readRaw(KEYS.profile), null),
    profileHistory: parse(readRaw(KEYS.profileHistory), []),
    nowHistory: parse(readRaw(KEYS.nowHistory), []),
    feedback: parse(readRaw(KEYS.feedback), { version: 1, tracks: {} }),
    interactions: parse(readRaw(KEYS.interactions), { version: 1, items: [] }),
    visits: parse(readRaw(KEYS.visits), null),
    weeklyVibes: parse(readRaw(KEYS.weeklyVibes), { version: 1, items: [] }),
    language: readRaw(KEYS.language)
  };
}

export function exportUserData() {
  const preferences = window.MusicVibeConsent?.getPreferences?.() || null;
  return Object.freeze({
    schema: DATA_EXPORT_SCHEMA,
    product: 'my-music-vibe',
    exportedAt: new Date().toISOString(),
    release: document.body?.dataset?.v3Release || document.body?.dataset?.commercialReadinessRelease || 'unknown',
    data: normalizeData(productDataSnapshot()),
    preferences: preferences ? {
      analytics: Boolean(preferences.analytics),
      adMeasurement: Boolean(preferences.adMeasurement),
      personalizedAds: Boolean(preferences.personalizedAds)
    } : null,
    note: 'Analytics visitor identifiers are intentionally excluded from this export.'
  });
}

export function parseImportText(text) {
  const source = String(text || '');
  if (!source || new TextEncoder().encode(source).byteLength > DATA_EXPORT_MAX_BYTES) throw new Error('The data file is empty or too large.');
  const bundle = JSON.parse(source);
  if (!bundle || bundle.product !== 'my-music-vibe' || Number(bundle.schema) !== DATA_EXPORT_SCHEMA) throw new Error('This is not a supported My Music Vibe data file.');
  return Object.freeze({
    schema: DATA_EXPORT_SCHEMA,
    product: 'my-music-vibe',
    exportedAt: String(bundle.exportedAt || ''),
    data: normalizeData(bundle.data || {})
  });
}

export function importUserData(bundle) {
  const normalized = bundle?.data ? normalizeData(bundle.data) : normalizeData(bundle);
  const results = {};
  results.profile = writeRaw(KEYS.profile, normalized.profile ? JSON.stringify(normalized.profile) : null);
  results.profileHistory = writeRaw(KEYS.profileHistory, normalized.profileHistory.length ? JSON.stringify(normalized.profileHistory) : null);
  results.nowHistory = writeRaw(KEYS.nowHistory, normalized.nowHistory.length ? JSON.stringify(normalized.nowHistory) : null);
  results.feedback = writeRaw(KEYS.feedback, JSON.stringify(normalized.feedback));
  results.interactions = writeRaw(KEYS.interactions, JSON.stringify(normalized.interactions));
  results.visits = writeRaw(KEYS.visits, normalized.visits ? JSON.stringify(normalized.visits) : null);
  results.weeklyVibes = writeRaw(KEYS.weeklyVibes, JSON.stringify(normalized.weeklyVibes));
  if (normalized.language) results.language = writeRaw(KEYS.language, normalized.language);
  return Object.freeze({ ok: Object.values(results).every(Boolean), results, imported: normalized });
}

export function clearProductData(category = 'all') {
  const keys = CATEGORIES[category] || [];
  if (!keys.length) return Object.freeze({ ok: false, category, removed: [] });
  const removed = [];
  let ok = true;
  keys.forEach((name) => {
    const result = writeRaw(KEYS[name], null);
    if (result) removed.push(name);
    else ok = false;
  });
  return Object.freeze({ ok, category, removed });
}

export function productDataSummary() {
  const data = normalizeData(productDataSnapshot());
  const feedbackTracks = data.feedback?.tracks && typeof data.feedback.tracks === 'object' ? Object.keys(data.feedback.tracks).length : 0;
  const interactionCount = Array.isArray(data.interactions?.items) ? data.interactions.items.length : 0;
  const weeklyCount = Array.isArray(data.weeklyVibes?.items) ? data.weeklyVibes.items.length : 0;
  return Object.freeze({
    hasProfile: Boolean(data.profile),
    timelineCount: data.profileHistory.length,
    recommendationCount: data.nowHistory.length,
    feedbackCount: feedbackTracks,
    interactionCount,
    weeklyCount,
    visitDayCount: Array.isArray(data.visits?.visitDays) ? data.visits.visitDays.length : 0,
    language: data.language || ''
  });
}

export const DATA_CATEGORIES = Object.freeze(Object.keys(CATEGORIES));
export const DATA_STORAGE_KEYS = KEYS;
