// P2 analytics bindings for crawlable static result pages.
(() => {
    'use strict';

    function track(name, params = {}, options = {}) {
        return window.trackEvent?.(name, params, options);
    }

    function resultType() {
        return String(document.body?.dataset?.resultType || '').toUpperCase();
    }

    function language() {
        return document.body?.dataset?.language || document.documentElement.lang || 'en';
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

        // Removes the legacy anonymous inline listener from the generated layout.
        const button = original.cloneNode(true);
        original.replaceWith(button);

        button.addEventListener('click', async () => {
            const payload = {
                title: document.title,
                text: document.querySelector('.subtitle')?.textContent?.trim() || '',
                url: window.location.href
            };

            track('share_click', {
                share_method: navigator.share ? 'native' : 'copy',
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
        track('ref_visit', {
            ref_type: type,
            referral_stage: 'static_result',
            traffic_source: 'shared_result'
        });

        const cta = document.querySelector('.primary');
        cta?.addEventListener('click', () => {
            track('ref_cta_click', {
                ref_type: type,
                referral_stage: 'static_to_app'
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
