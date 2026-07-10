// P0 stability, privacy and trust fixes.
(() => {
    'use strict';

    const CONSENT_KEY = 'music-vibe-consent-v2';
    const GA_MEASUREMENT_ID = 'G-XJ8Z43C6LQ';
    const ADSENSE_CLIENT = 'ca-pub-1386368370627622';
    const KAKAO_JS_KEY = 'e861d8f8a85f6c8d67c54f5d22384956';
    const SITE_NAME = 'Music Vibe Test';
    const scriptPromises = new Map();

    function safeStorageGet(key) {
        try {
            return window.localStorage.getItem(key);
        } catch (_) {
            return null;
        }
    }

    function safeStorageSet(key, value) {
        try {
            window.localStorage.setItem(key, value);
            return true;
        } catch (_) {
            return false;
        }
    }

    function safeStorageRemove(key) {
        try {
            window.localStorage.removeItem(key);
        } catch (_) {
            // Storage can be unavailable in private browsing modes.
        }
    }

    function stripHtml(value) {
        if (!value) return '';
        const template = document.createElement('template');
        template.innerHTML = String(value);
        return (template.content.textContent || '').replace(/\s+/g, ' ').trim();
    }

    function loadScriptOnce(id, src, attributes = {}) {
        if (scriptPromises.has(id)) return scriptPromises.get(id);

        const promise = new Promise((resolve, reject) => {
            const existing = document.getElementById(id);
            if (existing) {
                if (existing.dataset.loaded === 'true') {
                    resolve(existing);
                    return;
                }
                existing.addEventListener('load', () => resolve(existing), { once: true });
                existing.addEventListener('error', () => reject(new Error(`Failed to load ${src}`)), { once: true });
                return;
            }

            const script = document.createElement('script');
            script.id = id;
            script.src = src;
            script.async = true;

            Object.entries(attributes).forEach(([key, value]) => {
                if (value !== undefined && value !== null) script.setAttribute(key, value);
            });

            script.addEventListener('load', () => {
                script.dataset.loaded = 'true';
                resolve(script);
            }, { once: true });
            script.addEventListener('error', () => reject(new Error(`Failed to load ${src}`)), { once: true });
            document.head.appendChild(script);
        });

        scriptPromises.set(id, promise);
        return promise;
    }

    function getUiLanguage() {
        try {
            return currentLang || 'en';
        } catch (_) {
            return 'en';
        }
    }

    function getUiText() {
        const lang = getUiLanguage();
        if (lang === 'kr') {
            return {
                consentTitle: '선택적 쿠키 설정',
                consentBody: '분석 및 광고 스크립트는 동의한 경우에만 실행됩니다. 필수 기능은 쿠키 동의 없이도 사용할 수 있습니다.',
                accept: '모두 허용',
                decline: '필수만 사용',
                privacy: '개인정보 처리방침',
                copied: '공유 링크가 복사되었습니다.',
                shareError: '공유 링크를 복사하지 못했습니다.',
                previewTitle: '결과 이미지 미리보기',
                download: '이미지 저장',
                close: '닫기'
            };
        }

        return {
            consentTitle: 'Optional cookie settings',
            consentBody: 'Analytics and advertising scripts run only after consent. Essential test features work without optional cookies.',
            accept: 'Allow all',
            decline: 'Essential only',
            privacy: 'Privacy policy',
            copied: 'Share link copied.',
            shareError: 'Could not copy the share link.',
            previewTitle: 'Result image preview',
            download: 'Save image',
            close: 'Close'
        };
    }

    // Correct the duplicated Korean translation keys and make the test scope explicit.
    function applyTranslationPatches() {
        if (typeof TRANSLATIONS === 'undefined') return;

        const year = String(new Date().getFullYear());
        Object.values(TRANSLATIONS).forEach((language) => {
            if (!language || !language.ui) return;
            if (language.ui.footer_copy) {
                language.ui.footer_copy = language.ui.footer_copy.replace(/20\d{2}/, year);
            }
        });

        if (TRANSLATIONS.kr && TRANSLATIONS.kr.ui) {
            TRANSLATIONS.kr.ui.about_title = '테스트 소개';
            TRANSLATIONS.kr.ui.about_content = `
                <div class='text-left space-y-5 text-gray-300 text-[13px] leading-relaxed break-keep'>
                    <section>
                        <h4 class='text-amber-400 font-bold mb-2'>Music Vibe Test란?</h4>
                        <p>성격 질문의 답변을 16가지 음악적 이미지와 연결한 엔터테인먼트 콘텐츠입니다. 결과는 자기 탐색과 대화를 위한 참고 자료이며 전문 심리검사나 의학적·과학적 진단이 아닙니다.</p>
                    </section>
                    <section>
                        <h4 class='text-amber-400 font-bold mb-2'>데이터 처리</h4>
                        <p>답변과 결과 계산은 현재 브라우저에서 처리됩니다. 분석 및 광고 스크립트는 사용자가 선택적 쿠키에 동의한 경우에만 불러옵니다.</p>
                    </section>
                    <section class='pt-4 border-t border-white/5'>
                        <p class='text-gray-500 text-[11px]'>같은 답변에는 같은 결과와 공유 식별자가 생성되며, 근거 없는 희귀도나 무작위 점수는 표시하지 않습니다.</p>
                    </section>
                </div>
            `;
            TRANSLATIONS.kr.ui.legal_privacy_content = `
                <h3 class='text-xl font-bold mb-4'>개인정보 처리방침</h3>
                <div class='text-left space-y-4 text-sm text-gray-400'>
                    <p><strong>1. 테스트 처리:</strong> 답변과 결과는 브라우저에서 계산되며, 본 사이트가 이름이나 연락처를 직접 수집하지 않습니다.</p>
                    <p><strong>2. 선택적 쿠키:</strong> Google Analytics와 Google AdSense 관련 스크립트는 사용자가 “모두 허용”을 선택한 경우에만 불러옵니다.</p>
                    <p><strong>3. 동의 철회:</strong> 아래 버튼을 누르면 저장된 선택을 삭제하고 다음 방문 시 다시 설정할 수 있습니다.</p>
                    <button onclick='resetCookieConsent()' class='px-4 py-2 bg-white text-black font-bold rounded-lg'>쿠키 선택 초기화</button>
                </div>
            `;
        }

        if (TRANSLATIONS.en && TRANSLATIONS.en.ui) {
            TRANSLATIONS.en.ui.about_title = 'About the Test';
            TRANSLATIONS.en.ui.about_content = `
                <div class='text-left space-y-5 text-gray-300 text-[13px] leading-relaxed'>
                    <section>
                        <h4 class='text-amber-400 font-bold mb-2'>What is Music Vibe Test?</h4>
                        <p>This is entertainment content that maps personality-question responses to 16 musical personas. It is not a professional psychological, medical, or scientific diagnosis.</p>
                    </section>
                    <section>
                        <h4 class='text-amber-400 font-bold mb-2'>Data handling</h4>
                        <p>Answers and result calculations are processed in the browser. Analytics and advertising scripts load only after optional-cookie consent.</p>
                    </section>
                </div>
            `;
            TRANSLATIONS.en.ui.legal_privacy_content = `
                <h3 class='text-xl font-bold mb-4'>Privacy Policy</h3>
                <div class='text-left space-y-4 text-sm text-gray-400'>
                    <p><strong>1. Test processing:</strong> Answers and results are calculated in your browser. The site does not directly request your name or contact details.</p>
                    <p><strong>2. Optional cookies:</strong> Google Analytics and Google AdSense scripts load only after you choose “Allow all”.</p>
                    <p><strong>3. Withdraw consent:</strong> Use the button below to clear your saved choice.</p>
                    <button onclick='resetCookieConsent()' class='px-4 py-2 bg-white text-black font-bold rounded-lg'>Reset cookie choice</button>
                </div>
            `;
        }
    }

    function loadAnalyticsAndAds() {
        if (window.__musicVibeOptionalServicesLoaded) return;
        window.__musicVibeOptionalServicesLoaded = true;

        window.dataLayer = window.dataLayer || [];
        window.gtag = window.gtag || function gtag() {
            window.dataLayer.push(arguments);
        };
        window.gtag('consent', 'default', {
            analytics_storage: 'granted',
            ad_storage: 'granted',
            ad_user_data: 'granted',
            ad_personalization: 'granted'
        });
        window.gtag('js', new Date());
        window.gtag('config', GA_MEASUREMENT_ID, { anonymize_ip: true });

        loadScriptOnce(
            'music-vibe-ga4',
            `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(GA_MEASUREMENT_ID)}`
        ).catch((error) => console.warn('GA4 load failed:', error));

        loadScriptOnce(
            'music-vibe-adsense',
            `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${encodeURIComponent(ADSENSE_CLIENT)}`,
            { crossorigin: 'anonymous' }
        ).catch((error) => console.warn('AdSense load failed:', error));
    }

    function dismissConsentBanner() {
        const banner = document.getElementById('cookie-banner');
        if (!banner) return;
        banner.classList.add('opacity-0', 'pointer-events-none');
        window.setTimeout(() => banner.remove(), 250);
    }

    function showConsentBanner() {
        const consent = safeStorageGet(CONSENT_KEY);
        if (consent === 'accepted') {
            loadAnalyticsAndAds();
            return;
        }
        if (consent === 'declined' || document.getElementById('cookie-banner')) return;

        // The legacy banner did not provide a genuine reject option, so do not migrate it as consent.
        safeStorageRemove('cookies-accepted');

        const text = getUiText();
        const banner = document.createElement('section');
        banner.id = 'cookie-banner';
        banner.setAttribute('role', 'dialog');
        banner.setAttribute('aria-live', 'polite');
        banner.setAttribute('aria-label', text.consentTitle);
        banner.className = 'fixed bottom-6 left-6 right-6 z-[200] bg-black/80 backdrop-blur-2xl border border-white/10 p-5 rounded-2xl shadow-2xl animate-slide-up max-w-2xl mx-auto';
        banner.innerHTML = `
            <div class="flex items-start gap-3 text-white/90 text-sm mb-4">
                <span class="p-2 bg-amber-500/20 rounded-lg shrink-0"><i data-lucide="cookie" class="w-5 h-5 text-amber-400"></i></span>
                <div>
                    <h2 class="font-black text-white mb-1">${text.consentTitle}</h2>
                    <p class="text-gray-300 leading-relaxed">${text.consentBody}</p>
                    <button type="button" onclick="showLegal('privacy')" class="mt-2 text-amber-300 underline text-xs">${text.privacy}</button>
                </div>
            </div>
            <div class="grid grid-cols-2 gap-3">
                <button type="button" onclick="declineCookies()" class="px-4 py-3 bg-white/5 border border-white/10 text-white font-bold rounded-lg hover:bg-white/10 transition-colors">${text.decline}</button>
                <button type="button" onclick="acceptCookies()" class="px-4 py-3 bg-white text-black font-bold rounded-lg hover:bg-gray-200 transition-colors">${text.accept}</button>
            </div>
        `;
        document.body.appendChild(banner);
        if (window.lucide && typeof window.lucide.createIcons === 'function') window.lucide.createIcons();
    }

    window.acceptCookies = function acceptCookies() {
        safeStorageSet(CONSENT_KEY, 'accepted');
        dismissConsentBanner();
        loadAnalyticsAndAds();
    };

    window.declineCookies = function declineCookies() {
        safeStorageSet(CONSENT_KEY, 'declined');
        dismissConsentBanner();
    };

    window.resetCookieConsent = function resetCookieConsent() {
        safeStorageRemove(CONSENT_KEY);
        safeStorageRemove('cookies-accepted');
        window.__musicVibeOptionalServicesLoaded = false;
        const message = getUiLanguage() === 'kr'
            ? '저장된 쿠키 선택을 초기화했습니다. 페이지를 새로고침하면 다시 선택할 수 있습니다.'
            : 'Your saved cookie choice was cleared. Reload the page to choose again.';
        window.alert(message);
    };

    // Replace the legacy banner before init() runs.
    window.showCookieBanner = showConsentBanner;

    window.getShareUrl = function getShareUrl() {
        const url = new URL(window.location.pathname || '/', window.location.origin);
        const lang = getUiLanguage();
        if (lang) url.searchParams.set('lang', lang);

        try {
            if (finalResult && finalResult.mbti) {
                url.searchParams.set('ref', String(finalResult.mbti).trim().toUpperCase());
            }
        } catch (_) {
            // The intro screen has no final result yet.
        }

        return url.toString();
    };

    function buildSharePayload() {
        const text = getUiText();
        let genre = SITE_NAME;
        let subtitle = '';
        try {
            if (finalResult) {
                genre = stripHtml(finalResult.genre) || SITE_NAME;
                subtitle = stripHtml(finalResult.subTitle);
            }
        } catch (_) {
            // Keep generic payload.
        }

        return {
            title: `🎵 ${genre} | ${SITE_NAME}`,
            text: subtitle || 'Find your music persona.',
            url: window.getShareUrl(),
            copySuccess: text.copied,
            copyError: text.shareError
        };
    }

    async function copyText(value) {
        if (navigator.clipboard && window.isSecureContext) {
            await navigator.clipboard.writeText(value);
            return;
        }
        const textarea = document.createElement('textarea');
        textarea.value = value;
        textarea.setAttribute('readonly', '');
        textarea.style.position = 'fixed';
        textarea.style.opacity = '0';
        document.body.appendChild(textarea);
        textarea.select();
        const success = document.execCommand('copy');
        textarea.remove();
        if (!success) throw new Error('Copy command failed');
    }

    window.shareResult = async function shareResult() {
        if (typeof triggerHaptic === 'function') triggerHaptic();
        const payload = buildSharePayload();
        if (navigator.share) {
            try {
                await navigator.share({ title: payload.title, text: payload.text, url: payload.url });
                return;
            } catch (error) {
                if (error && error.name === 'AbortError') return;
            }
        }

        try {
            await copyText(payload.url);
            window.alert(payload.copySuccess);
        } catch (_) {
            window.prompt('Copy this link:', payload.url);
        }
    };

    window.handleSystemShare = window.shareResult;

    window.shareTwitter = function shareTwitter() {
        const payload = buildSharePayload();
        const intentUrl = new URL('https://twitter.com/intent/tweet');
        intentUrl.searchParams.set('text', `${payload.title}\n${payload.text}`);
        intentUrl.searchParams.set('url', payload.url);
        intentUrl.searchParams.set('hashtags', 'MusicVibeTest,음악성격');
        window.open(intentUrl.toString(), '_blank', 'noopener,noreferrer,width=550,height=420');
    };

    // Do not preload Kakao. Load the single pinned SDK only when the Kakao button is used.
    window.initKakao = function initKakao() {};

    async function ensureKakao() {
        if (!window.Kakao) {
            await loadScriptOnce(
                'music-vibe-kakao-sdk',
                'https://t1.kakaocdn.net/kakao_js_sdk/2.7.2/kakao.min.js',
                {
                    integrity: 'sha384-TiCUE00h649CAMonG018J2ujOgDKW/kVWlChEuu4jK2txfYR9bGr4i3le8M8UPJA',
                    crossorigin: 'anonymous'
                }
            );
        }
        if (!window.Kakao) throw new Error('Kakao SDK is unavailable');
        if (!window.Kakao.isInitialized()) window.Kakao.init(KAKAO_JS_KEY);
    }

    window.shareKakao = async function shareKakao() {
        if (!finalResult) return;
        try {
            await ensureKakao();
            const payload = buildSharePayload();
            const imageUrl = new URL(finalResult.image, window.location.href).href;
            window.Kakao.Share.sendDefault({
                objectType: 'feed',
                content: {
                    title: payload.title,
                    description: payload.text,
                    imageUrl,
                    link: { mobileWebUrl: payload.url, webUrl: payload.url }
                },
                buttons: [{
                    title: getUiLanguage() === 'kr' ? '결과 비교하기' : 'Compare results',
                    link: { mobileWebUrl: payload.url, webUrl: payload.url }
                }]
            });
        } catch (error) {
            console.warn('Kakao share failed:', error);
            window.shareResult();
        }
    };

    window.updateMetaTags = function updateMetaTags(result) {
        if (!result) return;
        const genre = stripHtml(result.genre) || SITE_NAME;
        const subtitle = stripHtml(result.subTitle || result.desc);
        const title = `${genre} | ${SITE_NAME}`;
        const description = subtitle ? `${subtitle} 🎧` : 'Find your music persona.';
        const image = new URL(result.image || 'assets/icon_main.webp', window.location.href).href;
        const shareUrl = window.getShareUrl();

        document.title = title;
        document.querySelector('meta[property="og:title"]')?.setAttribute('content', title);
        document.querySelector('meta[property="og:description"]')?.setAttribute('content', description);
        document.querySelector('meta[property="og:image"]')?.setAttribute('content', image);
        document.querySelector('meta[property="og:url"]')?.setAttribute('content', shareUrl);
        document.querySelector('meta[name="twitter:title"]')?.setAttribute('content', title);
        document.querySelector('meta[name="twitter:description"]')?.setAttribute('content', description);
        document.querySelector('meta[name="twitter:image"]')?.setAttribute('content', image);

        if (typeof window.injectJsonLd === 'function') window.injectJsonLd(result);
    };

    function normalizeUnsupportedMetrics(root = document) {
        root.querySelectorAll('span').forEach((element) => {
            const value = (element.textContent || '').trim();
            if (/^TOP\s+\d+(?:\.\d+)?%\s+VIBE$/i.test(value)) {
                element.textContent = 'VIBE PROFILE';
            }
        });
    }

    function hashString(value) {
        let hash = 2166136261;
        for (let index = 0; index < value.length; index += 1) {
            hash ^= value.charCodeAt(index);
            hash = Math.imul(hash, 16777619);
        }
        return (hash >>> 0).toString(36).toUpperCase().padStart(6, '0').slice(0, 6);
    }

    function updateExportTrustData() {
        const profileId = document.getElementById('export-profile-id');
        let type = 'VIBE';
        try {
            if (finalResult && finalResult.mbti) type = String(finalResult.mbti).toUpperCase();
        } catch (_) {
            // Keep fallback.
        }
        if (profileId) profileId.textContent = `#MV-${type}-${hashString(window.getShareUrl())}`;
    }

    async function ensureHtml2Canvas() {
        if (typeof window.html2canvas === 'function') return;
        await loadScriptOnce(
            'music-vibe-html2canvas',
            'https://cdn.jsdelivr.net/npm/html2canvas@1.4.1/dist/html2canvas.min.js'
        );
        if (typeof window.html2canvas !== 'function') throw new Error('Image capture library is unavailable');
    }

    async function ensureQrLibrary() {
        if (typeof window.QRCode === 'function') return;
        await loadScriptOnce(
            'music-vibe-qrcode',
            'https://cdn.jsdelivr.net/npm/qrcodejs@1.0.0/qrcode.min.js'
        );
        if (typeof window.QRCode !== 'function') throw new Error('QR library is unavailable');
    }

    async function renderExportQr() {
        const target = document.getElementById('export-qr-image');
        if (!target) return;
        await ensureQrLibrary();

        const workspace = document.createElement('div');
        workspace.setAttribute('aria-hidden', 'true');
        workspace.style.position = 'fixed';
        workspace.style.left = '-9999px';
        workspace.style.top = '0';
        document.body.appendChild(workspace);

        try {
            new window.QRCode(workspace, {
                text: window.getShareUrl(),
                width: 320,
                height: 320,
                colorDark: '#000000',
                colorLight: '#ffffff',
                correctLevel: window.QRCode.CorrectLevel.M
            });

            await new Promise((resolve) => window.setTimeout(resolve, 80));
            const canvas = workspace.querySelector('canvas');
            const generatedImage = workspace.querySelector('img');
            const dataUrl = canvas ? canvas.toDataURL('image/png') : generatedImage?.src;
            if (!dataUrl) throw new Error('QR image generation failed');

            await new Promise((resolve, reject) => {
                target.onload = () => resolve();
                target.onerror = () => reject(new Error('QR image could not be prepared'));
                target.src = dataUrl;
                if (target.complete) resolve();
            });
        } finally {
            workspace.remove();
        }
    }

    const legacySaveImage = window.saveImage;
    if (typeof legacySaveImage === 'function') {
        window.saveImage = async function saveImage() {
            try {
                updateExportTrustData();
                await Promise.all([ensureHtml2Canvas(), renderExportQr()]);
                return await legacySaveImage();
            } catch (error) {
                console.error('Result image preparation failed:', error);
                const message = getUiLanguage() === 'kr'
                    ? '결과 이미지 준비에 실패했습니다. 잠시 후 다시 시도해 주세요.'
                    : 'The result image could not be prepared. Please try again.';
                window.alert(message);
                return undefined;
            }
        };
    }

    // The legacy Instagram path referenced removed element IDs. Use the verified image workflow instead.
    window.shareInstagram = async function shareInstagram() {
        return window.saveImage();
    };

    // Canonical preview implementation: avoids embedding a multi-megabyte data URL in inline JavaScript.
    window.showPreviewModal = function showPreviewModal(dataUrl) {
        document.getElementById('preview-modal')?.remove();
        const text = getUiText();
        const modal = document.createElement('div');
        modal.id = 'preview-modal';
        modal.className = 'fixed inset-0 z-[300] flex items-center justify-center p-6 animate-fade-in';
        modal.innerHTML = `
            <div class="absolute inset-0 bg-black/90 backdrop-blur-xl" data-preview-close></div>
            <div class="relative w-full max-w-sm bg-[#1a1a1c] border border-white/10 rounded-[2.5rem] p-6 shadow-2xl flex flex-col items-center animate-slide-up">
                <h3 class="text-white font-black tracking-widest uppercase text-sm mb-4">${text.previewTitle}</h3>
                <div class="w-full aspect-[9/16] rounded-2xl overflow-hidden shadow-2xl border border-white/5 mb-6 bg-black">
                    <img class="w-full h-full object-contain" alt="Music Vibe result preview">
                </div>
                <button type="button" data-preview-download class="w-full py-4 bg-white text-black font-black uppercase tracking-widest rounded-xl transition-all hover:scale-105 active:scale-95 shadow-[0_0_20px_rgba(255,255,255,0.2)] mb-3">${text.download}</button>
                <button type="button" data-preview-close class="text-gray-500 text-xs font-bold uppercase tracking-widest hover:text-white transition-colors">${text.close}</button>
            </div>
        `;
        modal.querySelector('img').src = dataUrl;
        modal.querySelector('[data-preview-download]').addEventListener('click', () => window.downloadCapturedImage(dataUrl));
        modal.querySelectorAll('[data-preview-close]').forEach((button) => {
            button.addEventListener('click', () => window.closePreview());
        });
        document.body.appendChild(modal);
    };

    window.closePreview = function closePreview() {
        const modal = document.getElementById('preview-modal');
        if (!modal) return;
        modal.classList.add('opacity-0', 'pointer-events-none');
        window.setTimeout(() => modal.remove(), 250);
    };

    // Keep only one active all-types implementation and prevent duplicate overlays.
    const canonicalRenderAllTypes = window.renderAllTypes;
    if (typeof canonicalRenderAllTypes === 'function') {
        window.renderAllTypes = function renderAllTypes() {
            document.getElementById('all-types-modal')?.remove();
            return canonicalRenderAllTypes();
        };
    }

    async function cleanupLegacyServiceWorkers() {
        if ('serviceWorker' in navigator) {
            try {
                const registrations = await navigator.serviceWorker.getRegistrations();
                await Promise.all(registrations.map((registration) => registration.unregister()));
            } catch (error) {
                console.warn('Service worker cleanup failed:', error);
            }
        }

        if ('caches' in window) {
            try {
                const keys = await window.caches.keys();
                await Promise.all(
                    keys
                        .filter((key) => key.startsWith('music-vibe-'))
                        .map((key) => window.caches.delete(key))
                );
            } catch (error) {
                console.warn('Cache cleanup failed:', error);
            }
        }
    }

    applyTranslationPatches();

    document.addEventListener('DOMContentLoaded', () => {
        const year = document.getElementById('copyright-year');
        if (year) year.textContent = String(new Date().getFullYear());

        const langMap = { kr: 'ko', jp: 'ja', tw: 'zh-TW' };
        document.documentElement.lang = langMap[getUiLanguage()] || getUiLanguage();

        const app = document.getElementById('app-container');
        if (app) {
            normalizeUnsupportedMetrics(app);
            const observer = new MutationObserver(() => normalizeUnsupportedMetrics(app));
            observer.observe(app, { childList: true, subtree: true });
        }

        cleanupLegacyServiceWorkers();
    });
})();
