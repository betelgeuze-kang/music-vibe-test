// Runs in a separate clean document; automatic measurement observes only this document.
(() => {
    'use strict';
    const ID = 'G-XJ8Z43C6LQ';
    const parentOrigin = new URL(window.location.href).origin;
    let active = false;
    let configured = false;
    let script = null;
    window.dataLayer = [];
    function gtag() { window.dataLayer.push(arguments); }
    window.gtag = gtag;
    const denied = { analytics_storage: 'denied', ad_storage: 'denied', ad_user_data: 'denied', ad_personalization: 'denied' };
    gtag('consent', 'default', denied);

    function safeUrl(value) {
        try {
            const url = new URL(value);
            return /^https?:$/.test(url.protocol) ? `${url.origin}${url.pathname}` : '';
        } catch (_) { return ''; }
    }
    function params(input = {}) {
        const output = { ...input };
        for (const key of Object.keys(output)) {
            if (/(?:url|location|referrer|token|compare|profile_id|error_message|source_file)/i.test(key)) delete output[key];
        }
        output.page_location = safeUrl(input.page_location);
        output.page_referrer = safeUrl(input.page_referrer);
        return output;
    }
    function tellParent(type, extra = {}) {
        window.parent.postMessage({ type, ...extra }, parentOrigin);
    }
    function disable() {
        active = false;
        window[`ga-disable-${ID}`] = true;
        script?.remove();
    }
    window.MusicVibeGaBridge = Object.freeze({ disable });
    window.addEventListener('message', (event) => {
        if (event.source !== window.parent || event.origin !== parentOrigin) return;
        if (event.data?.type === 'music-vibe-ga-disable') {
            disable();
            return;
        }
        if (event.data?.type !== 'music-vibe-ga-command') return;
        const command = event.data.command;
        if (!Array.isArray(command)) return;
        const [kind, name, input] = command;
        if (kind === 'config' && name === ID && !configured) {
            configured = true;
            active = true;
            window[`ga-disable-${ID}`] = false;
            gtag('consent', 'update', { ...denied, analytics_storage: 'granted' });
            gtag('js', new Date());
            gtag('config', ID, {
                ...params(input), send_page_view: true,
                allow_google_signals: false, allow_ad_personalization_signals: false
            });
            script = document.createElement('script');
            script.id = 'music-vibe-ga4';
            script.async = true;
            script.src = `https://www.googletagmanager.com/gtag/js?id=${ID}`;
            script.addEventListener('load', () => tellParent('music-vibe-ga-loaded', { loaded: true }), { once: true });
            script.addEventListener('error', () => tellParent('music-vibe-ga-loaded', { loaded: false }), { once: true });
            document.head.appendChild(script);
        } else if (kind === 'event' && active && /^[a-z][a-z0-9_]{0,39}$/.test(name)) {
            gtag('event', name, params(input));
        }
    });
    tellParent('music-vibe-ga-ready');
})();
