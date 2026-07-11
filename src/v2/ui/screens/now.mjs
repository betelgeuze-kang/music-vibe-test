import { VIBE_CONTEXTS, CONTEXT_BY_ID } from '../../data/contexts.mjs?v=qg1';
import { localize } from '../../domain/profile.mjs?v=qg1';
import { recommendationSummary } from '../../domain/recommendation.mjs';
import { loadNowHistory } from '../../infrastructure/storage.mjs?v=qg1';
import { escapeHtml, track, trackCard } from '../helpers.mjs?ui=f1';
import { renderEmptyProfile } from './empty.mjs?ui=f1';

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
    track('vibe_now_view', { state: 'context_picker', profile_id: app.profile.id, product_version: 'v2-f1' });
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
      ${app.recommendations.map((candidate) => trackCard(candidate, app.language, 'vibe_now')).join('')}
    </section>
    <section class="action-band action-band--compact">
      <div><span class="eyebrow">${app.language === 'kr' ? '같이 듣기' : 'LISTEN TOGETHER'}</span><h2>${app.language === 'kr' ? '이 선곡을 친구 취향과 섞어볼까요?' : 'Blend this direction with a friend’s taste.'}</h2></div>
      <button class="button button--light" type="button" data-route="match">${escapeHtml(copy.openMatch)}</button>
    </section>
  `;
}
