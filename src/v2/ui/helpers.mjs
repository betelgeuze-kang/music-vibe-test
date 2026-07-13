import { getProfileArchetype, localize } from '../domain/profile.mjs?v=qg1';
import { loadLanguage } from '../infrastructure/storage.mjs?weekly=m4w1';
import { NARRATIVE_TRACK_NOTES } from '../data/narrative-notes.mjs?v3=nv1';
import { linkAuditForTrack } from '../data/link-audit.mjs?catalog=cat1';

export const ROUTES = new Set(['home', 'discover', 'profile', 'weekly', 'now', 'match', 'settings']);

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
      ? { group: '이 곡이 내 쪽에도 남는지 표시하기', more: '내 쪽에도 오래 남아요', less: '내 쪽에서는 금세 멀어져요', applied: '전에 남긴 표시를 조금 읽었습니다' }
      : { group: '다음 선곡을 위해 이 곡 곁에 표시하기', more: '이런 소리를 더 듣고 싶어요', less: '이쪽으로는 덜 가고 싶어요', applied: '전에 남긴 표시를 조금 읽었습니다' };
  }
  return bridge
    ? { group: 'Mark whether this song remains on your side too', more: 'This stays on my side too', less: 'This slips away from my side', applied: 'A small earlier mark was taken into account' }
    : { group: 'Leave a small mark for the next selection', more: 'I would hear more in this direction', less: 'I would turn away from this direction', applied: 'A small earlier mark was taken into account' };
}

function linkLabel(language, platform, record) {
  if (language === 'kr') return record.mode === 'exact' ? `${platform}에서 이 곡 바로 열기` : `${platform}에서 곡명과 아티스트로 찾기`;
  return record.mode === 'exact' ? `Open this track directly in ${platform}` : `Search ${platform} for the title and artist`;
}

export function trackCard(candidate, language, placement, options = {}) {
  const { track: item, reason, score, urls } = candidate;
  const strategy = candidate.strategyLabel || (language === 'kr' ? '이 자리에 놓인 까닭' : 'Why it sits here');
  const scoreLabel = language === 'kr' ? '지금 선곡과 가까운 정도' : 'Closeness to this selection';
  const serviceLabel = language === 'kr' ? '다른 음악 서비스에서 곡 찾기' : 'Find the song in another music service';
  const contextId = String(options.contextId || '');
  const feedbackValue = options.feedbackValue === 'more' || options.feedbackValue === 'less' ? options.feedbackValue : '';
  const feedback = feedbackLabels(language, placement);
  const audit = linkAuditForTrack(item);
  const narrative = localize(NARRATIVE_TRACK_NOTES[item.id], language);
  const displayReason = narrative || reason;
  const exactPlatforms = new Set(Object.values(audit).filter((record) => record.mode === 'exact').map((record) => record.platform));
  const matchMetrics = Number.isFinite(candidate.leftFit) && Number.isFinite(candidate.rightFit)
    ? `<div class="track-card__fit"><span>${language === 'kr' ? '내 쪽' : 'My side'} ${candidate.leftFit}</span><span>${language === 'kr' ? '친구 쪽' : 'Friend’s side'} ${candidate.rightFit}</span></div>`
    : '';
  const linkState = exactPlatforms.size
    ? `<span class="track-card__exact" title="${language === 'kr' ? '검토한 직접 곡 링크가 하나 이상 있습니다.' : 'At least one reviewed direct track link is available.'}">✓ ${language === 'kr' ? '직접 링크 있음' : 'DIRECT LINK'}</span>`
    : `<span class="track-card__search" title="${language === 'kr' ? '곡명과 아티스트를 넣은 검색 결과로 이동합니다.' : 'Opens search results for the title and artist.'}">${language === 'kr' ? '검색으로 찾기' : 'SEARCH'}</span>`;
  const feedbackApplied = candidate.feedbackAdjustment ? `<span class="track-card__feedback-applied">${escapeHtml(feedback.applied)}</span>` : '';
  const feedbackControls = options.feedbackEnabled ? `
    <div class="track-card__feedback" role="group" aria-label="${escapeHtml(feedback.group)}">
      <button type="button" class="feedback-button ${feedbackValue === 'more' ? 'is-active' : ''}" data-action="track-feedback" data-feedback-value="more" data-track-id="${escapeHtml(item.id)}" data-placement="${escapeHtml(placement)}" data-context-id="${escapeHtml(contextId)}" aria-pressed="${feedbackValue === 'more'}">＋ ${escapeHtml(feedback.more)}</button>
      <button type="button" class="feedback-button ${feedbackValue === 'less' ? 'is-active' : ''}" data-action="track-feedback" data-feedback-value="less" data-track-id="${escapeHtml(item.id)}" data-placement="${escapeHtml(placement)}" data-context-id="${escapeHtml(contextId)}" aria-pressed="${feedbackValue === 'less'}">－ ${escapeHtml(feedback.less)}</button>
    </div>
  ` : '';

  const link = (platform, label) => {
    const record = audit[platform];
    const href = urls?.[platform] || record.url;
    return `<a href="${escapeHtml(href)}" target="_blank" rel="noopener noreferrer" data-track-link data-link-mode="${record.mode}" data-link-reviewed-at="${record.reviewedAt}" data-platform="${platform}" data-placement="${escapeHtml(placement)}" aria-label="${escapeHtml(linkLabel(language, label, record))}">${label}<small>${language === 'kr' ? (record.mode === 'exact' ? '곡 바로 열기' : '제목으로 찾기') : record.mode}</small></a>`;
  };

  return `
    <article class="track-card" data-track-id="${escapeHtml(item.id)}" data-track-artist="${escapeHtml(item.artist)}" data-strategy="${escapeHtml(candidate.strategy || 'recommended')}" data-placement="${escapeHtml(placement)}">
      <div class="track-card__score"><span class="sr-only">${escapeHtml(scoreLabel)} </span>${score}</div>
      <div class="track-card__body">
        <div class="track-card__kicker"><span>${escapeHtml(strategy)}</span><span>${escapeHtml(item.region)} · ${item.year}</span>${linkState}${feedbackApplied}</div>
        <strong>${escapeHtml(item.title)}</strong>
        <span>${escapeHtml(item.artist)}</span>
        <p>${escapeHtml(displayReason)}</p>
        ${matchMetrics}
        ${feedbackControls}
      </div>
      <div class="track-card__actions" role="group" aria-label="${escapeHtml(serviceLabel)}">
        ${link('spotify', 'Spotify')}
        ${link('youtube', 'YouTube')}
        ${link('apple', 'Apple')}
      </div>
    </article>
  `;
}
