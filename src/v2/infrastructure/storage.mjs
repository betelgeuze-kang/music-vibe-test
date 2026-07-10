import { PROFILE_VERSION } from '../domain/profile.mjs';

const PROFILE_KEY = 'music-vibe-v2-profile';
const HISTORY_KEY = 'music-vibe-v2-history';
const NOW_KEY = 'music-vibe-v2-now-history';
const LANGUAGE_KEY = 'music-vibe-v2-language';
const MAX_HISTORY = 12;

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
