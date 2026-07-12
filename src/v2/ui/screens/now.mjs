import { VIBE_CONTEXTS, CONTEXT_BY_ID } from '../../data/contexts.mjs?v=qg1';
import { localize } from '../../domain/profile.mjs?v=qg1';
import { recommendationSummary } from '../../domain/recommendation.mjs?engagement=m4f1';
import { loadNowHistory } from '../../infrastructure/storage.mjs?engagement=m4f1';
import { escapeHtml, track, trackCard } from '../helpers.mjs?engagement=m4f1';
import { renderEmptyProfile } from './empty.mjs?ui=f1';

function refreshPanel(app) {
  if (app.feedbackChangesSinceRefresh < 2) return '';
  return `
    <section class="feedback-refresh" aria-live="polite">
      <div>
        <span class="eyebrow">${app.language === 'kr' ? '내 반응 반영' : 'USE MY FEEDBACK'}</span>
        <h2>${app.language === 'kr' ? '반응을 반영해 5곡을 다시 골라볼까요?' : 'Refresh these five tracks using your feedback?'}</h2>
        <p>${app.language === 'kr' ? '현재 취향과 3·1·1 구성은 유지하고, 각 자리 안에서 더 잘 맞는 곡을 찾습니다.' : 'Your taste profile and the 3/1/1 mix stay intact; only the candidates within each slot are reconsidered.'}</p>
      </div>
      <button class="button button--primary" type="button" data-action="refresh-recommendations">${app.language === 'kr' ? '반응을 반영해 다시 고르기' : 'Refresh the five tracks'}</button>
    </section>
  `;
}

export function renderNow(app) {
  const copy = app.copy();
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
      ${recent ? `<button class="recent-session" type="button" data-action="restore-context" data-context-id="${escapeHtml(recent.contextId)}"><span>${app.language === 'kr' ? '최근 선택' : 'Recent'}</span><strong>${escapeHtml(localize(CONTEXT_BY_ID[recent.contextId]?.label, app.language))}</strong><em aria-hidden="true">→</em></button>` : ''}
      <section class="context-grid">
        ${VIBE_CONTEXTS.map((context) => `
          <button type="button" class="context-card" data-action="select-context" data-context-id="${escapeHtml(context.id)}">
            <span aria-hidden="true">${escapeHtml(context.icon)}</span><h2>${escapeHtml(localize(context.label, app.language))}</h2><p>${escapeHtml(localize(context.description, app.language))}</p><em aria-hidden="true">→</em>
          </button>
        `).join('')}
      </section>
    `;
    app.renderNotice();
    track('vibe_now_view', { state: 'context_picker', profile_id: app.profile.id, product_version: 'v2-m4' });
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
      <div class="list-heading"><h2>${escapeHtml(copy.nowResultTitle)}</h2><span>${app.recommendations.length} TRACKS</span></div>
      ${app.recommendations.map((candidate) => trackCard(candidate, app.language, 'vibe_now', {
        feedbackEnabled: true,
        feedbackValue: app.trackFeedback[candidate.track.id]?.value || '',
        contextId: app.selectedContextId
      })).join('')}
    </section>
    ${refreshPanel(app)}
    <section class="action-band action-band--compact">
      <div><span class="eyebrow">${app.language === 'kr' ? '같이 듣기' : 'LISTEN TOGETHER'}</span><h2>${app.language === 'kr' ? '이 선곡을 친구 취향과 섞어볼까요?' : 'Blend this direction with a friend’s taste.'}</h2></div>
      <button class="button button--light" type="button" data-route="match">${escapeHtml(copy.openMatch)}</button>
    </section>
  `;
  app.renderNotice();
}
