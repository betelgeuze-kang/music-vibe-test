// P1: 60-second quick test, immediate results, top sharing, playlists, and static result URLs.
(() => {
    'use strict';

    const QUICK_TOTAL = Array.isArray(QUICK_QUESTIONS) ? QUICK_QUESTIONS.length : 0;
    const legacyRenderResult = window.renderResult;
    const legacyToggleAudio = window.toggleAudio;
    const legacySelectTypeAndShowResult = window.selectTypeAndShowResult;

    let quickAnswers = [];
    let previewAudio = null;
    let previewOptionIndex = null;
    let suppressLegacyAutoPlay = false;

    const UI = {
        kr: {
            eyebrow: '60초 음악 페르소나',
            title: '12개의 선택으로 찾는\n나의 음악 바이브',
            description: '4번의 오디오 A/B와 8번의 취향 선택으로 지금 가장 가까운 음악 페르소나를 찾아보세요.',
            duration: '약 60초',
            count: '12문항',
            audioCount: '오디오 선택 4회',
            start: '빠른 테스트 시작',
            samples: '결과 예시',
            allTypes: '16가지 바이브 미리보기',
            about: '테스트 소개',
            question: 'QUESTION',
            preview: '미리듣기',
            stop: '정지',
            choose: '이쪽이 더 끌려요',
            audioHint: '두 사운드를 짧게 들어본 뒤 선택하세요.',
            choiceHint: '지금의 나와 더 가까운 쪽을 선택하세요.',
            shareTitle: '결과를 친구에게 보내고 궁합 확인',
            shareDescription: '공유 링크는 이 결과의 정적 페이지로 연결됩니다.',
            share: '결과 공유',
            save: '이미지 저장',
            playlistTitle: '지금 바로 듣는 4곡',
            playlistDescription: '이 바이브와 잘 맞는 곡을 상황별로 골랐어요.',
            spotify: 'Spotify에서 찾기',
            staticPage: '공유용 결과 페이지 보기',
            resultReady: '결과가 준비됐어요',
            unsupportedLanguage: '빠른 테스트 문항은 현재 한국어와 영어로 제공됩니다. 선택한 언어에서는 영어 문항을 표시합니다.'
        },
        en: {
            eyebrow: '60-second music persona',
            title: 'Find your music vibe\nin 12 choices',
            description: 'Use four audio A/B choices and eight taste questions to discover the music persona closest to you right now.',
            duration: 'About 60 sec',
            count: '12 questions',
            audioCount: '4 audio choices',
            start: 'Start the quick test',
            samples: 'Sample results',
            allTypes: 'Preview all 16 vibes',
            about: 'About the test',
            question: 'QUESTION',
            preview: 'Preview',
            stop: 'Stop',
            choose: 'This one fits me',
            audioHint: 'Preview both sounds, then choose.',
            choiceHint: 'Choose what feels closer to you right now.',
            shareTitle: 'Send your result and compare vibes',
            shareDescription: 'The shared link opens a crawlable static result page.',
            share: 'Share result',
            save: 'Save image',
            playlistTitle: 'Four tracks for your vibe',
            playlistDescription: 'A situational mini-playlist selected for this result.',
            spotify: 'Find on Spotify',
            staticPage: 'Open shareable result page',
            resultReady: 'Your result is ready',
            unsupportedLanguage: 'The quick test is currently authored in Korean and English. English questions are shown for this language.'
        }
    };

    const SAMPLE_TYPES = ['ENFP', 'INFJ', 'INTJ'];

    function ui() {
        return currentLang === 'kr' ? UI.kr : UI.en;
    }

    function localized(value) {
        if (!value) return '';
        if (typeof value === 'string') return value;
        return value[currentLang] || value.en || value.kr || '';
    }

    function escapeHtml(value) {
        return String(value ?? '')
            .replaceAll('&', '&amp;')
            .replaceAll('<', '&lt;')
            .replaceAll('>', '&gt;')
            .replaceAll('"', '&quot;')
            .replaceAll("'", '&#039;');
    }

    function stripHtml(value) {
        const template = document.createElement('template');
        template.innerHTML = String(value || '');
        return (template.content.textContent || '').replace(/\s+/g, ' ').trim();
    }

    function emitEvent(name, params = {}) {
        if (typeof window.gtag === 'function') {
            window.gtag('event', name, params);
        }
    }

    function stopPreview() {
        if (previewAudio) {
            previewAudio.pause();
            previewAudio.currentTime = 0;
        }
        previewOptionIndex = null;
        document.querySelectorAll('[data-quick-preview]').forEach((button) => {
            const label = button.querySelector('[data-preview-label]');
            if (label) label.textContent = ui().preview;
            button.setAttribute('aria-pressed', 'false');
        });
    }

    function resetQuickState() {
        quickAnswers = [];
        currentQIndex = 0;
        scores = { E: 0, I: 0, S: 0, N: 0, F: 0, T: 0, J: 0, P: 0 };
        finalResult = null;
        isTransitioning = false;
        stopPreview();
        if (typeof stopAudio === 'function') stopAudio();
    }

    function setCanonical(url) {
        const canonical = document.querySelector('link[rel="canonical"]');
        if (canonical) canonical.setAttribute('href', url);
    }

    function baseLanguage() {
        return currentLang === 'kr' ? 'ko' : 'en';
    }

    function staticResultUrl(type) {
        const safeType = String(type || '').toLowerCase();
        return new URL(`/${baseLanguage()}/results/${safeType}/`, window.location.origin).toString();
    }

    function appStartUrl(type) {
        const url = new URL('/', window.location.origin);
        url.searchParams.set('lang', currentLang === 'kr' ? 'kr' : 'en');
        if (type) url.searchParams.set('ref', String(type).toUpperCase());
        return url.toString();
    }

    // Shared result URLs now point to crawlable, language-specific static pages.
    window.getShareUrl = function getShareUrl() {
        if (finalResult && finalResult.mbti) return staticResultUrl(finalResult.mbti);
        const url = new URL('/', window.location.origin);
        url.searchParams.set('lang', currentLang || 'en');
        return url.toString();
    };

    // Limit eager loading to the small set used on the first screen.
    window.preloadAssets = function preloadAssets() {
        ['assets/icon_main.webp', ...SAMPLE_TYPES.map((type) => `assets/icon_${type.toLowerCase()}.webp`)]
            .forEach((src) => {
                const image = new Image();
                image.src = src;
            });
    };

    window.startTest = function startTest() {
        if (typeof triggerHaptic === 'function') triggerHaptic();
        resetQuickState();
        emitEvent('start_test', { test_mode: 'quick_12' });
        renderScreen('test');
    };

    window.resetTest = function resetTest() {
        resetQuickState();
        const urlParams = new URLSearchParams(window.location.search);
        const rawRef = urlParams.get('ref');
        friendRef = rawRef ? rawRef.toUpperCase() : null;
        setCanonical('https://my-music-vibe.com/');
        document.title = currentLang === 'kr'
            ? 'MY MUSIC VIBE TEST - 60초 음악 페르소나'
            : 'MY MUSIC VIBE TEST - 60-second music persona';
        renderScreen('intro');
    };

    window.renderIntro = function renderIntro() {
        const text = ui();
        const translations = TRANSLATIONS[currentLang]?.ui || TRANSLATIONS.en.ui;
        setCanonical('https://my-music-vibe.com/');

        const sampleCards = SAMPLE_TYPES.map((type) => {
            const data = RESULTS_DATA[type];
            const local = TRANSLATIONS[currentLang]?.results?.[type]
                || TRANSLATIONS.en?.results?.[type]
                || {};
            const genre = stripHtml(local.genre || type);
            const subtitle = stripHtml(local.subTitle || '');
            return `
                <button type="button" data-sample-type="${type}"
                    class="min-w-[148px] text-left rounded-2xl border border-white/10 bg-white/[0.045] p-3 hover:bg-white/[0.08] hover:border-amber-400/30 transition-all">
                    <img src="${escapeHtml(data.image)}" alt="${escapeHtml(genre)}"
                        class="w-full aspect-square rounded-xl object-cover mb-3" loading="lazy">
                    <strong class="block text-white text-xs tracking-wide">${escapeHtml(genre)}</strong>
                    <span class="block text-gray-500 text-[10px] mt-1 line-clamp-2">${escapeHtml(subtitle)}</span>
                </button>
            `;
        }).join('');

        const fallbackNotice = !['kr', 'en'].includes(currentLang)
            ? `<p class="mt-4 rounded-xl border border-amber-400/20 bg-amber-400/5 px-4 py-3 text-left text-[11px] leading-relaxed text-amber-100/80">${text.unsupportedLanguage}</p>`
            : '';

        appContainer.innerHTML = `
            <div class="relative min-h-full overflow-hidden px-6 pb-12 pt-16">
                <div class="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_5%,rgba(147,51,234,0.34),transparent_38%),radial-gradient(circle_at_90%_35%,rgba(245,158,11,0.18),transparent_35%)]"></div>
                <div class="relative z-10">
                    <div class="mb-5 inline-flex items-center gap-2 rounded-full border border-amber-300/20 bg-amber-300/10 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.2em] text-amber-200">
                        <span class="h-1.5 w-1.5 rounded-full bg-amber-300 animate-pulse"></span>
                        ${text.eyebrow}
                    </div>

                    <h1 class="whitespace-pre-line text-left text-[2.55rem] font-black leading-[1.04] tracking-[-0.055em] text-white">
                        ${escapeHtml(text.title)}
                    </h1>
                    <p class="mt-5 max-w-sm text-left text-sm font-medium leading-6 text-gray-400">
                        ${text.description}
                    </p>

                    <div class="mt-6 grid grid-cols-3 gap-2">
                        <div class="rounded-xl border border-white/10 bg-black/20 p-3">
                            <span class="block text-[10px] uppercase tracking-wider text-gray-500">TIME</span>
                            <strong class="mt-1 block text-xs text-white">${text.duration}</strong>
                        </div>
                        <div class="rounded-xl border border-white/10 bg-black/20 p-3">
                            <span class="block text-[10px] uppercase tracking-wider text-gray-500">CHOICES</span>
                            <strong class="mt-1 block text-xs text-white">${text.count}</strong>
                        </div>
                        <div class="rounded-xl border border-white/10 bg-black/20 p-3">
                            <span class="block text-[10px] uppercase tracking-wider text-gray-500">AUDIO</span>
                            <strong class="mt-1 block text-xs text-white">${text.audioCount}</strong>
                        </div>
                    </div>

                    ${fallbackNotice}

                    <button type="button" data-start-quick
                        class="group relative mt-6 flex h-16 w-full items-center justify-center overflow-hidden rounded-2xl border border-purple-400/30 bg-gradient-to-r from-purple-600 to-fuchsia-600 font-black tracking-wide text-white shadow-[0_18px_50px_rgba(126,34,206,0.3)] transition-all hover:brightness-110 active:scale-[0.98]">
                        <span class="absolute inset-0 translate-x-[-120%] bg-gradient-to-r from-transparent via-white/20 to-transparent transition-transform duration-700 group-hover:translate-x-[120%]"></span>
                        <span class="relative flex items-center gap-2">
                            <i data-lucide="headphones" class="h-5 w-5"></i>
                            ${text.start}
                        </span>
                    </button>

                    <div class="mt-9 flex items-center justify-between">
                        <h2 class="text-left text-xs font-black uppercase tracking-[0.18em] text-gray-300">${text.samples}</h2>
                        <button type="button" data-all-types class="text-[10px] font-bold text-amber-300 hover:text-amber-200">${text.allTypes}</button>
                    </div>
                    <div class="-mx-1 mt-3 flex gap-3 overflow-x-auto px-1 pb-2 hide-scrollbar">
                        ${sampleCards}
                    </div>

                    <button type="button" data-about-toggle
                        class="mt-6 flex w-full items-center justify-between rounded-xl border border-white/10 bg-white/[0.03] px-4 py-4 text-left text-[11px] font-bold uppercase tracking-widest text-gray-400 hover:text-white">
                        <span>${text.about}</span>
                        <i data-lucide="chevron-down" class="h-4 w-4"></i>
                    </button>
                    <div data-about-content class="max-h-0 overflow-hidden transition-[max-height] duration-500">
                        <div class="pt-4">${translations.about_content || ''}</div>
                    </div>
                </div>
            </div>
        `;

        appContainer.querySelector('[data-start-quick]')?.addEventListener('click', window.startTest);
        appContainer.querySelector('[data-all-types]')?.addEventListener('click', () => renderAllTypes());
        appContainer.querySelectorAll('[data-sample-type]').forEach((card) => {
            card.addEventListener('click', () => legacySelectTypeAndShowResult(card.dataset.sampleType));
        });
        const aboutButton = appContainer.querySelector('[data-about-toggle]');
        const aboutContent = appContainer.querySelector('[data-about-content]');
        aboutButton?.addEventListener('click', () => {
            const expanded = aboutButton.getAttribute('aria-expanded') === 'true';
            aboutButton.setAttribute('aria-expanded', String(!expanded));
            aboutContent.style.maxHeight = expanded ? '0px' : '1100px';
        });

        if (window.lucide?.createIcons) window.lucide.createIcons();
    };

    function renderAudioOption(option, index) {
        return `
            <article class="rounded-2xl border border-white/10 bg-black/30 p-4 transition-all hover:border-purple-400/30">
                <div class="flex items-start gap-3">
                    <div class="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/5 text-sm font-black text-white">${index === 0 ? 'A' : 'B'}</div>
                    <div class="min-w-0 flex-1">
                        <h3 class="text-sm font-black text-white">${escapeHtml(localized(option.label))}</h3>
                        <p class="mt-1 text-xs leading-5 text-gray-500">${escapeHtml(localized(option.description))}</p>
                    </div>
                </div>
                <div class="mt-4 grid grid-cols-[0.85fr_1.15fr] gap-2">
                    <button type="button" data-quick-preview="${index}" aria-pressed="false"
                        class="flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-3 text-xs font-bold text-gray-200 hover:bg-white/10">
                        <i data-lucide="play" class="h-4 w-4"></i>
                        <span data-preview-label>${ui().preview}</span>
                    </button>
                    <button type="button" data-quick-select="${index}"
                        class="rounded-xl bg-white px-3 py-3 text-xs font-black text-black hover:bg-gray-200 active:scale-[0.98]">
                        ${ui().choose}
                    </button>
                </div>
            </article>
        `;
    }

    function renderChoiceOption(option, index) {
        return `
            <button type="button" data-quick-select="${index}"
                class="group w-full rounded-2xl border border-white/10 bg-black/30 p-5 text-left transition-all hover:-translate-y-0.5 hover:border-amber-400/40 hover:bg-white/[0.055] active:scale-[0.99]">
                <div class="flex items-start gap-4">
                    <span class="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-xs font-black text-gray-300 group-hover:text-amber-200">${index === 0 ? 'A' : 'B'}</span>
                    <span class="min-w-0">
                        <strong class="block text-sm leading-5 text-white">${escapeHtml(localized(option.label))}</strong>
                        <span class="mt-2 block text-xs leading-5 text-gray-500 group-hover:text-gray-400">${escapeHtml(localized(option.description))}</span>
                    </span>
                </div>
            </button>
        `;
    }

    window.renderTest = function renderTest() {
        const question = QUICK_QUESTIONS[currentQIndex];
        if (!question) {
            finalizeQuickResult();
            return;
        }

        const progress = ((currentQIndex + 1) / QUICK_TOTAL) * 100;
        const isAudio = question.kind === 'audio';
        const options = question.options
            .map((option, index) => isAudio ? renderAudioOption(option, index) : renderChoiceOption(option, index))
            .join('');

        appContainer.innerHTML = `
            <div id="quick-quiz-content" class="flex min-h-full flex-col px-6 pb-8 pt-6 opacity-0 transition-opacity duration-200">
                <div class="flex items-center justify-between text-[10px] font-bold uppercase tracking-[0.16em] text-gray-500">
                    <span>${ui().question} ${String(currentQIndex + 1).padStart(2, '0')}</span>
                    <span>${currentQIndex + 1} / ${QUICK_TOTAL}</span>
                </div>
                <div class="mt-3 h-1.5 overflow-hidden rounded-full bg-white/5">
                    <div class="h-full rounded-full bg-gradient-to-r from-purple-500 via-fuchsia-400 to-amber-300 transition-all duration-300" style="width:${progress}%"></div>
                </div>

                <div class="flex flex-1 flex-col justify-center py-8">
                    <div class="mb-3 flex items-center gap-2">
                        <span class="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-[9px] font-black uppercase tracking-widest text-gray-400">${isAudio ? 'AUDIO A/B' : question.axis}</span>
                        ${isAudio ? '<span class="text-[10px] font-bold text-amber-300">이어폰 권장 · Headphones</span>' : ''}
                    </div>
                    <h2 class="text-[1.55rem] font-black leading-[1.28] tracking-[-0.025em] text-white break-keep">${escapeHtml(localized(question.prompt))}</h2>
                    <p class="mt-3 text-xs leading-5 text-gray-500">${escapeHtml(localized(question.helper) || (isAudio ? ui().audioHint : ui().choiceHint))}</p>
                    <div class="mt-7 space-y-3">${options}</div>
                </div>
            </div>
        `;

        appContainer.querySelectorAll('[data-quick-select]').forEach((button) => {
            button.addEventListener('click', () => chooseQuickOption(Number(button.dataset.quickSelect)));
        });
        appContainer.querySelectorAll('[data-quick-preview]').forEach((button) => {
            button.addEventListener('click', () => togglePreview(Number(button.dataset.quickPreview), button));
        });

        requestAnimationFrame(() => {
            document.getElementById('quick-quiz-content')?.classList.remove('opacity-0');
        });
        if (window.lucide?.createIcons) window.lucide.createIcons();
    };

    async function togglePreview(optionIndex, button) {
        const question = QUICK_QUESTIONS[currentQIndex];
        const option = question?.options?.[optionIndex];
        if (!option?.audioSrc) return;

        if (previewAudio && previewOptionIndex === optionIndex && !previewAudio.paused) {
            stopPreview();
            return;
        }

        stopPreview();
        previewAudio = new Audio(option.audioSrc);
        previewAudio.preload = 'metadata';
        previewAudio.volume = 0.62;
        previewOptionIndex = optionIndex;
        button.setAttribute('aria-pressed', 'true');
        const label = button.querySelector('[data-preview-label]');
        if (label) label.textContent = ui().stop;
        previewAudio.addEventListener('ended', stopPreview, { once: true });

        try {
            await previewAudio.play();
            emitEvent('audio_choice_preview', {
                question_id: question.id,
                option: optionIndex === 0 ? 'A' : 'B',
                axis: question.axis
            });
        } catch (error) {
            console.warn('Quick preview playback failed:', error);
            stopPreview();
        }
    }

    function chooseQuickOption(optionIndex) {
        if (isTransitioning) return;
        const question = QUICK_QUESTIONS[currentQIndex];
        const option = question?.options?.[optionIndex];
        if (!option) return;

        isTransitioning = true;
        stopPreview();
        if (typeof triggerHaptic === 'function') triggerHaptic();

        scores[option.type] = (scores[option.type] || 0) + Number(option.score || 0);
        quickAnswers.push({
            questionId: question.id,
            axis: question.axis,
            type: option.type,
            optionIndex
        });

        emitEvent('question_answer', {
            test_mode: 'quick_12',
            question_id: question.id,
            question_number: currentQIndex + 1,
            question_kind: question.kind,
            axis: question.axis,
            selected_type: option.type
        });

        const content = document.getElementById('quick-quiz-content');
        if (content) content.classList.add('opacity-0');

        window.setTimeout(() => {
            if (currentQIndex >= QUICK_TOTAL - 1) {
                finalizeQuickResult();
            } else {
                currentQIndex += 1;
                isTransitioning = false;
                window.renderTest();
            }
        }, 120);
    }

    window.handleAnswer = function handleAnswer(type, score) {
        // Compatibility path for any stale inline handler.
        const question = QUICK_QUESTIONS[currentQIndex];
        const index = question?.options?.findIndex((option) => option.type === type && Number(option.score) === Number(score));
        chooseQuickOption(index >= 0 ? index : 0);
    };

    function chooseAxis(primary, secondary) {
        const primaryScore = Number(scores[primary] || 0);
        const secondaryScore = Number(scores[secondary] || 0);
        if (primaryScore !== secondaryScore) return primaryScore > secondaryScore ? primary : secondary;

        const lastRelevant = [...quickAnswers]
            .reverse()
            .find((answer) => answer.type === primary || answer.type === secondary);
        return lastRelevant?.type || primary;
    }

    function finalizeQuickResult() {
        isTransitioning = false;
        const mbti = [
            chooseAxis('E', 'I'),
            chooseAxis('S', 'N'),
            chooseAxis('F', 'T'),
            chooseAxis('J', 'P')
        ].join('');

        const finalType = RESULTS_DATA[mbti] ? mbti : 'ENFP';
        const baseData = RESULTS_DATA[finalType];
        const localData = TRANSLATIONS[currentLang]?.results?.[finalType]
            || TRANSLATIONS.en?.results?.[finalType]
            || {};

        finalResult = { ...baseData, ...localData, mbti: finalType };
        if (baseData.match || localData.match) {
            finalResult.match = { ...(baseData.match || {}), ...(localData.match || {}) };
        }

        if (typeof updateBackground === 'function') updateBackground(finalResult.color);
        if (typeof updateMetaTags === 'function') updateMetaTags(finalResult);

        emitEvent('test_complete', {
            test_mode: 'quick_12',
            result_type: finalType,
            question_count: QUICK_TOTAL
        });

        renderScreen('result');
    }

    window.calculateResult = finalizeQuickResult;

    function updatePausedPlayerUi() {
        isPlaying = false;
        audioPlayer.pause();
        const main = document.getElementById('audio-icon-main');
        const mini = document.getElementById('audio-icon-mini');
        if (main) main.innerHTML = SVG_PLAY;
        if (mini) mini.innerHTML = SVG_PLAY;
        const status = document.getElementById('player-status');
        const translations = TRANSLATIONS[currentLang]?.ui || TRANSLATIONS.en.ui;
        if (status) status.textContent = translations.audio_preview || 'PREVIEW TRACK';
    }

    window.toggleAudio = function toggleAudio() {
        if (suppressLegacyAutoPlay) {
            suppressLegacyAutoPlay = false;
            updatePausedPlayerUi();
            return;
        }
        return legacyToggleAudio.apply(this, arguments);
    };

    function buildSharePanel() {
        const panel = document.createElement('section');
        panel.id = 'result-share-panel';
        panel.className = 'mb-6 rounded-2xl border border-amber-300/20 bg-gradient-to-br from-amber-300/10 to-purple-500/10 p-4';
        panel.innerHTML = `
            <div class="flex items-start gap-3">
                <span class="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-amber-300 text-black"><i data-lucide="send" class="h-4 w-4"></i></span>
                <div>
                    <h3 class="text-sm font-black text-white">${ui().shareTitle}</h3>
                    <p class="mt-1 text-[11px] leading-4 text-gray-400">${ui().shareDescription}</p>
                </div>
            </div>
            <div class="mt-4 grid grid-cols-2 gap-2">
                <button type="button" data-top-share class="rounded-xl bg-white px-3 py-3 text-xs font-black text-black hover:bg-gray-200 active:scale-[0.98]">${ui().share}</button>
                <button type="button" data-top-save class="rounded-xl border border-white/15 bg-white/5 px-3 py-3 text-xs font-bold text-white hover:bg-white/10 active:scale-[0.98]">${ui().save}</button>
            </div>
            <a href="${escapeHtml(staticResultUrl(finalResult.mbti))}" target="_blank" rel="noopener noreferrer"
                class="mt-3 flex items-center justify-center gap-1.5 text-[10px] font-bold text-amber-200/80 hover:text-amber-100">
                ${ui().staticPage}
                <i data-lucide="external-link" class="h-3 w-3"></i>
            </a>
        `;
        panel.querySelector('[data-top-share]')?.addEventListener('click', () => {
            emitEvent('share_click', { placement: 'result_top', result_type: finalResult.mbti });
            window.shareResult();
        });
        panel.querySelector('[data-top-save]')?.addEventListener('click', () => {
            emitEvent('image_save', { placement: 'result_top', result_type: finalResult.mbti });
            window.saveImage();
        });
        return panel;
    }

    function spotifySearchUrl(track) {
        return `https://open.spotify.com/search/${encodeURIComponent(`${track.title} ${track.artist}`)}`;
    }

    function buildPlaylistSection() {
        const tracks = RESULT_PLAYLISTS[finalResult.mbti] || [];
        if (!tracks.length) return null;

        const section = document.createElement('section');
        section.id = 'result-playlist';
        section.className = 'mb-7 rounded-2xl border border-white/10 bg-white/[0.035] p-4 text-left';
        section.innerHTML = `
            <div class="mb-4 flex items-start gap-3">
                <span class="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-purple-500/20 text-purple-200"><i data-lucide="list-music" class="h-4 w-4"></i></span>
                <div>
                    <h3 class="text-sm font-black text-white">${ui().playlistTitle}</h3>
                    <p class="mt-1 text-[11px] leading-4 text-gray-500">${ui().playlistDescription}</p>
                </div>
            </div>
            <div class="space-y-2">
                ${tracks.map((track, index) => `
                    <a href="${escapeHtml(spotifySearchUrl(track))}" target="_blank" rel="noopener noreferrer"
                        data-playlist-track="${index}"
                        class="group flex items-center gap-3 rounded-xl border border-white/5 bg-black/20 p-3 hover:border-green-400/30 hover:bg-white/[0.055]">
                        <span class="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white/5 text-[10px] font-black text-gray-500 group-hover:text-green-300">${String(index + 1).padStart(2, '0')}</span>
                        <span class="min-w-0 flex-1">
                            <strong class="block truncate text-xs text-white">${escapeHtml(track.title)}</strong>
                            <span class="mt-0.5 block truncate text-[10px] text-gray-500">${escapeHtml(track.artist)} · ${escapeHtml(localized(track.moment))}</span>
                        </span>
                        <span class="text-[9px] font-bold text-green-300/70">${ui().spotify}</span>
                    </a>
                `).join('')}
            </div>
        `;

        section.querySelectorAll('[data-playlist-track]').forEach((link) => {
            link.addEventListener('click', () => {
                const index = Number(link.dataset.playlistTrack);
                const track = tracks[index];
                emitEvent('playlist_click', {
                    result_type: finalResult.mbti,
                    track_title: track.title,
                    track_artist: track.artist,
                    position: index + 1
                });
            });
        });
        return section;
    }

    function enhanceResult() {
        const player = document.getElementById('player-btn');
        const sharePanel = buildSharePanel();
        if (player?.parentNode) player.parentNode.insertBefore(sharePanel, player);

        const playlist = buildPlaylistSection();
        if (playlist && player?.parentNode) {
            player.insertAdjacentElement('afterend', playlist);
        }

        // Remove the old bottom share duplicate; retry and all-types controls stay in place.
        document.querySelectorAll('button[onclick="shareResult()"]')?.forEach((button) => button.remove());

        // The legacy template still emits a hard-coded rarity badge. P0 normalizes it,
        // while P1 removes the badge entirely from the primary result summary.
        document.querySelectorAll('#result-card span').forEach((element) => {
            const label = (element.textContent || '').trim();
            if (label === 'VIBE PROFILE' || /^TOP\s+\d+(?:\.\d+)?%\s+VIBE$/i.test(label)) {
                element.closest('div.inline-flex')?.remove();
            }
        });

        if (window.lucide?.createIcons) window.lucide.createIcons();
    }

    window.renderResult = function renderResult() {
        suppressLegacyAutoPlay = true;
        legacyRenderResult();
        enhanceResult();

        // Defensive pause after the legacy 500ms autoplay timer.
        window.setTimeout(() => {
            if (isPlaying) updatePausedPlayerUi();
            suppressLegacyAutoPlay = false;
        }, 700);
    };

    const p0UpdateMetaTags = window.updateMetaTags;
    window.updateMetaTags = function updateMetaTags(result) {
        p0UpdateMetaTags(result);
        if (!result?.mbti) return;
        const url = staticResultUrl(result.mbti);
        const ogImage = new URL(`/assets/og/${result.mbti.toLowerCase()}.svg`, window.location.origin).toString();
        document.querySelector('meta[property="og:image"]')?.setAttribute('content', ogImage);
        document.querySelector('meta[property="og:url"]')?.setAttribute('content', url);
        document.querySelector('meta[name="twitter:image"]')?.setAttribute('content', ogImage);
        setCanonical(url);
    };

    // Preserve the legacy all-types entry point while applying the new result enhancements.
    window.selectTypeAndShowResult = function selectTypeAndShowResult(type) {
        legacySelectTypeAndShowResult(type);
        if (finalResult) {
            if (typeof updateMetaTags === 'function') updateMetaTags(finalResult);
        }
    };

    document.addEventListener('DOMContentLoaded', () => {
        document.documentElement.dataset.testMode = 'quick-12';
    });
})();
