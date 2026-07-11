import { escapeHtml } from '../helpers.mjs?ui=f1';

export function renderEmptyProfile(app, description, buttonLabel) {
  app.root.innerHTML = `
    <div id="app-notice" class="app-notice"></div>
    <section class="empty-state">
      <span class="empty-state__symbol" aria-hidden="true">♫</span>
      <span class="eyebrow">${app.language === 'kr' ? '취향 기록이 필요해요' : 'TASTE NOTES REQUIRED'}</span>
      <h1>${app.language === 'kr' ? '먼저 나의 음악 취향을 만들어볼까요?' : 'Create your music taste notes first.'}</h1>
      <p>${escapeHtml(description)}</p>
      <button type="button" class="button button--primary" data-route="discover">${escapeHtml(buttonLabel)}</button>
    </section>
  `;
}
