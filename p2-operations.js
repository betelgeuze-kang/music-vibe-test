// P2 funnel measurement, referral-loop instrumentation and controlled experiments.
(() => {
    'use strict';

    const EXPERIMENTS = Object.freeze({
        landing_copy_v1: Object.freeze({
            status: 'active',
            variants: Object.freeze(['concrete', 'abstract']),
            weights: Object.freeze([50, 50]),
            primaryMetric: 'start_test_rate'
        }),
        test_length_v1: Object.freeze({
            status: 'ready',
            variants: Object.freeze(['quick_12', 'deep_40']),
            weights: Object.freeze([50, 50]),
            primaryMetric: 'test_complete_rate'
        }),
        result_delay_v1: Object.freeze({
            status: 'ready',
            variants: Object.freeze(['instant', 'legacy_2500']),
            weights: Object.freeze([50, 50]),
            primaryMetric: 'result_view_rate'
        }),
        share_placement_v1: Object.freeze({
            status: 'ready',
            variants: Object.freeze(['top', 'bottom']),
            weights: Object.freeze([50, 50]),
            primaryMetric: 'share_success_rate'
        }),
        export_card_v1: Object.freeze({
            status: 'ready',
            variants: Object.freeze(['classic_a', 'poster_b']),
            weights: Object.freeze([50, 50]),
            primaryMetric: 'image_save_rate'
        }),
        playlist_visibility_v1: Object.freeze({
            status: 'ready',
            variants: Object.freeze(['visible', 'hidden']),
            weights: Object.freeze([50, 50]),
            primaryMetric: 'playlist_click_rate'
        })
    });

    const activeExperimentIds = Object.entries(EXPERIMENTS)
        .filter(([, experiment]) => experiment.status === 'active')
        .map(([id]) => id);

    if (activeExperimentIds.length !== 1) {
        console.error('Exactly one production experiment must be active.', activeExperimentIds);
    }

    const funnel = {
        started: false,
        completed: false,
        completeEventSeen: false,
        resultViewed: false,
        abandoned: false,
        resultAbandoned: false,
        referralCompleted: false,
        startedAt: 0,
        completedAt: 0,
        lastQuestion: 0,
        questionCount: 12,
        testMode: 'quick_12',
        resultOrigin: 'unknown'
    };

    let resultDelayConsumed = false;
    let hiddenTimer = null;
    let refVisitTracked = false;
    const exposedPlacements = new Set();

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

    function hashString(value) {
        let hash = 2166136261;
        for (let index = 0; index < value.length; index += 1) {
            hash ^= value.charCodeAt(index);
            hash = Math.imul(hash, 16777619);
        }
        return hash >>> 0;
    }

    function analyticsSnapshot() {
        return window.MusicVibeAnalytics?.getSnapshot?.() || {
            visitorId: 'anonymous',
            sessionId: 'anonymous',
            attribution: {}
        };
    }

    function resolveExperimentAssignment() {
        const params = new URLSearchParams(window.location.search);
        const requestedId = params.get('exp');
        const requestedVariant = params.get('variant');

        if (
            requestedId
            && EXPERIMENTS[requestedId]
            && requestedVariant
            && EXPERIMENTS[requestedId].variants.includes(requestedVariant)
        ) {
            return { id: requestedId, variant: requestedVariant, source: 'preview' };
        }

        if (activeExperimentIds.length !== 1) {
            return { id: '', variant: '', source: 'disabled_invalid_config' };
        }

        const id = activeExperimentIds[0];
        const experiment = EXPERIMENTS[id];
        const storageKey = `music-vibe-experiment-${id}`;
        const storedVariant = safeLocalGet(storageKey);
        if (experiment.variants.includes(storedVariant)) {
            return { id, variant: storedVariant, source: 'stored' };
        }

        const seed = `${analyticsSnapshot().visitorId}|${id}`;
        const bucket = hashString(seed) % 100;
        let boundary = 0;
        let selected = experiment.variants[0];

        experiment.variants.some((variant, index) => {
            boundary += Number(experiment.weights[index] || 0);
            if (bucket < boundary) {
                selected = variant;
                return true;
            }
            return false;
        });

        safeLocalSet(storageKey, selected);
        return { id, variant: selected, source: 'assigned' };
    }

    const assignment = resolveExperimentAssignment();
    window.__musicVibeExperimentContext = Object.freeze({ ...assignment });
    window.MusicVibeExperiments = Object.freeze({
        definitions: EXPERIMENTS,
        assignment,
        previewUrl(experimentId, variant) {
            if (!EXPERIMENTS[experimentId]?.variants.includes(variant)) return '';
            const url = new URL(window.location.href);
            url.searchParams.set('exp', experimentId);
            url.searchParams.set('variant', variant);
            return url.toString();
        }
    });

    function track(name, params = {}, options = {}) {
        return window.trackEvent?.(name, params, options);
    }

    function expose(placement) {
        if (!assignment.id || !assignment.variant) return;
        const key = `${assignment.id}:${assignment.variant}:${placement}`;
        if (exposedPlacements.has(key)) return;
        exposedPlacements.add(key);
        track('experiment_exposure', {
            experiment_id: assignment.id,
            experiment_variant: assignment.variant,
            exposure_placement: placement,
            assignment_source: assignment.source
        });
    }

    function currentLanguage() {
        try {
            return currentLang === 'kr' ? 'kr' : 'en';
        } catch (_) {
            return 'en';
        }
    }

    function currentResultType() {
        try {
            return finalResult?.mbti ? String(finalResult.mbti).toUpperCase() : '';
        } catch (_) {
            return '';
        }
    }

    function stripHtml(value) {
        const template = document.createElement('template');
        template.innerHTML = String(value || '');
        return (template.content.textContent || '').replace(/\s+/g, ' ').trim();
    }

    function resetFunnel(origin = 'unknown') {
        funnel.started = false;
        funnel.completed = false;
        funnel.completeEventSeen = false;
        funnel.resultViewed = false;
        funnel.abandoned = false;
        funnel.resultAbandoned = false;
        funnel.referralCompleted = false;
        funnel.startedAt = 0;
        funnel.completedAt = 0;
        funnel.lastQuestion = 0;
        funnel.questionCount = funnel.testMode === 'deep_40' ? 40 : 12;
        funnel.resultOrigin = origin;
        resultDelayConsumed = false;
    }

    function predictLegacyResultType() {
        try {
            const eType = scores.E >= scores.I ? 'E' : 'I';
            const sType = scores.S >= scores.N ? 'S' : 'N';
            const fType = scores.F >= scores.T ? 'F' : 'T';
            const jType = scores.J >= scores.P ? 'J' : 'P';
            return `${eType}${sType}${fType}${jType}`;
        } catch (_) {
            return '';
        }
    }

    function markTestComplete(resultType = '') {
        if (!funnel.started || funnel.completeEventSeen) return;
        funnel.completed = true;
        funnel.completeEventSeen = true;
        funnel.completedAt = Date.now();
        track('test_complete', {
            test_mode: funnel.testMode,
            result_type: resultType,
            question_count: funnel.questionCount,
            elapsed_ms: funnel.startedAt ? Date.now() - funnel.startedAt : 0
        });
    }

    function applyFlowVariant() {
        if (assignment.id !== 'test_length_v1' || assignment.variant !== 'deep_40') {
            funnel.testMode = 'quick_12';
            return;
        }

        const legacy = window.__musicVibeLegacyFlow;
        if (!legacy?.startTest || !legacy?.renderTest || !legacy?.handleAnswer || !legacy?.calculateResult) {
            console.warn('The deep 40-question experiment is unavailable; falling back to quick mode.');
            funnel.testMode = 'quick_12';
            return;
        }

        window.startTest = legacy.startTest;
        window.renderTest = legacy.renderTest;
        window.handleAnswer = legacy.handleAnswer;
        window.calculateResult = legacy.calculateResult;
        funnel.testMode = 'deep_40';
    }

    applyFlowVariant();
    resetFunnel('landing');
    document.documentElement.dataset.testMode = funnel.testMode.replace('_', '-');

    function appendShareAttribution(rawUrl) {
        const url = new URL(rawUrl || window.location.href, window.location.origin);
        const type = currentResultType();
        if (!type || !/\/results\/[a-z]{4}\/?$/i.test(url.pathname)) return url.toString();
        url.searchParams.set('src', 'share');
        url.searchParams.set('utm_source', 'music_vibe');
        url.searchParams.set('utm_medium', 'share');
        url.searchParams.set('utm_campaign', 'result_share');
        url.searchParams.set('utm_content', type.toLowerCase());
        return url.toString();
    }

    const selectedGetShareUrl = window.getShareUrl;
    if (typeof selectedGetShareUrl === 'function') {
        window.getShareUrl = function attributedShareUrl() {
            return appendShareAttribution(selectedGetShareUrl.apply(this, arguments));
        };
    }

    function emitReferralVisit() {
        const attribution = analyticsSnapshot().attribution || {};
        if (refVisitTracked || !attribution.ref_type) return;
        refVisitTracked = true;
        track('ref_visit', {
            ref_type: attribution.ref_type,
            referral_stage: 'app_landing',
            traffic_source: attribution.source || 'shared_link'
        });
    }

    function applyLandingExperiment() {
        if (assignment.id !== 'landing_copy_v1') return;
        expose('landing');
        if (assignment.variant === 'concrete') return;

        const title = document.querySelector('#app-container h1');
        const description = title?.nextElementSibling;
        const isKorean = currentLanguage() === 'kr';
        if (title) {
            title.textContent = isKorean
                ? '당신의 영혼은\n어떤 음악으로 울리나요?'
                : 'What music makes\nyour soul resonate?';
        }
        if (description) {
            description.textContent = isKorean
                ? '감각과 성향을 따라가며 지금의 나를 닮은 음악적 주파수를 발견해 보세요.'
                : 'Follow your instincts and discover the musical frequency that feels most like you.';
        }
    }

    function applyDeepOfferCopy() {
        if (funnel.testMode !== 'deep_40') return;
        expose('landing_test_mode');
        const isKorean = currentLanguage() === 'kr';
        const statValues = document.querySelectorAll('#app-container .grid.grid-cols-3 strong');
        if (statValues[0]) statValues[0].textContent = isKorean ? '약 4분' : 'About 4 min';
        if (statValues[1]) statValues[1].textContent = isKorean ? '40문항' : '40 questions';
        if (statValues[2]) statValues[2].textContent = isKorean ? '심층 성향' : 'Deep profile';
        const startLabel = document.querySelector('#app-container [data-start-quick] span.relative');
        if (startLabel?.lastChild) {
            startLabel.lastChild.textContent = isKorean ? ' 심층 테스트 시작' : ' Start the deep test';
        }
    }

    const selectedRenderIntro = window.renderIntro;
    if (typeof selectedRenderIntro === 'function') {
        window.renderIntro = function measuredRenderIntro() {
            const result = selectedRenderIntro.apply(this, arguments);
            applyLandingExperiment();
            applyDeepOfferCopy();
            track('landing_view', {
                landing_variant: assignment.id === 'landing_copy_v1' ? assignment.variant : 'default',
                offered_test_mode: funnel.testMode,
                referral_present: Boolean(analyticsSnapshot().attribution?.ref_type)
            }, { allowDuplicate: true });
            emitReferralVisit();
            return result;
        };
    }

    function emitAbandon(reason) {
        if (!funnel.started || funnel.resultViewed) return;

        const base = {
            abandon_reason: reason,
            test_mode: funnel.testMode,
            last_question: funnel.lastQuestion,
            question_count: funnel.questionCount,
            progress_percent: funnel.questionCount
                ? Math.min(100, Math.round((funnel.lastQuestion / funnel.questionCount) * 100))
                : 0,
            elapsed_ms: funnel.startedAt ? Date.now() - funnel.startedAt : 0
        };

        if (funnel.completed) {
            if (funnel.resultAbandoned) return;
            funnel.resultAbandoned = true;
            track('result_abandon', base, { transportType: 'beacon' });
            return;
        }

        if (funnel.abandoned) return;
        funnel.abandoned = true;
        track('test_abandon', base, { transportType: 'beacon' });
    }

    const selectedStartTest = window.startTest;
    if (typeof selectedStartTest === 'function') {
        window.startTest = function measuredStartTest() {
            emitAbandon('restart_test');
            resetFunnel('test');
            funnel.started = true;
            funnel.startedAt = Date.now();
            funnel.questionCount = funnel.testMode === 'deep_40' ? 40 : 12;
            track('start_test', {
                test_mode: funnel.testMode,
                question_count: funnel.questionCount
            });
            return selectedStartTest.apply(this, arguments);
        };
    }

    const selectedResetTest = window.resetTest;
    if (typeof selectedResetTest === 'function') {
        window.resetTest = function measuredResetTest() {
            emitAbandon('home_reset');
            resetFunnel('landing');
            return selectedResetTest.apply(this, arguments);
        };
    }

    const selectedHandleAnswer = window.handleAnswer;
    if (funnel.testMode === 'deep_40' && typeof selectedHandleAnswer === 'function') {
        window.handleAnswer = function measuredDeepAnswer(type, score) {
            let questionNumber = funnel.lastQuestion + 1;
            let axis = '';
            try {
                questionNumber = Number(currentQIndex) + 1;
                axis = QUESTIONS?.[currentQIndex]?.axis || '';
            } catch (_) {
                // Legacy globals are only unavailable outside the app shell.
            }

            funnel.lastQuestion = questionNumber;
            track('question_answer', {
                test_mode: 'deep_40',
                question_number: questionNumber,
                question_count: 40,
                question_kind: 'personality_scale',
                axis,
                selected_type: type,
                selected_score: score
            });
            return selectedHandleAnswer.apply(this, arguments);
        };
    }

    const selectedCalculateResult = window.calculateResult;
    if (funnel.testMode === 'deep_40' && typeof selectedCalculateResult === 'function') {
        window.calculateResult = function measuredDeepCalculateResult() {
            markTestComplete(predictLegacyResultType());
            return selectedCalculateResult.apply(this, arguments);
        };
    }

    function renderDelayScreen() {
        const host = document.getElementById('app-container');
        if (!host) return;
        const isKorean = currentLanguage() === 'kr';
        host.innerHTML = `
            <div class="flex min-h-full flex-col items-center justify-center px-8 text-center">
                <div class="relative h-20 w-20">
                    <div class="absolute inset-0 rounded-full border border-purple-300/20"></div>
                    <div class="absolute inset-2 animate-spin rounded-full border-2 border-transparent border-t-purple-300 border-r-amber-300"></div>
                    <div class="absolute inset-6 rounded-full bg-white/10"></div>
                </div>
                <h2 class="mt-7 text-xl font-black text-white">${isKorean ? '당신의 바이브를 조율하는 중' : 'Tuning your music vibe'}</h2>
                <p class="mt-2 text-xs leading-5 text-gray-500">${isKorean ? '선택의 패턴을 하나의 사운드로 연결하고 있어요.' : 'Connecting your choices into one sound profile.'}</p>
            </div>
        `;
    }

    function applyExportCardVariant() {
        const card = document.getElementById('export-card');
        if (!card) return;
        card.dataset.exportVariant = assignment.id === 'export_card_v1'
            ? assignment.variant
            : 'classic_a';
        if (card.dataset.exportVariant !== 'poster_b') return;

        const background = document.getElementById('export-bg-gradient');
        const genre = document.getElementById('export-genre-en');
        const match = document.getElementById('export-match-type');
        if (background) {
            background.className = 'absolute inset-0 z-0 bg-[radial-gradient(circle_at_75%_20%,#7c3aed_0%,transparent_38%),radial-gradient(circle_at_20%_75%,#d97706_0%,transparent_42%),linear-gradient(145deg,#09090b,#18181b)]';
        }
        if (genre) {
            genre.style.letterSpacing = '-0.075em';
            genre.style.transform = 'skewY(-3deg)';
        }
        if (match) match.style.textTransform = 'uppercase';
    }

    function applyResultExperiments() {
        if (assignment.id === 'share_placement_v1') {
            expose('result_share');
            const panel = document.getElementById('result-share-panel');
            if (panel && assignment.variant === 'bottom') {
                panel.parentElement?.appendChild(panel);
                panel.dataset.experimentPlacement = 'bottom';
            }
        }
        if (assignment.id === 'playlist_visibility_v1') {
            expose('result_playlist');
            if (assignment.variant === 'hidden') document.getElementById('result-playlist')?.remove();
        }
        if (assignment.id === 'export_card_v1') {
            expose('result_export');
            applyExportCardVariant();
        }
    }

    function finalizeResultView() {
        if (funnel.resultViewed) return;
        const resultType = currentResultType();

        if (funnel.started && !funnel.completeEventSeen) markTestComplete(resultType);
        funnel.resultViewed = true;
        applyResultExperiments();

        track('result_view', {
            result_type: resultType,
            result_origin: funnel.resultOrigin,
            test_mode: funnel.started ? funnel.testMode : '',
            elapsed_ms: funnel.startedAt ? Date.now() - funnel.startedAt : 0
        });

        const refType = analyticsSnapshot().attribution?.ref_type;
        if (funnel.started && funnel.completed && refType && !funnel.referralCompleted) {
            funnel.referralCompleted = true;
            track('ref_complete', {
                ref_type: refType,
                result_type: resultType,
                referral_match: refType === resultType,
                elapsed_ms: funnel.startedAt ? Date.now() - funnel.startedAt : 0
            });
        }
    }

    const selectedRenderResult = window.renderResult;
    if (typeof selectedRenderResult === 'function') {
        window.renderResult = function measuredRenderResult() {
            if (
                funnel.started
                && assignment.id === 'result_delay_v1'
                && assignment.variant === 'legacy_2500'
                && !resultDelayConsumed
            ) {
                resultDelayConsumed = true;
                expose('result_transition');
                renderDelayScreen();
                const args = arguments;
                window.setTimeout(() => {
                    selectedRenderResult.apply(this, args);
                    finalizeResultView();
                }, 2500);
                return undefined;
            }

            const result = selectedRenderResult.apply(this, arguments);
            finalizeResultView();
            return result;
        };
    }

    // Landing sample cards call a captured function, so use capture-phase delegation.
    document.addEventListener('click', (event) => {
        const sample = event.target?.closest?.('[data-sample-type]');
        if (sample) {
            resetFunnel('sample_preview');
            const type = String(sample.dataset.sampleType || '').toUpperCase();
            track('sample_result_click', {
                result_type: type,
                placement: 'landing_samples'
            });
        }
    }, true);

    const selectedTypeBrowser = window.selectTypeAndShowResult;
    if (typeof selectedTypeBrowser === 'function') {
        window.selectTypeAndShowResult = function measuredTypeBrowser(type) {
            resetFunnel('type_browser');
            track('sample_result_click', {
                result_type: String(type || '').toUpperCase(),
                placement: 'all_types'
            });
            return selectedTypeBrowser.apply(this, arguments);
        };
    }

    document.addEventListener('musicvibe:analytics', (event) => {
        const record = event.detail;
        if (!record) return;

        if (record.name === 'question_answer') {
            funnel.started = true;
            funnel.lastQuestion = Number(record.params.question_number || funnel.lastQuestion);
            funnel.questionCount = Math.max(
                funnel.questionCount,
                Number(record.params.question_count || 0),
                funnel.testMode === 'deep_40' ? 40 : 12
            );
        }
        if (record.name === 'test_complete') {
            funnel.completed = true;
            funnel.completeEventSeen = true;
            funnel.completedAt = funnel.completedAt || Date.now();
        }
        if (record.name === 'result_view') funnel.resultViewed = true;
    });

    window.addEventListener('pagehide', () => emitAbandon('pagehide'));
    document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'hidden') {
            hiddenTimer = window.setTimeout(() => emitAbandon('visibility_hidden_30s'), 30000);
        } else if (hiddenTimer) {
            window.clearTimeout(hiddenTimer);
            hiddenTimer = null;
        }
    });

    function isAudioPlaying() {
        try {
            return typeof isPlaying !== 'undefined' && Boolean(isPlaying);
        } catch (_) {
            return false;
        }
    }

    const selectedToggleAudio = window.toggleAudio;
    if (typeof selectedToggleAudio === 'function') {
        window.toggleAudio = function measuredToggleAudio() {
            const wasPlaying = isAudioPlaying();
            const result = selectedToggleAudio.apply(this, arguments);
            window.setTimeout(() => {
                if (!wasPlaying && isAudioPlaying()) {
                    track('audio_play', {
                        audio_context: 'result_preview',
                        result_type: currentResultType()
                    });
                }
            }, 0);
            return result;
        };
    }

    function inferSharePlacement() {
        const active = document.activeElement;
        if (active?.closest?.('#result-share-panel')) return 'result_top';
        if (active?.closest?.('#share-modal')) return 'share_modal';
        return document.getElementById('result-share-panel')?.dataset?.experimentPlacement === 'bottom'
            ? 'result_bottom'
            : 'unknown';
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

    function sharePayload() {
        let genre = 'Music Vibe Test';
        let text = 'Find your music persona.';
        try {
            genre = stripHtml(finalResult?.genre) || genre;
            text = stripHtml(finalResult?.subTitle || finalResult?.desc) || text;
        } catch (_) {
            // Generic share payload is valid before a result exists.
        }
        return {
            title: `🎵 ${genre} | Music Vibe Test`,
            text,
            url: typeof window.getShareUrl === 'function' ? window.getShareUrl() : window.location.href
        };
    }

    window.shareResult = async function measuredShareResult() {
        const payload = sharePayload();
        const placement = inferSharePlacement();
        track('share_click', { placement, result_type: currentResultType() });

        if (navigator.share) {
            try {
                await navigator.share(payload);
                track('share_success', {
                    share_method: 'native', placement, result_type: currentResultType()
                });
                return { status: 'shared', method: 'native' };
            } catch (error) {
                if (error?.name === 'AbortError') {
                    track('share_cancel', { share_method: 'native', placement });
                    return { status: 'cancelled', method: 'native' };
                }
            }
        }

        try {
            await copyText(payload.url);
            track('share_success', {
                share_method: 'copy', placement, result_type: currentResultType()
            });
            window.alert(currentLanguage() === 'kr' ? '결과 링크가 복사되었습니다.' : 'Result link copied.');
            return { status: 'shared', method: 'copy' };
        } catch (error) {
            track('share_error', {
                share_method: 'copy', placement, error_name: error?.name || 'Error'
            });
            window.prompt('Copy this link:', payload.url);
            return { status: 'error', method: 'copy' };
        }
    };
    window.handleSystemShare = window.shareResult;

    const selectedKakaoShare = window.shareKakao;
    if (typeof selectedKakaoShare === 'function') {
        window.shareKakao = async function measuredKakaoShare() {
            track('share_click', {
                share_method: 'kakao', placement: 'share_modal', result_type: currentResultType()
            });
            track('share_intent_open', {
                share_method: 'kakao', placement: 'share_modal', result_type: currentResultType()
            });
            try {
                return await selectedKakaoShare.apply(this, arguments);
            } catch (error) {
                track('share_error', {
                    share_method: 'kakao', error_name: error?.name || 'Error'
                });
                throw error;
            }
        };
    }

    const selectedTwitterShare = window.shareTwitter;
    if (typeof selectedTwitterShare === 'function') {
        window.shareTwitter = function measuredTwitterShare() {
            track('share_click', {
                share_method: 'x_intent', placement: 'share_modal', result_type: currentResultType()
            });
            track('share_intent_open', {
                share_method: 'x_intent', placement: 'share_modal', result_type: currentResultType()
            });
            return selectedTwitterShare.apply(this, arguments);
        };
    }

    const selectedSaveImage = window.saveImage;
    if (typeof selectedSaveImage === 'function') {
        window.saveImage = function measuredSaveImage() {
            applyExportCardVariant();
            track('image_save', {
                placement: inferSharePlacement(),
                export_variant: document.getElementById('export-card')?.dataset?.exportVariant || 'classic_a',
                result_type: currentResultType()
            });
            return selectedSaveImage.apply(this, arguments);
        };
    }

    const selectedDownloadCapturedImage = window.downloadCapturedImage;
    if (typeof selectedDownloadCapturedImage === 'function') {
        window.downloadCapturedImage = function measuredDownloadCapturedImage() {
            const result = selectedDownloadCapturedImage.apply(this, arguments);
            track('image_save_success', {
                export_variant: document.getElementById('export-card')?.dataset?.exportVariant || 'classic_a',
                result_type: currentResultType()
            });
            return result;
        };
    }

    document.addEventListener('DOMContentLoaded', () => {
        document.documentElement.dataset.testMode = funnel.testMode.replace('_', '-');
        if (assignment.id) {
            document.documentElement.dataset.experimentId = assignment.id;
            document.documentElement.dataset.experimentVariant = assignment.variant;
        }
    });
})();
