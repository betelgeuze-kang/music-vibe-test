import { BRAND_COPY } from '../brand/copy.mjs?brand=bd1';
import { decodeProfile, profileFromLegacyType } from '../domain/profile.mjs?v=qg1';
import { mergeActiveSnapshot } from '../domain/timeline.mjs?timeline=m4t1';
import { sevenDayReturnStatus } from '../domain/weekly.mjs?weekly=m4w1';
import {
  loadLatestWeeklyVibe,
  loadProfile,
  loadProfileHistory,
  loadTrackFeedback,
  markReturnVisitTracked,
  recordInteraction,
  registerVisit,
  returnVisitAlreadyTracked
} from '../infrastructure/storage.mjs?weekly=m4w1';
import { actionMethods } from './actions.mjs?weekly=m4w1';
import { renderFooter, renderHeader, UI_RELEASE } from './components/shell.mjs?weekly=m4w1';
import { renderDiscover } from './screens/discover.mjs?ui=f1';
import { renderHome } from './screens/home.mjs?weekly=m4w1';
import { escapeHtml, detectLanguage, extractToken, parseRoute, ROUTES, routeUrl, track } from './helpers.mjs?weekly=m4w1';
import { handleTimelineClick } from './timeline-actions.mjs?timeline=m4t1';
import { handleWeeklyClick } from './weekly-actions.mjs?weekly=m4w1';

export const ENGAGEMENT_RELEASE = 'm4f1';
export const TIMELINE_RELEASE = 'm4t1';
export const WEEKLY_RELEASE = 'm4w1';

export class VibeApp {
  constructor({ root, header, footer }) {
    this.root = root;
    this.header = header;
    this.footer = footer;
    this.language = detectLanguage();
    this.profile = loadProfile();
    this.profileHistory = mergeActiveSnapshot(this.profile, loadProfileHistory());
    this.latestWeeklyVibe = loadLatestWeeklyVibe(this.profile?.id || '');
    this.weeklyAnchorAt = null;
    this.pendingWeeklyContextId = '';
    this.visitRegistration = null;
    this.returnStatus = Object.freeze({ eligible: false, daysSincePrevious: null, anchorAt: null, eventKey: '' });
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
    this.trackFeedback = loadTrackFeedback();
    this.feedbackChangesSinceRefresh = 0;
    this.matchResult = null;
    this.notice = '';
    this.noticeTone = 'neutral';
    this.startedAt = 0;
    this.renderTicket = 0;
    this.boundHashChange = () => this.handleRouteChange();
    this.boundClick = (event) => {
      if (!handleWeeklyClick(this, event) && !handleTimelineClick(this, event)) this.handleClick(event);
    };
    this.boundSubmit = (event) => this.handleSubmit(event);
    this.boundKeydown = (event) => this.handleKeydown(event);
  }

  start() {
    document.documentElement.lang = this.language === 'kr' ? 'ko' : 'en';
    document.documentElement.dataset.testMode = 'vibe-profile-v2-m4w1';
    document.documentElement.dataset.uiRelease = UI_RELEASE;
    document.documentElement.dataset.engagementRelease = ENGAGEMENT_RELEASE;
    document.documentElement.dataset.timelineRelease = TIMELINE_RELEASE;
    document.documentElement.dataset.weeklyRelease = WEEKLY_RELEASE;
    window.addEventListener('hashchange', this.boundHashChange);
    document.addEventListener('click', this.boundClick);
    document.addEventListener('submit', this.boundSubmit);
    document.addEventListener('keydown', this.boundKeydown);

    const visit = registerVisit();
    this.visitRegistration = visit;
    this.returnStatus = sevenDayReturnStatus(visit, this.latestWeeklyVibe);
    if (this.profile && this.returnStatus.eligible && !returnVisitAlreadyTracked(this.returnStatus.eventKey)) {
      track('return_visit_7d', {
        route: this.route,
        product_version: 'v2-m4w1',
        profile_id: this.profile.id,
        days_since_previous: this.returnStatus.daysSincePrevious,
        latest_week_key: this.latestWeeklyVibe?.weekKey || ''
      });
      recordInteraction({
        type: 'return_visit_7d',
        value: String(this.returnStatus.daysSincePrevious),
        placement: 'app_start',
        profileId: this.profile.id
      });
      markReturnVisitTracked(this.returnStatus.eventKey);
    }

    track('route_view', {
      route: this.route,
      product_version: 'v2-m4w1',
      has_profile: Boolean(this.profile),
      previous_visit_at: visit.state.previousVisitAt || ''
    });
    if (this.friendProfile) {
      track('ref_visit', { referral_stage: 'v2_landing', ref_type: this.friendProfile.archetypeId, referral_source: this.friendSource, product_version: 'v2-m4w1' });
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
    if (this.route !== 'weekly') this.weeklyAnchorAt = null;
    track('route_view', { route: this.route, product_version: 'v2-m4w1', has_profile: Boolean(this.profile) });
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
    const module = await import('./screens/profile.mjs?timeline=m4t1');
    module.renderProfile(this);
  }

  async renderWeekly() {
    const module = await import('./screens/weekly.mjs?weekly=m4w1');
    await module.renderWeekly(this);
  }

  async renderNow() {
    if (this.pendingWeeklyContextId && this.profile) {
      const contextId = this.pendingWeeklyContextId;
      this.pendingWeeklyContextId = '';
      await this.selectContext(contextId);
      return;
    }
    const module = await import('./screens/now.mjs?engagement=m4f1');
    module.renderNow(this);
  }

  async renderMatch() {
    const module = await import('./screens/match.mjs?engagement=m4f1');
    module.renderMatch(this);
  }

  async render() {
    const ticket = ++this.renderTicket;
    document.body.dataset.route = this.route;
    document.body.dataset.uiRelease = UI_RELEASE;
    document.body.dataset.engagementRelease = ENGAGEMENT_RELEASE;
    document.body.dataset.timelineRelease = TIMELINE_RELEASE;
    document.body.dataset.weeklyRelease = WEEKLY_RELEASE;
    this.renderHeader();
    this.renderFooter();
    this.updateMeta();

    if (this.route === 'home') this.renderHome();
    else if (this.route === 'discover') this.renderDiscover();
    else if (this.route === 'profile') await this.renderProfile();
    else if (this.route === 'weekly') await this.renderWeekly();
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
      weekly: this.language === 'kr' ? '이번 주의 듣기 기록 | My Music Vibe' : 'My Weekly Vibe | My Music Vibe',
      now: this.language === 'kr' ? '오늘의 선곡 | My Music Vibe' : 'Music for today | My Music Vibe',
      match: this.language === 'kr' ? '같이 듣기 | My Music Vibe' : 'Listen together | My Music Vibe'
    };
    document.title = titles[this.route] || titles.home;
    document.querySelector('meta[name="description"]')?.setAttribute('content', copy.homeDescription);
  }
}

Object.assign(VibeApp.prototype, actionMethods);
