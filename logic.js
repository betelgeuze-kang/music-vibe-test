// ==========================================
// [2] 로직 및 상태 관리
// ==========================================

let currentState = 'intro'; // intro, test, loading, result, allTypes
let currentQIndex = 0;
let scores = { E: 0, I: 0, S: 0, N: 0, F: 0, T: 0, J: 0, P: 0 };
let finalResult = null;
let isTransitioning = false; // 광클 방지용
let isPlaying = false;
let audioPlayer = new Audio();
audioPlayer.loop = true;
audioPlayer.volume = 0.5;
audioPlayer.preload = 'auto'; // 빠른 재생을 위한 설정
let currentLang = 'en'; // Default language
let friendRef = null; // Viral Loop: Stores the MBTI of the friend who invited you (from URL)
let vizInterval = null; // Visualizer Interval
let currentBgColor = 'rgba(76,29,149,0.4)'; // Default Violet

const appContainer = document.getElementById('app-container');

// SVG Constants for Direct Injection (Fail-safe)
const SVG_PLAY = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="w-5 h-5 text-white ml-0.5"><polygon points="6 3 20 12 6 21 6 3"></polygon></svg>`;
const SVG_PAUSE = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="w-5 h-5 text-white"><rect x="6" y="4" width="4" height="16"></rect><rect x="14" y="4" width="4" height="16"></rect></svg>`;

// Option Labels for Localization (Agree/Disagree)
const OPTION_LABELS = {
    kr: ['매우 아니다', '아니다', '보통이다', '그렇다', '매우 그렇다'],
    en: ['Strongly Disagree', 'Disagree', 'Neutral', 'Agree', 'Strongly Agree'],
    jp: ['全くそう思わない', 'そう思わない', 'どちらでもない', 'そう思う', '非常にそう思う'],
    es: ['Totalmente en desacuerdo', 'En desacuerdo', 'Neutral', 'De acuerdo', 'Totalmente de acuerdo'],
    pt: ['Discordo totalmente', 'Discordo', 'Neutro', 'Concordo', 'Concordo totalmente'],
    id: ['Sangat tidak setuju', 'Tidak setuju', 'Netral', 'Setuju', 'Sangat setuju'],
    vi: ['Rất không đồng ý', 'Không đồng ý', 'Bình thường', 'Đồng ý', 'Rất đồng ý'],
    tw: ['非常不同意', '不同意', '普通', '同意', '非常同意']
};

// Haptic Feedback Helper
function triggerHaptic() {
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
        navigator.vibrate(10); // Light vibration
    }
}

// [UI Enhancement] Dynamic Background Logic
function updateBackground(colorClass) {
    const bgOverlay = document.getElementById('dynamic-bg-overlay');
    if (!bgOverlay) return;

    // Extract color or map from class
    let color = 'rgba(76,29,149,0.4)'; // Default
    if (colorClass.includes('from-purple')) color = 'rgba(147, 51, 234, 0.4)';
    if (colorClass.includes('from-blue')) color = 'rgba(59, 130, 246, 0.4)';
    if (colorClass.includes('from-pink')) color = 'rgba(236, 72, 153, 0.4)';
    if (colorClass.includes('from-amber')) color = 'rgba(245, 158, 11, 0.4)';
    if (colorClass.includes('from-green')) color = 'rgba(34, 197, 94, 0.4)';

    bgOverlay.style.background = `radial-gradient(circle at 50% 30%, ${color} 0%, rgba(0,0,0,1) 70%)`;
}

function startTest() {
    triggerHaptic();
    renderScreen('test');
}

function detectLanguage() {
    let navLang = 'en';
    if (typeof navigator !== 'undefined' && (navigator.language || navigator.userLanguage)) {
        navLang = navigator.language || navigator.userLanguage;
    }
    const langCode = navLang.toLowerCase();

    console.log("Detected Browser Lang:", langCode);

    if (langCode.includes('ko')) return 'kr';
    if (langCode.includes('ja')) return 'jp';
    if (langCode.includes('es')) return 'es';
    if (langCode.includes('pt')) return 'pt';
    if (langCode.includes('id')) return 'id';
    if (langCode.includes('vi')) return 'vi';
    if (langCode.includes('zh')) {
        if (langCode.includes('tw') || langCode.includes('hk')) return 'tw';
        return 'en'; // Mainland simplified triggers EN for now
    }
    return 'en';
}

// 초기화
function init() {
    console.log("init() called");
    try {
        currentLang = detectLanguage();
        console.log("App Language Set to:", currentLang);

        // [Viral] Parse URL for Friend Match
        const urlParams = new URLSearchParams(window.location.search);
        const rawRef = urlParams.get('ref');
        friendRef = rawRef ? rawRef.toUpperCase() : null;
        if (friendRef) console.log("Invited by friend type:", friendRef);

        // [Viral] Init Visualizer
        initVisualizer();

        // [New] Show Cookie Banner
        showCookieBanner();

        if (!TRANSLATIONS) throw new Error("TRANSLATIONS not defined");
        if (!RESULTS_DATA) throw new Error("RESULTS_DATA not defined");
        if (!QUESTIONS) throw new Error("QUESTIONS not defined");

        console.log("Data checks passed");

        // Start Preloading (Silent)
        preloadAssets();

        renderScreen('intro');
    } catch (e) {
        console.error("Critical Init Error: " + e.message);
    }
}

// Preload Images and Audio
function preloadAssets() {
    console.log("Starting asset preload...");
    Object.values(RESULTS_DATA).forEach(data => {
        // Preload Image
        const img = new Image();
        img.src = data.image;

        // Preload Audio (Metadata only to save bandwidth but establishing connection)
        const audio = new Audio();
        audio.src = data.audioSrc;
        audio.preload = 'metadata';
    });
}

// 인트로 화면으로 돌아가기 (되돌아가기 버튼 기능)
function goToIntro() {
    resetTest();
}

function resetTest() {
    scores = { E: 0, I: 0, S: 0, N: 0, F: 0, T: 0, J: 0, P: 0 };
    currentQIndex = 0;
    isTransitioning = false;
    stopAudio();
    renderScreen('intro');
}

// 화면 렌더링 라우터
function renderScreen(state) {
    console.log("renderScreen:", state);
    currentState = state;

    if (!appContainer) {
        console.error("appContainer is null!");
        return;
    }

    appContainer.innerHTML = ''; // 기존 내용 삭제
    stopAudio(); // 화면 전환 시 오디오 정지

    switch (state) {
        case 'intro':
            renderIntro();
            break;
        case 'test':
            renderTest();
            break;
        case 'loading':
            renderLoading();
            break;
        case 'result':
            renderResult();
            break;
        case 'allTypes':
            renderAllTypes();
            break;
    }
    // 아이콘 리렌더링
    if (window.lucide && typeof window.lucide.createIcons === 'function') {
        lucide.createIcons();
    }
}

// [Intro] 화면
function renderIntro() {
    console.log("Rendering Intro...");
    const T = TRANSLATIONS[currentLang].ui;

    appContainer.innerHTML = `
        <div class="flex flex-col items-center justify-start min-h-full px-6 text-center relative bg-transparent pb-10">
            <!-- K/DA Style Background: Deep Violet + Gold/Neon Accents -->
            <div id="dynamic-bg-overlay" class="absolute inset-0 bg-[radial-gradient(circle_at_center,_rgba(76,29,149,0.5)_0%,_transparent_120%)] transition-all duration-1000 ease-in-out"></div>
            
            <!-- Neon Orbs -->
            <div class="absolute top-[-10%] right-[-10%] w-[50%] h-[50%] bg-[radial-gradient(circle,_rgba(139,92,246,0.3)_0%,_transparent_70%)] blur-[80px] animate-float"></div>
            <div class="absolute bottom-[-10%] left-[-10%] w-[50%] h-[50%] bg-[radial-gradient(circle,_rgba(234,179,8,0.2)_0%,_transparent_70%)] blur-[80px] animate-float" style="animation-delay: -2s;"></div>

            <!-- Holographic HUD Rings -->
            <div class="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div class="w-[80vw] h-[80vw] md:w-[600px] md:h-[600px] border border-white/5 rounded-full animate-spin-slower"></div>
                <div class="w-[70vw] h-[70vw] md:w-[500px] md:h-[500px] border border-purple-500/20 rounded-full animate-reverse-spin"></div>
            </div>

            <!-- Content Container -->
            <div class="relative z-10 flex flex-col items-center w-full max-w-md pt-32 pb-10 animate-fade-in-up">
                
                <!-- HUD Badge -->
                <div class="relative group mb-10">
                    <div class="absolute -inset-1 bg-gradient-to-r from-purple-600 to-amber-400 rounded-lg blur opacity-25 group-hover:opacity-75 transition duration-1000 group-hover:duration-200"></div>
                    <div class="relative px-6 py-2 bg-black/50 ring-1 ring-white/10 rounded-lg backdrop-blur-xl flex items-center gap-3">
                        <span class="flex h-2 w-2 relative">
                            <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                            <span class="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
                        </span>
                        <span class="text-amber-100/90 text-[11px] font-bold tracking-[0.2em] font-display uppercase">MUSIC VIBE TEST</span>
                    </div>
                </div>
                
                <!-- Localized Title -->
                <div class="px-2 w-full text-center max-w-full break-keep relative z-20">
                    <h1 class="text-4xl md:text-7xl font-black mb-8 tracking-tight animate-gradient-x font-display leading-tight break-keep px-1" style="filter: drop-shadow(0 0 10px rgba(168,85,247,0.4));">
                        ${T.title_main}
                    </h1>
                </div>
                
                <!-- Description -->
                <p class="text-gray-400 text-sm md:text-base mb-12 font-medium tracking-wide leading-relaxed break-keep">
                    ${T.desc_html}
                </p>

                <!-- Start Button -->
                <button onclick="startTest()" class="group relative w-full h-16 bg-gray-900 rounded-xl transition-all duration-300 hover:scale-[1.02] hover:shadow-[0_0_30px_rgba(168,85,247,0.5)] overflow-hidden mb-4 border border-purple-500/30">
                    <div class="absolute inset-0 bg-gradient-to-r from-purple-600/20 to-amber-600/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                    <div class="absolute bottom-0 left-0 h-[2px] w-full bg-gradient-to-r from-purple-500 via-amber-400 to-purple-500"></div>
                    <span class="relative flex items-center justify-center gap-3 text-white font-bold text-lg tracking-widest w-full h-full">
                        <i data-lucide="play" class="w-5 h-5 fill-amber-400 text-amber-400"></i>
                        ${T.btn_start}
                    </span>
                </button>
                
                <!-- All Types Button -->
                <!-- All Types Button (Premium Design) -->
                <!-- All Types Button (Premium Design) -->
                 <button onclick="renderAllTypes()" class="group w-full h-16 relative overflow-hidden rounded-xl transition-all duration-300 active:scale-95 mb-4 shadow-lg">
                    <div class="absolute inset-0 bg-white/5 opacity-80 border border-white/10 rounded-xl group-hover:bg-white/10 transition-colors"></div>
                    <div class="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
                    
                    <div class="relative flex items-center justify-center gap-3 h-full">
                        <div class="p-1.5 rounded-full bg-white/10 border border-white/10 group-hover:bg-white/20 transition-colors">
                             <i data-lucide="layout-grid" class="w-4 h-4 text-gray-300 group-hover:text-white transition-colors"></i>
                        </div>
                        <span class="text-gray-300 text-xs font-bold tracking-[0.2em] group-hover:text-white transition-colors uppercase bg-transparent shadow-none">${T.btn_all_types}</span>
                    </div>
                </button>

                <!-- About Collapsible (Transparent) -->
                <div class="w-full bg-transparent overflow-hidden transition-all duration-300 mt-0">
                    <button onclick="toggleAbout()" class="flex items-center justify-between w-full px-6 py-4 text-gray-400 hover:text-white hover:bg-white/5 transition-all group bg-transparent">
                        <span class="text-[10px] font-bold tracking-widest uppercase">${T.about_title}</span>
                        <i id="about-chevron" data-lucide="chevron-down" class="w-4 h-4 transition-transform duration-300 opacity-70 group-hover:opacity-100"></i>
                    </button>
                    <div id="about-content-area" class="overflow-hidden max-h-0 transition-all duration-500 ease-in-out">
                        <div class="px-6 py-4 text-left border-t border-white/5">
                            ${T.about_content}
                        </div>
                    </div>
                </div>
            </div>
            
            <!-- Global Footer (Always at bottom) -->
            <div class="mt-auto py-10 opacity-30">
                 <!-- Spacing for intrinsic footer -->
            </div>
        </div>
    `;

    // Re-initialize Lucide icons
    if (window.lucide) {
        window.lucide.createIcons();
    }
}

window.toggleAbout = function () {
    const content = document.getElementById('about-content-area');
    const chevron = document.getElementById('about-chevron');
    if (!content || !chevron) return;

    if (content.style.maxHeight && content.style.maxHeight !== '0px') {
        content.style.maxHeight = '0px';
        chevron.style.transform = 'rotate(0deg)';
    } else {
        content.style.maxHeight = '1000px'; // Arbitrary large value
        chevron.style.transform = 'rotate(180deg)';
    }
};
// [Quiz] 화면
function renderTest() {
    const q = QUESTIONS[currentQIndex];
    if (!q) return;

    // Localization for Question
    const translatedQuestion = TRANSLATIONS[currentLang].questions[currentQIndex];
    // Generic Option Labels
    const labels = OPTION_LABELS[currentLang] || OPTION_LABELS['en'];

    const progress = ((currentQIndex + 1) / QUESTIONS.length) * 100;

    const contentHTML = `
    <div id="quiz-content" class="flex flex-col h-full px-6 py-4 opacity-0 transition-opacity duration-300 overflow-y-auto hide-scrollbar">
            <div class="w-full bg-gray-800/50 h-1.5 rounded-full mb-6 overflow-hidden shrink-0 border border-white/5">
                <div id="progress-bar" class="bg-gradient-to-r from-purple-600 to-amber-400 h-full transition-all duration-500 ease-out shadow-[0_0_10px_rgba(245,158,11,0.5)]" style="width: ${progress}%"></div>
            </div>
            <div class="flex-1 flex flex-col justify-center pb-6">
                <div class="flex justify-between items-center mb-3">
                    <span class="text-purple-400 font-bold tracking-widest text-sm block">
                        Q. ${currentQIndex + 1 < 10 ? '0' + (currentQIndex + 1) : currentQIndex + 1}
                    </span>
                    <span class="text-gray-500 text-xs font-mono">${currentQIndex + 1} / ${QUESTIONS.length}</span>
                </div>
                <h2 class="text-xl md:text-2xl font-bold text-white mb-8 leading-snug break-keep">
                    ${translatedQuestion || q.text}
                </h2>
                
                <div class="flex flex-col gap-3">
                    ${q.options.map((opt, idx) => `
                        <button 
                            onclick="handleAnswer('${opt.type}', ${opt.score})" 
                            class="w-full p-4 text-left bg-black/40 backdrop-blur-md border border-white/10 rounded-xl hover:bg-black/60 hover:border-amber-500/50 hover:shadow-[0_0_15px_rgba(245,158,11,0.2)] hover:translate-x-1 transition-all duration-200 group option-btn"
                        >
                            <span class="text-gray-300 group-hover:text-amber-100 text-sm md:text-base font-medium break-keep leading-relaxed flex justify-between items-center">
                                ${labels[idx]}
                                <i data-lucide="chevron-right" class="w-4 h-4 text-gray-600 group-hover:text-amber-500 transition-colors"></i>
                            </span>
                        </button>
                    `).join('')}
                </div>
            </div>
        </div>
    `;

    appContainer.innerHTML = contentHTML;

    // 페이드인 효과
    setTimeout(() => {
        const el = document.getElementById('quiz-content');
        if (el) {
            el.classList.remove('opacity-0');
            if (window.lucide) lucide.createIcons();
        }
    }, 50);
}

// 답변 처리 (광클 방지 포함)
function handleAnswer(type, score) {
    if (isTransitioning) return;
    isTransitioning = true;

    // 버튼 비활성화 시각 효과
    const btns = document.querySelectorAll('.option-btn');
    btns.forEach(b => {
        b.classList.add('cursor-not-allowed', 'opacity-70');
        b.disabled = true;
    });

    // Haptic Feedback
    triggerHaptic();

    // 점수 반영
    scores[type] = (scores[type] || 0) + score;

    // 페이드아웃 및 다음 질문
    const content = document.getElementById('quiz-content');
    // content가 존재하고 opacity-0 클래스가 없으면 페이드 아웃
    if (content && !content.classList.contains('opacity-0')) {
        content.style.opacity = '0';
    }

    setTimeout(() => {
        if (currentQIndex < QUESTIONS.length - 1) {
            currentQIndex++;
            renderTest();
        } else {
            calculateResult();
        }
        isTransitioning = false;
    }, 150);
}

// [Loading] 화면 및 결과 계산
function renderLoading() {
    const T = TRANSLATIONS[currentLang].ui;
    appContainer.innerHTML = `
    <div class="flex flex-col items-center justify-center h-full text-center px-6">
            <div class="flex items-end gap-1 mb-8 h-16">
                <div class="w-3 bg-gradient-to-t from-purple-600 to-amber-400 rounded-full animate-music-bar shadow-[0_0_10px_rgba(168,85,247,0.5)]" style="animation-delay: 0s;"></div>
                <div class="w-3 bg-gradient-to-t from-purple-600 to-amber-400 rounded-full animate-music-bar shadow-[0_0_10px_rgba(168,85,247,0.5)]" style="animation-delay: 0.1s;"></div>
                <div class="w-3 bg-gradient-to-t from-purple-600 to-amber-400 rounded-full animate-music-bar shadow-[0_0_10px_rgba(168,85,247,0.5)]" style="animation-delay: 0.2s;"></div>
                <div class="w-3 bg-gradient-to-t from-purple-600 to-amber-400 rounded-full animate-music-bar shadow-[0_0_10px_rgba(168,85,247,0.5)]" style="animation-delay: 0.3s;"></div>
                <div class="w-3 bg-gradient-to-t from-purple-600 to-amber-400 rounded-full animate-music-bar shadow-[0_0_10px_rgba(168,85,247,0.5)]" style="animation-delay: 0.4s;"></div>
            </div>
            <div id="loading-pulse" class="absolute inset-0 bg-white/5 opacity-0 pointer-events-none rounded-full blur-3xl animate-ping-slow"></div>
            <h3 class="text-2xl font-bold text-white mb-2">${T.loading_text}</h3>
            <p class="text-gray-400">${T.loading_sub}</p>
        </div>
    `;
}

function calculateResult() {
    renderScreen('loading');

    setTimeout(() => {
        const eType = scores.E >= scores.I ? 'E' : 'I';
        const sType = scores.S >= scores.N ? 'S' : 'N';
        const fType = scores.F >= scores.T ? 'F' : 'T';
        const jType = scores.J >= scores.P ? 'J' : 'P';

        const mbti = eType + sType + fType + jType;

        // Fallback (mbti가 없을 경우 ENFP를 사용)
        const finalMbti = RESULTS_DATA[mbti] ? mbti : "ENFP";

        // Merge Base Data with Localized Data
        const baseData = RESULTS_DATA[finalMbti];
        const localData = TRANSLATIONS[currentLang].results && TRANSLATIONS[currentLang].results[finalMbti]
            ? TRANSLATIONS[currentLang].results[finalMbti]
            : {}; // Fallback to base text if missing

        finalResult = { ...baseData, ...localData, mbti: finalMbti };

        // Deep Merge for 'match' to preserve IDs from baseData and Descs from localData
        if (baseData.match && localData.match) {
            finalResult.match = { ...baseData.match, ...localData.match };
        }

        // [UI Enhancement] Match background to result
        updateBackground(finalResult.color);

        // [SEO Enhancement] Update Meta Tags for results
        updateMetaTags(finalResult);

        // [Viral] Sound Modal Check: Instead of showing result immediately, ask for headphones
        checkSoundAndRevealResult();
    }, 2500);
}

// [SEO Enhancement] Dynamic Meta Tag Updater
function updateMetaTags(result) {
    if (!result) return;

    const title = `🎵 Result: ${result.genre} | Music Vibe Test`;
    const desc = `${result.subTitle}. See my soul music vibe! 🎧`;
    const image = window.location.origin + window.location.pathname.replace('index.html', '') + result.image;

    // OG Tags
    document.querySelector('meta[property="og:title"]')?.setAttribute('content', title);
    document.querySelector('meta[property="og:description"]')?.setAttribute('content', desc);
    document.querySelector('meta[property="og:image"]')?.setAttribute('content', image);

    // Twitter Card
    document.querySelector('meta[name="twitter:title"]')?.setAttribute('content', title);
    document.querySelector('meta[name="twitter:description"]')?.setAttribute('content', desc);
    document.querySelector('meta[name="twitter:image"]')?.setAttribute('content', image);
}

// 특정 MBTI를 선택하여 결과 화면을 보여주는 함수
function selectTypeAndShowResult(mbtiKey) {
    // scores 초기화 (테스트를 거치지 않으므로)
    scores = { E: 0, I: 0, S: 0, N: 0, F: 0, T: 0, J: 0, P: 0 };
    currentQIndex = QUESTIONS.length; // 퀴즈 완료 상태로 설정

    // 결과 데이터 설정
    const finalMbti = RESULTS_DATA[mbtiKey] ? mbtiKey : "ENFP";

    // Merge Base Data with Localized Data
    const baseData = RESULTS_DATA[finalMbti];
    const localData = TRANSLATIONS[currentLang].results && TRANSLATIONS[currentLang].results[finalMbti]
        ? TRANSLATIONS[currentLang].results[finalMbti]
        : {};

    finalResult = { ...baseData, ...localData, mbti: finalMbti };

    // Deep Merge for 'match' to preserve IDs from baseData and Descs from localData
    if (baseData.match && localData.match) {
        finalResult.match = { ...baseData.match, ...localData.match };
    }

    renderScreen('result');
}

// [Result] 화면
function renderResult() {
    // 오디오 설정
    if (audioPlayer.src !== finalResult.audioSrc) {
        audioPlayer.src = finalResult.audioSrc;
    }
    // isPlaying = false; // 자동재생을 위해 제거 (renderScreen에서 이미 stopAudio 호출됨)

    const T = TRANSLATIONS[currentLang].ui; // Used for titles if needed

    // 장단점 리스트 HTML 생성
    const prosList = finalResult.pros.map(p => `<li class="flex items-start gap-2"><i data-lucide="check-circle" class="w-4 h-4 text-green-400 mt-0.5 shrink-0"></i><span class="text-gray-300 text-sm">${p}</span></li>`).join('');
    const consList = finalResult.cons.map(c => `<li class="flex items-start gap-2"><i data-lucide="x-octagon" class="w-4 h-4 text-red-400 mt-0.5 shrink-0"></i><span class="text-gray-300 text-sm">${c}</span></li>`).join('');

    // Match Data Lookup (For Viral Feature)
    // [Viral Update] Friend Match Override Logic
    let bestType = finalResult.match ? finalResult.match.best : null;
    const worstType = finalResult.match ? finalResult.match.worst : null;

    let labelBest = T.match_label_best;
    let isFriendMatch = false;

    if (friendRef && RESULTS_DATA[friendRef]) {
        bestType = friendRef; // Override: Show Friend in the Best Match Slot
        labelBest = T.match_label_friend || "💌 Friend";
        isFriendMatch = true;
    }

    const bestData = bestType ? RESULTS_DATA[bestType] : null;
    const worstData = worstType ? RESULTS_DATA[worstType] : null;

    // [스크롤 최종 해결]
    appContainer.innerHTML = `
    <div class="h-full overflow-y-auto hide-scrollbar flex flex-col flex-grow min-h-0 relative"> 
            
            <!-- K/DA Result Background Overlay -->
            <div class="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,_rgba(76,29,149,0.3)_0%,_transparent_70%)] pointer-events-none z-0"></div>
            <div class="absolute top-[-20%] right-[-20%] w-[60%] h-[60%] bg-purple-900/40 rounded-full blur-[100px] pointer-events-none z-0"></div>
            <div class="absolute bottom-[-10%] left-[-10%] w-[50%] h-[50%] bg-amber-600/20 rounded-full blur-[100px] pointer-events-none z-0"></div>
 
            <div class="px-6 py-8 flex flex-col items-center text-center animate-slide-up pb-20 relative z-10">
                
                <!-- Friend Match Card Removed -->

                <!-- Main Result Card: Glassmorphism Update -->
                <div id="result-card" class="w-full max-w-sm bg-black/30 backdrop-blur-2xl border border-white/10 p-6 rounded-[2rem] shadow-2xl relative overflow-hidden mb-6 group select-none transition-all">
                    <div id="card-bg" class="absolute inset-0 bg-gradient-to-br ${finalResult.color} opacity-20 transition-opacity duration-1000"></div>
                    
                    <div class="flex justify-between items-center text-gray-400 text-[10px] font-mono mb-6 opacity-70 relative z-10">
                        <span>${T.label_vibe || 'VIBE'}: ${finalResult.genre}</span>
                        <div class="flex gap-1 items-center">
                            <span>${T.label_vibe_match || 'VIBE MATCH'}</span>
                            <div id="rec-dot" class="w-2 h-2 rounded-full bg-red-500"></div>
                        </div>
                    </div>


                    <!-- Spinning Vinyl Record Design -->
                    <div class="relative w-64 h-64 mx-auto mb-8 flex items-center justify-center group-hover:scale-105 transition-transform duration-700 ease-in-out">
                        
                        <!-- Adaptive Glow (Behind) -->
                        <div id="lp-glow" class="absolute inset-0 rounded-full bg-gradient-to-br ${finalResult.color} blur-[50px] opacity-30 animate-pulse"></div>
                        
                        <!-- The Record (Spinning) -->
                        <div class="relative w-full h-full rounded-full shadow-2xl border border-white/5" style="animation: spin-slow 10s linear infinite;">
                            
                            <!-- Vinyl Texture / Grooves -->
                            <div class="absolute inset-0 rounded-full bg-[#151515] overflow-hidden">
                                <!-- Groove lines gradient -->
                                <div class="absolute inset-0 rounded-full opacity-60" 
                                     style="background: repeating-radial-gradient(circle at center, #111 0, #111 2px, #222 3px, #222 4px);">
                                </div>
                                <!-- Angular Reflection (Light shine on vinyl) -->
                                <div class="absolute inset-0 bg-gradient-to-tr from-transparent via-white/10 to-transparent rounded-full z-10"></div>
                                <div class="absolute inset-0 bg-gradient-to-bl from-transparent via-white/5 to-transparent rounded-full z-10"></div>
                            </div>

                            <!-- Album Art Label (Center) -->
                            <div class="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[55%] h-[55%] rounded-full z-20 overflow-hidden border-4 border-[#121212] shadow-2xl">
                                <img src="${finalResult.image}" alt="${finalResult.genre}" class="w-full h-full object-cover opacity-90" onerror="this.src='assets/icon_main.webp'">
                                
                                <!-- Vintage Overlay on Label -->
                                <div class="absolute inset-0 bg-yellow-500/10 mix-blend-overlay"></div>
                            </div>

                            <!-- Center Spindle Hole -->
                            <div class="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-3 h-3 bg-[#09090b] rounded-full z-30 shadow-inner border border-gray-700"></div>
                        </div>


                    </div>
                    <div class="relative z-10 text-left px-2">
                        <div class="inline-block px-3 py-1 bg-white/5 rounded-full mb-3 border border-white/10 backdrop-blur-md">
                            <span class="text-[11px] font-bold text-gray-300 tracking-widest drop-shadow-sm">${T.result_title} <span class="text-amber-300 ml-2 font-black text-sm drop-shadow-md">(${finalResult.mbti})</span></span>
                        </div>
                        
                        <!-- Rarity Badge (Viral) -->
                        <div class="inline-block px-3 py-1 bg-gradient-to-r from-amber-200/20 to-yellow-400/20 rounded-full mb-3 border border-amber-300/30 backdrop-blur-md ml-2">
                             <span class="text-[11px] font-bold text-amber-300 tracking-widest drop-shadow-sm">
                                ${T.rarity_label} ${finalResult.rarity || 'Unknown'}
                             </span>
                        </div>

                        <h2 class="text-4xl md:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white via-gray-200 to-gray-400 mb-2 leading-none tracking-tighter shadow-xl">
                            ${finalResult.genre}
                        </h2>
                        <p class="text-sm font-medium text-gray-400 mb-6 tracking-wide flex items-center gap-2">
                            <span class="w-1.5 h-1.5 rounded-full bg-gradient-to-r ${finalResult.color}"></span>
                            ${finalResult.subTitle}
                        </p>

                        <div onclick="toggleAudio()" 
                                id="player-btn"
                                class="group cursor-pointer rounded-2xl p-1 mb-6 backdrop-blur-md bg-white/5 border border-white/10 flex items-center gap-2 transition-all duration-300 hover:bg-white/10 hover:border-white/20 hover:shadow-[0_0_20px_rgba(255,255,255,0.1)]">
                                
                                <div class="w-12 h-12 rounded-xl bg-gradient-to-br ${finalResult.color} flex items-center justify-center shrink-0 shadow-lg relative overflow-hidden group-hover:scale-95 transition-transform duration-300">
                                    <div id="audio-icon-main" class="flex items-center justify-center w-full h-full">
                                        ${SVG_PLAY}
                                    </div>
                                    <div class="absolute inset-0 bg-black/20 hidden group-hover:block transition-all"></div>
                                </div>
                                
                                <div class="flex-1 min-w-0 pr-4">
                                    <div class="flex items-center gap-2 mb-0.5">
                                        <span id="player-status" class="text-gray-400 text-[10px] font-bold uppercase tracking-widest">${T.audio_preview}</span>
                                        <span class="w-1 h-1 rounded-full bg-white animate-pulse"></span>
                                    </div>
                                    <div class="text-gray-200 text-sm font-bold truncate group-hover:text-white transition-colors" id="song-title">
                                        ${finalResult.bestSong}
                                    </div>
                                </div>

                                <div class="w-10 h-10 rounded-full flex items-center justify-center text-gray-400 group-hover:text-white transition-colors" id="mini-control-wrapper">
                                    <div id="audio-icon-mini" class="flex items-center justify-center">
                                        ${SVG_PLAY}
                                    </div>
                                </div>
                        </div>

                        <h3 class="flex items-center gap-2 text-lg font-bold text-white mt-8 mb-4 pb-2 border-b border-white/10">
                            <i data-lucide="sparkles" class="w-5 h-5 text-amber-400"></i>
                            <span class="text-transparent bg-clip-text bg-gradient-to-r from-purple-200 to-amber-200">${T.result_analysis}</span>
                        </h3>
                        
                        <div class="mb-8">
                            ${finalResult.desc.split('\n').filter(line => line.trim() !== '').map(paragraph =>
        `<p class="text-gray-200 text-[1.05rem] leading-relaxed mb-4 text-left font-normal break-keep opacity-90">${paragraph}</p>`
    ).join('')}
                        </div>

                            <!-- Strengths: Adaptive Color (Matches Result) -->
                            <div class="bg-white/5 border border-white/10 rounded-2xl p-5 backdrop-blur-md relative overflow-hidden group hover:border-white/30 transition-colors">
                                <div class="absolute inset-0 bg-gradient-to-br ${finalResult.color} opacity-0 group-hover:opacity-10 transition-opacity duration-500"></div>
                                <h4 class="flex items-center gap-2 text-md font-bold mb-4 relative z-10">
                                    <i data-lucide="zap" class="w-5 h-5 text-transparent bg-clip-text bg-gradient-to-br ${finalResult.color}"></i> 
                                    <span class="text-white brightness-150 drop-shadow-md">${T.result_pro}</span>
                                </h4>
                                <ul class="space-y-3 list-none p-0 relative z-10">
                                    ${finalResult.pros.map(p => `
                                        <li class="flex items-start gap-3">
                                            <div class="w-1.5 h-1.5 rounded-full bg-gradient-to-r ${finalResult.color} mt-1.5 shadow-[0_0_8px_rgba(255,255,255,0.3)] shrink-0"></div>
                                            <span class="text-gray-300 text-[13px] leading-relaxed break-keep font-medium opacity-90">${p}</span>
                                        </li>
                                    `).join('')}
                                </ul>
                            </div>

                            <!-- Weaknesses: Consistent Rose / Red -->
                            <div class="bg-white/5 border border-white/10 rounded-2xl p-5 backdrop-blur-md relative overflow-hidden group hover:border-red-500/30 transition-colors">
                                <div class="absolute inset-0 bg-gradient-to-br from-red-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                                <h4 class="flex items-center gap-2 text-md font-bold text-rose-300 mb-4 relative z-10 drop-shadow-[0_0_8px_rgba(244,63,94,0.5)]">
                                    <i data-lucide="alert-triangle" class="w-5 h-5 text-rose-400 fill-rose-400/20"></i> ${T.result_con}
                                </h4>
                                <ul class="space-y-3 list-none p-0 relative z-10">
                                    ${finalResult.cons.map(c => `
                                        <li class="flex items-start gap-3">
                                            <div class="w-1.5 h-1.5 rounded-full bg-rose-400 mt-1.5 shadow-[0_0_8px_rgba(251,113,133,0.8)] shrink-0"></div>
                                            <span class="text-gray-300 text-[13px] leading-relaxed break-keep font-medium opacity-90">${c}</span>
                                        </li>
                                    `).join('')}
                                </ul>
                            </div>
                        </div>
                        
                        <!--Match & Mismatch(Viral)-->
        ${bestType && worstType ? `
                        <!-- Match & Mismatch (Mini LP Ver.) -->
                        <div class="grid grid-cols-2 gap-4 mt-8 mb-2 w-full relative z-20">
                            <!-- Best Match (or Friend Match) -->
                            <div onclick="openMatchModal('${finalResult.mbti}', '${bestType}', true, ${isFriendMatch})" class="group cursor-pointer bg-white/5 border border-white/10 rounded-2xl p-4 flex flex-col items-center justify-center transition-all hover:bg-white/10 hover:border-pink-400/50 active:scale-95 relative overflow-hidden">
                                <div class="absolute inset-0 bg-gradient-to-br from-pink-500/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                                <div class="text-[11px] font-black text-pink-400 mb-3 uppercase tracking-widest relative z-10 drop-shadow-sm">${labelBest}</div>
                                
                                <div class="w-20 h-20 flex items-center justify-center mb-3 relative z-10 group-hover:rotate-[360deg] transition-transform duration-[3s] ease-linear">
                                    <div class="absolute inset-0 rounded-full border-[3px] border-white/10"></div>
                                    <div class="w-[90%] h-[90%] rounded-full overflow-hidden relative shadow-xl">
                                        <img src="${bestData ? bestData.image : ''}" class="w-full h-full object-cover opacity-90" onerror="this.src='assets/icon_main.webp'">
                                        <div class="absolute inset-0 bg-yellow-500/10 mix-blend-overlay"></div>
                                    </div>
                                    <div class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-2 h-2 bg-black rounded-full border border-gray-700"></div>
                                </div>
                                
                                <div class="text-sm font-black text-white relative z-10">${(TRANSLATIONS[currentLang].results[bestType] && TRANSLATIONS[currentLang].results[bestType].genre) || (bestData && bestData.genre) || "Unknown Vibe"}</div>
                                <div class="text-[0.6rem] text-pink-200/60 mt-1 relative z-10">${T.match_click}</div>
                            </div>

                            <!-- Worst Match -->
                            <div onclick="openMatchModal('${finalResult.mbti}', '${finalResult.match.worst}', false)" class="group cursor-pointer bg-white/5 border border-white/10 rounded-2xl p-4 flex flex-col items-center justify-center transition-all hover:bg-white/10 hover:border-blue-400/50 active:scale-95 relative overflow-hidden">
                                <div class="absolute inset-0 bg-gradient-to-br from-blue-500/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                                <div class="text-[11px] font-black text-blue-400 mb-3 uppercase tracking-widest relative z-10 drop-shadow-sm">${T.match_label_worst}</div>
                                
                                <div class="w-20 h-20 flex items-center justify-center mb-3 relative z-10 group-hover:rotate-[360deg] transition-transform duration-[3s] ease-linear overflow-hidden">
                                    <div class="absolute inset-0 rounded-full border-[3px] border-white/10"></div>
                                    <div class="w-[90%] h-[90%] rounded-full overflow-hidden relative shadow-xl">
                                        <img src="${worstData ? worstData.image : ''}" class="w-full h-full object-cover opacity-90 grayscale" onerror="this.src='assets/icon_main.webp'">
                                    </div>
                                    <div class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-2 h-2 bg-black rounded-full border border-gray-700"></div>
                                </div>
                                
                                <div class="text-sm font-black text-gray-400 group-hover:text-white transition-colors relative z-10">${(TRANSLATIONS[currentLang].results[worstType] && TRANSLATIONS[currentLang].results[worstType].genre) || (worstData && worstData.genre) || "Unknown Vibe"}</div>
                                <div class="text-[0.6rem] text-blue-200/60 mt-1 relative z-10">${T.match_click}</div>
                            </div>
                        </div>
                        ` : ''
        }

                    </div>
                </div>

                <div class="flex flex-col gap-3 w-full max-w-sm mx-auto mb-10">
                    <button id="save-image-btn" class="group w-full py-4 bg-gradient-to-r ${finalResult.color} rounded-xl text-white font-bold hover:brightness-110 transition-all shadow-lg flex items-center justify-center gap-2 relative overflow-hidden">
                        <div class="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
                        <i data-lucide="download" class="w-4 h-4 relative z-10"></i> <span class="relative z-10">${T.btn_save_img}</span>
                    </button>

                    <div class="flex gap-2">
                        <button onclick="location.reload()" class="flex-1 bg-white/5 border border-white/10 text-white text-xs font-bold py-3 rounded-xl hover:bg-white/10 active:scale-95 transition-all">
                            ${T.btn_retry}
                        </button>
                        <button onclick="shareResult()" class="flex-1 bg-white/5 border border-white/10 text-white text-xs font-bold py-3 rounded-xl hover:bg-white/10 active:scale-95 transition-all">
                            ${T.btn_share}
                        </button>
                    </div>

                    <!-- [Feature] See Other Types Button (Moved inside scrollable container) -->
                    <button onclick="renderAllTypes()" class="w-full py-3 bg-transparent border border-white/30 rounded-xl text-xs font-bold text-gray-300 hover:bg-white/10 hover:text-white transition-all flex items-center justify-center gap-2 mt-2">
                        <i data-lucide="layout-grid" class="w-4 h-4 text-gray-400"></i>
                        ${T.btn_all_types || "All Vibe Types"}
                    </button>

                    <button onclick="renderIntro()" class="w-full text-gray-500 text-[10px] uppercase font-bold tracking-widest hover:text-white mt-4 transition-colors">
                        ${T.btn_main}
                    </button>
                    
                    <p class="text-[10px] text-white font-bold opacity-90 leading-relaxed max-w-[280px] mx-auto mt-2 break-keep text-center">
                        ${T.disclaimer_text || "본 테스트는 오락 목적으로 제작되었으며, 공식 MBTI® 검사와는 무관합니다."}
                    </p>
                </div>
            </div>
            
            <!--Match Detail Modal-->
    <div id="match-modal" class="fixed inset-0 z-50 hidden flex items-center justify-center p-4">
        <div class="absolute inset-0 bg-black/80 backdrop-blur-sm transition-opacity" onclick="closeMatchModal()"></div>
        <div class="relative bg-[#1a1a1c] border border-white/10 w-full max-w-sm rounded-[2rem] p-6 shadow-2xl animate-slide-up overflow-hidden">
            <!-- Background Glow -->
            <div id="modal-glow" class="absolute top-[-20%] right-[-20%] w-[150px] h-[150px] bg-purple-500/20 rounded-full blur-[60px] pointer-events-none"></div>

            <!-- Close Button -->
            <button onclick="closeMatchModal()" class="absolute top-4 right-4 text-white/50 hover:text-white transition-colors p-2 z-20">
                <i data-lucide="x" class="w-6 h-6"></i>
            </button>

            <!-- Content -->
            <div class="flex flex-col items-center text-center relative z-10 mt-2">
                <div id="modal-header" class="mb-6">
                    <!-- Dynamic Header -->
                </div>

                <div class="flex items-center justify-center gap-4 mb-6 w-full">
                    <!-- My LP -->
                    <div class="w-16 h-16 rounded-full bg-black border-2 border-white/10 flex items-center justify-center overflow-hidden shadow-lg relative">
                        <img src="${finalResult.image}" class="w-full h-full object-cover">
                            <div class="absolute inset-0 bg-black/20"></div>
                    </div>

                    <!-- Connection Icon -->
                    <div id="modal-conn-icon" class="text-2xl animate-pulse">
                        💖
                    </div>

                    <!-- Match LP -->
                    <div class="w-16 h-16 rounded-full bg-black border-2 border-white/10 flex items-center justify-center overflow-hidden shadow-lg relative">
                        <img id="modal-match-img" src="" class="w-full h-full object-cover">
                    </div>
                </div>

                <h3 id="modal-match-title" class="text-xl font-black text-white mb-4 tracking-tight">
                    <!-- Dynamic Genre Name -->
                </h3>

                <div class="w-full h-[1px] bg-gradient-to-r from-transparent via-white/10 to-transparent mb-5"></div>

                <div class="max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                    <p id="modal-desc" class="text-gray-200 text-[1.05rem] leading-8 break-keep font-medium text-left">
                        <!-- Detailed Description -->
                    </p>
                </div>

                <button onclick="closeMatchModal()" class="mt-6 w-full py-3 bg-white/5 border border-white/10 rounded-xl text-sm font-bold text-gray-300 hover:bg-white/10 hover:text-white transition-all">
                    ${T.match_close}
                </button>
            </div>
        </div>
    </div>
`;
    // Safe Lucide Init
    if (window.lucide && typeof window.lucide.createIcons === 'function') {
        lucide.createIcons();
    }

    // 결과 화면 진입 시 자동 재생 (Sound Modal에서 이미 체크했으므로 100% 실행)
    setTimeout(() => {
        if (!isPlaying) toggleAudio();
    }, 500);
}

// 오디오 토글 로직 & UI 업데이트
function toggleAudio() {
    isPlaying = !isPlaying;
    console.log("[Audio Debug] Toggle Audio: ", isPlaying ? "PLAYING" : "PAUSED");
    // console.log("[Audio Debug] Toggle Audio: ", isPlaying ? "PLAYING" : "PAUSED");

    const cardBg = document.getElementById('card-bg');
    const recDot = document.getElementById('rec-dot');
    const lpDisk = document.getElementById('lp-disk');
    const lpGlow = document.getElementById('lp-glow');
    const playerBtn = document.getElementById('player-btn');
    const playerStatus = document.getElementById('player-status');
    const songTitle = document.getElementById('song-title');

    // Container Elements (New Unique IDs)
    const mainIconEl = document.getElementById('audio-icon-main');
    const miniIconEl = document.getElementById('audio-icon-mini');

    if (!mainIconEl) console.error("[Audio Debug] Critical: Main icon container not found!");
    if (!miniIconEl) console.error("[Audio Debug] Critical: Mini icon container not found!");

    if (isPlaying) {
        audioPlayer.play().catch(e => {
            console.error("[Audio Debug] Auto-play prevented", e);
            isPlaying = false;
            // Revert UI if play fails
            if (mainIconEl) mainIconEl.innerHTML = SVG_PLAY;
            if (miniIconEl) miniIconEl.innerHTML = SVG_PLAY;
            return;
        });

        // UI: Playing State
        if (cardBg) cardBg.classList.replace('opacity-20', 'opacity-40');
        if (recDot) recDot.classList.add('animate-ping');

        if (lpDisk) {
            lpDisk.style.animationPlayState = 'running';
            lpDisk.classList.remove('paused');
            lpDisk.classList.add('animate-spin-slow');
        }
        if (lpGlow) lpGlow.classList.add('scale-110', 'opacity-60');

        if (playerBtn) {
            playerBtn.classList.replace('bg-gray-800/60', 'bg-white/10');
            playerBtn.classList.add('border-white/20', 'shadow-[0_0_15px_rgba(255,255,255,0.1)]');
            playerBtn.classList.add('scale-[1.02]');
        }

        // Inject PAUSE SVG
        if (mainIconEl) mainIconEl.innerHTML = SVG_PAUSE;
        if (miniIconEl) miniIconEl.innerHTML = SVG_PAUSE;

        if (playerStatus) playerStatus.innerText = TRANSLATIONS[currentLang].ui.audio_playing; // Localized
        if (songTitle) songTitle.classList.add(finalResult.textColor.split(' ')[0]);

        // [Viral] Start Visualizer Loop
        toggleVisualizer(true);

    } else {
        audioPlayer.pause();

        // UI: Paused State
        if (cardBg && cardBg.classList.contains('opacity-40')) {
            cardBg.classList.replace('opacity-40', 'opacity-20');
        }
        if (recDot) recDot.classList.remove('animate-ping');

        if (lpDisk) {
            // Smooth Stop: Use .paused class to freeze animation at current angle
            lpDisk.style.animationPlayState = 'paused';
            lpDisk.classList.add('paused');
            // Note: We don't remove animate-spin-slow immediately to avoid jump
        }

        // [Viral] Stop Visualizer
        toggleVisualizer(false);
        if (lpGlow) lpGlow.classList.remove('scale-110', 'opacity-60');

        if (playerBtn) {
            playerBtn.classList.replace('bg-white/10', 'bg-gray-800/60');
            playerBtn.classList.remove('border-white/20', 'shadow-[0_0_15px_rgba(255,255,255,0.1)]');
            playerBtn.classList.remove('scale-[1.02]');
        }

        // Inject PLAY SVG
        if (mainIconEl) mainIconEl.innerHTML = SVG_PLAY;
        if (miniIconEl) miniIconEl.innerHTML = SVG_PLAY;

        if (playerStatus) playerStatus.innerText = TRANSLATIONS[currentLang].ui.audio_preview; // Localized
        if (songTitle) songTitle.classList.remove(finalResult.textColor.split(' ')[0]);
    }
}

function stopAudio() {
    audioPlayer.pause();
    audioPlayer.currentTime = 0;
    isPlaying = false;
}

// [All Types] 전체 유형 보기 (Mini LP Collection Style)
function renderAllTypes() {
    triggerHaptic();
    const localResults = TRANSLATIONS[currentLang].results || {};
    const T = TRANSLATIONS[currentLang].ui;

    const typesHTML = Object.entries(RESULTS_DATA).map(([key, data]) => {
        const localData = localResults[key] || {};
        // Merge localized data (genre, subTitle, etc.)
        const finalData = { ...data, ...localData };

        return `
    <div onclick = "selectTypeAndShowResult('${key}'); document.getElementById('all-types-modal').remove();" class="group relative flex flex-col items-center text-center p-4 rounded-[1.5rem] bg-white/5 border border-white/10 backdrop-blur-md cursor-pointer transition-all duration-300 hover:bg-black/40 hover:-translate-y-1.5 shadow-lg hover:shadow-2xl overflow-hidden" >
            
            < !--Adaptive Glow-- >
            <div class="absolute inset-0 bg-gradient-to-br ${finalData.color} opacity-10 group-hover:opacity-20 transition-opacity duration-500"></div>
            
            <!--Mini LP Design-- >
            <div class="relative w-24 h-24 mb-4 rounded-full shadow-xl group-hover:scale-105 transition-transform duration-500 ease-out shrink-0">
                 <!-- Vinyl Ring (Adaptive Color) -->
                 <div class="absolute -inset-1 rounded-full bg-gradient-to-br ${finalData.color} opacity-40 blur-md group-hover:opacity-70 transition-opacity"></div>
                 <div class="absolute -inset-[2px] rounded-full bg-gradient-to-br ${finalData.color} opacity-80"></div>
                 
                 <!-- Album Art -->
                 <div class="absolute inset-0 rounded-full overflow-hidden border-2 border-[#1a1a1a] z-10 w-full h-full">
                    <img src="${finalData.image}" alt="${finalData.genre}" class="w-full h-full object-cover opacity-90">
                 </div>
                 
                 <!-- Vinyl Hole -->
                 <div class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-3 h-3 bg-[#1a1a1a] rounded-full z-20 border border-white/10 shadow-inner"></div>
            </div>

            <!--Text Content-- >
            <div class="relative z-10 w-full">
                <span class="inline-block px-2 py-0.5 rounded text-[10px] font-black tracking-widest uppercase bg-black/50 border border-white/10 text-gray-400 mb-2 group-hover:text-white transition-colors shadow-sm">${key}</span>
                <h3 class="text-sm font-bold text-gray-100 mb-1 leading-tight group-hover:text-amber-400 transition-all truncate px-1">${finalData.genre}</h3>
                <p class="text-[10px] text-gray-500 line-clamp-1 group-hover:text-gray-300 transition-colors">${finalData.subTitle}</p>
            </div>
            
            <!--Play Icon Overlay-- >
    <div class="absolute top-4 right-4 text-white/0 group-hover:text-white/40 transition-all duration-300">
        <i data-lucide="play-circle" class="w-4 h-4"></i>
    </div>
        </div>
    `}).join('');

    const modal = document.createElement('div');
    modal.id = 'all-types-modal';
    modal.className = 'fixed inset-0 z-[250] bg-black/90 backdrop-blur-xl p-6 overflow-y-auto animate-fade-in custom-scrollbar';
    modal.innerHTML = `
    <div class="max-w-4xl mx-auto min-h-full flex flex-col" >
             
             < !--Glass Header-- >
             <div class="sticky top-0 z-30 bg-[#09090b]/80 backdrop-blur-xl border-b border-white/5 px-6 py-4 flex items-center justify-between shadow-lg -mx-6 -mt-6 rounded-b-2xl mb-8">
                <div class="flex items-center gap-3">
                    <button onclick="document.getElementById('all-types-modal').remove()" class="p-2 -ml-2 rounded-full hover:bg-white/10 transition-colors text-gray-400 hover:text-white">
                        <i data-lucide="arrow-left" class="w-5 h-5"></i>
                    </button>
                    <span class="text-lg font-black italic text-white tracking-tighter">${T.vibe_collection || "Vibe Collection"}</span>
                </div>
                <div class="flex items-center gap-1.5 px-2 py-1 bg-white/5 rounded-lg border border-white/10">
                    <i data-lucide="disc" class="w-3 h-3 text-amber-500"></i>
                    <span class="text-gray-400 text-[10px] font-mono font-bold">${Object.keys(RESULTS_DATA).length} LP</span>
                </div>
             </div>
 
             <!--Grid Layout-- >
    <div class="grid grid-cols-2 md:grid-cols-4 gap-4 pb-24 animate-slide-up">
        ${typesHTML}
    </div>
        </div>
    `;
    document.body.appendChild(modal);
    if (window.lucide) lucide.createIcons();
}

// 결과 공유하기
// 결과 공유하기 (모달 버전)
function shareResult() {
    triggerHaptic();
    if (!finalResult) {
        console.error("No result to share");
        return;
    }

    const T = TRANSLATIONS[currentLang].ui;

    // 모달 생성
    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-300';
    modal.onclick = (e) => { if (e.target === modal) modal.remove(); };

    modal.innerHTML = `
        <div class="w-full max-w-sm bg-gray-900 border border-white/10 rounded-3xl p-6 shadow-2xl animate-in zoom-in-95 duration-300">
            <div class="flex justify-between items-center mb-6">
                <h3 class="text-xl font-bold text-white">${T.btn_share}</h3>
                <button onclick="this.closest('.fixed').remove()" class="p-2 text-gray-400 hover:text-white transition-colors">
                    <i data-lucide="x" class="w-6 h-6"></i>
                </button>
            </div>
            
            <div class="grid grid-cols-1 gap-3">
                <!-- 카카오톡 -->
                <button onclick="shareKakao(); this.closest('.fixed').remove()" class="flex items-center gap-4 w-full p-4 bg-[#FAE100] hover:bg-[#FFEB3B] text-[#371D1E] rounded-2xl font-bold transition-all active:scale-95">
                    <div class="w-10 h-10 bg-[#371D1E] rounded-full flex items-center justify-center">
                        <i data-lucide="message-circle" class="w-5 h-5 text-[#FAE100]"></i>
                    </div>
                    <span>카카오톡으로 공유</span>
                </button>
                
                <!-- 트위터 -->
                <button onclick="shareTwitter(); this.closest('.fixed').remove()" class="flex items-center gap-4 w-full p-4 bg-black border border-white/10 hover:bg-gray-800 text-white rounded-2xl font-bold transition-all active:scale-95">
                    <div class="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center">
                        <i data-lucide="twitter" class="w-5 h-5 text-white"></i>
                    </div>
                    <span>X (트위터)에 공유</span>
                </button>
                
                <!-- 인스타그램 -->
                <button onclick="shareInstagram(); this.closest('.fixed').remove()" class="flex items-center gap-4 w-full p-4 bg-gradient-to-tr from-yellow-400 via-red-500 to-purple-500 text-white rounded-2xl font-bold transition-all active:scale-95">
                    <div class="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                        <i data-lucide="instagram" class="w-5 h-5 text-white"></i>
                    </div>
                    <span>인스타그램 스토리</span>
                </button>

                <div class="my-2 h-px bg-white/5"></div>

                <!-- 시스템 공유 / 링크 복사 -->
                <button onclick="handleSystemShare(); this.closest('.fixed').remove()" class="flex items-center gap-4 w-full p-4 bg-white/5 hover:bg-white/10 border border-white/10 text-white rounded-2xl font-bold transition-all active:scale-95">
                    <div class="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center">
                        <i data-lucide="share-2" class="w-5 h-5 text-white"></i>
                    </div>
                    <span>${T.copy_link || "기타 방법으로 공유"}</span>
                </button>
            </div>
        </div>
    `;

    document.body.appendChild(modal);
    if (window.lucide) lucide.createIcons();
}

// 기존 시스템 공유 로직 분리
function handleSystemShare() {
    const T = TRANSLATIONS[currentLang].ui;
    const shareData = {
        title: T.share_title_template || 'MY MUSIC VIBE TEST',
        text: `${T.share_api_text || "Check out my music persona!"} ${finalResult.genre} (${finalResult.subTitle})`,
        url: window.location.href
    };

    if (navigator.share) {
        navigator.share(shareData).catch(err => console.log('Error sharing', err));
    } else {
        const textToCopy = `${shareData.title}\n${shareData.text}\nTest here: ${shareData.url}`;
        navigator.clipboard.writeText(textToCopy).then(() => {
            alert(TRANSLATIONS[currentLang].ui.copy_success);
        });
    }
}


// Global Event Delegation for Dynamic Elements
document.addEventListener('click', (e) => {
    const btn = e.target.closest('#save-image-btn');
    if (btn) {
        e.preventDefault();
        window.saveImage();
    }
});

// 6. Updated Save Image Logic (With Preview Modal)
window.saveImage = async function () {
    // 1. Prepare for Capture
    const btn = document.getElementById('save-image-btn');
    const originalText = btn.innerHTML;
    const T = TRANSLATIONS[currentLang].ui;

    // Get Export Elements
    const exportCard = document.getElementById('export-card');
    const exImg = document.getElementById('export-img');
    const exGenreEn = document.getElementById('export-genre-en');
    const exGenreKr = document.getElementById('export-genre-kr');
    const exMbti = document.getElementById('export-mbti');
    const exMbtiIcon = document.getElementById('export-mbti-icon');
    const exSong = document.getElementById('export-song');
    const exMatch = document.getElementById('export-match-type'); // Corrected ID
    const exTags = document.getElementById('export-tags');
    const exBg = document.getElementById('export-bg-gradient');
    const exOverlay = document.getElementById('export-bg-overlay');
    const exRarity = document.getElementById('export-rarity-badge');
    const exEnergyVal = document.getElementById('export-energy-value');
    const exEnergyBar = document.getElementById('export-energy-bar');
    const exResultId = document.getElementById('export-result-id');

    // Use a try-finally block for the ENTIRE operation to ensure button reset
    try {
        // Loading State
        btn.innerHTML = `<span class="animate-pulse">⏳ ${T.loading || "Saving"}...</span>`;
        btn.disabled = true;

        console.log("SaveImage: Syncing data...", { mbti: finalResult.mbti });

        // Sync Data
        if (exImg) {
            exImg.crossOrigin = "anonymous";
            exImg.src = finalResult.image;
        }

        // Genre Handling (Asymmetric Typography)
        const genreText = finalResult.genre;
        if (genreText && genreText.includes('&')) {
            const parts = genreText.split('&');
            if (exGenreEn) exGenreEn.innerHTML = `${parts[0].trim()}<br>& ${parts[1].trim()}`;
        } else {
            if (exGenreEn) exGenreEn.innerText = genreText || "";
        }

        // Get Korean Genre if available
        const localResult = (TRANSLATIONS['kr'].results && TRANSLATIONS['kr'].results[finalResult.id]) ? TRANSLATIONS['kr'].results[finalResult.id] : {};
        if (exGenreKr) exGenreKr.innerText = localResult.genre || "";

        if (exMbti) exMbti.innerText = finalResult.mbti;
        if (exMbtiIcon) exMbtiIcon.innerText = finalResult.mbti ? finalResult.mbti.substring(0, 2) : "";
        if (exSong) exSong.innerText = finalResult.bestSong || "";

        // Dynamic ID & Stats
        if (exResultId) exResultId.innerText = `#MV-2025-${Math.floor(Math.random() * 9000) + 1000}`;

        // Rarity Calculation
        const rarityMap = { 'INFJ': 1.5, 'ENTP': 3.2, 'INTJ': 2.1, 'ENFJ': 2.5, 'INFP': 4.4, 'ENFP': 8.1, 'ISFP': 8.8, 'INTP': 3.3, 'ESFP': 8.5, 'ESTP': 4.3, 'ISFJ': 13.8, 'ESFJ': 12.3, 'ISTJ': 11.6, 'ESTJ': 8.7, 'ISTP': 5.4, 'ENTJ': 1.8 };
        const rarity = rarityMap[finalResult.mbti] || 5.0;
        if (exRarity) exRarity.innerText = `TOP ${rarity}%`;

        // Energy Calculation
        const energy = Math.floor(80 + Math.random() * 19);
        if (exEnergyVal) exEnergyVal.innerText = `${energy}%`;
        if (exEnergyBar) exEnergyBar.style.width = `${energy}%`;

        // Fix: Use localized genre for match
        const bestMatchKey = finalResult.match ? finalResult.match.best : null;
        if (bestMatchKey && RESULTS_DATA[bestMatchKey]) {
            const localMatch = (TRANSLATIONS[currentLang].results && TRANSLATIONS[currentLang].results[bestMatchKey]) ? TRANSLATIONS[currentLang].results[bestMatchKey] : {};
            if (exMatch) exMatch.innerText = localMatch.genre || RESULTS_DATA[bestMatchKey].genre;
        } else {
            if (exMatch) exMatch.innerText = "Unknown";
        }

        // Enhanced Styling - Sophisticated Gradients
        if (finalResult.color) {
            // Map simple tailwind colors to complex poster-style gradients (Using RAW CSS strings for html2canvas compatibility)
            const colorMap = {
                'from-purple-600': 'linear-gradient(135deg, #4c1d95, #1e1b4b, #000000)',
                'from-pink-600': 'linear-gradient(135deg, #831843, #1a1a1c, #000000)',
                'from-blue-600': 'linear-gradient(135deg, #0e7490, #082f49, #000000)',
                'from-amber-600': 'linear-gradient(135deg, #92400e, #09090b, #000000)',
                'from-emerald-600': 'linear-gradient(135deg, #065f46, #022c22, #000000)'
            };
            const baseGradient = finalResult.color.split(' ')[0];
            const richGradient = colorMap[baseGradient] || `linear-gradient(135deg, #4c1d95, #000000)`; // Default fallback

            if (exBg) {
                exBg.className = 'absolute inset-0 z-0'; // Remove tailwind gradient classes
                exBg.style.background = richGradient;
                exBg.style.width = '100%';
                exBg.style.height = '100%';
            }
            if (exOverlay) {
                // Use simple linear gradient for compatibility
                exOverlay.style.background = 'linear-gradient(180deg, rgba(255,255,255,0.05) 0%, rgba(0,0,0,0) 100%)';
                exOverlay.style.width = '100%';
                exOverlay.style.height = '100%';
            }
        }

        // Dynamic Tags (Select 3 pros as tags)
        if (exTags && finalResult.pros) {
            exTags.innerHTML = finalResult.pros.slice(0, 3).map(pro => `
                <span class="px-6 py-2 bg-white/10 backdrop-blur-md border border-white/20 rounded-full text-2xl font-bold text-white/90">#${pro.split(' ').pop()}</span>
            `).join('');
        }

        console.log("SaveImage: Preparing capture...", { mbti: finalResult.mbti, img: finalResult.image });

        // --- MANUAL CLONE STRATEGY ---
        // 1. Clone the element
        const clone = exportCard.cloneNode(true);
        clone.id = 'export-card-clone'; // Avoid ID conflict

        // 2. Enforce Clone Styles (Visible, Correct Size)
        clone.style.display = 'flex';
        clone.style.width = '1080px';
        clone.style.height = '1920px';
        clone.style.position = 'fixed';
        clone.style.top = '0';
        clone.style.left = '0'; // Visible viewport area
        clone.style.zIndex = '-9999'; // Behind everything
        clone.style.opacity = '1';
        clone.style.transform = 'none';
        clone.style.visibility = 'visible';

        // 3. Append to body
        document.body.appendChild(clone);

        console.log("SaveImage: Clone created and appended.");

        // Force reflow
        window.scrollTo(0, 0);
        await new Promise(resolve => requestAnimationFrame(() => setTimeout(resolve, 500)));


        if (typeof html2canvas === 'undefined') {
            document.body.removeChild(clone);
            throw new Error("html2canvas libraries not loaded");
        }

        // Wait for images in clone to load
        const cloneImg = clone.querySelector('#export-img');
        if (cloneImg && !cloneImg.complete) {
            await new Promise((resolve) => {
                cloneImg.onload = resolve;
                cloneImg.onerror = resolve;
                setTimeout(resolve, 1500);
            });
        }

        // 4. Capture Clone
        const canvas = await html2canvas(clone, {
            scale: 1, // Reset scale to 1 for 1080x1920 native size
            useCORS: true,
            backgroundColor: '#09090b',
            logging: false, // Disable logging for speed
            width: 1080,
            height: 1920,
            windowWidth: 1080, // CRITICAL FIX: Simulate full 1080p width
            windowHeight: 1920, // CRITICAL FIX: Simulate full 1920p height
            scrollX: 0,
            scrollY: 0,
            x: 0,
            y: 0,
            ignoreElements: (element) => element.classList.contains('exclude-export')
        });

        // 5. Cleanup Clone
        document.body.removeChild(clone);

        console.log("SaveImage: Capture complete. Generating data URL...");

        const dataUrl = canvas.toDataURL('image/png');
        console.log("SaveImage: Data URL generated (" + Math.round(dataUrl.length / 1024) + "KB). Showing preview modal...");

        // 3. Show Preview Modal
        showPreviewModal(dataUrl);

    } catch (err) {
        console.error("Capture failed:", err);
        // Clean up clone if it exists and wasn't removed
        const existingClone = document.getElementById('export-card-clone');
        if (existingClone) document.body.removeChild(existingClone);

        alert((T.share_error || "Image save failed.") + "\n(Error: " + (err.message || "Unknown") + ")");
    } finally {
        // Reset Original Header Button
        btn.innerHTML = originalText;
        btn.disabled = false;

        // Reset Original Card (just in case)
        if (exportCard) {
            exportCard.style.transform = 'translateY(200%)';
            exportCard.style.opacity = '0';
            exportCard.style.visibility = 'hidden';
            exportCard.style.zIndex = '-1';
        }
    }
};

function showPreviewModal(dataUrl) {
    const T = TRANSLATIONS[currentLang].ui;
    const modal = document.createElement('div');
    modal.id = 'preview-modal';
    modal.className = 'fixed inset-0 z-[300] flex items-center justify-center p-6 animate-fade-in';
    modal.innerHTML = `
        <div class="absolute inset-0 bg-black/90 backdrop-blur-xl" onclick="closePreview()"></div>
            <div class="relative w-full max-w-sm bg-[#1a1a1c] border border-white/10 rounded-[2.5rem] p-6 shadow-2xl flex flex-col items-center animate-slide-up">
                <h3 class="text-white font-black tracking-widest uppercase text-sm mb-4">${T.preview_title}</h3>

                <div class="w-full aspect-[9/16] rounded-2xl overflow-hidden shadow-2xl border border-white/5 mb-6 bg-black">
                    <img src="${dataUrl}" class="w-full h-full object-contain">
                </div>

                <button onclick="downloadCapturedImage('${dataUrl}')" class="w-full py-4 bg-white text-black font-black uppercase tracking-widest rounded-xl transition-all hover:scale-105 active:scale-95 shadow-[0_0_20px_rgba(255,255,255,0.2)] mb-3">
                    ${T.preview_btn}
                </button>
                <button onclick="closePreview()" class="text-gray-500 text-xs font-bold uppercase tracking-widest hover:text-white transition-colors">
                    ${T.match_close}
                </button>
            </div>
`;
    document.body.appendChild(modal);
}

window.closePreview = function () {
    const modal = document.getElementById('preview-modal');
    if (modal) {
        modal.classList.replace('animate-slide-up', 'animate-fade-out');
        setTimeout(() => modal.remove(), 400);
    }
};

window.downloadCapturedImage = function (dataUrl) {
    triggerHaptic();
    const link = document.createElement('a');
    link.href = dataUrl;
    link.download = `MY_VIBE_${finalResult.mbti}.png`;
    link.click();
};


// --- Viral Feature: Match Modal Logic ---
window.openMatchModal = function (myTypeKey, targetType, isBest, isFriendOverride = false) {
    const T = TRANSLATIONS[currentLang].ui;

    // Helper to get merged data (Deep merge for match)
    const getMergedData = (key) => {
        if (!key) return null;
        const base = RESULTS_DATA[key];
        const local = TRANSLATIONS[currentLang].results && TRANSLATIONS[currentLang].results[key]
            ? TRANSLATIONS[currentLang].results[key]
            : {};

        const merged = { ...base, ...local };
        if (base.match && local.match) {
            merged.match = { ...base.match, ...local.match };
        }
        return merged;
    };

    const myData = getMergedData(myTypeKey);
    const targetData = getMergedData(targetType);

    const modal = document.getElementById('match-modal');
    const header = document.getElementById('modal-header');
    const title = document.getElementById('modal-match-title');
    const desc = document.getElementById('modal-desc');
    const matchImg = document.getElementById('modal-match-img');
    const connIcon = document.getElementById('modal-conn-icon');
    const glow = document.getElementById('modal-glow');

    // UI Reset/Set
    matchImg.src = targetData.image;
    title.innerHTML = targetData.genre || "Unknown Vibe";

    // Format Description Helper
    const formatDesc = (text) => {
        if (!text) return "";
        // Replace periods/questions/exclamations followed by space using regex, but avoid breaking numbers or Initials if simple
        // Simple approach: Split by ". " -> ".<br><br>"
        return text.replace(/([.?!])\s+/g, '$1<br><br>');
    };

    if (isFriendOverride) {
        // [Viral] Friend Match Modal
        const fTitle = T.match_modal_friend || "Friend Compatibility";
        header.innerHTML = `<span class="text-[10px] text-gray-400 font-bold tracking-widest block mb-1">PERFECT MATCH</span> <span class="text-2xl font-black text-white">${fTitle}</span>`;
        connIcon.textContent = "💌";
        // Show the Friend's Persona Description
        desc.innerHTML = formatDesc(targetData.desc);
        glow.className = "absolute top-[-20%] right-[-20%] w-[150px] h-[150px] rounded-full blur-[60px] pointer-events-none bg-purple-500/20 animate-pulse";
    } else if (isBest) {
        header.innerHTML = `<span class="text-[10px] text-gray-400 font-bold tracking-widest block mb-1">${T.match_header_sub_best}</span> <span class="text-2xl font-black text-white">${T.match_modal_best}</span>`;
        connIcon.textContent = "💖";
        desc.innerHTML = formatDesc(myData.match.bestDesc || "데이터 준비 중입니다...");
        glow.className = "absolute top-[-20%] right-[-20%] w-[150px] h-[150px] rounded-full blur-[60px] pointer-events-none bg-pink-500/20 animate-pulse";
    } else {
        header.innerHTML = `<span class="text-[10px] text-gray-400 font-bold tracking-widest block mb-1">${T.match_header_sub_worst}</span> <span class="text-2xl font-black text-gray-300">${T.match_modal_worst}</span>`;
        connIcon.textContent = "💔";
        desc.innerHTML = formatDesc(myData.match.worstDesc || "데이터 준비 중입니다...");
        glow.className = "absolute top-[-20%] right-[-20%] w-[150px] h-[150px] rounded-full blur-[60px] pointer-events-none bg-blue-500/20 animate-pulse";
    }

    modal.classList.remove('hidden');
    // Prevent background scroll
    document.body.style.overflow = 'hidden';
}


window.closeMatchModal = function () {
    const modal = document.getElementById('match-modal');
    if (modal) modal.classList.add('hidden');
    document.body.style.overflow = '';
}

// ==========================================
// [Viral] Helper Functions
// ==========================================

// 1. Sound Modal Logic (Moved to Loading Phase)
window.checkSoundAndRevealResult = function () {
    triggerHaptic();

    // Check if modal exists
    const modal = document.getElementById('sound-modal');
    if (!modal) { renderResult(); return; }

    // Set Text based on currentLang
    const T = TRANSLATIONS[currentLang].ui;
    // Safe check if element exists (it should)
    const elTitle = document.getElementById('modal-title');
    const elDesc = document.getElementById('modal-desc');
    const elBtn = document.getElementById('modal-btn');

    if (elTitle) elTitle.innerText = T.sound_modal_title || "Headphones ON?";
    if (elDesc) elDesc.innerHTML = T.sound_modal_desc || "For best experience, use headphones.";
    if (elBtn) elBtn.innerText = T.sound_modal_btn || "I'm Ready";

    // Show Modal
    modal.classList.remove('pointer-events-none', 'opacity-0');
    // Scale effect
    const content = document.getElementById('sound-modal-content');
    if (content) {
        content.classList.replace('scale-90', 'scale-100');
    }
}

window.confirmSound = function () {
    triggerHaptic();
    const modal = document.getElementById('sound-modal');
    if (modal) {
        modal.classList.add('opacity-0', 'pointer-events-none');
        // Scale down
        const content = document.getElementById('sound-modal-content');
        if (content) content.classList.replace('scale-100', 'scale-90');
    }

    // Start Result Logic
    setTimeout(() => {
        renderResult();
    }, 300);
}

// 2. Visualizer Logic (Disabled per user request)
window.initVisualizer = function () {
    // Disabled
}

window.toggleVisualizer = function (active) {
    // Disabled
}

window.loopVisualizer = function () {
    // Disabled
}

// 3. Friend Rendering
window.renderFriendMatchCard = function (T) {
    if (!friendRef || !finalResult) return '';

    const friendData = RESULTS_DATA[friendRef];
    if (!friendData) return ''; // Invalid Ref

    const myMbti = finalResult.mbti;
    let score = 50;
    let label = "So-So";
    let color = "text-gray-400";

    // Check specific best/worst matches from data
    if (finalResult.match && finalResult.match.best === friendRef) {
        score = 98;
        label = T.match_label_best || "Perfect Match";
        color = "text-pink-400";
    } else if (finalResult.match && finalResult.match.worst === friendRef) {
        score = 12;
        label = T.match_label_worst || "Worst Match";
        color = "text-blue-400";
    } else if (myMbti === friendRef) {
        score = 95;
        label = T.match_result_labels.soulmate;
        color = "text-purple-400";
    } else {
        // Fallback calculation
        const diff = [...myMbti].filter((c, i) => c !== friendRef[i]).length;
        if (diff === 1) { score = 85; label = T.match_result_labels.good; color = "text-green-400"; }
        else if (diff === 2) { score = 60; label = T.match_result_labels.soso; color = "text-yellow-400"; }
        else { score = 30; label = T.match_result_labels.bad; color = "text-red-400"; }
    }

    return `
    <div class="w-full max-w-sm mb-6 animate-fade-in-down">
        <div class="glass-panel p-4 rounded-2xl border border-white/20 bg-gradient-to-r from-purple-900/40 to-black/40 relative overflow-hidden">
            <div class="absolute inset-0 bg-white/5 animate-pulse-slow"></div>

            <div class="relative z-10 flex justify-between items-center mb-4">
                <span class="text-xs font-bold text-gray-300 uppercase tracking-widest">${T.match_modal_friend || "Friend Match"}</span>
            </div>

            <div class="flex items-center justify-between gap-4">
                <!-- Me -->
                <div class="flex flex-col items-center gap-2">
                    <div class="w-14 h-14 rounded-full border-2 border-purple-500 overflow-hidden shadow-lg">
                        <img src="${finalResult.image}" class="w-full h-full object-cover">
                    </div>
                    <span class="text-[10px] font-bold text-gray-400">${T.label_you || 'YOU'}</span>
                </div>

                <!-- Score -->
                <div class="flex flex-col items-center">
                    <span class="text-2xl font-black ${color} drop-shadow-glow">${score}%</span>
                    <span class="text-[10px] uppercase font-bold text-white/50">${label}</span>
                </div>

                <!-- Friend -->
                <div class="flex flex-col items-center gap-2">
                    <div class="w-14 h-14 rounded-full border-2 border-gray-500 overflow-hidden shadow-lg grayscale opacity-80">
                        <img src="${friendData.image}" class="w-full h-full object-cover">
                    </div>
                    <span class="text-[10px] font-bold text-gray-400">${T.label_friend || 'FRIEND'}</span>
                </div>
            </div>

            <div class="mt-4 pt-4 border-t border-white/10 text-center">
                <p class="text-xs text-gray-400 leading-tight">
                    ${T.friend_compatibility_label || "Compatibility with:"} <span class="font-bold text-white">${friendData.genre}</span>
                </p>
            </div>
        </div>
        </div>
    `;
}

// 4. Update Share URL
window.getShareUrl = function () {
    const baseUrl = window.location.origin + window.location.pathname;
    const ref = finalResult ? finalResult.mbti : '';
    // Append ref if exists
    return ref ? `${baseUrl}?ref = ${ref} ` : baseUrl;
}
// Override shareResult to use getShareUrl
window.shareResult = async function () {
    triggerHaptic();
    const url = getShareUrl();
    const T = TRANSLATIONS[currentLang].ui;

    // Viral Share Metadata
    const title = `🎵 ${finalResult.genre} | Music Vibe Test`;
    const text = `${finalResult.subTitle} - Find your soul BGM! 🎧`;

    if (navigator.share) {
        try {
            await navigator.share({
                title: title,
                text: text,
                url: url
            });
        } catch (err) {
            console.log('Share failed:', err);
        }
    } else {
        navigator.clipboard.writeText(url).then(() => {
            alert(T.copy_success);
        }).catch(() => {
            prompt("Copy this link:", url);
        });
    }
}




// 5. View All Types Logic
window.renderAllTypes = function () {
    triggerHaptic();
    const T = TRANSLATIONS[currentLang].ui;

    // Create Modal Overlay - Append to app-wrapper for containment
    const modal = document.createElement('div');
    modal.id = 'all-types-modal';
    modal.className = 'absolute inset-0 z-[250] bg-black/90 backdrop-blur-xl p-6 overflow-y-auto animate-fade-in custom-scrollbar'; // absolute instead of fixed for container relative

    // Grid Content
    const types = Object.keys(RESULTS_DATA);
    let gridHtml = '';

    types.forEach(key => {
        // We need merged data to get the localized Genre/Subtitle
        const local = TRANSLATIONS[currentLang].results && TRANSLATIONS[currentLang].results[key] ? TRANSLATIONS[currentLang].results[key] : {};
        const base = RESULTS_DATA[key];
        const merged = { ...base, ...local };

        gridHtml += `
    <div onclick="selectTypeAndShowResult('${key}'); document.getElementById('all-types-modal').remove();" class="cursor-pointer relative overflow-hidden rounded-[2rem] p-5 border border-white/10 bg-black/20 backdrop-blur-xl group transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_0_30px_rgba(255,255,255,0.1)] hover:border-white/30 active:scale-95">
                
                <!-- Gradient Background (Subtle Tint) -->
                <div class="absolute inset-0 bg-gradient-to-br ${merged.color} opacity-20 group-hover:opacity-40 transition-opacity duration-500"></div>
                
                <!-- Shine Effect -->
                <div class="absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"></div>

                <!-- Content -->
                <div class="relative z-10 flex flex-col items-center text-center gap-3">
                    <div class="relative w-16 h-16 rounded-full overflow-hidden shadow-lg border-2 border-white/20 group-hover:border-white/50 transition-colors">
                        <img src="${merged.image}" class="w-full h-full object-cover" onerror="this.src='assets/icon_main.webp'">
                    </div>
                    <div>
                        <h3 class="font-bold text-white text-sm group-hover:text-amber-300 transition-colors">${merged.genre}</h3>
                        <p class="text-[10px] text-gray-300 uppercase tracking-widest truncate max-w-[120px] opacity-80 group-hover:opacity-100 transition-opacity">${key}</p>
                    </div>
                </div>
            </div>
    `;
    });

    modal.innerHTML = `
    <div class="max-w-4xl mx-auto">
            <div class="flex justify-between items-center mb-6 relative z-10 py-4 border-b border-white/5">
                <div class="relative">
                     <h2 class="text-2xl font-black text-white italic tracking-tighter relative z-10">${T.vibe_collection || "Vibe Collection"}</h2>
                     <div class="absolute -bottom-1 left-0 w-full h-3 bg-cyan-500/20 blur-lg -z-0"></div>
                </div>

                <button onclick="document.getElementById('all-types-modal').remove()" class="p-2 rounded-full bg-white/5 text-gray-400 hover:text-white hover:bg-white/10 transition-all border border-white/5">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                </button>
            </div>
            <div class="grid grid-cols-2 gap-4 pb-10 animate-slide-up">
                ${gridHtml}
            </div>
        </div>
    `;

    // Append to wrapper if exists, else body
    const wrapper = document.getElementById('app-wrapper') || document.body;
    wrapper.appendChild(modal);
}


// 6. Legal Modal Logic (Adsense Requirement)
window.showLegal = function (type) {
    const modal = document.getElementById('legal-modal');
    const content = document.getElementById('legal-content');
    if (!modal || !content) return;

    const T = TRANSLATIONS[currentLang].ui;
    let html = '';

    if (type === 'privacy') {
        html = T.legal_privacy_content;
    } else if (type === 'terms') {
        html = T.legal_terms_content;
    }

    content.innerHTML = html;
    modal.classList.remove('opacity-0', 'pointer-events-none');
    modal.querySelector('div').classList.remove('scale-90');
    modal.querySelector('div').classList.add('scale-100');
};

window.closeLegal = function () {
    const modal = document.getElementById('legal-modal');
    if (!modal) return;

    modal.classList.add('opacity-0', 'pointer-events-none');
    modal.querySelector('div').classList.remove('scale-100');
    modal.querySelector('div').classList.add('scale-90');
};

// 6. Cookie Consent Logic
function showCookieBanner() {
    if (localStorage.getItem('cookies-accepted')) return;

    const banner = document.createElement('div');
    banner.id = 'cookie-banner';
    banner.className = 'fixed bottom-6 left-6 right-6 z-[200] bg-black/60 backdrop-blur-2xl border border-white/10 p-5 rounded-2xl shadow-2xl animate-slide-up flex flex-col sm:flex-row items-center justify-between gap-4 max-w-2xl mx-auto';

    const T = TRANSLATIONS[currentLang].ui;
    banner.innerHTML = `
    <div class="flex items-center gap-3 text-white/90 text-sm">
            <span class="p-2 bg-amber-500/20 rounded-lg"><i data-lucide="cookie" class="w-5 h-5 text-amber-400"></i></span>
            <p>${T.cookie_text}</p>
        </div>
    <button onclick="acceptCookies()" class="px-6 py-2 bg-white text-black font-bold rounded-lg hover:bg-gray-200 transition-colors whitespace-nowrap">
        ${T.cookie_btn}
    </button>
`;

    document.body.appendChild(banner);
    if (window.lucide) lucide.createIcons();
}

window.acceptCookies = function () {
    localStorage.setItem('cookies-accepted', 'true');
    const banner = document.getElementById('cookie-banner');
    if (banner) {
        banner.classList.replace('animate-slide-up', 'animate-fade-out');
        setTimeout(() => banner.remove(), 500);
    }
};

// 7. PWA Deferred Prompt Logic
let deferredPrompt;
window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
    // Show install button or hint if needed (can be integrated into UI)
    console.log("PWA Install Prompt ready");
});

window.installPWA = function () {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    deferredPrompt.userChoice.then((choiceResult) => {
        if (choiceResult.outcome === 'accepted') {
            console.log('User accepted the PWA install');
        }
        deferredPrompt = null;
    });
};

// 8. Image Preview & Action Logic
function showPreviewModal(dataUrl) {
    const T = TRANSLATIONS[currentLang].ui;
    const modal = document.createElement('div');
    modal.id = 'preview-modal';
    modal.className = 'fixed inset-0 z-[300] flex items-center justify-center p-6 animate-fade-in';
    modal.innerHTML = `
    <div class="absolute inset-0 bg-black/90 backdrop-blur-xl" onclick="closePreview()"></div>
        <div class="relative w-full max-w-sm bg-[#1a1a1c] border border-white/10 rounded-[2.5rem] p-6 shadow-2xl flex flex-col items-center animate-slide-up">
            <h3 class="text-white font-black tracking-widest uppercase text-sm mb-4">${T.preview_title}</h3>

            <div class="w-full aspect-[9/16] rounded-2xl overflow-hidden shadow-2xl border border-white/5 mb-6 bg-black">
                <img src="${dataUrl}" class="w-full h-full object-contain">
            </div>

            <button onclick="downloadCapturedImage('${dataUrl}')" class="w-full py-4 bg-white text-black font-black uppercase tracking-widest rounded-xl transition-all hover:scale-105 active:scale-95 shadow-[0_0_20px_rgba(255,255,255,0.2)] mb-3">
                ${T.preview_btn}
            </button>
            <button onclick="closePreview()" class="text-gray-500 text-xs font-bold uppercase tracking-widest hover:text-white transition-colors">
                ${T.match_close}
            </button>
        </div>
`;
    document.body.appendChild(modal);
}

window.closePreview = function () {
    const modal = document.getElementById('preview-modal');
    if (modal) {
        modal.classList.replace('animate-slide-up', 'animate-fade-out');
        setTimeout(() => modal.remove(), 400);
    }
};

window.downloadCapturedImage = function (dataUrl) {
    triggerHaptic();
    const link = document.createElement('a');
    link.href = dataUrl;
    link.download = `MY_VIBE_${finalResult.mbti}.png`;
    link.click();
};

// [Viral] Kakao Share Logic
window.initKakao = function () {
    if (window.Kakao && !window.Kakao.isInitialized()) {
        try {
            window.Kakao.init('e861d8f8a85f6c8d67c54f5d22384956'); // Placeholder Key
            console.log('Kakao SDK Initialized');
        } catch (e) {
            console.warn('Kakao Init Failed', e);
        }
    }
};

window.shareKakao = function () {
    if (!window.Kakao || !window.Kakao.isInitialized()) {
        alert("카카오톡 공유 기능이 활성화되지 않았습니다.");
        return;
    }

    if (!finalResult) return;

    window.Kakao.Share.sendDefault({
        objectType: 'feed',
        content: {
            title: '나의 음악 주파수(Vibe)는? 🎧',
            description: `내 결과: ${finalResult.genre} (#${finalResult.mbti})\n당신의 소울 바이브도 찾아보세요!`,
            imageUrl: window.location.origin + '/' + finalResult.image,
            link: {
                mobileWebUrl: 'https://my-music-vibe.com',
                webUrl: 'https://my-music-vibe.com',
            },
        },
        buttons: [
            {
                title: '결과 확인하기',
                link: {
                    mobileWebUrl: 'https://my-music-vibe.com',
                    webUrl: 'https://my-music-vibe.com',
                },
            },
        ],
    });
};

// [Viral] Twitter Share Logic
window.shareTwitter = function () {
    const text = `내 음악적 성격은? 🎧\n🎵 ${finalResult.genre} (${finalResult.mbti})\n\n👉 테스트 하러가기:`;
    const url = "https://my-music-vibe.com";
    const hashtags = "MusicVibeTest,MBTI,음악성격";

    // Use Twitter Web Intent
    const intentUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}&hashtags=${encodeURIComponent(hashtags)}`;
    window.open(intentUrl, '_blank', 'width=550,height=420');
};

// [Viral] Instagram Share Logic (Web Fallback)
window.shareInstagram = async function () {
    // 1. Try Native Share (Mobile) - "Stories" often accept image shares
    if (navigator.canShare && navigator.share) {
        try {
            // We need a file to share to Instagram properly
            // Reuse the logic from saveImage to get a blob, but streamlined
            const exportCard = document.getElementById('export-card');
            const exImg = document.getElementById('export-img');
            const exGenre = document.getElementById('export-genre');
            const exMbti = document.getElementById('export-mbti');
            const exSong = document.getElementById('export-song');
            const exMatch = document.getElementById('export-match-type');
            const exTags = document.getElementById('export-tags');
            const exBg = document.getElementById('export-bg-gradient');
            const exGlow = document.getElementById('export-avatar-glow');
            const exOverlay = document.getElementById('export-bg-overlay');

            // Sync Data (Same as saveImage)
            exImg.src = finalResult.image;
            exGenre.innerText = finalResult.genre;
            exMbti.innerText = finalResult.mbti;
            exSong.innerText = finalResult.bestSong;
            exMatch.innerText = RESULTS_DATA[finalResult.match.best].genre;

            if (finalResult.color) {
                exBg.className = `absolute inset-0 z-0 bg-gradient-to-br ${finalResult.color}`;
                exGlow.className = `absolute inset-[-40px] rounded-full blur-[80px] opacity-60 bg-gradient-to-br ${finalResult.color}`;
                exOverlay.style.background = finalResult.coverPattern || '';
            }

            exTags.innerHTML = finalResult.pros.slice(0, 3).map(pro => `
                <span class="px-6 py-2 bg-white/10 backdrop-blur-md border border-white/20 rounded-full text-2xl font-bold text-white/90">#${pro.split(' ').pop()}</span>
            `).join('');

            exportCard.classList.remove('hidden');

            // Wait for image
            await new Promise(resolve => {
                if (exImg.complete) resolve();
                else exImg.onload = resolve;
            });

            const canvas = await html2canvas(exportCard, {
                scale: 2,
                useCORS: true,
                allowTaint: true,
                backgroundColor: '#09090b',
                logging: false,
                width: 1080,
                height: 1920
            });

            exportCard.classList.add('hidden');

            canvas.toBlob(async (blob) => {
                const file = new File([blob], "music_vibe_result.png", { type: "image/png" });

                try {
                    // Attempt native share with file
                    await navigator.share({
                        files: [file],
                        title: 'My Music Vibe',
                        text: 'Check out my music vibe! 🎧'
                    });
                } catch (err) {
                    console.log("Native share failed/cancelled", err);
                    // Fallback if user cancels or app doesn't support file share
                }
            }, 'image/png');

            return; // Exit if native share attempted

        } catch (e) {
            console.log("Blob generation or share processing failed", e);
            // Fallback to manual download
        }
    }

    // 2. Fallback: Save Image & Alert
    // If we are here, native sharing failed or isn't supported. 
    // Just trigger the normal save logic and show a toast/alert.
    await saveImage();
    alert("이미지가 저장되었습니다! 📸\n인스타그램 스토리/피드에 직접 업로드해주세요.");
};


// Initialize App
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        init();
        setTimeout(initKakao, 1000);
    });
} else {
    init();
    setTimeout(initKakao, 1000);
}


// ============================================================
// PREMIUM EXPORT SYSTEM (Safe Native Canvas)
// ============================================================

/**
 * 1. Safe Image Loader with Timeout
 */
function loadCanvasImageSafe(src, timeoutMs = 5000) {
    return new Promise((resolve) => {
        const img = new Image();
        img.crossOrigin = "anonymous";

        const timeoutId = setTimeout(() => {
            console.warn("Image load timed out:", src);
            resolve(null);
        }, timeoutMs);

        img.onload = () => {
            clearTimeout(timeoutId);
            resolve(img);
        };

        img.onerror = () => {
            clearTimeout(timeoutId);
            console.warn("Image load failed:", src);
            resolve(null);
        };

        img.src = src;
    });
}

/**
 * 2. Identity Profile Card Drawing Logic
 */
async function drawEtherealVinylCanvasSafe(result) {
    const canvas = document.createElement('canvas');
    canvas.width = 1080;
    canvas.height = 1920;
    const ctx = canvas.getContext('2d');
    const centerX = 1080 / 2;

    // --- 1. AURA BACKGROUND (Layered "Aura" Effect) ---
    // Fix: Use result.mbti as the key (result.id might be undefined)
    const mbtiKey = result.mbti || "ISTJ";

    // Precise Layered Color Mapping (Synchronized with Result Screen Atmospheres)
    const auraColors = {
        'ISTJ': { base: '#0f172a', glow: 'rgba(51, 65, 85, 0.6)', accent: 'rgba(30, 41, 59, 0.5)' }, // Slate Deep
        'ISFJ': { base: '#1e1b10', glow: 'rgba(180, 83, 9, 0.5)', accent: 'rgba(251, 191, 36, 0.3)' }, // Amber Warm
        'INFJ': { base: '#1e1b4b', glow: 'rgba(79, 70, 229, 0.6)', accent: 'rgba(129, 140, 248, 0.4)' }, // Indigo Mystical
        'INTJ': { base: '#0f172a', glow: 'rgba(30, 58, 138, 0.6)', accent: 'rgba(37, 99, 235, 0.4)' },  // Blue Deep
        'ISTP': { base: '#18181b', glow: 'rgba(82, 82, 91, 0.5)', accent: 'rgba(39, 39, 42, 0.4)' },  // Zinc Tech
        'ISFP': { base: '#310a1a', glow: 'rgba(225, 29, 72, 0.6)', accent: 'rgba(251, 113, 133, 0.4)' }, // Rose Artistic
        'INFP': { base: '#064e3b', glow: 'rgba(5, 150, 105, 0.6)', accent: 'rgba(16, 185, 129, 0.4)' }, // Emerald Dreamy
        'INTP': { base: '#2e1065', glow: 'rgba(124, 58, 237, 0.6)', accent: 'rgba(139, 92, 246, 0.4)' }, // Violet Intellectual
        'ESTP': { base: '#450a0a', glow: 'rgba(220, 38, 38, 0.6)', accent: 'rgba(153, 27, 27, 0.5)' },  // Red Energetic
        'ESFP': { base: '#431407', glow: 'rgba(234, 88, 12, 0.6)', accent: 'rgba(194, 65, 12, 0.4)' },  // Orange Vibrant
        'ENFP': { base: '#430641', glow: 'rgba(217, 70, 239, 0.6)', accent: 'rgba(162, 28, 175, 0.4)' },  // Fuchsia Social
        'ENTP': { base: '#1a2e05', glow: 'rgba(101, 163, 13, 0.6)', accent: 'rgba(77, 124, 15, 0.4)' },  // Lime Curious
        'ESTJ': { base: '#0c4a6e', glow: 'rgba(2, 132, 199, 0.6)', accent: 'rgba(3, 105, 161, 0.4)' },  // Cyan Efficient
        'ESFJ': { base: '#2d0a31', glow: 'rgba(147, 51, 234, 0.7)', accent: 'rgba(192, 38, 211, 0.5)' },  // Purple-Pink K-Pop
        'ENFJ': { base: '#451a03', glow: 'rgba(245, 158, 11, 0.6)', accent: 'rgba(217, 119, 6, 0.5)' },  // Amber Charismatic
        'ENTJ': { base: '#450a0a', glow: 'rgba(185, 28, 28, 0.7)', accent: 'rgba(153, 27, 27, 0.5)' }   // Crimson Strategic (Deep Red Sync)
    };

    const colors = auraColors[mbtiKey] || auraColors['ISTJ'];

    // Multi-layer Gradient for Richer Aura
    ctx.fillStyle = colors.base;
    ctx.fillRect(0, 0, 1080, 1920);

    // 1. Back Glow (Deeper, broader)
    const backGlow = ctx.createRadialGradient(centerX, 400, 0, centerX, 400, 1400);
    backGlow.addColorStop(0, colors.glow);
    backGlow.addColorStop(0.6, colors.glow.replace('0.4', '0.05').replace('0.5', '0.05').replace('0.6', '0.05').replace('0.7', '0.05'));
    backGlow.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = backGlow;
    ctx.fillRect(0, 0, 1080, 1920);

    // 2. Front Aura (Vibrant, directional)
    const frontAura = ctx.createLinearGradient(0, -200, 1080, 1000);
    frontAura.addColorStop(0, colors.accent);
    frontAura.addColorStop(0.5, 'rgba(0,0,0,0)');
    frontAura.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = frontAura;
    ctx.fillRect(0, 0, 1080, 1920);

    // 3. Bottom Shadow (Grounding)
    const bottomShadow = ctx.createLinearGradient(0, 1500, 0, 1920);
    bottomShadow.addColorStop(0, 'rgba(0,0,0,0)');
    bottomShadow.addColorStop(1, 'rgba(0,0,0,0.6)');
    ctx.fillStyle = bottomShadow;
    ctx.fillRect(0, 0, 1080, 1920);

    // --- 2. MINI LP RECORD (Centerpiece) ---
    const iconY = 320;
    const lpRadius = 240;
    const labelRadius = 90;

    if (result.image) {
        const lpImg = await loadCanvasImageSafe(result.image);
        if (lpImg) {
            // Draw Vinyl Base
            ctx.save();
            ctx.shadowColor = 'rgba(0,0,0,0.5)';
            ctx.shadowBlur = 40;

            ctx.beginPath();
            ctx.arc(centerX, iconY, lpRadius, 0, Math.PI * 2);
            ctx.fillStyle = '#111111';
            ctx.fill();

            // Draw Grooves
            ctx.strokeStyle = 'rgba(255,255,255,0.08)';
            ctx.lineWidth = 1;
            for (let r = 110; r < lpRadius - 5; r += 6) {
                ctx.beginPath();
                ctx.arc(centerX, iconY, r, 0, Math.PI * 2);
                ctx.stroke();
            }

            // Draw Label (Image)
            ctx.beginPath();
            ctx.arc(centerX, iconY, labelRadius, 0, Math.PI * 2);
            ctx.clip();
            ctx.drawImage(lpImg, centerX - labelRadius, iconY - labelRadius, labelRadius * 2, labelRadius * 2);
            ctx.restore();

            // Label Border & Hole
            ctx.beginPath();
            ctx.arc(centerX, iconY, labelRadius, 0, Math.PI * 2);
            ctx.strokeStyle = "rgba(255,255,255,0.2)";
            ctx.lineWidth = 4;
            ctx.stroke();

            ctx.beginPath();
            ctx.arc(centerX, iconY, 8, 0, Math.PI * 2);
            ctx.fillStyle = colors.base;
            ctx.fill();

            // Shine Reflect
            const shine = ctx.createLinearGradient(centerX - lpRadius, iconY - lpRadius, centerX + lpRadius, iconY + lpRadius);
            shine.addColorStop(0, 'rgba(255,255,255,0)');
            shine.addColorStop(0.48, 'rgba(255,255,255,0.05)');
            shine.addColorStop(0.5, 'rgba(255,255,255,0.15)');
            shine.addColorStop(0.52, 'rgba(255,255,255,0.05)');
            shine.addColorStop(1, 'rgba(255,255,255,0)');
            ctx.fillStyle = shine;
            ctx.beginPath();
            ctx.arc(centerX, iconY, lpRadius, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    // --- 3. VIBE TITLE (Aesthetic Artist Header) ---
    ctx.textAlign = 'center';
    ctx.fillStyle = '#ffffff';
    ctx.font = '900 72px "Pretendard", sans-serif'; // Kept 900 as per original, instruction was ambiguous
    ctx.shadowColor = 'rgba(0,0,0,0.3)';
    ctx.shadowBlur = 15;
    ctx.fillText(result.genre.toUpperCase(), centerX, 640);
    ctx.shadowBlur = 0;

    // Small decorative line
    ctx.beginPath();
    ctx.moveTo(centerX - 40, 680);
    ctx.lineTo(centerX + 40, 680);
    ctx.strokeStyle = 'rgba(255,255,255,0.4)';
    ctx.lineWidth = 4;
    ctx.stroke();

    // --- 4. CHARACTER ANALYSIS (Lyrics Panel) ---
    const analysisY = 780;
    const padding = 120;
    const maxWidth = 1080 - (padding * 2);

    // Glass Panel for Text
    drawGlassPanel(ctx, padding / 2, analysisY - 80, 1080 - padding, 820, 60);

    // Detailed Text Wrapping
    const kData = (TRANSLATIONS['kr'] && TRANSLATIONS['kr'].results[result.id]) || {};
    const fullDesc = kData.desc || result.desc || "";

    ctx.font = '700 48px "Pretendard", sans-serif'; // Bolder font weight
    ctx.fillStyle = 'rgba(255,255,255,1)';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';

    // Smart Text Wrapping (Conclusion on complete sentence)
    wrapTextBySentence(ctx, fullDesc, padding + 40, analysisY, maxWidth - 80, 66, 11);

    // --- 5. IDENTITY HASHTAGS ---
    const hashtagY = 1660;
    ctx.textAlign = 'center';
    ctx.font = '700 52px "Pretendard", sans-serif';
    ctx.fillStyle = '#fbbf24'; // amber-400

    // Fix: Improved Hashtag Extraction (Ensure complete phrases/keywords)
    const traits = kData.pros || result.pros || ["심층분석", "유니크바이브"];
    // Extract keywords (usually the last or longest word in a trait phrase works best for KR)
    const hashtags = traits.slice(0, 3).map(t => {
        const parts = t.replace(/[.,]/g, '').split(/\s+/);
        return "#" + (parts.length > 1 ? parts[parts.length - 1] : parts[0]);
    });

    const hashtagStr = hashtags.join('     ');
    ctx.fillText(hashtagStr, centerX, hashtagY);

    // --- 6. MINI RESULT PLAYER FOOTER (Refinement) ---
    const footerY = 1730; // Slightly higher
    const footerW = 880;  // Slightly wider for better balance
    const footerH = 130;
    const footerX = centerX - (footerW / 2);

    // 1. Player Glass Panel
    drawGlassPanel(ctx, footerX, footerY, footerW, footerH, 30);

    // 2. Playback Icon (Mini clone)
    const iconSize = 90; // Slightly larger for better icon visibility
    const iconMargin = 20;
    const iconX = footerX + iconMargin;
    const footerIconY = footerY + (footerH - iconSize) / 2;

    // Draw Gradient Icon Base
    ctx.save();
    const iconGrad = ctx.createLinearGradient(iconX, footerIconY, iconX + iconSize, footerIconY + iconSize);
    iconGrad.addColorStop(0, colors.glow.replace('0.6', '1').replace('0.7', '1'));
    iconGrad.addColorStop(1, colors.accent.replace('0.4', '1').replace('0.5', '1'));

    ctx.beginPath();
    roundRect(ctx, iconX, footerIconY, iconSize, iconSize, 20);
    ctx.fillStyle = iconGrad;
    ctx.fill();

    // Draw Small Play Triangle on Icon
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    const triSize = 28;
    const triX = iconX + iconSize / 2 - 5;
    const triY = footerIconY + iconSize / 2;
    ctx.moveTo(triX, triY - triSize / 2);
    ctx.lineTo(triX + triSize, triY);
    ctx.lineTo(triX, triY + triSize / 2);
    ctx.closePath();
    ctx.fill();
    ctx.restore();

    // 3. Playback Text (Song Info)
    const textX = iconX + iconSize + 35;
    const statusT = (TRANSLATIONS[currentLang] && TRANSLATIONS[currentLang].ui.audio_preview) || "NOW PLAYING";

    // Status Text
    ctx.textAlign = 'left';
    ctx.font = '700 24px "Pretendard", sans-serif';
    ctx.fillStyle = 'rgba(255,255,255,0.4)';
    ctx.textBaseline = 'middle';
    ctx.fillText(statusT.toUpperCase(), textX, footerY + 45);

    // Song Title (Truncate if too long)
    const maxSongW = footerX + footerW - textX - 100;
    let songTitle = result.bestSong || "Vibe Masterpiece";
    ctx.font = '800 38px "Pretendard", sans-serif';
    ctx.fillStyle = '#ffffff';

    if (ctx.measureText(songTitle).width > maxSongW) {
        while (ctx.measureText(songTitle + "...").width > maxSongW && songTitle.length > 0) {
            songTitle = songTitle.slice(0, -1);
        }
        songTitle += "...";
    }
    ctx.fillText(songTitle, textX, footerY + 90);

    // 4. Mini Control Circle (Right side)
    const controlRadius = 28;
    const controlX = footerX + footerW - 65;
    const controlY = footerY + footerH / 2;

    ctx.beginPath();
    ctx.arc(controlX, controlY, controlRadius, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(255,255,255,0.2)';
    ctx.lineWidth = 3;
    ctx.stroke();

    // Small play icon in circle
    ctx.fillStyle = 'rgba(255,255,255,0.4)';
    ctx.beginPath();
    const sTriSize = 14;
    ctx.moveTo(controlX - 4, controlY - sTriSize / 2);
    ctx.lineTo(controlX + 10, controlY);
    ctx.lineTo(controlX - 4, controlY + sTriSize / 2);
    ctx.fill();

    return canvas;
}

/**
 * Helper: RoundRect
 */
function roundRect(ctx, x, y, width, height, radius) {
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + width - radius, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
    ctx.lineTo(x + width, y + height - radius);
    ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
    ctx.lineTo(x + radius, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
    ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y);
    ctx.closePath();
}

/**
 * 3. Helper Functions
 */
function wrapTextBySentence(ctx, text, x, y, maxWidth, lineHeight, maxLines) {
    const sentences = text.match(/[^.!?]+[.!?]+/g) || [text];
    let currentY = y;
    let lineCount = 0;
    const paragraphGap = 20; // Extra gap between sentences (paragraphs)

    for (let i = 0; i < sentences.length; i++) {
        const sentence = sentences[i].trim() + " ";
        const words = sentence.split(/\s+/);
        let tempLineCount = 0;
        let line = "";

        // Trial wrap to see if sentence fits
        for (let word of words) {
            let testLine = line + word + " ";
            if (ctx.measureText(testLine).width > maxWidth) {
                tempLineCount++;
                line = word + " ";
            } else {
                line = testLine;
            }
        }
        if (line) tempLineCount++;

        // If adding this sentence exceeds maxLines, we stop here
        if (lineCount + tempLineCount > maxLines) break;

        // Actually draw the sentence
        line = "";
        for (let word of words) {
            let testLine = line + word + " ";
            if (ctx.measureText(testLine).width > maxWidth) {
                ctx.fillText(line, x, currentY);
                line = word + " ";
                currentY += lineHeight;
                lineCount++;
            } else {
                line = testLine;
            }
        }
        if (line) {
            ctx.fillText(line, x, currentY);
            currentY += lineHeight + paragraphGap; // Add paragraph gap after each sentence
            lineCount++;
        }
    }
}

function wrapText(ctx, text, x, y, maxWidth, lineHeight, maxLines) {
    const words = text.split(/\s+/);
    let line = '';
    let lineCount = 0;

    for (let n = 0; n < words.length; n++) {
        let testLine = line + words[n] + ' ';
        let metrics = ctx.measureText(testLine);
        let testWidth = metrics.width;

        if (testWidth > maxWidth && n > 0) {
            ctx.fillText(line, x, y);
            line = words[n] + ' ';
            y += lineHeight;
            lineCount++;
            if (lineCount >= maxLines) return;
        } else {
            line = testLine;
        }
    }
    if (lineCount < maxLines) {
        ctx.fillText(line, x, y);
    }
}

function drawGlassPanel(ctx, x, y, width, height, radius) {
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + width - radius, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
    ctx.lineTo(x + width, y + height - radius);
    ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
    ctx.lineTo(x + radius, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
    ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y);
    ctx.closePath();

    ctx.fillStyle = "rgba(255, 255, 255, 0.05)";
    ctx.shadowColor = "rgba(0,0,0,0.2)";
    ctx.shadowBlur = 40;
    ctx.fill();

    ctx.strokeStyle = "rgba(255, 255, 255, 0.15)";
    ctx.lineWidth = 2;
    ctx.stroke();

    const shine = ctx.createLinearGradient(x, y, x + width, y + height);
    shine.addColorStop(0, "rgba(255,255,255,0.05)");
    shine.addColorStop(0.5, "rgba(255,255,255,0)");
    shine.addColorStop(1, "rgba(255,255,255,0.02)");
    ctx.fillStyle = shine;
    ctx.fill();

    ctx.restore();
}

/**
 * 4. Override: Main saveImage Function
 */
window.saveImage = async function () {
    const btn = document.getElementById('save-image-btn');
    const originalText = btn.innerHTML;
    const T = TRANSLATIONS[currentLang].ui;

    try {
        btn.innerHTML = `<span class="animate-pulse">✨ ${T.loading || "Designing"}...</span>`;
        btn.disabled = true;

        if (!finalResult) throw new Error("Result data missing");

        await new Promise(r => setTimeout(r, 50));

        const canvas = await Promise.race([
            drawEtherealVinylCanvasSafe(finalResult),
            new Promise((_, reject) => setTimeout(() => reject(new Error("Generation Timeout (15s)")), 15000))
        ]);

        const dataUrl = canvas.toDataURL('image/png');

        if (typeof showPreviewModal === 'function') {
            showPreviewModal(dataUrl);
        } else {
            const link = document.createElement('a');
            link.download = `music_vibe_${finalResult.id}.png`;
            link.href = dataUrl;
            link.click();
        }

    } catch (err) {
        console.error("Design generation failed:", err);
        alert((T.share_error || "Image save failed.") + "\n[Debug: " + (err.message || "Unknown Error") + "]");
    } finally {
        btn.innerHTML = originalText;
        btn.disabled = false;
    }
};

