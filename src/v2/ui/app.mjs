import { BRAND_COPY } from '../brand/copy.mjs?v3=nv1';
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
import { commercialAudioMethods } from './commercial-audio-actions.mjs?commercial=cr1';
import { renderFooter, renderHeader, UI_RELEASE } from './components/shell.mjs?v3=nv1';
import { closeOpenAppDialogs, showPrivacyDialog } from './dialogs.mjs?v3=nv1';
import { handleDataChange, handleDataClick } from './data-actions.mjs?data=data1';
import { renderDiscover } from './screens/discover.mjs?v3=nv1';
import { renderHome } from './screens/home.mjs?v3=nv1';
import { escapeHtml, detectLanguage, extractToken, parseRoute, ROUTES, routeUrl, track } from './helpers.mjs?v3=nv1';
import { handleTimelineClick } from './timeline-actions.mjs?v3=nv1';
import { handleWeeklyClick } from './weekly-actions.mjs?v3=nv1';

export const ENGAGEMENT_RELEASE = 'm4f1';
export const TIMELINE_RELEASE = 'm4t1';
export const WEEKLY_RELEASE = 'm4w1';
export const FRONTEND_QUALITY_RELEASE = 'fq1';
export const HUMAN_EDITORIAL_RELEASE = 'he1';
export const COMMERCIAL_READINESS_RELEASE = 'cr1';
export const PRIVACY_RELEASE = 'pv1';
export const NARRATIVE_RELEASE = 'nv1';
export const DATA_RELEASE = 'data1';
export const PERFORMANCE_RELEASE = 'perf1';

const ROUTE_IMPORTS = Object.freeze({
  profile: () => import('./screens/profile.mjs?v3=nv1'),
  weekly: () => import('./screens/weekly.mjs?v3=nv1'),
  now: () => import('./screens/now.mjs?v3=nv1'),
  match: () => import('./screens/match.mjs?v3=nv1'),
  settings: () => import('./screens/settings.mjs?data=data1')
});

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
    this.noticeTimer = null;
    this.startedAt = 0;
    this.renderTicket = 0;
    this.routePromises = new Map();
    this.showPrivacy = () => showPrivacyDialog(this);
    this.boundHashChange = () => this.handleRouteChange();
    this.boundClick = async (event) => {
      if (await handleDataClick(this, event)) return;
      if (!handleWeeklyClick(this, event) && !handleTimelineClick(this, event)) this.handleClick(event);
    };
    this.boundChange = (event) => handleDataChange(this, event);
    this.boundSubmit = (event) => this.handleSubmit(event);
    this.boundKeydown = (event) => this.handleKeydown(event);
    this.boundIntent = (event) => {
      const route = event.target.closest?.('[data-route]')?.dataset?.route;
      if (route) this.prefetchRoute(route);
    };
  }

  start() {
    document.documentElement.lang = this.language === 'kr' ? 'ko' : 'en';
    document.documentElement.dataset.testMode = 'v3-human-listening';
    document.documentElement.dataset.uiRelease = UI_RELEASE;
    document.documentElement.dataset.engagementRelease = ENGAGEMENT_RELEASE;
    document.documentElement.dataset.timelineRelease = TIMELINE_RELEASE;
    document.documentElement.dataset.weeklyRelease = WEEKLY_RELEASE;
    document.documentElement.dataset.frontendQualityRelease = FRONTEND_QUALITY_RELEASE;
    document.documentElement.dataset.humanEditorialRelease = HUMAN_EDITORIAL_RELEASE;
    document.documentElement.dataset.commercialReadinessRelease = COMMERCIAL_READINESS_RELEASE;
    document.documentElement.dataset.privacyRelease = PRIVACY_RELEASE;
    document.documentElement.dataset.narrativeRelease = NARRATIVE_RELEASE;
    document.documentElement.dataset.dataRelease = DATA_RELEASE;
    document.documentElement.dataset.performanceRelease = PERFORMANCE_RELEASE;
    window.addEventListener('hashchange', this.boundHashChange);
    document.addEventListener('click', this.boundClick);
    document.addEventListener('change', this.boundChange);
    document.addEventListener('submit', this.boundSubmit);
    document.addEventListener('keydown', this.boundKeydown);
    document.addEventListener('pointerover', this.boundIntent, { passive: true });
    document.addEventListener('focusin', this.boundIntent);

    const visit = registerVisit();
    this.visitRegistration = visit;
    this.returnStatus = sevenDayReturnStatus(visit, this.latestWeeklyVibe);
    if (this.profile && this.returnStatus.eligible && !returnVisitAlreadyTracked(this.returnStatus.eventKey)) {
      track('return_visit_7d', {
        route: this.route,
        product_version: 'v3',
        profile_id: this.profile.id,
        days_since_previous: this.returnStatus.daysSincePrevious,
        latest_week_key: this.latestWeeklyVibe?.weekKey || ''
      });
      recordInteraction({ type: 'return_visit_7d', value: String(this.returnStatus.daysSincePrevious), placement: 'app_start', profileId: this.profile.id });
      markReturnVisitTracked(this.returnStatus.eventKey);
    }

    track('route_view', { route: this.route, product_version: 'v3', has_profile: Boolean(this.profile), previous_visit_at: visit.state.previousVisitAt || '' });
    if (this.friendProfile) {
      track('ref_visit', { referral_stage: 'v3_landing', ref_type: this.friendProfile.archetypeId, referral_source: this.friendSource, product_version: 'v3' });
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

  prefetchRoute(route) {
    if (!ROUTE_IMPORTS[route] || this.routePromises.has(route)) return;
    const started = performance.now();
    const promise = ROUTE_IMPORTS[route]().then((module) => {
      track('route_module_load', { route, route_module_load_ms: Math.round(performance.now() - started), prefetch: true, product_version: 'v3-perf1' });
      return module;
    }).catch((error) => {
      this.routePromises.delete(route);
      throw error;
    });
    this.routePromises.set(route, promise);
  }

  async routeModule(route) {
    const loader = ROUTE_IMPORTS[route];
    if (!loader) return null;
    if (this.routePromises.has(route)) return this.routePromises.get(route);
    const started = performance.now();
    const promise = loader().then((module) => {
      track('route_module_load', { route, route_module_load_ms: Math.round(performance.now() - started), prefetch: false, product_version: 'v3-perf1' });
      return module;
    });
    this.routePromises.set(route, promise);
    return promise;
  }

  navigate(route, params = null) {
    const safeRoute = ROUTES.has(route) ? route : 'home';
    if (parseRoute() === safeRoute && !params) {
      this.route = safeRoute;
      this.clearNotice();
      this.render();
      return;
    }
    window.location.hash = routeUrl(safeRoute, params || {});
  }

  handleRouteChange() {
    this.stopPreview();
    this.stopHomePreview(true);
    this.clearNotice();
    closeOpenAppDialogs();
    this.route = parseRoute();
    if (this.route !== 'weekly') this.weeklyAnchorAt = null;
    track('route_view', { route: this.route, product_version: 'v3', has_profile: Boolean(this.profile) });
    this.render();
  }

  clearNotice() {
    window.clearTimeout(this.noticeTimer);
    this.noticeTimer = null;
    this.notice = '';
    this.noticeTone = 'neutral';
    this.renderNotice();
  }

  setNotice(message, tone = 'neutral') {
    this.notice = message;
    this.noticeTone = tone;
    this.renderNotice();
    window.clearTimeout(this.noticeTimer);
    this.noticeTimer = window.setTimeout(() => this.clearNotice(), 3600);
  }

  renderNotice() {
    const host = document.getElementById('app-notice');
    if (!host) return;
    host.setAttribute('aria-live', this.noticeTone === 'error' ? 'assertive' : 'polite');
    host.setAttribute('aria-atomic', 'true');
    host.setAttribute('role', this.noticeTone === 'error' ? 'alert' : 'status');
    if (!this.notice) { host.innerHTML = ''; host.className = 'app-notice'; return; }
    host.className = `app-notice app-notice--${this.noticeTone}`;
    host.innerHTML = `<span>${escapeHtml(this.notice)}</span>`;
  }

  renderHeader() { renderHeader(this); }
  renderFooter() { renderFooter(this); }
  renderHome() { renderHome(this); }
  renderDiscover() { renderDiscover(this); }

  async renderProfile() { (await this.routeModule('profile')).renderProfile(this); }
  async renderWeekly() { await (await this.routeModule('weekly')).renderWeekly(this); }

  async renderNow() {
    if (this.pendingWeeklyContextId && this.profile) {
      const contextId = this.pendingWeeklyContextId;
      this.pendingWeeklyContextId = '';
      await this.selectContext(contextId);
      return;
    }
    (await this.routeModule('now')).renderNow(this);
  }

  async renderMatch() { (await this.routeModule('match')).renderMatch(this); }
  async renderSettings() { (await this.routeModule('settings')).renderSettings(this); }

  async render() {
    const ticket = ++this.renderTicket;
    document.body.dataset.route = this.route;
    document.body.dataset.v3Release = 'v3';
    document.body.dataset.uiRelease = UI_RELEASE;
    document.body.dataset.engagementRelease = ENGAGEMENT_RELEASE;
    document.body.dataset.timelineRelease = TIMELINE_RELEASE;
    document.body.dataset.weeklyRelease = WEEKLY_RELEASE;
    document.body.dataset.frontendQualityRelease = FRONTEND_QUALITY_RELEASE;
    document.body.dataset.humanEditorialRelease = HUMAN_EDITORIAL_RELEASE;
    document.body.dataset.commercialReadinessRelease = COMMERCIAL_READINESS_RELEASE;
    document.body.dataset.privacyRelease = PRIVACY_RELEASE;
    document.body.dataset.narrativeRelease = NARRATIVE_RELEASE;
    document.body.dataset.dataRelease = DATA_RELEASE;
    document.body.dataset.performanceRelease = PERFORMANCE_RELEASE;
    this.renderHeader();
    this.renderFooter();
    this.updateMeta();

    if (this.route === 'home') this.renderHome();
    else if (this.route === 'discover') this.renderDiscover();
    else if (this.route === 'profile') await this.renderProfile();
    else if (this.route === 'weekly') await this.renderWeekly();
    else if (this.route === 'now') await this.renderNow();
    else if (this.route === 'match') await this.renderMatch();
    else if (this.route === 'settings') await this.renderSettings();
    else this.renderHome();

    if (ticket !== this.renderTicket) return;
    this.renderNotice();
    window.scrollTo({ top: 0, behavior: 'auto' });
  }

  updateMeta() {
    const copy = this.copy();
    const titles = {
      home: this.language === 'kr' ? 'My Music Vibe — 귀가 먼저 알아챈 마음' : 'My Music Vibe — What the ear noticed first',
      discover: this.language === 'kr' ? '열 번의 짧은 선택 | My Music Vibe' : 'Ten brief choices | My Music Vibe',
      profile: this.language === 'kr' ? '내가 남긴 듣기 기록 | My Music Vibe' : 'My listening note | My Music Vibe',
      weekly: this.language === 'kr' ? '이번 주에 오래 머문 소리 | My Music Vibe' : 'The sounds that stayed this week | My Music Vibe',
      now: this.language === 'kr' ? '오늘 곁에 둘 다섯 곡 | My Music Vibe' : 'Five songs to keep nearby | My Music Vibe',
      match: this.language === 'kr' ? '두 사람 사이에 놓을 음악 | My Music Vibe' : 'Music to place between two people | My Music Vibe',
      settings: this.language === 'kr' ? '내 데이터와 개인정보 | My Music Vibe' : 'My data and privacy | My Music Vibe'
    };
    document.title = titles[this.route] || titles.home;
    document.querySelector('meta[name="description"]')?.setAttribute('content', copy.homeDescription);
  }
}

Object.assign(VibeApp.prototype, actionMethods, commercialAudioMethods);
