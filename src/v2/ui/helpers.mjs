import { getProfileArchetype } from '../domain/profile.mjs?v=qg1';
import { loadLanguage } from '../infrastructure/storage.mjs?v=qg1';

export const ROUTES = new Set(['home', 'discover', 'profile', 'now', 'match']);

export function escapeHtml(value) {
  return String(value ?? '').replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;').replaceAll("'", '&#039;');
}

export function fragmentState(value = window.location.hash) {
  const raw = String(value || '').replace(/^#\/?/, '');
  const [routePart = 'home', query = ''] = raw.split('?');
  return { route: ROUTES.has(routePart) ? routePart : 'home', params: new URLSearchParams(query) };
}

export function detectLanguage() {
  const query = new URLSearchParams(window.location.search);
  const fragment = fragmentState().params;
  const requested = fragment.get('lang') || query.get('lang');
  if (requested === 'en') return 'en';
  if (requested === 'kr' || requested === 'ko') return 'kr';
  const saved = loadLanguage();
  if (saved) return saved;
  return navigator.language?.toLowerCase().startsWith('ko') ? 'kr' : 'en';
}

export function parseRoute() {
  return fragmentState().route;
}

export function routeUrl(route, params = {}) {
  const query = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') query.set(key, String(value));
  });
  return `#/${ROUTES.has(route) ? route : 'home'}${query.size ? `?${query}` : ''}`;
}

export function axisDirection(axis, score, language) {
  return score >= 50 ? (axis.high?.[language] || axis.high?.en) : (axis.low?.[language] || axis.low?.en);
}

export function extractToken(rawValue) {
  const value = String(rawValue || '').trim();
  if (!value) return '';
  try {
    const url = new URL(value, window.location.origin);
    const fragment = fragmentState(url.hash);
    return fragment.params.get('compare') || url.searchParams.get('compare') || '';
  } catch (_) {
    const hashQuery = value.includes('?') ? new URLSearchParams(value.split('?').slice(1).join('?')) : null;
    return hashQuery?.get('compare') || value.replace(/^compare=/, '');
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
      <span class="mini-profile__symbol" aria-hidden="true">${escapeHtml(archetype.symbol)}</span>
      <strong>${escapeHtml(archetype.name?.[language] || archetype.name?.en || archetype.id)}</strong>
      <small>${escapeHtml(profile.id)}</small>
    </article>
  `;
}

export function trackCard(candidate, language, placement) {
  const { track: item, reason, score, urls } = candidate;
  const strategy = candidate.strategyLabel || (language === 'kr' ? '추천' : 'Recommended');
  const scoreLabel = language === 'kr' ? '추천 적합도' : 'Match score';
  const serviceLabel = language === 'kr' ? '음악 서비스에서 듣기' : 'Listen on a music service';
  const matchMetrics = Number.isFinite(candidate.leftFit) && Number.isFinite(candidate.rightFit)
    ? `<div class="track-card__fit"><span>${language === 'kr' ? '나' : 'You'} ${candidate.leftFit}</span><span>${language === 'kr' ? '친구' : 'Friend'} ${candidate.rightFit}</span></div>`
    : '';
  const exact = candidate.exactPlatforms?.length
    ? `<span class="track-card__exact" title="${language === 'kr' ? '검증된 직접 링크 포함' : 'Includes a verified direct link'}">✓ LINK</span>`
    : '';
  return `
    <article class="track-card" data-track-id="${escapeHtml(item.id)}" data-strategy="${escapeHtml(candidate.strategy || 'recommended')}">
      <div class="track-card__score"><span class="sr-only">${escapeHtml(scoreLabel)} </span>${score}</div>
      <div class="track-card__body">
        <div class="track-card__kicker"><span>${escapeHtml(strategy)}</span><span>${escapeHtml(item.region)} · ${item.year}</span>${exact}</div>
        <strong>${escapeHtml(item.title)}</strong>
        <span>${escapeHtml(item.artist)}</span>
        <p>${escapeHtml(reason)}</p>
        ${matchMetrics}
      </div>
      <div class="track-card__actions" role="group" aria-label="${escapeHtml(serviceLabel)}">
        <a href="${escapeHtml(urls.spotify)}" target="_blank" rel="noopener noreferrer" data-track-link data-platform="spotify" data-placement="${placement}">Spotify</a>
        <a href="${escapeHtml(urls.youtube)}" target="_blank" rel="noopener noreferrer" data-track-link data-platform="youtube" data-placement="${placement}">YouTube</a>
        <a href="${escapeHtml(urls.apple)}" target="_blank" rel="noopener noreferrer" data-track-link data-platform="apple" data-placement="${placement}">Apple</a>
      </div>
    </article>
  `;
}
