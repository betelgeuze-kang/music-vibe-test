// P2 analytics bindings for crawlable static result pages.
(() => {
    'use strict';

    function track(name, params = {}, options = {}) {
        return window.trackEvent?.(name, params, options);
    }

    function analyticsSnapshot() {
        return window.MusicVibeAnalytics?.getSnapshot?.() || { attribution: {} };
    }

    function resultType() {
        return String(document.body?.dataset?.resultType || '').toUpperCase();
    }

    function language() {
        return document.body?.dataset?.language || document.documentElement.lang || 'en';
    }

    function attributedShareUrl() {
        const url = new URL(window.location.href);
        const type = resultType();
        url.searchParams.set('src', 'share');
        url.searchParams.set('utm_source', 'music_vibe');
        url.searchParams.set('utm_medium', 'share');
        url.searchParams.set('utm_campaign', 'result_share');
        if (type) url.searchParams.set('utm_content', type.toLowerCase());
        url.searchParams.delete('debug');
        url.searchParams.delete('exp');
        url.searchParams.delete('variant');
        return url.toString();
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
        if (!success) throw new Error('Copy failed');
    }

    function replaceShareHandler() {
        const original = document.getElementById('share-result');
        if (!original) return;

        // Cloning removes the anonymous listener emitted by the static layout.
        const button = original.cloneNode(true);
        original.replaceWith(button);

        button.addEventListener('click', async () => {
            const method = navigator.share ? 'native' : 'copy';
            const payload = {
                title: document.title,
                text: document.querySelector('.subtitle')?.textContent?.trim() || '',
                url: attributedShareUrl()
            };

            track('share_click', {
                share_method: method,
                placement: 'static_result',
                result_type: resultType()
            });

            if (navigator.share) {
                try {
                    await navigator.share(payload);
                    track('share_success', {
                        share_method: 'native',
                        placement: 'static_result',
                        result_type: resultType()
                    });
                    return;
                } catch (error) {
                    if (error?.name === 'AbortError') {
                        track('share_cancel', {
                            share_method: 'native',
                            placement: 'static_result',
                            result_type: resultType()
                        });
                        return;
                    }
                }
            }

            try {
                await copyText(payload.url);
                track('share_success', {
                    share_method: 'copy',
                    placement: 'static_result',
                    result_type: resultType()
                });
                window.alert(language().toLowerCase().startsWith('ko')
                    ? '결과 링크가 복사되었습니다.'
                    : 'Result link copied.');
            } catch (error) {
                track('share_error', {
                    share_method: 'copy',
                    placement: 'static_result',
                    result_type: resultType(),
                    error_name: error?.name || 'Error'
                });
                window.prompt('Copy this link:', payload.url);
            }
        });
    }

    document.addEventListener('DOMContentLoaded', () => {
        const type = resultType();
        const attribution = analyticsSnapshot().attribution || {};
        const sharedEntry = Boolean(attribution.shared_entry);

        track('static_result_view', {
            result_type: type,
            shared_entry: sharedEntry,
            traffic_source: attribution.source || (sharedEntry ? 'shared_result' : 'organic_or_direct')
        });

        // Organic search visits remain content views. Referral attribution starts only
        // when the URL or session contains an explicit sharing signal.
        if (sharedEntry) {
            track('ref_visit', {
                ref_type: attribution.ref_type || type,
                referral_stage: 'static_result',
                traffic_source: attribution.source || 'shared_result'
            });
        }

        const cta = document.querySelector('.primary');
        cta?.addEventListener('click', () => {
            track('ref_cta_click', {
                ref_type: type,
                referral_stage: 'static_to_app',
                shared_entry: sharedEntry
            });
        });

        document.querySelectorAll('.track').forEach((link, index) => {
            link.addEventListener('click', () => {
                const title = link.querySelector('strong')?.textContent?.trim() || '';
                const detail = link.querySelector('small')?.textContent?.trim() || '';
                track('playlist_click', {
                    result_type: type,
                    track_title: title,
                    track_detail: detail,
                    track_position: index + 1,
                    placement: 'static_result'
                });
            });
        });

        replaceShareHandler();
    });
})();
