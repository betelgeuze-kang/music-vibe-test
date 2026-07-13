import { escapeHtml } from '../helpers.mjs?v3=nv1';

export function renderEmptyProfile(app, description, buttonLabel) {
  const korean = app.language === 'kr';
  app.root.innerHTML = `
    <div id="app-notice" class="app-notice"></div>
    <section class="empty-state">
      <span class="empty-state__symbol" aria-hidden="true">♫</span>
      <span class="eyebrow">${korean ? '아직 비어 있는 첫 장' : 'THE FIRST PAGE IS STILL BLANK'}</span>
      <h1>${korean ? '열 번만 귀를 기울이면, 여기서부터 기록이 시작됩니다.' : 'Give ten brief listens, and the notebook begins here.'}</h1>
      <p>${escapeHtml(description)}</p>
      <button type="button" class="button button--primary" data-route="discover">${escapeHtml(buttonLabel)}</button>
    </section>
  `;
}
