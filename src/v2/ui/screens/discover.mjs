import { PROFILE_QUESTIONS } from '../../data/questions.mjs?commercial=cr1';
import { localize } from '../../domain/profile.mjs?v=qg1';
import { escapeHtml } from '../helpers.mjs?ui=f1';

const AUDIO_PREVIEW_LIMIT_SECONDS = 12;

function questionKey(question, option) {
  return `${question.id}:${option.id}`;
}

function formatTime(value) {
  const seconds = Math.max(0, Math.floor(Number(value) || 0));
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`;
}

export function renderDiscover(app) {
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
    <section class="quiz-shell quality-quiz" aria-labelledby="question-title">
      <div class="quiz-topline">
        <div class="quiz-topline__left">
          <button type="button" class="text-button" data-action="quit-quiz">${escapeHtml(copy.quitQuiz)}</button>
          <button type="button" class="text-button" data-action="previous-question" ${app.quizIndex === 0 ? 'disabled' : ''}>← ${app.language === 'kr' ? '이전 질문' : 'Previous'}</button>
        </div>
        <span>${app.quizIndex + 1} / ${PROFILE_QUESTIONS.length}</span>
      </div>
      <div class="progress" role="progressbar" aria-label="${app.language === 'kr' ? '프로필 진행률' : 'Profile progress'}" aria-valuemin="1" aria-valuemax="${PROFILE_QUESTIONS.length}" aria-valuenow="${app.quizIndex + 1}"><i style="width:${progress}%"></i></div>
      <div class="quiz-copy">
        <span class="eyebrow">${escapeHtml(copy.quizEyebrow)}</span>
        <div class="quiz-kind"><span aria-hidden="true">${isAudio ? '♫' : '◇'}</span>${escapeHtml(isAudio ? copy.quizAudio : copy.quizChoice)}</div>
        <h1 id="question-title">${escapeHtml(localize(question.prompt, app.language))}</h1>
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
                    <span aria-hidden="true">${playing ? 'Ⅱ' : '▶'}</span>${escapeHtml(playing ? copy.stop : copy.preview)}
                  </button>
                  <div class="audio-progress" aria-hidden="true"><i data-audio-fill="${escapeHtml(option.id)}" style="width:${Math.round(ratio * 100)}%"></i></div>
                  <div class="audio-meta"><span data-audio-time="${escapeHtml(option.id)}">${formatTime(progressState.current)} / ${formatTime(duration)}</span><b>${error ? (app.language === 'kr' ? '재생 실패 · 텍스트로 선택 가능' : 'Preview unavailable · text choice still works') : heard ? (app.language === 'kr' ? '✓ 들어봄' : '✓ Heard') : (app.language === 'kr' ? '직접 만든 소리 · 비교 후 선택' : 'Original clip · preview and compare')}</b></div>
                </div>
              ` : ''}
              <button type="button" class="button button--option" data-action="choose-option" data-option-id="${escapeHtml(option.id)}" ${app.selectionLocked ? 'disabled' : ''}>${selected === option.id ? (app.language === 'kr' ? '선택했어요' : 'Selected') : escapeHtml(copy.choose)} <span aria-hidden="true">→</span></button>
            </article>
          `;
        }).join('')}
      </div>
      <div class="selection-live" aria-live="polite">${app.selectionLocked ? (app.language === 'kr' ? '선택을 반영하고 있어요.' : 'Applying your choice.') : ''}</div>
    </section>
  `;
  app.renderNotice();
}
