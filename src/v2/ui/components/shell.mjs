import { escapeHtml } from '../helpers.mjs?weekly=m4w1';

export const UI_RELEASE = 'f1';

export function renderHeader(app) {
  const copy = app.copy();
  const nav = (route, label) => `
    <button type="button" data-route="${route}" class="site-nav__link ${app.route === route ? 'is-active' : ''}" ${app.route === route ? 'aria-current="page"' : ''}>${escapeHtml(label)}</button>
  `;
  app.header.innerHTML = `
    <div class="site-header__inner editorial-header">
      <button class="brand editorial-wordmark" type="button" data-route="home" aria-label="My Music Vibe home">
        <span class="editorial-wordmark__name">MY MUSIC VIBE</span>
        <span class="editorial-wordmark__issue">LISTENING NOTES / M4 WEEKLY</span>
      </button>
      <nav class="site-nav editorial-nav" aria-label="${app.language === 'kr' ? '주요 메뉴' : 'Primary navigation'}">
        ${nav('home', copy.navHome)}
        ${nav('profile', copy.navProfile)}
        ${app.profile ? nav('weekly', app.language === 'kr' ? '이번 주' : 'This week') : ''}
        ${nav('now', copy.navNow)}
        ${nav('match', copy.navMatch)}
      </nav>
      <button type="button" class="language-toggle editorial-language" data-action="toggle-language" aria-label="${app.language === 'kr' ? '영어로 보기' : '한국어로 보기'}">${app.language === 'kr' ? 'EN' : '한국어'}</button>
    </div>
  `;
}

export function renderFooter(app) {
  const copy = app.copy();
  app.footer.innerHTML = `
    <div class="site-footer__inner editorial-footer">
      <div><strong>MY MUSIC VIBE</strong><span>© ${new Date().getFullYear()}</span></div>
      <p>${escapeHtml(copy.footerNote)}</p>
      <button type="button" data-action="privacy">${escapeHtml(copy.footerPrivacy)} ↗</button>
    </div>
  `;
}
