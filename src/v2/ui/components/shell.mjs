import { escapeHtml } from '../helpers.mjs?v3=nv1';

export const UI_RELEASE = 'f1';

export function renderHeader(app) {
  const copy = app.copy();
  const korean = app.language === 'kr';
  const nav = (route, label, shortLabel, icon) => `
    <button type="button" data-route="${route}" class="site-nav__link ${app.route === route ? 'is-active' : ''}" aria-label="${escapeHtml(label)}" ${app.route === route ? 'aria-current="page"' : ''}>
      <span class="site-nav__icon" aria-hidden="true">${escapeHtml(icon)}</span>
      <span class="site-nav__label">${escapeHtml(label)}</span>
      <span class="site-nav__short" aria-hidden="true">${escapeHtml(shortLabel)}</span>
    </button>
  `;
  app.header.innerHTML = `
    <div class="site-header__inner editorial-header">
      <button class="brand editorial-wordmark" type="button" data-route="home" aria-label="${korean ? 'My Music Vibe 첫 장' : 'My Music Vibe first page'}">
        <span class="editorial-wordmark__name">MY MUSIC VIBE</span>
        <span class="editorial-wordmark__issue">HUMAN LISTENING / V3</span>
      </button>
      <nav class="site-nav editorial-nav" aria-label="${korean ? '주요 메뉴' : 'Primary navigation'}">
        ${nav('home', copy.navHome, korean ? '첫 장' : 'Home', '⌂')}
        ${nav('profile', copy.navProfile, korean ? '기록' : 'Notes', '◉')}
        ${app.profile ? nav('weekly', korean ? '이번 주에 오래 머문 소리' : 'What stayed this week', korean ? '이번 주' : 'Week', 'W') : ''}
        ${nav('now', copy.navNow, korean ? '오늘' : 'Today', '♫')}
        ${nav('match', copy.navMatch, korean ? '둘이' : 'Two', '∞')}
      </nav>
      <button type="button" class="language-toggle editorial-language" data-action="toggle-language" aria-label="${korean ? '영어로 보기' : '한국어로 보기'}">${korean ? 'EN' : '한국어'}</button>
    </div>
  `;
}

export function renderFooter(app) {
  const copy = app.copy();
  const korean = app.language === 'kr';
  app.footer.innerHTML = `
    <div class="site-footer__inner editorial-footer commercial-footer">
      <div class="commercial-footer__brand"><strong>MY MUSIC VIBE</strong><span>© ${new Date().getFullYear()} · V3</span></div>
      <p>${escapeHtml(copy.footerNote)}</p>
      <nav class="commercial-footer__links" aria-label="${korean ? '기록·권리·개인정보' : 'Notes, rights, and privacy'}">
        <button type="button" data-route="settings">${korean ? '내 데이터' : 'My data'}</button>
        <button type="button" data-consent-settings>${korean ? '개인정보 설정' : 'Privacy choices'}</button>
        <a href="${korean ? '/about/' : '/en/about/'}">${korean ? '서비스 이야기' : 'About'}</a>
        <a href="${korean ? '/privacy/' : '/en/privacy/'}">${korean ? '개인정보·쿠키' : 'Privacy'}</a>
        <a href="${korean ? '/audio-credits/' : '/en/audio-credits/'}">${korean ? '오디오 권리' : 'Audio rights'}</a>
        <button type="button" data-action="privacy">${escapeHtml(copy.footerPrivacy)} ↗</button>
      </nav>
    </div>
  `;
}
