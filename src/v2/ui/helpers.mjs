import { getProfileArchetype, localize } from '../domain/profile.mjs';
import { loadLanguage } from '../infrastructure/storage.mjs';

export const ROUTES = new Set(['home', 'discover', 'profile', 'now', 'match']);

export function escapeHtml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

export function detectLanguage() {
  const params = new URLSearchParams(window.location.search);
  const requested = params.get('lang');
  if (requested === 'en') return 'en';
  if (requested === 'kr' || requested === 'ko') return 'kr';
  const saved = loadLanguage();
  if (saved) return saved;
  return navigator.language?.toLowerCase().startsWith('ko') ? 'kr' : 'en';
}

export function parseRoute() {
  const route = window.location.hash.replace(/^#\/?/, '').split('?')[0] || 'home';
  return ROUTES.has(route) ? route : 'home';
}

export function axisDirection(axis, score, language) {
  return score >= 50 ? localize(axis.high, language) : localize(axis.low, language);
}

export function extractToken(rawValue) {
  const value = String(rawValue || '').trim();
  if (!value) return '';
  try {
    const url = new URL(value);
    return url.searchParams.get('compare') || '';
  } catch (_) {
    return value.replace(/^compare=/, '');
  }
}

export function track(name, params = {}, options = {}) {
  return window.trackEvent?.(name, params, options);
}

export function profileMiniCard(profile, label, language) {
  const archetype = getProfileArchetype(profile);
  const [start, middle, end] = archetype.gradient;
  return `
    <article class="mini-profile" style="--profile-start:${start};--profile-middle:${middle};--profile-end:${end}">
      <span class="mini-profile__label">${escapeHtml(label)}</span>
      <span class="mini-profile__symbol">${escapeHtml(archetype.symbol)}</span>
      <strong>${escapeHtml(localize(archetype.name, language))}</strong>
      <small>${escapeHtml(profile.id)}</small>
    </article>
  `;
}

export function trackCard(candidate, language, placement) {
  const { track: item, reason, score, urls } = candidate;
  return `
    <article class="track-card" data-track-id="${escapeHtml(item.id)}">
      <div class="track-card__score" aria-label="match score ${score}">${score}</div>
      <div class="track-card__body">
        <strong>${escapeHtml(item.title)}</strong>
        <span>${escapeHtml(item.artist)}</span>
        <p>${escapeHtml(reason)}</p>
      </div>
      <div class="track-card__actions" aria-label="Listen on a music service">
        <a href="${escapeHtml(urls.spotify)}" target="_blank" rel="noopener noreferrer" data-track-link data-platform="spotify" data-placement="${placement}">${language === 'kr' ? 'Spotify' : 'Spotify'}</a>
        <a href="${escapeHtml(urls.youtube)}" target="_blank" rel="noopener noreferrer" data-track-link data-platform="youtube" data-placement="${placement}">${language === 'kr' ? 'YouTube' : 'YouTube'}</a>
        <a href="${escapeHtml(urls.apple)}" target="_blank" rel="noopener noreferrer" data-track-link data-platform="apple" data-placement="${placement}">${language === 'kr' ? 'Apple' : 'Apple'}</a>
      </div>
    </article>
  `;
}
