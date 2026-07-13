import { VIBE_CONTEXTS, CONTEXT_BY_ID } from '../../data/contexts.mjs?v3=nv1';
import { localize } from '../../domain/profile.mjs?v=qg1';
import { recommendationSummary } from '../../domain/recommendation.mjs?engagement=m4f1';
import { loadNowHistory } from '../../infrastructure/storage.mjs?engagement=m4f1';
import { escapeHtml, track, trackCard } from '../helpers.mjs?v3=nv1';
import { renderEmptyProfile } from './empty.mjs?v3=nv1';

function refreshPanel(app) {
  if (app.feedbackChangesSinceRefresh < 2) return '';
  const korean = app.language === 'kr';
  return `
    <section class="feedback-refresh" aria-live="polite">
      <div>
        <span class="eyebrow">${korean ? '두 곡에서 마음이 움직였어요' : 'TWO SONGS MOVED THE NEEDLE'}</span>
        <h2>${korean ? '남긴 반응을 보고, 같은 다섯 자리를 다시 채워볼까요?' : 'Shall we refill the same five places using the notes you left?'}</h2>
        <p>${korean ? '가까운 세 곡, 옆길 한 곡, 먼 곳의 한 곡은 그대로 둡니다. 그 자리 안에서 조금 더 오래 남을 곡을 다시 고릅니다.' : 'The three close songs, one side road, and one distant song remain. We simply choose again within those places.'}</p>
      </div>
      <button class="button button--primary" type="button" data-action="refresh-recommendations">${korean ? '반응을 읽고 다섯 곡 다시 놓기' : 'Choose the five again'}</button>
    </section>
  `;
}

export function renderNow(app) {
  const copy = app.copy();
  const korean = app.language === 'kr';
  if (!app.profile) {
    renderEmptyProfile(app, copy.nowNeedProfile, copy.beginProfile);
    return;
  }

  if (!app.selectedContextId) {
    const recent = loadNowHistory()[0];
    app.root.innerHTML = `
      <div id="app-notice" class="app-notice"></div>
      <section class="section-heading">
        <span class="eyebrow">${escapeHtml(copy.nowEyebrow)}</span>
        <h1>${escapeHtml(copy.nowTitle)}</h1>
        <p>${escapeHtml(copy.nowDescription)}</p>
      </section>
      ${recent ? `<button class="recent-session" type="button" data-action="restore-context" data-context-id="${escapeHtml(recent.contextId)}"><span>${korean ? '조금 전 골랐던 장면' : 'THE LAST SCENE YOU CHOSE'}</span><strong>${escapeHtml(localize(CONTEXT_BY_ID[recent.contextId]?.label, app.language))}</strong><em aria-hidden="true">→</em></button>` : ''}
      <section class="context-grid" aria-label="${korean ? '지금의 청취 장면' : 'Listening moments for now'}">
        ${VIBE_CONTEXTS.map((context) => `
          <button type="button" class="context-card" data-action="select-context" data-context-id="${escapeHtml(context.id)}">
            <span aria-hidden="true">${escapeHtml(context.icon)}</span><h2>${escapeHtml(localize(context.label, app.language))}</h2><p>${escapeHtml(localize(context.description, app.language))}</p><em aria-hidden="true">→</em>
          </button>
        `).join('')}
      </section>
    `;
    app.renderNotice();
    track('vibe_now_view', { state: 'context_picker', profile_id: app.profile.id, product_version: 'v3-nv1' });
    return;
  }

  const context = CONTEXT_BY_ID[app.selectedContextId];
  app.root.innerHTML = `
    <div id="app-notice" class="app-notice"></div>
    <section class="now-hero">
      <button type="button" class="text-button" data-action="change-context">← ${escapeHtml(copy.nowChange)}</button>
      <div class="now-hero__symbol" aria-hidden="true">${escapeHtml(context.icon)}</div>
      <span class="eyebrow">${escapeHtml(copy.nowEyebrow)} · ${escapeHtml(localize(context.shortLabel, app.language))}</span>
      <h1>${escapeHtml(localize(context.label, app.language))}</h1>
      <p>${escapeHtml(recommendationSummary(app.profile, context.id, app.language))}</p>
    </section>
    <section class="recommendation-list" aria-label="${escapeHtml(copy.nowResultTitle)}">
      <div class="list-heading"><h2>${escapeHtml(copy.nowResultTitle)}</h2><span>${korean ? '가까운 3 · 옆길 1 · 먼 곳 1' : '3 CLOSE · 1 SIDE ROAD · 1 FARTHER OUT'}</span></div>
      ${app.recommendations.map((candidate) => trackCard(candidate, app.language, 'vibe_now', {
        feedbackEnabled: true,
        feedbackValue: app.trackFeedback[candidate.track.id]?.value || '',
        contextId: app.selectedContextId
      })).join('')}
    </section>
    ${refreshPanel(app)}
    <section class="action-band action-band--compact">
      <div><span class="eyebrow">${korean ? '한 사람을 더 떠올렸다면' : 'IF SOMEONE ELSE CAME TO MIND'}</span><h2>${korean ? '이 다섯 곡을 친구의 귀와 나란히 놓아볼 수 있어요.' : 'Set these five songs beside a friend’s way of listening.'}</h2></div>
      <button class="button button--light" type="button" data-route="match">${escapeHtml(copy.openMatch)}</button>
    </section>
  `;
  app.renderNotice();
}
