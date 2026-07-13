// PV1 consent-aware analytics, attribution, quality monitoring, and privacy controls.
(() => {
  'use strict';

  const CONSENT_KEY = 'music-vibe-consent-v2';
  const CONSENT_VERSION = 3;
  const GA_MEASUREMENT_ID = 'G-XJ8Z43C6LQ';
  const VISITOR_KEY = 'music-vibe-visitor-v1';
  const SESSION_KEY = 'music-vibe-session-v1';
  const ATTRIBUTION_KEY = 'music-vibe-attribution-v2';
  const MAX_PENDING_EVENTS = 120;
  const MAX_DEBUG_EVENTS = 80;
  const DEDUPE_WINDOW_MS = 800;
  const startedAt = Date.now();

  const pendingEvents = [];
  const debugEvents = [];
  const recentFingerprints = new Map();
  let gaLoadPromise = null;
  let gaConfigured = false;
  let performanceSent = false;
  let persistentVisitorId = null;
  const ephemeralVisitorId = randomId('mve');

  const performanceState = {
    fcpMs: 0,
    lcpMs: 0,
    cls: 0,
    fidMs: 0,
    inpMs: 0,
    longTaskMs: 0
  };

  // Historical runtime hooks remain available to old static pages and rollback tools.
  window.__musicVibeLegacyFlow = Object.freeze({
    startTest: window.startTest,
    renderTest: window.renderTest,
    handleAnswer: window.handleAnswer,
    calculateResult: window.calculateResult,
    renderIntro: window.renderIntro,
    renderResult: window.renderResult,
    renderLoading: window.renderLoading,
    confirmSound: window.confirmSound
  });

  function safeLocalGet(key) {
    try { return window.localStorage.getItem(key); } catch (_) { return null; }
  }

  function safeLocalSet(key, value) {
    try { window.localStorage.setItem(key, value); return true; } catch (_) { return false; }
  }

  function safeLocalRemove(key) {
    try { window.localStorage.removeItem(key); return true; } catch (_) { return false; }
  }

  function safeSessionGet(key) {
    try { return window.sessionStorage.getItem(key); } catch (_) { return null; }
  }

  function safeSessionSet(key, value) {
    try { window.sessionStorage.setItem(key, value); return true; } catch (_) { return false; }
  }

  function parseJson(value, fallback) {
    if (!value) return fallback;
    try { return JSON.parse(value); } catch (_) { return fallback; }
  }

  function randomId(prefix) {
    const random = window.crypto?.getRandomValues
      ? Array.from(window.crypto.getRandomValues(new Uint32Array(2))).map((part) => part.toString(36)).join('')
      : Math.random().toString(36).slice(2) + Date.now().toString(36);
    return `${prefix}_${random.slice(0, 16)}`;
  }

  function getSessionId() {
    let value = safeSessionGet(SESSION_KEY);
    if (!value) {
      value = randomId('mvs');
      safeSessionSet(SESSION_KEY, value);
    }
    return value;
  }

  const sessionId = getSessionId();
  const visitId = randomId('mvv');

  function defaultConsent() {
    return {
      version: CONSENT_VERSION,
      decided: false,
      analytics: false,
      adMeasurement: false,
      personalizedAds: false,
      updatedAt: null
    };
  }

  function normalizeConsent(raw) {
    if (raw === 'accepted') {
      return { ...defaultConsent(), decided: true, analytics: true, updatedAt: new Date().toISOString() };
    }
    if (raw === 'declined') {
      return { ...defaultConsent(), decided: true, updatedAt: new Date().toISOString() };
    }
    const parsed = parseJson(raw, null);
    if (!parsed || typeof parsed !== 'object') return defaultConsent();
    return {
      version: CONSENT_VERSION,
      decided: Boolean(parsed.decided ?? true),
      analytics: Boolean(parsed.analytics),
      adMeasurement: Boolean(parsed.adMeasurement),
      personalizedAds: Boolean(parsed.personalizedAds),
      updatedAt: parsed.updatedAt ? String(parsed.updatedAt) : null
    };
  }

  let consentState = normalizeConsent(safeLocalGet(CONSENT_KEY));

  function adsAvailable() {
    return document.body?.dataset?.adsEnabled === 'true';
  }

  function normalizedPreferences(next = {}) {
    const analytics = Boolean(next.analytics);
    const canUseAds = adsAvailable();
    const adMeasurement = canUseAds && Boolean(next.adMeasurement);
    const personalizedAds = adMeasurement && Boolean(next.personalizedAds);
    return {
      version: CONSENT_VERSION,
      decided: true,
      analytics,
      adMeasurement,
      personalizedAds,
      updatedAt: new Date().toISOString()
    };
  }

  function rawGtag() {
    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push(arguments);
  }

  function consentPayload(state = consentState) {
    return {
      analytics_storage: state.analytics ? 'granted' : 'denied',
      ad_storage: state.adMeasurement ? 'granted' : 'denied',
      ad_user_data: state.adMeasurement ? 'granted' : 'denied',
      ad_personalization: state.personalizedAds ? 'granted' : 'denied'
    };
  }

  // Consent is denied before any Google script is requested. Individual values are
  // updated only after a user makes the matching choice.
  rawGtag('consent', 'default', { ...consentPayload(defaultConsent()), wait_for_update: 500 });

  function currentLanguage() {
    const bodyLanguage = document.body?.dataset?.language;
    if (bodyLanguage) return bodyLanguage;
    try { if (typeof currentLang === 'string') return currentLang; } catch (_) {}
    return document.documentElement.lang || 'en';
  }

  function currentResultType() {
    const bodyResult = document.body?.dataset?.resultType;
    if (bodyResult) return bodyResult.toUpperCase();
    try { if (finalResult?.mbti) return String(finalResult.mbti).toUpperCase(); } catch (_) {}
    return '';
  }

  function pageType() {
    const explicit = document.body?.dataset?.pageType;
    if (explicit) return explicit;
    if (/\/(?:ko|en)\/(?:results|vibes|moments)\//i.test(window.location.pathname)) return 'static_editorial';
    return 'app';
  }

  function normalizeTestMode(value) {
    return String(value || '').replaceAll('-', '_').slice(0, 30);
  }

  function sanitizeValue(value) {
    if (value === undefined || value === null || value === '') return undefined;
    if (typeof value === 'boolean' || typeof value === 'number') return value;
    if (Array.isArray(value)) return value.slice(0, 10).map(sanitizeValue).filter((item) => item !== undefined);
    return String(value).replace(/\s+/g, ' ').trim().slice(0, 100);
  }

  function sanitizeParams(params) {
    const output = {};
    Object.entries(params || {}).forEach(([key, value]) => {
      const safeKey = String(key).replace(/[^a-zA-Z0-9_]/g, '_').slice(0, 40);
      const safeValue = sanitizeValue(value);
      if (safeValue !== undefined) output[safeKey] = safeValue;
    });
    return output;
  }

  function isSharedEntry(params, source, medium, explicitRef) {
    const normalizedSource = String(source || '').toLowerCase();
    const normalizedMedium = String(medium || '').toLowerCase();
    return Boolean(
      explicitRef
      || ['share', 'shared_result', 'static_result', 'social'].includes(normalizedSource)
      || ['share', 'social', 'referral'].includes(normalizedMedium)
      || params.get('shared') === '1'
    );
  }

  function readAttribution() {
    const params = new URLSearchParams(window.location.search);
    const existing = parseJson(safeSessionGet(ATTRIBUTION_KEY), {});
    const explicitRef = (params.get('ref') || '').toUpperCase();
    const source = params.get('src') || params.get('source') || existing.source || '';
    const utmMedium = params.get('utm_medium') || existing.utm_medium || '';
    const pathResult = window.location.pathname.match(/\/results\/([a-z]{4})\/?$/i)?.[1]?.toUpperCase() || '';
    const sharedEntry = isSharedEntry(params, source, utmMedium, explicitRef);
    let referrerHost = existing.referrer_host || '';
    if (document.referrer) {
      try { referrerHost = new URL(document.referrer).hostname.slice(0, 100); } catch (_) { referrerHost = ''; }
    }
    const incoming = {
      ref_type: explicitRef || (sharedEntry ? pathResult : '') || existing.ref_type || '',
      source,
      shared_entry: sharedEntry || Boolean(existing.shared_entry),
      utm_source: params.get('utm_source') || existing.utm_source || '',
      utm_medium: utmMedium,
      utm_campaign: params.get('utm_campaign') || existing.utm_campaign || '',
      utm_content: params.get('utm_content') || existing.utm_content || '',
      utm_term: params.get('utm_term') || existing.utm_term || '',
      referrer_host: referrerHost
    };
    safeSessionSet(ATTRIBUTION_KEY, JSON.stringify(incoming));
    return incoming;
  }

  const attribution = readAttribution();

  function ensurePersistentVisitorId() {
    if (!consentState.analytics) return null;
    if (persistentVisitorId) return persistentVisitorId;
    persistentVisitorId = safeLocalGet(VISITOR_KEY);
    if (!persistentVisitorId) {
      persistentVisitorId = randomId('mvu');
      safeLocalSet(VISITOR_KEY, persistentVisitorId);
    }
    return persistentVisitorId;
  }

  function currentVisitorId() {
    return consentState.analytics ? ensurePersistentVisitorId() : ephemeralVisitorId;
  }

  function commonParams() {
    const experiment = window.__musicVibeExperimentContext || {};
    return sanitizeParams({
      visitor_id: currentVisitorId(),
      visitor_scope: consentState.analytics ? 'persistent' : 'ephemeral',
      session_id: sessionId,
      visit_id: visitId,
      page_type: pageType(),
      page_path: window.location.pathname,
      language: currentLanguage(),
      result_type: currentResultType(),
      test_mode: normalizeTestMode(document.documentElement.dataset.testMode || ''),
      ref_type: attribution.ref_type,
      traffic_source: attribution.source,
      shared_entry: Boolean(attribution.shared_entry),
      utm_source: attribution.utm_source,
      utm_medium: attribution.utm_medium,
      utm_campaign: attribution.utm_campaign,
      utm_content: attribution.utm_content,
      utm_term: attribution.utm_term,
      referrer_host: attribution.referrer_host,
      experiment_id: experiment.id || '',
      experiment_variant: experiment.variant || ''
    });
  }

  function eventFingerprint(name, params) {
    const keys = ['question_id', 'question_number', 'result_type', 'result_origin', 'placement', 'share_method', 'track_id', 'referral_stage', 'error_type', 'experiment_id', 'experiment_variant'];
    return `${name}|${keys.map((key) => params[key] ?? '').join('|')}`;
  }

  function isDuplicate(name, params, allowDuplicate) {
    if (allowDuplicate) return false;
    const fingerprint = eventFingerprint(name, params);
    const now = Date.now();
    const lastSeen = recentFingerprints.get(fingerprint) || 0;
    recentFingerprints.set(fingerprint, now);
    for (const [key, timestamp] of recentFingerprints.entries()) {
      if (now - timestamp > DEDUPE_WINDOW_MS * 8) recentFingerprints.delete(key);
    }
    return now - lastSeen < DEDUPE_WINDOW_MS;
  }

  function appendDebugEvent(record) {
    debugEvents.push(record);
    if (debugEvents.length > MAX_DEBUG_EVENTS) debugEvents.shift();
    document.dispatchEvent(new CustomEvent('musicvibe:analytics', { detail: record }));
    window.__musicVibeRefreshDebugPanel?.();
  }

  function pushEventToGa(record) {
    rawGtag('event', record.name, {
      ...record.params,
      event_time_ms: record.timestamp,
      engagement_time_msec: Math.max(1, Date.now() - startedAt),
      transport_type: record.transportType || 'beacon'
    });
  }

  function flushPending() {
    if (!consentState.analytics || !gaConfigured) return;
    while (pendingEvents.length) pushEventToGa(pendingEvents.shift());
  }

  function ensureGa() {
    if (!consentState.analytics) return Promise.resolve(false);
    ensurePersistentVisitorId();
    rawGtag('consent', 'update', consentPayload());

    if (!gaConfigured) {
      rawGtag('js', new Date());
      rawGtag('config', GA_MEASUREMENT_ID, { anonymize_ip: true, send_page_view: false });
      gaConfigured = true;
    }

    const existing = document.getElementById('music-vibe-ga4');
    if (existing) {
      gaLoadPromise = gaLoadPromise || Promise.resolve(true);
      flushPending();
      return gaLoadPromise;
    }
    if (gaLoadPromise) return gaLoadPromise;

    gaLoadPromise = new Promise((resolve) => {
      const script = document.createElement('script');
      script.id = 'music-vibe-ga4';
      script.async = true;
      script.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(GA_MEASUREMENT_ID)}`;
      script.addEventListener('load', () => { script.dataset.loaded = 'true'; flushPending(); resolve(true); }, { once: true });
      script.addEventListener('error', () => { console.warn('GA4 failed to load; analytics remain off for this page.'); resolve(false); }, { once: true });
      document.head.appendChild(script);
    });
    return gaLoadPromise;
  }

  function trackEvent(name, params = {}, options = {}) {
    const normalizedName = String(name || '').toLowerCase().replace(/[^a-z0-9_]/g, '_').slice(0, 40);
    if (!normalizedName || !/^[a-z]/.test(normalizedName)) return { status: 'invalid' };
    const mergedParams = sanitizeParams({ ...commonParams(), ...params });
    if (isDuplicate(normalizedName, mergedParams, options.allowDuplicate === true)) return { status: 'deduplicated' };

    const record = {
      name: normalizedName,
      params: mergedParams,
      timestamp: Date.now(),
      consent: { ...consentState },
      transportType: options.transportType || 'beacon'
    };
    appendDebugEvent(record);

    if (!consentState.analytics) return { status: 'discarded', record };
    ensureGa();
    if (gaConfigured) pushEventToGa(record);
    else if (pendingEvents.length < MAX_PENDING_EVENTS) pendingEvents.push(record);
    return { status: 'sent', record };
  }

  function deleteAnalyticsCookies() {
    const names = document.cookie.split(';').map((part) => part.split('=')[0].trim()).filter((name) => /^_ga(?:_|$)/.test(name));
    names.forEach((name) => {
      document.cookie = `${name}=; Max-Age=0; path=/; SameSite=Lax`;
      document.cookie = `${name}=; Max-Age=0; path=/; domain=.${location.hostname}; SameSite=Lax`;
    });
  }

  function resetAnalyticsIdentity() {
    persistentVisitorId = null;
    safeLocalRemove(VISITOR_KEY);
    pendingEvents.length = 0;
    deleteAnalyticsCookies();
    document.dispatchEvent(new CustomEvent('musicvibe:analytics-identity-reset'));
    window.__musicVibeRefreshDebugPanel?.();
    return true;
  }

  function setPreferences(next, options = {}) {
    const previous = consentState;
    consentState = normalizedPreferences({ ...previous, ...next });
    safeLocalSet(CONSENT_KEY, JSON.stringify(consentState));
    rawGtag('consent', 'update', consentPayload());

    if (consentState.analytics) {
      ensurePersistentVisitorId();
      ensureGa().then(flushPending);
    } else {
      resetAnalyticsIdentity();
    }

    if (!options.silent) {
      document.dispatchEvent(new CustomEvent('musicvibe:consent-changed', { detail: { previous, current: { ...consentState } } }));
    }
    window.__musicVibeRefreshDebugPanel?.();
    return { ...consentState };
  }

  function setConsent(nextState) {
    if (nextState === 'accepted') return setPreferences({ analytics: true, adMeasurement: false, personalizedAds: false });
    if (nextState === 'declined') return setPreferences({ analytics: false, adMeasurement: false, personalizedAds: false });
    return { ...consentState };
  }

  window.gtag = function gtag(command, ...args) {
    if (command === 'event') return trackEvent(args[0], args[1] || {});
    if (command === 'config' && args[0] === GA_MEASUREMENT_ID) gaConfigured = true;
    rawGtag(command, ...args);
    return undefined;
  };

  function dismissStandaloneConsent() {
    const banner = document.getElementById('standalone-cookie-banner');
    if (!banner) return;
    banner.style.opacity = '0';
    banner.style.pointerEvents = 'none';
    window.setTimeout(() => banner.remove(), 180);
  }

  function showStandaloneConsent() {
    if (consentState.decided || document.getElementById('standalone-cookie-banner')) return;
    if (document.body?.dataset?.analyticsConsentUi !== 'standalone') return;
    const korean = currentLanguage().toLowerCase().startsWith('ko');
    const banner = document.createElement('section');
    banner.id = 'standalone-cookie-banner';
    banner.className = 'privacy-consent-banner';
    banner.setAttribute('role', 'region');
    banner.setAttribute('aria-labelledby', 'analytics-consent-title');
    banner.setAttribute('aria-describedby', 'analytics-consent-description');
    banner.innerHTML = `
      <div class="privacy-consent-banner__copy">
        <strong id="analytics-consent-title">${korean ? '어떤 흔적을 남길지 먼저 정할게요.' : 'Choose what this visit leaves behind.'}</strong>
        <p id="analytics-consent-description">${korean
          ? '취향 기록은 이 브라우저에만 남습니다. 익명 사용 흐름을 보내주면 사람들이 어디에서 멈추는지 고치는 데만 씁니다. 광고 관련 저장은 켜지지 않습니다.'
          : 'Taste notes stay in this browser. If you share anonymous usage, it is used only to repair the places where people lose their way. Advertising storage stays off.'}</p>
        <a href="${korean ? '/privacy/' : '/en/privacy/'}">${korean ? '개인정보·쿠키 정책 읽기' : 'Read the privacy policy'}</a>
      </div>
      <div class="privacy-consent-banner__actions">
        <button type="button" data-consent-choice="essential">${korean ? '필수 기능만' : 'Essential only'}</button>
        <button type="button" data-consent-choice="analytics">${korean ? '익명 분석 허용' : 'Allow anonymous analytics'}</button>
      </div>
    `;
    banner.querySelector('[data-consent-choice="essential"]').addEventListener('click', () => {
      setPreferences({ analytics: false, adMeasurement: false, personalizedAds: false });
      dismissStandaloneConsent();
    });
    banner.querySelector('[data-consent-choice="analytics"]').addEventListener('click', () => {
      setPreferences({ analytics: true, adMeasurement: false, personalizedAds: false });
      dismissStandaloneConsent();
    });
    document.body.appendChild(banner);
  }

  function openSettings(opener = document.activeElement) {
    document.getElementById('privacy-preferences-dialog')?.remove();
    const korean = currentLanguage().toLowerCase().startsWith('ko');
    const dialog = document.createElement('dialog');
    dialog.id = 'privacy-preferences-dialog';
    dialog.className = 'app-dialog privacy-preferences-dialog';
    dialog.setAttribute('aria-labelledby', 'privacy-preferences-title');
    dialog.setAttribute('aria-describedby', 'privacy-preferences-description');
    const adsOn = adsAvailable();
    dialog.innerHTML = `
      <form method="dialog" class="app-dialog__surface">
        <div class="app-dialog__copy">
          <span class="eyebrow">${korean ? '기록의 범위' : 'WHAT THIS VISIT LEAVES'}</span>
          <h2 id="privacy-preferences-title">${korean ? '남길 것과 남기지 않을 것을 고르세요.' : 'Choose what may remain after you leave.'}</h2>
          <p id="privacy-preferences-description">${korean
            ? '취향과 주간 기록은 기능을 위해 브라우저에 저장됩니다. 아래 선택은 외부 분석과 광고 관련 저장만 다룹니다.'
            : 'Taste and weekly notes stay in the browser for the product to work. These choices cover only external analytics and advertising storage.'}</p>
          <label class="privacy-preference-row">
            <input type="checkbox" name="analytics" ${consentState.analytics ? 'checked' : ''}>
            <span><strong>${korean ? '익명 사용 흐름' : 'Anonymous product analytics'}</strong><small>${korean ? '어느 화면에서 길을 잃는지 살펴보고 문장과 동선을 고칩니다.' : 'Helps us find where people lose the thread and repair the copy and flow.'}</small></span>
          </label>
          <label class="privacy-preference-row ${adsOn ? '' : 'is-disabled'}">
            <input type="checkbox" name="adMeasurement" ${consentState.adMeasurement ? 'checked' : ''} ${adsOn ? '' : 'disabled'}>
            <span><strong>${korean ? '광고 성과 측정' : 'Advertising measurement'}</strong><small>${adsOn ? (korean ? '광고가 켜진 경우 노출과 성과를 측정합니다.' : 'Measures delivery when advertising is active.') : (korean ? '현재 광고가 꺼져 있어 선택할 수 없습니다.' : 'Advertising is currently off, so this cannot be selected.')}</small></span>
          </label>
          <label class="privacy-preference-row ${adsOn ? '' : 'is-disabled'}">
            <input type="checkbox" name="personalizedAds" ${consentState.personalizedAds ? 'checked' : ''} ${adsOn ? '' : 'disabled'}>
            <span><strong>${korean ? '맞춤형 광고' : 'Personalized advertising'}</strong><small>${korean ? '별도 동의 없이는 켜지지 않습니다.' : 'Never enabled without a separate choice.'}</small></span>
          </label>
          <button type="button" class="privacy-identity-reset" data-reset-analytics-id>${korean ? '분석용 익명 ID 지우기' : 'Delete the anonymous analytics ID'}</button>
        </div>
        <div class="app-dialog__actions">
          <button type="submit" value="cancel" class="button button--ghost">${korean ? '그대로 두기' : 'Keep current choices'}</button>
          <button type="submit" value="save" class="button button--light">${korean ? '선택 저장' : 'Save choices'}</button>
        </div>
      </form>
    `;
    dialog.querySelector('[data-reset-analytics-id]').addEventListener('click', () => {
      resetAnalyticsIdentity();
      const button = dialog.querySelector('[data-reset-analytics-id]');
      button.textContent = korean ? '분석용 익명 ID를 지웠어요.' : 'Anonymous analytics ID deleted.';
      button.disabled = true;
    });
    dialog.addEventListener('close', () => {
      if (dialog.returnValue === 'save') {
        const form = dialog.querySelector('form');
        const data = new FormData(form);
        setPreferences({
          analytics: data.get('analytics') === 'on',
          adMeasurement: adsOn && data.get('adMeasurement') === 'on',
          personalizedAds: adsOn && data.get('personalizedAds') === 'on'
        });
      }
      dialog.remove();
      if (opener instanceof HTMLElement && opener.isConnected) opener.focus({ preventScroll: true });
    }, { once: true });
    document.body.appendChild(dialog);
    dialog.showModal();
    dialog.querySelector('input[name="analytics"]')?.focus();
    return dialog;
  }

  window.trackEvent = trackEvent;
  window.MusicVibeAnalytics = Object.freeze({
    track: trackEvent,
    setConsent,
    setPreferences,
    ensureGa,
    resetIdentity: resetAnalyticsIdentity,
    getSnapshot() {
      return {
        consent: { ...consentState },
        visitorId: currentVisitorId(),
        visitorScope: consentState.analytics ? 'persistent' : 'ephemeral',
        sessionId,
        visitId,
        attribution: { ...attribution },
        experiment: { ...(window.__musicVibeExperimentContext || {}) },
        pendingCount: pendingEvents.length,
        events: debugEvents.slice()
      };
    }
  });
  window.MusicVibeConsent = Object.freeze({
    getPreferences: () => ({ ...consentState }),
    setPreferences,
    openSettings,
    resetAnalyticsIdentity,
    showInitialNotice: showStandaloneConsent
  });

  const originalAcceptCookies = window.acceptCookies;
  if (typeof originalAcceptCookies === 'function') {
    window.acceptCookies = function acceptCookiesWithAnalytics() {
      const result = originalAcceptCookies.apply(this, arguments);
      setPreferences({ analytics: true, adMeasurement: false, personalizedAds: false });
      return result;
    };
  }
  const originalDeclineCookies = window.declineCookies;
  if (typeof originalDeclineCookies === 'function') {
    window.declineCookies = function declineCookiesWithAnalytics() {
      const result = originalDeclineCookies.apply(this, arguments);
      setPreferences({ analytics: false, adMeasurement: false, personalizedAds: false });
      return result;
    };
  }

  document.addEventListener('click', (event) => {
    const trigger = event.target.closest('[data-consent-settings]');
    if (!trigger) return;
    event.preventDefault();
    openSettings(trigger);
  });

  function renderDebugPanel() {
    if (new URLSearchParams(window.location.search).get('debug') !== 'analytics') return;
    const panel = document.createElement('aside');
    panel.id = 'analytics-debug-panel';
    Object.assign(panel.style, {
      position: 'fixed', top: '12px', right: '12px', zIndex: '10000', width: 'min(380px, calc(100vw - 24px))',
      maxHeight: '58vh', overflow: 'auto', padding: '14px', border: '1px solid rgba(255,255,255,.18)',
      borderRadius: '14px', background: 'rgba(0,0,0,.9)', color: '#e4e4e7',
      font: '11px/1.45 ui-monospace,SFMono-Regular,Menlo,monospace', boxShadow: '0 18px 60px rgba(0,0,0,.6)', whiteSpace: 'pre-wrap'
    });
    const refresh = () => {
      const snapshot = window.MusicVibeAnalytics.getSnapshot();
      panel.textContent = JSON.stringify({
        consent: snapshot.consent,
        visitor: snapshot.visitorId,
        visitorScope: snapshot.visitorScope,
        session: snapshot.sessionId,
        attribution: snapshot.attribution,
        experiment: snapshot.experiment,
        queued: snapshot.pendingCount,
        latest: snapshot.events.slice(-8).map((event) => ({ name: event.name, consent: event.consent, params: event.params }))
      }, null, 2);
    };
    window.__musicVibeRefreshDebugPanel = refresh;
    document.body.appendChild(panel);
    refresh();
  }

  function observePerformance() {
    if (typeof PerformanceObserver !== 'function') return;
    const observe = (type, callback) => {
      try {
        const observer = new PerformanceObserver((list) => callback(list.getEntries()));
        observer.observe({ type, buffered: true });
      } catch (_) {}
    };
    observe('paint', (entries) => {
      const fcp = entries.find((entry) => entry.name === 'first-contentful-paint');
      if (fcp) performanceState.fcpMs = Math.round(fcp.startTime);
    });
    observe('largest-contentful-paint', (entries) => {
      const latest = entries.at(-1);
      if (latest) performanceState.lcpMs = Math.round(latest.startTime);
    });
    observe('layout-shift', (entries) => entries.forEach((entry) => { if (!entry.hadRecentInput) performanceState.cls += Number(entry.value || 0); }));
    observe('first-input', (entries) => {
      const first = entries[0];
      if (first) performanceState.fidMs = Math.round(first.processingStart - first.startTime);
    });
    observe('event', (entries) => entries.forEach((entry) => { performanceState.inpMs = Math.max(performanceState.inpMs, Math.round(entry.duration || 0)); }));
    observe('longtask', (entries) => entries.forEach((entry) => { performanceState.longTaskMs += Math.round(entry.duration || 0); }));
  }

  function emitPerformance(reason) {
    if (performanceSent) return;
    performanceSent = true;
    const navigation = performance.getEntriesByType?.('navigation')?.[0];
    trackEvent('performance_summary', {
      performance_reason: reason,
      dom_content_loaded_ms: Math.round(navigation?.domContentLoadedEventEnd || 0),
      load_complete_ms: Math.round(navigation?.loadEventEnd || 0),
      transfer_size_kb: Math.round((navigation?.transferSize || 0) / 1024),
      fcp_ms: performanceState.fcpMs,
      lcp_ms: performanceState.lcpMs,
      cls_milli: Math.round(performanceState.cls * 1000),
      fid_ms: performanceState.fidMs,
      inp_ms: performanceState.inpMs,
      long_task_ms: performanceState.longTaskMs
    }, { allowDuplicate: true, transportType: 'beacon' });
  }

  function installQualityMonitoring() {
    observePerformance();
    window.addEventListener('error', (event) => {
      const resourceTarget = event.target && event.target !== window ? event.target : null;
      trackEvent('test_error', {
        error_type: resourceTarget ? 'resource_error' : 'window_error',
        error_message: resourceTarget ? `Failed to load ${resourceTarget.tagName || 'resource'}` : String(event.message || 'Unknown error').slice(0, 100),
        source_file: resourceTarget ? String(resourceTarget.src || resourceTarget.href || '').split('/').pop() : String(event.filename || '').split('/').pop(),
        line_number: event.lineno || 0
      }, { allowDuplicate: true, transportType: 'beacon' });
    }, true);
    window.addEventListener('unhandledrejection', (event) => {
      trackEvent('test_error', { error_type: 'unhandled_rejection', error_message: String(event.reason?.message || event.reason || 'Unknown rejection').slice(0, 100) }, { allowDuplicate: true, transportType: 'beacon' });
    });
    window.addEventListener('load', () => window.setTimeout(() => emitPerformance('load'), 0));
    window.addEventListener('pagehide', () => emitPerformance('pagehide'));
  }

  installQualityMonitoring();
  if (consentState.analytics) {
    persistentVisitorId = safeLocalGet(VISITOR_KEY);
    ensureGa();
  }

  document.addEventListener('DOMContentLoaded', () => {
    showStandaloneConsent();
    renderDebugPanel();
    trackEvent('page_view_internal', { document_title: document.title, page_location: window.location.href.slice(0, 300) }, { allowDuplicate: true });
  });
})();
