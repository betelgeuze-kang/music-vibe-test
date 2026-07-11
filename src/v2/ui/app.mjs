import { BRAND_COPY } from '../brand/copy.mjs?brand=bd1';
import { decodeProfile, profileFromLegacyType } from '../domain/profile.mjs?v=qg1';
import { loadProfile } from '../infrastructure/storage.mjs?v=qg1';
import { actionMethods } from './actions.mjs?ui=f1';
import { renderFooter, renderHeader, UI_RELEASE } from './components/shell.mjs?ui=f1';
import { renderDiscover } from './screens/discover.mjs?ui=f1';
import { renderHome } from './screens/home.mjs?ui=f1';
import { escapeHtml, detectLanguage, extractToken, parseRoute, ROUTES, routeUrl, track } from './helpers.mjs?ui=f1';

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
    this.audioProgress = new Map();
    this.audioErrorIds = new Set();
    this.heardOptionIds = new Set();
    this.selectionLocked = false;
    this.selectionTimer = null;
    this.audioErrorTimer = null;
    this.homePreviewAudio = null;
    this.homePreviewOptionId = '';
    this.homePreviewTimer = null;
    this.homeHeardOptionIds = new Set();
    this.homeAudioErrorIds = new Set();
    this.selectedContextId = '';
    this.recommendations = [];
    this.notice = '';
    this.noticeTone = 'neutral';
    this.startedAt = 0;
    this.renderTicket = 0;
    this.boundHashChange = () => this.handleRouteChange();
    this.boundClick = (event) => this.handleClick(event);
    this.boundSubmit = (event) => this.handleSubmit(event);
    this.boundKeydown = (event) => this.handleKeydown(event);
  }

  start() {
    document.documentElement.lang = this.language === 'kr' ? 'ko' : 'en';
    document.documentElement.dataset.testMode = 'vibe-profile-v2-f1';
    document.documentElement.dataset.uiRelease = UI_RELEASE;
    window.addEventListener('hashchange', this.boundHashChange);
    document.addEventListener('click', this.boundClick);
    document.addEventListener('submit', this.boundSubmit);
    document.addEventListener('keydown', this.boundKeydown);
    if (this.friendProfile) {
      track('ref_visit', { referral_stage: 'v2_landing', ref_type: this.friendProfile.archetypeId, referral_source: this.friendSource, product_version: 'v2-f1' });
      if (this.profile && this.route === 'home') this.route = 'match';
    }
    this.render();
  }

  resolveIncomingProfile() {
    const token = extractToken(window.location.href);
    if (token) return decodeProfile(token);
    const legacy = new URLSearchParams(window.location.search).get('ref');
    return legacy ? profileFromLegacyType(legacy) : null;
  }

  copy() {
    return BRAND_COPY[this.language === 'en' ? 'en' : 'kr'];
  }

  navigate(route, params = null) {
    const safeRoute = ROUTES.has(route) ? route : 'home';
    if (parseRoute() === safeRoute && !params) {
      this.route = safeRoute;
      this.render();
      return;
    }
    window.location.hash = routeUrl(safeRoute, params || {});
  }

  handleRouteChange() {
    this.stopPreview();
    this.stopHomePreview(true);
    this.route = parseRoute();
    this.render();
  }

  setNotice(message, tone = 'neutral') {
    this.notice = message;
    this.noticeTone = tone;
    this.renderNotice();
    window.clearTimeout(this.noticeTimer);
    this.noticeTimer = window.setTimeout(() => { this.notice = ''; this.renderNotice(); }, 3200);
  }

  renderNotice() {
    const host = document.getElementById('app-notice');
    if (!host) return;
    if (!this.notice) { host.innerHTML = ''; host.className = 'app-notice'; return; }
    host.className = `app-notice app-notice--${this.noticeTone}`;
    host.innerHTML = `<span>${escapeHtml(this.notice)}</span>`;
  }

  renderHeader() { renderHeader(this); }
  renderFooter() { renderFooter(this); }
  renderHome() { renderHome(this); }
  renderDiscover() { renderDiscover(this); }

  async renderProfile() {
    const module = await import('./screens/profile.mjs?ui=f1');
    module.renderProfile(this);
  }

  async renderNow() {
    const module = await import('./screens/now.mjs?ui=f1');
    module.renderNow(this);
  }

  async renderMatch() {
    const module = await import('./screens/match.mjs?ui=f1');
    module.renderMatch(this);
  }

  async render() {
    const ticket = ++this.renderTicket;
    document.body.dataset.route = this.route;
    document.body.dataset.uiRelease = UI_RELEASE;
    this.renderHeader();
    this.renderFooter();
    this.updateMeta();

    if (this.route === 'home') this.renderHome();
    else if (this.route === 'discover') this.renderDiscover();
    else if (this.route === 'profile') await this.renderProfile();
    else if (this.route === 'now') await this.renderNow();
    else if (this.route === 'match') await this.renderMatch();
    else this.renderHome();

    if (ticket !== this.renderTicket) return;
    this.renderNotice();
    window.scrollTo({ top: 0, behavior: 'auto' });
  }

  updateMeta() {
    const copy = this.copy();
    const titles = {
      home: this.language === 'kr' ? 'My Music Vibe — 내가 좋아하는 소리엔 이유가 있어요' : 'My Music Vibe — There is a reason some sounds stay with you',
      discover: this.language === 'kr' ? '듣고 고르기 | My Music Vibe' : 'Listen and choose | My Music Vibe',
      profile: this.language === 'kr' ? '내 취향 기록 | My Music Vibe' : 'My taste notes | My Music Vibe',
      now: this.language === 'kr' ? '오늘의 선곡 | My Music Vibe' : 'Music for today | My Music Vibe',
      match: this.language === 'kr' ? '같이 듣기 | My Music Vibe' : 'Listen together | My Music Vibe'
    };
    document.title = titles[this.route] || titles.home;
    document.querySelector('meta[name="description"]')?.setAttribute('content', copy.homeDescription);
  }
}

Object.assign(VibeApp.prototype, actionMethods);
