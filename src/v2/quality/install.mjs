import { PROFILE_QUESTIONS } from '../data/questions.mjs?v=qg1';
import { localize, getProfileArchetype } from '../domain/profile.mjs?v=qg1';
import { recommendProfileTracks } from '../domain/recommendation.mjs?v=qg1';
import { compareProfiles } from '../domain/match.mjs?v=qg1';
import { escapeHtml, track, trackCard } from '../ui/helpers.mjs?v=qg1';
import { confidenceLabel, renderBipolarAxes, renderVibeGlyph } from './visuals.mjs?v=qg1';

const AUDIO_PREVIEW_LIMIT_SECONDS = 20;
const HEARD_SECONDS = 3;

function questionKey(question, option) {
  return `${question.id}:${option.id}`;
}

function formatTime(value) {
  const seconds = Math.max(0, Math.floor(Number(value) || 0));
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`;
}

function updateAudioDom(app, optionId) {
  const progress = app.audioProgress.get(optionId) || { current: 0, duration: AUDIO_PREVIEW_LIMIT_SECONDS };
  const duration = Math.min(progress.duration || AUDIO_PREVIEW_LIMIT_SECONDS, AUDIO_PREVIEW_LIMIT_SECONDS);
  const current = Math.min(progress.current || 0, duration);
  const ratio = duration ? current / duration : 0;
  const fill = app.root.querySelector(`[data-audio-fill="${CSS.escape(optionId)}"]`);
  const time = app.root.querySelector(`[data-audio-time="${CSS.escape(optionId)}"]`);
  if (fill) fill.style.width = `${Math.round(ratio * 100)}%`;
  if (time) time.textContent = `${formatTime(current)} / ${formatTime(duration)}`;
}

function renderQualityDiscover(app) {
  const copy = app.copy();
  const question = PROFILE_QUESTIONS[app.quizIndex];
  if (!question) {
    app.finishProfile();
    return;
  }
  const progress = ((app.quizIndex + 1) / PROFILE_QUESTIONS.length) * 100;
  const isAudio = question.kind === 'audio';
  const selected = app.answers.find((answer) => answer.questionId === question.id)?.optionId || '';
  const keyboardHelp = app.language === 'kr'
    ? 'A/B 선택 · 1/2 미리듣기 · ← 이전 질문'
    : 'A/B choose · 1/2 preview · ← previous question';

  app.root.innerHTML = `
    <div id="app-notice" class="app-notice"></div>
    <section class="quiz-shell quality-quiz" aria-labelledby="quality-question-title">
      <div class="quiz-topline">
        <div class="quiz-topline__left">
          <button type="button" class="text-button" data-action="quit-quiz">${escapeHtml(copy.quitQuiz)}</button>
          <button type="button" class="text-button" data-action="previous-question" ${app.quizIndex === 0 ? 'disabled' : ''}>← ${app.language === 'kr' ? '이전 질문' : 'Previous'}</button>
        </div>
        <span>${app.quizIndex + 1} / ${PROFILE_QUESTIONS.length}</span>
      </div>
      <div class="progress" role="progressbar" aria-valuemin="1" aria-valuemax="${PROFILE_QUESTIONS.length}" aria-valuenow="${app.quizIndex + 1}"><i style="width:${progress}%"></i></div>
      <div class="quiz-copy">
        <span class="eyebrow">${escapeHtml(copy.quizEyebrow)}</span>
        <div class="quiz-kind"><span>${isAudio ? '♫' : '◇'}</span>${escapeHtml(isAudio ? copy.quizAudio : copy.quizChoice)}</div>
        <h1 id="quality-question-title">${escapeHtml(localize(question.prompt, app.language))}</h1>
        <p>${escapeHtml(localize(question.helper, app.language))}</p>
        <small class="keyboard-help">${escapeHtml(keyboardHelp)}</small>
      </div>
      <div class="option-grid ${isAudio ? 'option-grid--audio' : ''}">
        ${question.options.map((option, index) => {
          const playing = app.previewOptionId === option.id && app.previewAudio && !app.previewAudio.paused;
          const heard = app.heardOptionIds.has(questionKey(question, option));
          const error = app.audioErrorIds.has(questionKey(question, option));
          const progressState = app.audioProgress.get(option.id) || { current: 0, duration: AUDIO_PREVIEW_LIMIT_SECONDS };
          const duration = Math.min(progressState.duration || AUDIO_PREVIEW_LIMIT_SECONDS, AUDIO_PREVIEW_LIMIT_SECONDS);
          const ratio = duration ? Math.min(progressState.current || 0, duration) / duration : 0;
          return `
            <article class="option-card quality-option ${selected === option.id ? 'is-selected' : ''}" data-option-card="${escapeHtml(option.id)}">
              <div class="option-card__top"><span>${index === 0 ? 'A' : 'B'}</span><div><h2>${escapeHtml(localize(option.label, app.language))}</h2><p>${escapeHtml(localize(option.description, app.language))}</p></div></div>
              ${isAudio ? `
                <div class="audio-preview-state ${error ? 'has-error' : ''}">
                  <button type="button" class="preview-button ${playing ? 'is-playing' : ''}" data-action="preview" data-option-id="${escapeHtml(option.id)}" aria-pressed="${playing}">
                    <span>${playing ? 'Ⅱ' : '▶'}</span>${escapeHtml(playing ? copy.stop : copy.preview)}
                  </button>
                  <div class="audio-progress" aria-hidden="true"><i data-audio-fill="${escapeHtml(option.id)}" style="width:${Math.round(ratio * 100)}%"></i></div>
                  <div class="audio-meta"><span data-audio-time="${escapeHtml(option.id)}">${formatTime(progressState.current)} / ${formatTime(duration)}</span><b>${error ? (app.language === 'kr' ? '재생 실패 · 텍스트로 선택 가능' : 'Preview unavailable · text choice still works') : heard ? (app.language === 'kr' ? '✓ 들어봄' : '✓ Heard') : (app.language === 'kr' ? '비교 후 선택해보세요' : 'Preview and compare')}</b></div>
                </div>
              ` : ''}
              <button type="button" class="button button--option" data-action="choose-option" data-option-id="${escapeHtml(option.id)}" ${app.selectionLocked ? 'disabled' : ''}>${selected === option.id ? (app.language === 'kr' ? '선택했어요' : 'Selected') : escapeHtml(copy.choose)} <span>→</span></button>
            </article>
          `;
        }).join('')}
      </div>
      <div class="selection-live" aria-live="polite">${app.selectionLocked ? (app.language === 'kr' ? '선택을 반영하고 있어요.' : 'Applying your choice.') : ''}</div>
    </section>
  `;
  app.renderNotice();
}

function enhanceProfile(app) {
  const archetype = getProfileArchetype(app.profile);
  const radar = app.root.querySelector('.profile-hero__radar');
  if (radar) {
    radar.className = 'profile-hero__radar quality-glyph-shell';
    radar.innerHTML = renderVibeGlyph(app.profile, app.language, { id: `profile-${app.profile.id}`, size: 300 });
  }
  const profileMeta = app.root.querySelector('.profile-hero__copy > small');
  if (profileMeta) profileMeta.insertAdjacentHTML('beforebegin', `<p class="profile-confidence">${escapeHtml(confidenceLabel(app.profile, app.language))}</p>`);

  const axisList = app.root.querySelector('.panel--axes .axis-list');
  if (axisList) axisList.outerHTML = renderBipolarAxes(app.profile, app.language);

  const actionBand = app.root.querySelector('.action-band');
  if (actionBand) {
    const tracks = recommendProfileTracks(app.profile, { language: app.language, limit: 3 });
    const section = document.createElement('section');
    section.className = 'profile-signature recommendation-list';
    section.innerHTML = `
      <div class="list-heading"><div><span class="eyebrow">SIGNATURE LISTEN</span><h2>${app.language === 'kr' ? '이 프로필을 가장 잘 설명하는 3곡' : 'Three tracks that explain this profile'}</h2></div><span>3 TRACKS</span></div>
      <p class="profile-signature__intro">${app.language === 'kr' ? '결과 이름보다 실제 음악으로 프로필을 확인해보세요.' : 'Validate the profile through music, not only a label.'}</p>
      ${tracks.map((candidate) => trackCard(candidate, app.language, 'profile_signature')).join('')}
    `;
    actionBand.parentNode.insertBefore(section, actionBand);
  }

  track('profile_quality_view', {
    result_type: archetype.id,
    archetype_confidence: app.profile.archetypeConfidence,
    product_version: 'v2-qg1'
  });
}

function enhanceMatch(app) {
  if (!app.profile || !app.friendProfile) return;
  const match = compareProfiles(app.profile, app.friendProfile, app.language);
  const score = app.root.querySelector('.match-score');
  if (score) {
    score.className = 'match-score quality-match-score';
    score.innerHTML = `
      <div><strong>${match.resonance}</strong><span>${app.language === 'kr' ? '공명도' : 'Resonance'}</span></div>
      <i></i>
      <div><strong>${match.discovery}</strong><span>${app.language === 'kr' ? '발견 가능성' : 'Discovery'}</span></div>
      <small>${escapeHtml(match.label)}</small>
    `;
  }
  const hero = app.root.querySelector('.match-hero');
  hero?.insertAdjacentHTML('beforeend', `<p class="match-method-note">${app.language === 'kr' ? '공명도는 현재 비슷한 정도, 발견 가능성은 서로의 취향을 넓힐 여지를 뜻해요.' : 'Resonance measures current similarity; Discovery measures how much the pair can expand each other’s listening.'}</p>`);
  track('match_quality_view', { resonance: match.resonance, discovery: match.discovery, compatibility_score: match.score, product_version: 'v2-qg1' });
}

export function installQualityGates(app) {
  app.heardOptionIds = new Set();
  app.audioProgress = new Map();
  app.audioErrorIds = new Set();
  app.selectionLocked = false;
  app.selectionTimer = null;
  app.boundQualityKeydown = (event) => app.handleQualityKeydown(event);

  const originalStart = app.start.bind(app);
  app.start = function qualityStart() {
    document.addEventListener('keydown', this.boundQualityKeydown);
    return originalStart();
  };

  const originalStartQuiz = app.startQuiz.bind(app);
  app.startQuiz = function qualityStartQuiz(force = false) {
    if (force) {
      this.heardOptionIds.clear();
      this.audioProgress.clear();
      this.audioErrorIds.clear();
    }
    return originalStartQuiz(force);
  };

  const originalHandleClick = app.handleClick.bind(app);
  app.handleClick = function qualityHandleClick(event) {
    const actionTarget = event.target.closest('[data-action]');
    if (actionTarget?.dataset.action === 'previous-question') {
      event.preventDefault();
      this.previousQuestion();
      return;
    }
    return originalHandleClick(event);
  };

  app.renderDiscover = function qualityRenderDiscover() { renderQualityDiscover(this); };

  app.previousQuestion = function previousQuestion() {
    if (this.quizIndex <= 0) return;
    window.clearTimeout(this.selectionTimer);
    this.selectionLocked = false;
    this.stopPreview(false);
    this.quizIndex -= 1;
    track('question_back', { question_number: this.quizIndex + 1, test_mode: 'vibe_profile_10', product_version: 'v2-qg1' });
    this.renderDiscover();
  };

  app.chooseOption = function qualityChooseOption(optionId) {
    if (this.selectionLocked) return;
    const question = PROFILE_QUESTIONS[this.quizIndex];
    const option = question?.options.find((candidate) => candidate.id === optionId);
    if (!option) return;
    this.stopPreview(false);
    const previous = this.answers.find((answer) => answer.questionId === question.id)?.optionId || '';
    this.answers = [...this.answers.filter((answer) => answer.questionId !== question.id), { questionId: question.id, optionId: option.id }];
    track('question_answer', {
      product_version: 'v2-qg1', test_mode: 'vibe_profile_10', question_id: question.id,
      question_number: this.quizIndex + 1, question_kind: question.kind, selected_option: option.id,
      answer_changed: Boolean(previous && previous !== option.id)
    });
    this.selectionLocked = true;
    this.renderDiscover();
    this.selectionTimer = window.setTimeout(() => {
      this.selectionLocked = false;
      if (this.quizIndex >= PROFILE_QUESTIONS.length - 1) this.finishProfile();
      else { this.quizIndex += 1; this.renderDiscover(); }
    }, 220);
  };

  app.togglePreview = function qualityTogglePreview(optionId) {
    const question = PROFILE_QUESTIONS[this.quizIndex];
    const option = question?.options.find((candidate) => candidate.id === optionId);
    if (!option?.audioSrc) return;
    if (this.previewOptionId === optionId && this.previewAudio && !this.previewAudio.paused) {
      this.stopPreview(false);
      this.renderDiscover();
      return;
    }
    this.stopPreview(false);
    const key = questionKey(question, option);
    const audio = new Audio(option.audioSrc);
    this.previewAudio = audio;
    this.previewOptionId = optionId;
    audio.preload = 'metadata';
    audio.volume = 0.68;

    const update = () => {
      const duration = Number.isFinite(audio.duration) ? Math.min(audio.duration, AUDIO_PREVIEW_LIMIT_SECONDS) : AUDIO_PREVIEW_LIMIT_SECONDS;
      const current = Math.min(audio.currentTime || 0, duration);
      this.audioProgress.set(optionId, { current, duration });
      if (current >= HEARD_SECONDS || (duration && current / duration >= 0.35)) this.heardOptionIds.add(key);
      updateAudioDom(this, optionId);
      if (current >= AUDIO_PREVIEW_LIMIT_SECONDS) {
        this.heardOptionIds.add(key);
        this.stopPreview(false);
        this.renderDiscover();
      }
    };
    audio.addEventListener('loadedmetadata', update);
    audio.addEventListener('timeupdate', update);
    audio.addEventListener('ended', () => {
      this.heardOptionIds.add(key);
      this.stopPreview(false);
      this.renderDiscover();
    }, { once: true });
    audio.addEventListener('error', () => {
      this.audioErrorIds.add(key);
      track('audio_error', { question_id: question.id, option_id: option.id, product_version: 'v2-qg1' });
      this.stopPreview(false);
      this.renderDiscover();
    }, { once: true });

    this.renderDiscover();
    audio.play().then(() => {
      track('audio_play', { product_version: 'v2-qg1', audio_context: 'profile_question', question_id: question.id, option_id: option.id });
    }).catch(() => {
      this.audioErrorIds.add(key);
      this.stopPreview(false);
      this.renderDiscover();
    });
  };

  app.stopPreview = function qualityStopPreview(render = false) {
    if (this.previewAudio) {
      this.previewAudio.pause();
      this.previewAudio.removeAttribute('src');
      this.previewAudio.load();
    }
    this.previewAudio = null;
    this.previewOptionId = '';
    if (render && this.route === 'discover') this.renderDiscover();
  };

  app.handleQualityKeydown = function qualityKeydown(event) {
    if (this.route !== 'discover' || event.defaultPrevented || /INPUT|TEXTAREA|SELECT/.test(event.target?.tagName || '')) return;
    const key = event.key.toLowerCase();
    if (key === 'arrowleft') { event.preventDefault(); this.previousQuestion(); return; }
    const question = PROFILE_QUESTIONS[this.quizIndex];
    if (!question) return;
    if (key === 'a' || key === 'b') {
      event.preventDefault();
      this.chooseOption(question.options[key === 'a' ? 0 : 1].id);
    } else if ((key === '1' || key === '2') && question.kind === 'audio') {
      event.preventDefault();
      this.togglePreview(question.options[key === '1' ? 0 : 1].id);
    }
  };

  const originalRenderProfile = app.renderProfile.bind(app);
  app.renderProfile = function qualityProfile() {
    originalRenderProfile();
    if (this.profile) enhanceProfile(this);
  };

  const originalRenderMatch = app.renderMatch.bind(app);
  app.renderMatch = function qualityMatch() {
    originalRenderMatch();
    enhanceMatch(this);
  };
}
