import { COPY } from '../data/copy.mjs';
import { decodeProfile, profileFromLegacyType } from '../domain/profile.mjs';
import { loadProfile } from '../infrastructure/storage.mjs';
import { actionMethods } from './actions.mjs';
import { escapeHtml, detectLanguage, parseRoute, ROUTES, track } from './helpers.mjs';
import { screenMethods } from './screens.mjs';

export class VibeApp {
  constructor({ root, header, footer }) {
    this.root = root;
    this.header = header;
    this.footer = footer;
    this.language = detectLanguage();
    this.profile = loadProfile();
    this.friendProfile = this.resolveIncomingProfile();
    this.friendSource = this.friendProfile?.source || '';
    this.route = parseRoute();
    this.answers = [];
    this.quizIndex = 0;
    this.previewAudio = null;
    this.previewOptionId = '';
    this.previewTimeout = null;
    this.selectedContextId = '';
    this.recommendations = [];
    this.notice = '';
    this.noticeTone = 'neutral';
    this.startedAt = 0;
    this.boundHashChange = () => this.handleRouteChange();
    this.boundClick = (event) => this.handleClick(event);
    this.boundSubmit = (event) => this.handleSubmit(event);
  }

  start() {
    document.documentElement.lang = this.language === 'kr' ? 'ko' : 'en';
    document.documentElement.dataset.testMode = 'vibe-profile-v2';
    window.addEventListener('hashchange', this.boundHashChange);
    document.addEventListener('click', this.boundClick);
    document.addEventListener('submit', this.boundSubmit);

    if (this.friendProfile) {
      track('ref_visit', {
        referral_stage: 'v2_landing',
        ref_type: this.friendProfile.archetypeId,
        referral_source: this.friendSource
      });
      if (this.profile && this.route === 'home') this.route = 'match';
    }

    this.render();
  }

  resolveIncomingProfile() {
    const params = new URLSearchParams(window.location.search);
    const token = params.get('compare');
    if (token) return decodeProfile(token);
    const legacy = params.get('ref');
    if (legacy) return profileFromLegacyType(legacy);
    return null;
  }

  copy() {
    return COPY[this.language];
  }

  navigate(route) {
    const safeRoute = ROUTES.has(route) ? route : 'home';
    if (parseRoute() === safeRoute) {
      this.route = safeRoute;
      this.render();
      return;
    }
    window.location.hash = `/${safeRoute}`;
  }

  handleRouteChange() {
    this.stopPreview();
    this.route = parseRoute();
    this.render();
  }

  setNotice(message, tone = 'neutral') {
    this.notice = message;
    this.noticeTone = tone;
    this.renderNotice();
    window.clearTimeout(this.noticeTimer);
    this.noticeTimer = window.setTimeout(() => {
      this.notice = '';
      this.renderNotice();
    }, 3200);
  }

  renderNotice() {
    const host = document.getElementById('app-notice');
    if (!host) return;
    if (!this.notice) {
      host.innerHTML = '';
      host.className = 'app-notice';
      return;
    }
    host.className = `app-notice app-notice--${this.noticeTone}`;
    host.innerHTML = `<span>${escapeHtml(this.notice)}</span>`;
  }

  render() {
    this.renderHeader();
    this.renderFooter();
    this.updateMeta();

    if (this.route === 'discover') this.renderDiscover();
    else if (this.route === 'profile') this.renderProfile();
    else if (this.route === 'now') this.renderNow();
    else if (this.route === 'match') this.renderMatch();
    else this.renderHome();

    this.renderNotice();
    window.scrollTo({ top: 0, behavior: 'auto' });
  }

  renderHeader() {
    const copy = this.copy();
    const active = (route) => this.route === route ? 'aria-current="page" class="site-nav__link is-active"' : 'class="site-nav__link"';
    this.header.innerHTML = `
      <div class="site-header__inner">
        <button class="brand" type="button" data-route="home" aria-label="Music Vibe home">
          <span class="brand__mark">MV</span>
          <span class="brand__copy"><strong>MY MUSIC VIBE</strong><small>${escapeHtml(copy.brandTag)}</small></span>
        </button>
        <nav class="site-nav" aria-label="Primary navigation">
          <button type="button" data-route="home" ${active('home')}>${escapeHtml(copy.navHome)}</button>
          <button type="button" data-route="profile" ${active('profile')}>${escapeHtml(copy.navProfile)}</button>
          <button type="button" data-route="now" ${active('now')}>${escapeHtml(copy.navNow)}</button>
          <button type="button" data-route="match" ${active('match')}>${escapeHtml(copy.navMatch)}</button>
        </nav>
        <button type="button" class="language-toggle" data-action="toggle-language" aria-label="Change language">${this.language === 'kr' ? 'EN' : '한국어'}</button>
      </div>
    `;
  }

  renderFooter() {
    const copy = this.copy();
    this.footer.innerHTML = `
      <div class="site-footer__inner">
        <p>© ${new Date().getFullYear()} My Music Vibe</p>
        <p>${escapeHtml(copy.footerNote)}</p>
        <button type="button" data-action="privacy">${escapeHtml(copy.footerPrivacy)}</button>
      </div>
    `;
  }

  updateMeta() {
    const copy = this.copy();
    const titles = {
      home: this.language === 'kr' ? 'My Music Vibe — 지금의 나를 음악으로 번역해요' : 'My Music Vibe — Translate yourself into music',
      discover: this.language === 'kr' ? 'Vibe Profile 만들기 | My Music Vibe' : 'Create your Vibe Profile | My Music Vibe',
      profile: this.language === 'kr' ? '나의 Vibe Profile | My Music Vibe' : 'My Vibe Profile | My Music Vibe',
      now: this.language === 'kr' ? 'Vibe Now — 지금 들을 5곡' : 'Vibe Now — Five tracks for this moment',
      match: this.language === 'kr' ? 'Vibe Match — 친구와 음악 궁합' : 'Vibe Match — Compare music taste'
    };
    document.title = titles[this.route] || titles.home;
    document.querySelector('meta[name="description"]')?.setAttribute('content', copy.homeDescription);
  }
}

Object.assign(VibeApp.prototype, screenMethods, actionMethods);
