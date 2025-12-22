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

function detectLanguage() {
    const navLang = navigator.language || navigator.userLanguage;
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
    currentLang = detectLanguage();
    console.log("App Language Set to:", currentLang);
    renderScreen('intro');
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
    currentState = state;
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
    if (window.lucide) {
        lucide.createIcons();
    }
}

// [Intro] 화면
function renderIntro() {
    const T = TRANSLATIONS[currentLang].ui;

    appContainer.innerHTML = `
        <div class="flex flex-col items-center justify-start min-h-full px-6 text-center relative bg-[#09090b] pb-20">
            <!-- K/DA Style Background: Deep Violet + Gold/Neon Accents -->
            <div class="absolute inset-0 bg-[radial-gradient(circle_at_50%_30%,_rgba(76,29,149,0.4)_0%,_rgba(0,0,0,1)_70%)] animate-pulse-slow"></div>
            
            <!-- Neon Orbs -->
            <div class="absolute top-[-10%] right-[-10%] w-[50%] h-[50%] bg-[radial-gradient(circle,_rgba(139,92,246,0.3)_0%,_transparent_70%)] blur-[80px] animate-float"></div>
            <div class="absolute bottom-[-10%] left-[-10%] w-[50%] h-[50%] bg-[radial-gradient(circle,_rgba(234,179,8,0.2)_0%,_transparent_70%)] blur-[80px] animate-float" style="animation-delay: -2s;"></div>

            <!-- Holographic HUD Rings -->
            <div class="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div class="w-[80vw] h-[80vw] md:w-[600px] md:h-[600px] border border-white/5 rounded-full animate-spin-slower"></div>
                <div class="w-[70vw] h-[70vw] md:w-[500px] md:h-[500px] border border-purple-500/20 rounded-full animate-reverse-spin"></div>
            </div>

            <!-- Content Container -->
            <div class="relative z-10 flex flex-col items-center w-full max-w-md animate-fade-in-up">
                
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
                    <h1 class="text-4xl md:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-b from-white via-white to-gray-400 mb-2 tracking-tighter drop-shadow-[0_0_30px_rgba(255,255,255,0.2)] font-display italic leading-tight" style="text-shadow: 0 0 20px rgba(139,92,246,0.5);">
                        ${T.title_sub}
                    </h1>
                    <h1 class="text-5xl md:text-7xl font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-fuchsia-400 to-amber-300 mb-8 tracking-tighter animate-gradient-x font-display italic leading-tight" style="filter: drop-shadow(0 0 10px rgba(168,85,247,0.4));">
                        ${T.title_main}
                    </h1>
                </div>
                
                <!-- Description -->
                <p class="text-gray-400 text-sm md:text-base mb-12 font-medium tracking-wide leading-relaxed break-keep">
                    ${T.desc_html}
                </p>

                <!-- Start Button -->
                <button onclick="renderScreen('test')" class="group relative w-full h-16 bg-gray-900 rounded-xl transition-all duration-300 hover:scale-[1.02] hover:shadow-[0_0_30px_rgba(168,85,247,0.5)] overflow-hidden mb-4 border border-purple-500/30">
                    <div class="absolute inset-0 bg-gradient-to-r from-purple-600/20 to-amber-600/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                    <div class="absolute bottom-0 left-0 h-[2px] w-full bg-gradient-to-r from-purple-500 via-amber-400 to-purple-500"></div>
                    <span class="relative flex items-center justify-center gap-3 text-white font-bold text-lg tracking-widest w-full h-full">
                        <i data-lucide="play" class="w-5 h-5 fill-amber-400 text-amber-400"></i>
                        ${T.btn_start}
                    </span>
                </button>
                
                <!-- All Types Button -->
                 <button onclick="renderScreen('allTypes')" class="group w-full h-14 bg-white/5 hover:bg-white/10 rounded-xl transition-all duration-300 border border-white/10 hover:border-white/30 flex items-center justify-center gap-2 backdrop-blur-md">
                    <i data-lucide="layout-grid" class="w-4 h-4 text-gray-400 group-hover:text-white transition-colors"></i>
                    <span class="text-gray-400 text-xs font-bold tracking-widest group-hover:text-white transition-colors uppercase">${T.btn_all_types}</span>
                </button>
            </div>
            
            <!-- AdSense Content Injection: About Section (Static for now, can be localized later) -->
            <div class="relative z-10 w-full max-w-md mt-12 mb-8 animate-fade-in-up" style="animation-delay: 0.2s;">
                <div class="glass-panel rounded-2xl p-6 text-left border border-white/5 bg-black/40 backdrop-blur-xl">
                    <h3 class="flex items-center gap-2 text-sm font-bold text-gray-200 mb-4 pb-2 border-b border-white/10">
                        <i data-lucide="info" class="w-4 h-4 text-amber-400"></i>
                        <span class="text-transparent bg-clip-text bg-gradient-to-r from-purple-200 to-amber-200">About This Test</span>
                    </h3>
                    
                    <div class="space-y-6 text-gray-400 text-xs md:text-sm leading-relaxed font-normal break-keep">
                        <div>
                            <h4 class="text-amber-400/90 font-bold mb-1 text-[13px]">1. 음악 성향 테스트의 과학적 원리</h4>
                            <p class="opacity-80">음악적 취향은 단순한 우연이 아닙니다. 심리학계의 '공감화-체계화 이론'에 따르면, 사람의 성격은 음악 선호도와 밀접한 연관이 있습니다. 공감 능력이 뛰어난 사람들은 감성적인 음악을, 체계적인 사고를 하는 사람들은 구조적인 음악을 선호하는 경향이 있습니다.</p>
                        </div>

                        <div>
                            <h4 class="text-amber-400/90 font-bold mb-1 text-[13px]">2. 성격 스펙트럼과 주파수</h4>
                            <p class="opacity-80 mb-2">우리의 성격 DNA는 특정 주파수에 반응합니다.</p>
                            <ul class="list-disc pl-4 space-y-1 opacity-80">
                                <li><strong>에너지의 방향 (Energy)</strong>: 외향적 성향은 강한 비트와 리듬에서, 내향적 성향은 섬세한 멜로디에서 편안함을 느낍니다.</li>
                                <li><strong>인식의 방식 (Perception)</strong>: 감각적 성향은 트렌디한 사운드를, 직관적 성향은 실험적이고 몽환적인 분위기를 선호합니다.</li>
                                <li><strong>판단의 기준 (Judgment)</strong>: 이성적 성향은 구조적으로 완벽한 곡을, 감성적 성향은 호소력 짙은 가사에 끌립니다.</li>
                            </ul>
                        </div>

                        <div>
                            <h4 class="text-amber-400/90 font-bold mb-1 text-[13px]">3. 왜 이 테스트가 정확할까요?</h4>
                            <p class="opacity-80">단순히 선호 장르를 묻지 않습니다. 소리의 질감, 리듬의 속도(BPM), 가사의 분위기 등 무의식적인 반응을 분석하여 당신의 '영혼의 플레이리스트'를 찾아냅니다.</p>
                        </div>
                    </div>
                </div>
            </div>
            
        </div>
    `;
    // Safe Lucide Init
    if (window.lucide && typeof window.lucide.createIcons === 'function') {
        lucide.createIcons();
    }
}

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
                <div class="bg-gradient-to-r from-purple-600 to-amber-400 h-full transition-all duration-500 ease-out shadow-[0_0_10px_rgba(245,158,11,0.5)]" style="width: ${progress}%"></div>
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
    }, 300);
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

        renderScreen('result');
    }, 2500);
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
    const bestType = finalResult.match ? finalResult.match.best : null;
    const worstType = finalResult.match ? finalResult.match.worst : null;
    const bestData = bestType ? RESULTS_DATA[bestType] : null;
    const worstData = worstType ? RESULTS_DATA[worstType] : null;

    // **[스크롤 최종 해결]** h-full, overflow-y-auto, flex-col, flex-grow, min-h-0 클래스를 모두 적용하여 스크롤 영역을 명확히 지정합니다.
    appContainer.innerHTML = `
        <div class="h-full overflow-y-auto hide-scrollbar flex flex-col flex-grow min-h-0 relative"> 
            
            <!-- K/DA Result Background Overlay (To match Intro intensity) -->
            <div class="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,_rgba(76,29,149,0.3)_0%,_transparent_70%)] pointer-events-none z-0"></div>
            <div class="absolute top-[-20%] right-[-20%] w-[60%] h-[60%] bg-purple-900/40 rounded-full blur-[100px] pointer-events-none z-0"></div>
            <div class="absolute bottom-[-10%] left-[-10%] w-[50%] h-[50%] bg-amber-600/20 rounded-full blur-[100px] pointer-events-none z-0"></div>

            <div class="px-6 py-8 flex flex-col items-center text-center animate-slide-up pb-20 relative z-10">
                
                <!-- Main Result Card: Glassmorphism Update -->
                <div id="result-card" class="w-full max-w-sm bg-black/30 backdrop-blur-2xl border border-white/10 p-6 rounded-[2rem] shadow-2xl relative overflow-hidden mb-6 group select-none transition-all">
                    <div id="card-bg" class="absolute inset-0 bg-gradient-to-br ${finalResult.color} opacity-20 transition-opacity duration-1000"></div>
                    
                    <div class="flex justify-between items-center text-gray-400 text-[10px] font-mono mb-6 opacity-70 relative z-10">
                        <span>VIBE: ${finalResult.genre}</span>
                        <div class="flex gap-1 items-center">
                            <span>VIBE MATCH</span>
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
                                <img src="${finalResult.image}" alt="${finalResult.genre}" class="w-full h-full object-cover opacity-90">
                                
                                <!-- Vintage Overlay on Label -->
                                <div class="absolute inset-0 bg-yellow-500/10 mix-blend-overlay"></div>
                            </div>

                            <!-- Center Spindle Hole -->
                            <div class="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-3 h-3 bg-[#09090b] rounded-full z-30 shadow-inner border border-gray-700"></div>
                        </div>

                        <!-- Equalizer Visualizer (Decorative, Static for now but adds vibe) -->
                        <div class="absolute -bottom-6 left-1/2 -translate-x-1/2 flex gap-1 opacity-50">
                            <div class="w-1 h-3 bg-white/20 rounded-full animate-bounce" style="animation-delay: 0s"></div>
                            <div class="w-1 h-5 bg-white/20 rounded-full animate-bounce" style="animation-delay: 0.1s"></div>
                            <div class="w-1 h-2 bg-white/20 rounded-full animate-bounce" style="animation-delay: 0.2s"></div>
                        </div>
                    </div>
                    <div class="relative z-10 text-left px-2">
                        <div class="inline-block px-3 py-1 bg-white/5 rounded-full mb-3 border border-white/10 backdrop-blur-md">
                            <span class="text-[11px] font-bold text-gray-300 tracking-widest drop-shadow-sm">${T.result_title}</span>
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

                        <div class="grid grid-cols-1 gap-4">
                            <!-- Strengths: Adaptive Color (Matches Result) -->
                            <div class="bg-white/5 border border-white/10 rounded-2xl p-5 backdrop-blur-md relative overflow-hidden group transition-colors hover:border-white/30">
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

                            <!-- Weaknesses: Consistent Rose/Red -->
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
                        
                        <!-- Match & Mismatch (Viral) -->
                        ${bestType && worstType ? `
                        <!-- Match & Mismatch (Mini LP Ver.) -->
                        <div class="grid grid-cols-2 gap-4 mt-8 mb-2 w-full">
                            <!-- Best Match -->
                            <div onclick="openMatchModal('${finalResult.mbti}', '${finalResult.match.best}', true)" class="group cursor-pointer bg-white/5 border border-white/10 rounded-2xl p-4 flex flex-col items-center justify-center transition-all hover:bg-white/10 hover:border-pink-400/50 active:scale-95 relative overflow-hidden">
                                <div class="absolute inset-0 bg-gradient-to-br from-pink-500/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                                <div class="text-[11px] font-black text-pink-400 mb-3 uppercase tracking-widest relative z-10 drop-shadow-sm">${T.match_label_best}</div>
                                
                                <div class="w-20 h-20 rounded-full bg-black flex items-center justify-center mb-3 shadow-xl relative z-10 group-hover:rotate-[360deg] transition-transform duration-[3s] ease-linear">
                                    <div class="absolute inset-0 rounded-full border-[3px] border-white/10"></div>
                                    <div class="w-[90%] h-[90%] rounded-full overflow-hidden relative">
                                        <img src="${bestData ? bestData.image : ''}" class="w-full h-full object-cover opacity-80">
                                        <div class="absolute inset-0 bg-yellow-500/10 mix-blend-overlay"></div>
                                    </div>
                                    <div class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-2 h-2 bg-black rounded-full border border-gray-700"></div>
                                </div>
                                
                                <div class="text-sm font-black text-white relative z-10">${bestData ? bestData.genre : ''}</div>
                                <div class="text-[0.6rem] text-pink-200/60 mt-1 relative z-10">${T.match_click}</div>
                            </div>

                            <!-- Worst Match -->
                            <div onclick="openMatchModal('${finalResult.mbti}', '${finalResult.match.worst}', false)" class="group cursor-pointer bg-white/5 border border-white/10 rounded-2xl p-4 flex flex-col items-center justify-center transition-all hover:bg-white/10 hover:border-blue-400/50 active:scale-95 relative overflow-hidden">
                                <div class="absolute inset-0 bg-gradient-to-br from-blue-500/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                                <div class="text-[11px] font-black text-blue-400 mb-3 uppercase tracking-widest relative z-10 drop-shadow-sm">${T.match_label_worst}</div>
                                
                                <div class="w-20 h-20 rounded-full bg-black flex items-center justify-center mb-3 shadow-xl relative z-10 group-hover:rotate-[360deg] transition-transform duration-[3s] ease-linear">
                                    <div class="absolute inset-0 rounded-full border-[3px] border-white/10"></div>
                                    <div class="w-[90%] h-[90%] rounded-full overflow-hidden relative">
                                        <img src="${worstData ? worstData.image : ''}" class="w-full h-full object-cover opacity-80 backdrop-grayscale">
                                    </div>
                                    <div class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-2 h-2 bg-black rounded-full border border-gray-700"></div>
                                </div>
                                
                                <div class="text-sm font-black text-gray-400 group-hover:text-white transition-colors relative z-10">${worstData ? worstData.genre : ''}</div>
                                <div class="text-[0.6rem] text-blue-200/60 mt-1 relative z-10">${T.match_click}</div>
                            </div>
                        </div>
                        ` : ''}

                    </div>
                </div>

                <div class="flex flex-col gap-3 w-full max-w-sm">
                    <button onclick="saveImage()" class="group w-full py-4 bg-gradient-to-r ${finalResult.color} rounded-xl text-white font-bold hover:brightness-110 transition-all shadow-lg flex items-center justify-center gap-2 relative overflow-hidden">
                        <div class="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
                        <i data-lucide="download" class="w-4 h-4 relative z-10"></i> <span class="relative z-10">${T.btn_save_img}</span>
                    </button>
                    
                    <div class="flex gap-3">
                        <button onclick="goToIntro()" class="flex-1 py-3 bg-black/40 backdrop-blur-md border border-white/10 rounded-xl text-gray-300 font-medium hover:bg-white/10 hover:border-amber-500/50 hover:text-white transition-all flex items-center justify-center gap-2 text-xs md:text-sm group shadow-lg">
                            <i data-lucide="home" class="w-4 h-4 group-hover:scale-110 transition-transform"></i> ${T.btn_main}
                        </button>
                        <button onclick="resetTest()" class="flex-1 py-3 bg-black/40 backdrop-blur-md border border-white/10 rounded-xl text-gray-300 font-medium hover:bg-white/10 hover:border-amber-500/50 hover:text-white transition-all flex items-center justify-center gap-2 text-xs md:text-sm group shadow-lg">
                            <i data-lucide="refresh-cw" class="w-4 h-4 group-hover:rotate-180 transition-transform duration-500"></i> ${T.btn_retry}
                        </button>
                    </div>
                    <div class="grid grid-cols-2 gap-3 mt-1">
                        <button onclick="renderScreen('allTypes')" class="py-3 bg-black/40 backdrop-blur-md border border-white/10 rounded-xl text-gray-300 font-medium hover:bg-white/10 hover:border-amber-500/50 hover:text-white transition-all flex items-center justify-center gap-2 text-xs md:text-sm group shadow-lg">
                            <i data-lucide="list-music" class="w-4 h-4 group-hover:scale-110 transition-transform"></i> ${T.btn_all_types}
                        </button>
                        <button onclick="shareResult()" class="py-3 bg-black/40 backdrop-blur-md border border-white/10 rounded-xl text-gray-300 font-medium hover:bg-white/10 hover:border-amber-500/50 hover:text-white transition-all flex items-center justify-center gap-2 text-xs md:text-sm group shadow-lg">
                            <i data-lucide="share-2" class="w-4 h-4 group-hover:scale-110 transition-transform"></i> ${T.btn_share}
                        </button>
                    </div>

                    <!-- 면책 조항 (Disclaimer) -->
                    <div class="mt-8 text-center px-4">
                        <p class="text-[10px] text-gray-600 leading-tight">
                            ${T.disclaimer}
                        </p>
                    </div>
                </div>
            </div>
        </div>
            </div>
            
            <!-- Match Detail Modal -->
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
                            <p id="modal-desc" class="text-gray-300 text-[0.95rem] leading-7 break-keep font-light text-left">
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

    // 결과 화면 진입 시 자동 재생
    setTimeout(() => {
        toggleAudio();
    }, 100);
}

// 오디오 토글 로직 & UI 업데이트
function toggleAudio() {
    isPlaying = !isPlaying;
    console.log("[Audio Debug] Toggle Audio: ", isPlaying ? "PLAYING" : "PAUSED");

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
    const typesHTML = Object.entries(RESULTS_DATA).map(([key, data]) => `
        <div onclick="selectTypeAndShowResult('${key}')" class="group relative flex flex-col items-center text-center p-4 rounded-[1.5rem] bg-white/5 border border-white/10 backdrop-blur-md cursor-pointer transition-all duration-300 hover:bg-black/40 hover:-translate-y-1.5 shadow-lg hover:shadow-2xl overflow-hidden">
            
            <!-- Adaptive Glow (Always visible but subtle, stronger on hover) -->
            <div class="absolute inset-0 bg-gradient-to-br ${data.color} opacity-10 group-hover:opacity-20 transition-opacity duration-500"></div>
            
            <!-- Adaptive Border (Gradient Border via Mask or pseudo-element trick is hard, using simple box-shadow or ring) -->
            <div class="absolute inset-0 rounded-[1.5rem] ring-1 ring-white/10 group-hover:ring-2 group-hover:ring-white/30 transition-all"></div>

            <!-- Mini LP Design -->
            <div class="relative w-24 h-24 mb-4 rounded-full shadow-xl group-hover:scale-105 group-hover:rotate-3 transition-transform duration-500 ease-out">
                 <!-- Vinyl Ring (Adaptive Color) -->
                 <div class="absolute -inset-1 rounded-full bg-gradient-to-br ${data.color} opacity-40 blur-md group-hover:opacity-70 transition-opacity"></div>
                 <div class="absolute -inset-[2px] rounded-full bg-gradient-to-br ${data.color} opacity-80"></div>
                 
                 <!-- Album Art -->
                 <img src="${data.image}" alt="${data.genre}" class="absolute inset-0 w-full h-full object-cover rounded-full border-2 border-[#1a1a1a] relative z-10">
                 
                 <!-- Vinyl Hole -->
                 <div class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-4 h-4 bg-[#1a1a1a] rounded-full z-20 border border-gray-700 shadow-inner"></div>
            </div>

            <!-- Text Content -->
            <div class="relative z-10 w-full">
                <span class="inline-block px-2 py-0.5 rounded text-[10px] font-black tracking-widest uppercase bg-black/50 border border-white/10 text-gray-400 mb-2 group-hover:text-white group-hover:border-white/30 transition-colors shadow-sm">${key}</span>
                <h3 class="text-sm font-bold text-gray-100 mb-1 leading-tight group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r ${data.color} transition-all truncate">${data.genre}</h3>
                <p class="text-[10px] text-gray-500 line-clamp-1 group-hover:text-gray-300 transition-colors">${data.subTitle}</p>
            </div>
            
            <!-- Play Icon Overlay on Hover -->
            <div class="absolute top-4 right-4 text-white/0 group-hover:text-white/80 transition-all duration-300 transform translate-x-2 group-hover:translate-x-0">
                <i data-lucide="play-circle" class="w-5 h-5"></i>
            </div>
        </div>
    `).join('');

    appContainer.innerHTML = `
        <div class="h-full overflow-y-auto hide-scrollbar relative z-20 animate-fade-in flex flex-col bg-[#09090b]">
             
             <!-- Glass Header -->
             <div class="sticky top-0 z-30 bg-[#09090b]/80 backdrop-blur-xl border-b border-white/5 px-6 py-4 flex items-center justify-between shadow-lg">
                <div class="flex items-center gap-3">
                    <button onclick="goToIntro()" class="p-2 -ml-2 rounded-full hover:bg-white/10 transition-colors text-gray-400 hover:text-white">
                        <i data-lucide="arrow-left" class="w-5 h-5"></i>
                    </button>
                    <span class="text-lg font-black italic text-white tracking-tighter">${TRANSLATIONS[currentLang].ui.vibe_collection}</span>
                </div>
                <div class="flex items-center gap-1.5 px-2 py-1 bg-white/5 rounded-lg border border-white/10">
                    <i data-lucide="disc" class="w-3 h-3 text-amber-500"></i>
                    <span class="text-gray-400 text-[10px] font-mono font-bold">${Object.keys(RESULTS_DATA).length} LP</span>
                </div>
             </div>

             <!-- Grid Layout -->
             <div class="p-5 grid grid-cols-2 gap-x-4 gap-y-6 pb-24">
                 ${typesHTML}
             </div>
        </div>
    `;
    lucide.createIcons();
}

// 결과 공유하기
function shareResult() {
    // calculateMBTI() function is missing in the original logic.js I viewed, but I see it commonly in such apps. 
    // However, finalResult.mbti is already set in calculateResult().
    // So I will use finalResult directly.

    if (!finalResult) {
        console.error("No result to share");
        return;
    }

    const shareData = {
        title: 'MY MUSIC VIBE TEST',
        text: `Based on my personality, my music vibe is: ${finalResult.genre} (${finalResult.subTitle})\nCheck out your music persona!`, // Localize this later?
        url: window.location.href
    };

    if (navigator.share) {
        navigator.share(shareData)
            .then(() => console.log('Shared successfully'))
            .catch((error) => console.log('Error sharing', error));
    } else {
        const textToCopy = `${shareData.title}\n${shareData.text}\nTest here: ${shareData.url}`;
        navigator.clipboard.writeText(textToCopy).then(() => {
            alert(TRANSLATIONS[currentLang].ui.copy_success);
        }).catch(err => {
            alert('Sharing not supported on this browser.');
        });
    }
}

async function saveImage() {
    const input = document.getElementById('result-card'); // Targeted capture
    if (!input) {
        console.error("Result card not found");
        return;
    }

    // Temporary Visual Adjustments for Screenshot
    const originalStyle = input.style.cssText;
    // input.style.width = "1080px"; // Optional: Force standard width
    // input.style.height = "1920px"; // Optional

    try {
        const canvas = await html2canvas(input, {
            scale: 2,
            useCORS: true,
            allowTaint: true,
            backgroundColor: '#09090b', // Force background color
            logging: false
        });

        const image = canvas.toDataURL("image/png");
        const link = document.createElement('a');
        link.href = image;
        link.download = `music_vibe_${finalResult.mbti}.png`;
        link.click();
    } catch (err) {
        console.error("Image save failed:", err);
        alert(TRANSLATIONS[currentLang].ui.share_error || "Save failed.");
    }
}

// 앱 시작
// init(); // Removed redundant call


// --- Viral Feature: Match Modal Logic ---
window.openMatchModal = function (myTypeKey, targetType, isBest) {
    const T = TRANSLATIONS[currentLang].ui;
    const myType = myTypeKey;
    const myData = RESULTS_DATA[myType];
    const targetData = RESULTS_DATA[targetType];

    const modal = document.getElementById('match-modal');
    const header = document.getElementById('modal-header');
    const title = document.getElementById('modal-match-title');
    const desc = document.getElementById('modal-desc');
    const matchImg = document.getElementById('modal-match-img');
    const connIcon = document.getElementById('modal-conn-icon');
    const glow = document.getElementById('modal-glow');

    // UI Reset/Set
    matchImg.src = targetData.image;
    title.innerText = targetData.genre;

    if (isBest) {
        header.innerHTML = `<span class="text-[10px] text-gray-400 font-bold tracking-widest block mb-1">${T.match_header_sub_best}</span><span class="text-2xl font-black text-white">${T.match_modal_best}</span>`;
        connIcon.textContent = "💖";
        desc.innerText = myData.match.bestDesc || "데이터 준비 중입니다...";
        glow.className = "absolute top-[-20%] right-[-20%] w-[150px] h-[150px] rounded-full blur-[60px] pointer-events-none bg-pink-500/20 animate-pulse";
    } else {
        header.innerHTML = `<span class="text-[10px] text-gray-400 font-bold tracking-widest block mb-1">${T.match_header_sub_worst}</span><span class="text-2xl font-black text-gray-300">${T.match_modal_worst}</span>`;
        connIcon.textContent = "💔";
        desc.innerText = myData.match.worstDesc || "데이터 준비 중입니다...";
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

// Initialize App
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}
