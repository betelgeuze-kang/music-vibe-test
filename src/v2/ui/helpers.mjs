import { getProfileArchetype } from '../domain/profile.mjs?v=qg1';
import { loadLanguage } from '../infrastructure/storage.mjs?weekly=m4w1';

export const ROUTES = new Set(['home', 'discover', 'profile', 'weekly', 'now', 'match']);

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

function feedbackLabels(language, placement) {
  const bridge = placement === 'bridge_playlist';
  if (language === 'kr') {
    return bridge
      ? { group: '이 곡이 내 취향과 얼마나 가까운지 표시', more: '내 취향에 더 가까워요', less: '내 취향에서는 조금 멀어요', applied: '내 이전 반응을 반영한 곡' }
      : { group: '다음 선곡을 위한 곡 반응', more: '이런 곡 더 듣고 싶어요', less: '이 방향은 덜 듣고 싶어요', applied: '내 이전 반응을 반영한 곡' };
  }
  return bridge
    ? { group: 'Mark how this track fits your taste', more: 'Closer to my taste', less: 'A little far from my taste', applied: 'Adjusted using your previous feedback' }
    : { group: 'Feedback for your next selection', more: 'More like this', less: 'Less in this direction', applied: 'Adjusted using your previous feedback' };
}

export function trackCard(candidate, language, placement, options = {}) {
  const { track: item, reason, score, urls } = candidate;
  const strategy = candidate.strategyLabel || (language === 'kr' ? '추천' : 'Recommended');
  const scoreLabel = language === 'kr' ? '추천 적합도' : 'Match score';
  const serviceLabel = language === 'kr' ? '음악 서비스에서 듣기' : 'Listen on a music service';
  const contextId = String(options.contextId || '');
  const feedbackValue = options.feedbackValue === 'more' || options.feedbackValue === 'less' ? options.feedbackValue : '';
  const feedback = feedbackLabels(language, placement);
  const matchMetrics = Number.isFinite(candidate.leftFit) && Number.isFinite(candidate.rightFit)
    ? `<div class="track-card__fit"><span>${language === 'kr' ? '나' : 'You'} ${candidate.leftFit}</span><span>${language === 'kr' ? '친구' : 'Friend'} ${candidate.rightFit}</span></div>`
    : '';
  const exact = candidate.exactPlatforms?.length
    ? `<span class="track-card__exact" title="${language === 'kr' ? '검증된 직접 링크 포함' : 'Includes a verified direct link'}">✓ LINK</span>`
    : '';
  const feedbackApplied = candidate.feedbackAdjustment
    ? `<span class="track-card__feedback-applied">${escapeHtml(feedback.applied)}</span>`
    : '';
  const feedbackControls = options.feedbackEnabled ? `
    <div class="track-card__feedback" role="group" aria-label="${escapeHtml(feedback.group)}">
      <button type="button" class="feedback-button ${feedbackValue === 'more' ? 'is-active' : ''}" data-action="track-feedback" data-feedback-value="more" data-track-id="${escapeHtml(item.id)}" data-placement="${escapeHtml(placement)}" data-context-id="${escapeHtml(contextId)}" aria-pressed="${feedbackValue === 'more'}">＋ ${escapeHtml(feedback.more)}</button>
      <button type="button" class="feedback-button ${feedbackValue === 'less' ? 'is-active' : ''}" data-action="track-feedback" data-feedback-value="less" data-track-id="${escapeHtml(item.id)}" data-placement="${escapeHtml(placement)}" data-context-id="${escapeHtml(contextId)}" aria-pressed="${feedbackValue === 'less'}">－ ${escapeHtml(feedback.less)}</button>
    </div>
  ` : '';

  return `
    <article class="track-card" data-track-id="${escapeHtml(item.id)}" data-track-artist="${escapeHtml(item.artist)}" data-strategy="${escapeHtml(candidate.strategy || 'recommended')}" data-placement="${escapeHtml(placement)}">
      <div class="track-card__score"><span class="sr-only">${escapeHtml(scoreLabel)} </span>${score}</div>
      <div class="track-card__body">
        <div class="track-card__kicker"><span>${escapeHtml(strategy)}</span><span>${escapeHtml(item.region)} · ${item.year}</span>${exact}${feedbackApplied}</div>
        <strong>${escapeHtml(item.title)}</strong>
        <span>${escapeHtml(item.artist)}</span>
        <p>${escapeHtml(reason)}</p>
        ${matchMetrics}
        ${feedbackControls}
      </div>
      <div class="track-card__actions" role="group" aria-label="${escapeHtml(serviceLabel)}">
        <a href="${escapeHtml(urls.spotify)}" target="_blank" rel="noopener noreferrer" data-track-link data-platform="spotify" data-placement="${placement}">Spotify</a>
        <a href="${escapeHtml(urls.youtube)}" target="_blank" rel="noopener noreferrer" data-track-link data-platform="youtube" data-placement="${placement}">YouTube</a>
        <a href="${escapeHtml(urls.apple)}" target="_blank" rel="noopener noreferrer" data-track-link data-platform="apple" data-placement="${placement}">Apple</a>
      </div>
    </article>
  `;
}
