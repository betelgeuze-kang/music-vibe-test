// P2 consent-aware analytics, attribution, quality monitoring and legacy-flow bootstrap.
(() => {
    'use strict';

    const CONSENT_KEY = 'music-vibe-consent-v2';
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
    let gaFrame = null;
    let gaBridge = null;
    let finishGaLoad = null;
    const gaCommands = [];
    const storedConsent = safeLocalGet(CONSENT_KEY);
    let consentState = ['accepted', 'declined'].includes(storedConsent) ? storedConsent : 'unknown';
    let gaLoadStatus = 'idle';
    let performanceSent = false;

    const performanceState = {
        fcpMs: 0,
        lcpMs: 0,
        cls: 0,
        fidMs: 0,
        inpMs: 0
    };

    // P1 replaces these globals later. Preserve the original 40-question flow for a controlled experiment.
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
        try {
            return window.localStorage.getItem(key);
        } catch (_) {
            return null;
        }
    }

    function safeLocalSet(key, value) {
        try {
            window.localStorage.setItem(key, value);
            return true;
        } catch (_) {
            return false;
        }
    }

    function safeSessionGet(key) {
        try {
            return window.sessionStorage.getItem(key);
        } catch (_) {
            return null;
        }
    }

    function safeSessionSet(key, value) {
        try {
            window.sessionStorage.setItem(key, value);
            return true;
        } catch (_) {
            return false;
        }
    }

    function parseJson(value, fallback) {
        if (!value) return fallback;
        try {
            return JSON.parse(value);
        } catch (_) {
            return fallback;
        }
    }

    function randomId(prefix) {
        const random = window.crypto?.getRandomValues
            ? Array.from(window.crypto.getRandomValues(new Uint32Array(2)))
                .map((part) => part.toString(36))
                .join('')
            : Math.random().toString(36).slice(2) + Date.now().toString(36);
        return `${prefix}_${random.slice(0, 16)}`;
    }

    function getPersistentId(storage, key, prefix) {
        let value = storage.get(key);
        if (!value) {
            value = randomId(prefix);
            storage.set(key, value);
        }
        return value;
    }

    const localStore = {
        get: safeLocalGet,
        set: safeLocalSet
    };
    const sessionStore = {
        get: safeSessionGet,
        set: safeSessionSet
    };

    let visitorId = null;
    let sessionId = null;
    let visitId = null;

    function prepareAnalyticsIdentifiers() {
        if (consentState !== 'accepted') return;
        visitId ||= randomId('mvv');
        visitorId ||= getPersistentId(localStore, VISITOR_KEY, 'mvu');
        sessionId ||= getPersistentId(sessionStore, SESSION_KEY, 'mvs');
    }

    // An identifier must not be persisted until a user has accepted analytics.
    prepareAnalyticsIdentifiers();

    function currentLanguage() {
        const bodyLanguage = document.body?.dataset?.language;
        if (bodyLanguage) return bodyLanguage;
        try {
            if (typeof currentLang === 'string') return currentLang;
        } catch (_) {
            // App globals are not available on static result pages.
        }
        return document.documentElement.lang || 'en';
    }

    function currentResultType() {
        const bodyResult = document.body?.dataset?.resultType;
        if (bodyResult) return bodyResult.toUpperCase();
        try {
            if (finalResult?.mbti) return String(finalResult.mbti).toUpperCase();
        } catch (_) {
            // Result is not available yet.
        }
        return '';
    }

    function pageType() {
        const explicit = document.body?.dataset?.pageType;
        if (explicit) return explicit;
        if (/\/(?:ko|en)\/results\/[a-z]{4}\/?$/i.test(window.location.pathname)) {
            return 'static_result';
        }
        return 'app';
    }

    function normalizeTestMode(value) {
        const normalized = String(value || '').replaceAll('-', '_');
        if (normalized === 'quick_12' || normalized === 'deep_40') return normalized;
        return normalized.slice(0, 30);
    }

    function sanitizeValue(value) {
        if (value === undefined || value === null || value === '') return undefined;
        if (typeof value === 'boolean' || typeof value === 'number') return value;
        if (Array.isArray(value)) {
            return value.slice(0, 10).map(sanitizeValue).filter((item) => item !== undefined);
        }
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
        const rawRef = (params.get('ref') || '').toUpperCase();
        const explicitRef = /^[EI][NS][FT][JP]$/.test(rawRef) ? rawRef : '';
        const known = (value, allowed) => allowed.includes(value) ? value : '';
        const source = known(params.get('src') || params.get('source') || existing.source || '', ['share', 'shared_result', 'static_result', 'social']);
        const utmMedium = known(params.get('utm_medium') || existing.utm_medium || '', ['share', 'social', 'referral']);
        const pathResult = window.location.pathname.match(/\/results\/([a-z]{4})\/?$/i)?.[1]?.toUpperCase() || '';
        const sharedEntry = isSharedEntry(params, source, utmMedium, explicitRef);
        let referrerHost = existing.referrer_host || '';

        if (document.referrer) {
            try {
                referrerHost = new URL(document.referrer).hostname.slice(0, 100);
            } catch (_) {
                referrerHost = '';
            }
        }

        const incoming = {
            ref_type: explicitRef || (sharedEntry ? pathResult : '') || (/^[EI][NS][FT][JP]$/.test(existing.ref_type || '') ? existing.ref_type : ''),
            source,
            shared_entry: sharedEntry || Boolean(existing.shared_entry),
            utm_source: known(params.get('utm_source') || existing.utm_source || '', ['music_vibe']),
            utm_medium: utmMedium,
            utm_campaign: known(params.get('utm_campaign') || existing.utm_campaign || '', ['result_share', 'vibe_match_qg1']),
            utm_content: /^[ei][ns][ft][jp]$/.test(params.get('utm_content') || existing.utm_content || '') ? (params.get('utm_content') || existing.utm_content) : '',
            utm_term: '',
            referrer_host: referrerHost
        };

        if (consentState === 'accepted') safeSessionSet(ATTRIBUTION_KEY, JSON.stringify(incoming));
        return incoming;
    }

    const attribution = readAttribution();

    function commonParams() {
        const experiment = window.__musicVibeExperimentContext || {};
        return sanitizeParams({
            visitor_id: visitorId,
            app_session_id: sessionId,
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

    function safePageUrl(value) {
        try {
            const url = new URL(value);
            return /^https?:$/.test(url.protocol) ? `${url.origin}${url.pathname}` : '';
        } catch (_) { return ''; }
    }

    function safeEventParams(params) {
        const output = sanitizeParams(params);
        // Never export profile tokens/IDs, free-form errors or caller-supplied URLs.
        for (const key of Object.keys(output)) {
            if (/(?:url|location|referrer|token|compare|profile_id|error_message|source_file)/i.test(key)) delete output[key];
        }
        output.page_location = safePageUrl(window.location.href);
        output.page_referrer = safePageUrl(document.referrer);
        return output;
    }

    function rawGtag(...command) {
        // Diagnostic queue only: Google never runs in the application's window.
        window.dataLayer = window.dataLayer || [];
        window.dataLayer.push(command);
        if (window.dataLayer.length > MAX_DEBUG_EVENTS) window.dataLayer.shift();
        if (consentState !== 'accepted') return;
        if (gaBridge) gaBridge.send(command);
        else if (gaCommands.length < MAX_PENDING_EVENTS) gaCommands.push(command);
    }

    // Establish strict defaults before any Google tag/config/event commands.
    rawGtag('consent', 'default', {
        analytics_storage: 'denied',
        ad_storage: 'denied',
        ad_user_data: 'denied',
        ad_personalization: 'denied'
    });

    function eventFingerprint(name, params) {
        const keys = [
            'question_id', 'question_number', 'result_type', 'result_origin',
            'placement', 'share_method', 'track_title', 'referral_stage',
            'error_type', 'experiment_id', 'experiment_variant'
        ];
        const signature = keys.map((key) => params[key] ?? '').join('|');
        return `${name}|${signature}`;
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

        document.dispatchEvent(new CustomEvent('musicvibe:analytics', {
            detail: record
        }));

        window.__musicVibeRefreshDebugPanel?.();
    }

    function pushEventToGa(record) {
        rawGtag('event', record.name, {
            ...safeEventParams(record.params),
            event_time_ms: record.timestamp,
            engagement_time_msec: Math.max(1, Date.now() - startedAt),
            transport_type: record.transportType || 'beacon'
        });
    }

    function flushPending() {
        if (consentState !== 'accepted' || !gaConfigured) return;
        while (pendingEvents.length) pushEventToGa(pendingEvents.shift());
    }

    function ensureGa() {
        if (consentState !== 'accepted') return Promise.resolve(false);

        if (!gaConfigured) {
            rawGtag('consent', 'update', {
                analytics_storage: 'granted',
                ad_storage: 'denied',
                ad_user_data: 'denied',
                ad_personalization: 'denied'
            });
            rawGtag('js', new Date());
            rawGtag('config', GA_MEASUREMENT_ID, {
                send_page_view: true,
                page_location: safePageUrl(window.location.href),
                page_referrer: safePageUrl(document.referrer),
                page_title: document.title,
                ...sanitizeParams({
                    campaign_source: attribution.utm_source,
                    campaign_medium: attribution.utm_medium,
                    campaign_name: attribution.utm_campaign,
                    campaign_content: attribution.utm_content
                }),
                allow_google_signals: false,
                allow_ad_personalization_signals: false
            });
            gaConfigured = true;
        }

        if (gaLoadPromise) return gaLoadPromise;
        gaLoadStatus = 'loading';
        gaLoadPromise = new Promise((resolve) => {
            finishGaLoad = resolve;
            const frame = document.createElement('iframe');
            gaFrame = frame;
            frame.id = 'music-vibe-ga4-frame';
            frame.hidden = true;
            frame.title = 'Optional analytics';
            frame.referrerPolicy = 'no-referrer';
            frame.src = '/analytics-frame.html?version=ga4c3';
            (document.body || document.documentElement).appendChild(frame);
        });
        return gaLoadPromise;
    }

    window.addEventListener('message', (event) => {
        if (!gaFrame || consentState !== 'accepted' || event.source !== gaFrame.contentWindow || event.origin !== window.location.origin) return;
        if (event.data?.type === 'music-vibe-ga-ready') {
            const frame = gaFrame;
            gaBridge = {
                send(command) {
                    if (consentState === 'accepted' && frame === gaFrame) {
                        // Only the current analytics document receives commands.
                        frame.contentWindow.postMessage({ type: 'music-vibe-ga-command', command }, window.location.origin);
                    }
                }
            };
            while (gaCommands.length) gaBridge.send(gaCommands.shift());
        } else if (event.data?.type === 'music-vibe-ga-loaded') {
            gaLoadStatus = event.data.loaded ? 'loaded' : 'failed';
            finishGaLoad?.(Boolean(event.data.loaded));
        }
    });

    function removeAnalyticsCookies() {
        // GA uses domain cookies at /; also clear legacy path-scoped variants.
        const names = (document.cookie || '').split(';').map((part) => part.trim().split('=')[0])
            .filter((name) => /^_ga(?:_|$)|^_gid$|^_gat(?:_|$)/.test(name));
        const labels = window.location.hostname.split('.');
        const domains = [''];
        for (let index = 0; index < labels.length - 1; index++) {
            domains.push(labels.slice(index).join('.'), `.${labels.slice(index).join('.')}`);
        }
        const paths = new Set(['/']);
        const segments = window.location.pathname.split('/').filter(Boolean);
        for (let index = 1; index <= segments.length; index++) {
            const path = '/' + segments.slice(0, index).join('/');
            paths.add(path); paths.add(path + '/');
        }
        names.forEach((name) => domains.forEach((domain) => paths.forEach((path) => {
            document.cookie = `${name}=; Max-Age=0; path=${path}${domain ? `; domain=${domain}` : ''}`;
        })));
    }

    function stopGa() {
        // Disable synchronously before removal: unload handlers must not send a final beacon.
        gaFrame?.contentWindow?.MusicVibeGaBridge?.disable();
        gaBridge = null;
        gaFrame?.remove();
        gaFrame = null;
        finishGaLoad?.(false);
        finishGaLoad = null;
        gaLoadPromise = null;
        gaConfigured = false;
        gaLoadStatus = 'idle';
        gaCommands.length = 0;
        pendingEvents.length = 0;
        debugEvents.length = 0;
        recentFingerprints.clear();
        window.dataLayer = [];
        removeAnalyticsCookies();
    }

    function trackEvent(name, params = {}, options = {}) {
        const normalizedName = String(name || '')
            .toLowerCase()
            .replace(/[^a-z0-9_]/g, '_')
            .slice(0, 40);

        if (!normalizedName || !/^[a-z]/.test(normalizedName)) {
            console.warn('Ignored invalid analytics event name:', name);
            return { status: 'invalid' };
        }

        const mergedParams = safeEventParams({
            ...commonParams(),
            ...params
        });

        if (isDuplicate(normalizedName, mergedParams, options.allowDuplicate === true)) {
            return { status: 'deduplicated' };
        }

        const record = {
            name: normalizedName,
            params: mergedParams,
            timestamp: Date.now(),
            consent: consentState,
            transportType: options.transportType || 'beacon'
        };
        appendDebugEvent(record);

        if (consentState !== 'accepted') return { status: 'discarded', record };

        if (consentState === 'accepted') {
            ensureGa();
            if (gaConfigured) pushEventToGa(record);
            else if (pendingEvents.length < MAX_PENDING_EVENTS) pendingEvents.push(record);
            return { status: 'sent', record };
        }

        return { status: 'discarded', record };
    }

    function setConsent(nextState) {
        if (!['accepted', 'declined'].includes(nextState)) return;
        const previousState = consentState;
        consentState = nextState;

        if (nextState === 'accepted') {
            safeLocalSet(CONSENT_KEY, 'accepted');
            prepareAnalyticsIdentifiers();
            safeSessionSet(ATTRIBUTION_KEY, JSON.stringify(attribution));
            ensureGa().then(flushPending);
            if (previousState !== 'accepted') {
                // Capture the current consented view, never replay pre-consent behavior.
                trackEvent('page_view_internal', { view_reason: 'consent_granted' }, { allowDuplicate: true });
                if (window.__musicVibeV2?.route === 'home') {
                    trackEvent('landing_view', { view_reason: 'consent_granted' }, { allowDuplicate: true });
                }
            }
        } else {
            safeLocalSet(CONSENT_KEY, 'declined');
            pendingEvents.length = 0;
            stopGa();
            visitorId = null;
            sessionId = null;
            visitId = null;
            try { window.localStorage.removeItem(VISITOR_KEY); } catch (_) {}
            try { window.sessionStorage.removeItem(SESSION_KEY); } catch (_) {}
            try { window.sessionStorage.removeItem(ATTRIBUTION_KEY); } catch (_) {}

        }

        window.__musicVibeRefreshDebugPanel?.();
    }

    window.addEventListener('storage', (event) => {
        if ((event.key === CONSENT_KEY || event.key === null) && event.newValue !== 'accepted') {
            setConsent('declined');
        }
    });

    // Preserve the public gtag contract while withholding event transmission before consent.
    window.gtag = function gtag(command, ...args) {
        if (command === 'event') return trackEvent(args[0], args[1] || {});
        // Config/consent are controlled only by the consent UI, never callers.
        return undefined;
    };

    window.trackEvent = trackEvent;
    window.MusicVibeAnalytics = Object.freeze({
        track: trackEvent,
        setConsent,
        ensureGa,
        openConsentPreferences() {
            showStandaloneConsent(true);
        },
        getSnapshot() {
            return {
                consent: consentState,
                gaLoadStatus,
                visitorId,
                sessionId,
                visitId,
                attribution: { ...attribution },
                experiment: { ...(window.__musicVibeExperimentContext || {}) },
                pendingCount: pendingEvents.length,
                events: debugEvents.slice()
            };
        }
    });

    const originalAcceptCookies = window.acceptCookies;
    if (typeof originalAcceptCookies === 'function') {
        window.acceptCookies = function acceptCookiesWithAnalytics() {
            const result = originalAcceptCookies.apply(this, arguments);
            setConsent('accepted');
            return result;
        };
    }

    const originalDeclineCookies = window.declineCookies;
    if (typeof originalDeclineCookies === 'function') {
        window.declineCookies = function declineCookiesWithAnalytics() {
            const result = originalDeclineCookies.apply(this, arguments);
            setConsent('declined');
            return result;
        };
    }

    function dismissStandaloneConsent() {
        const banner = document.getElementById('standalone-cookie-banner');
        if (!banner) return;
        banner.style.opacity = '0';
        banner.style.pointerEvents = 'none';
        window.setTimeout(() => banner.remove(), 220);
    }

    function showStandaloneConsent(force = false) {
        if ((!force && consentState !== 'unknown') || document.getElementById('standalone-cookie-banner')) return;
        if (document.body?.dataset?.analyticsConsentUi !== 'standalone') return;

        const isKorean = currentLanguage().toLowerCase().startsWith('ko');
        const banner = document.createElement('section');
        banner.id = 'standalone-cookie-banner';
        banner.setAttribute('role', 'dialog');
        banner.setAttribute('aria-label', isKorean ? '선택적 분석 쿠키 설정' : 'Optional analytics cookies');
        Object.assign(banner.style, {
            position: 'fixed', left: '16px', right: '16px', bottom: '16px', zIndex: '9999',
            maxWidth: '620px', margin: '0 auto', padding: '18px',
            border: '1px solid rgba(255,255,255,.14)', borderRadius: '18px',
            background: 'rgba(9,9,12,.94)', backdropFilter: 'blur(18px)',
            boxShadow: '0 18px 70px rgba(0,0,0,.55)', color: '#fff',
            transition: 'opacity .22s ease'
        });
        banner.innerHTML = `
            <strong style="display:block;font-size:14px;margin-bottom:7px">
                ${isKorean ? '선택적 분석 쿠키' : 'Optional analytics cookies'}
            </strong>
            <p style="margin:0;color:#a1a1aa;font-size:12px;line-height:1.65">
                ${isKorean
                    ? '방문·공유·테스트 완료 흐름을 개선하기 위한 GA4 분석은 동의한 경우에만 전송됩니다. Cloudflare의 쿠키 없는 성능 측정은 별도로 동작합니다.'
                    : 'GA4 analytics are sent only after consent. Cloudflare cookie-free performance measurement operates separately.'}
            </p>
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:14px">
                <button type="button" data-consent="declined" style="min-height:42px;border:1px solid rgba(255,255,255,.15);border-radius:11px;background:rgba(255,255,255,.05);color:#fff;font-weight:800;cursor:pointer">
                    ${isKorean ? '필수만 사용' : 'Essential only'}
                </button>
                <button type="button" data-consent="accepted" style="min-height:42px;border:0;border-radius:11px;background:#fff;color:#09090b;font-weight:900;cursor:pointer">
                    ${isKorean ? '분석 허용' : 'Allow analytics'}
                </button>
            </div>
        `;
        banner.querySelector('[data-consent="accepted"]').addEventListener('click', () => {
            setConsent('accepted');
            dismissStandaloneConsent();
        });
        banner.querySelector('[data-consent="declined"]').addEventListener('click', () => {
            setConsent('declined');
            dismissStandaloneConsent();
        });
        document.body.appendChild(banner);
    }

    function renderDebugPanel() {
        const params = new URLSearchParams(window.location.search);
        if (params.get('debug') !== 'analytics') return;

        const panel = document.createElement('aside');
        panel.id = 'analytics-debug-panel';
        Object.assign(panel.style, {
            position: 'fixed', top: '12px', right: '12px', zIndex: '10000',
            width: 'min(380px, calc(100vw - 24px))', maxHeight: '58vh', overflow: 'auto',
            padding: '14px', border: '1px solid rgba(255,255,255,.18)', borderRadius: '14px',
            background: 'rgba(0,0,0,.9)', color: '#e4e4e7',
            font: '11px/1.45 ui-monospace,SFMono-Regular,Menlo,monospace',
            boxShadow: '0 18px 60px rgba(0,0,0,.6)', whiteSpace: 'pre-wrap'
        });

        const refresh = () => {
            const snapshot = window.MusicVibeAnalytics.getSnapshot();
            panel.textContent = JSON.stringify({
                consent: snapshot.consent,
                gaStatus: snapshot.gaLoadStatus,
                visitor: snapshot.visitorId,
                session: snapshot.sessionId,
                attribution: snapshot.attribution,
                experiment: snapshot.experiment,
                queued: snapshot.pendingCount,
                latest: snapshot.events.slice(-8).map((event) => ({
                    name: event.name,
                    consent: event.consent,
                    params: event.params
                }))
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
            } catch (_) {
                // Browser does not support this entry type.
            }
        };

        observe('paint', (entries) => {
            const fcp = entries.find((entry) => entry.name === 'first-contentful-paint');
            if (fcp) performanceState.fcpMs = Math.round(fcp.startTime);
        });
        observe('largest-contentful-paint', (entries) => {
            const latest = entries.at(-1);
            if (latest) performanceState.lcpMs = Math.round(latest.startTime);
        });
        observe('layout-shift', (entries) => {
            entries.forEach((entry) => {
                if (!entry.hadRecentInput) performanceState.cls += Number(entry.value || 0);
            });
        });
        observe('first-input', (entries) => {
            const first = entries[0];
            if (first) performanceState.fidMs = Math.round(first.processingStart - first.startTime);
        });
        observe('event', (entries) => {
            entries.forEach((entry) => {
                performanceState.inpMs = Math.max(performanceState.inpMs, Math.round(entry.duration || 0));
            });
        });
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
            inp_ms: performanceState.inpMs
        }, { allowDuplicate: true, transportType: 'beacon' });
    }

    function installQualityMonitoring() {
        observePerformance();

        window.addEventListener('error', (event) => {
            const resourceTarget = event.target && event.target !== window ? event.target : null;
            trackEvent('test_error', {
                error_type: resourceTarget ? 'resource_error' : 'window_error',
                error_message: resourceTarget
                    ? `Failed to load ${resourceTarget.tagName || 'resource'}`
                    : String(event.message || 'Unknown error').slice(0, 100),
                source_file: resourceTarget
                    ? String(resourceTarget.src || resourceTarget.href || '').split('/').pop()
                    : String(event.filename || '').split('/').pop(),
                line_number: event.lineno || 0
            }, { allowDuplicate: true, transportType: 'beacon' });
        }, true);

        window.addEventListener('unhandledrejection', (event) => {
            trackEvent('test_error', {
                error_type: 'unhandled_rejection',
                error_message: String(event.reason?.message || event.reason || 'Unknown rejection').slice(0, 100)
            }, { allowDuplicate: true, transportType: 'beacon' });
        });

        window.addEventListener('load', () => window.setTimeout(() => emitPerformance('load'), 0));
        window.addEventListener('pagehide', () => emitPerformance('pagehide'));
    }

    installQualityMonitoring();
    if (consentState !== 'accepted') {
        try { window.localStorage.removeItem(VISITOR_KEY); } catch (_) {}
        try { window.sessionStorage.removeItem(SESSION_KEY); window.sessionStorage.removeItem(ATTRIBUTION_KEY); } catch (_) {}
        removeAnalyticsCookies();
    }
    if (consentState === 'accepted') ensureGa();

    document.addEventListener('DOMContentLoaded', () => {
        showStandaloneConsent();
        renderDebugPanel();
        trackEvent('page_view_internal', {
            document_title: document.title,
            page_location: `${window.location.origin}${window.location.pathname}`
        }, { allowDuplicate: true });
    });
})();
