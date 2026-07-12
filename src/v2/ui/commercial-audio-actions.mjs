import { PROFILE_QUESTIONS } from '../data/questions.mjs?commercial=cr1';
import { createOriginalAudioUrl, isCommercialAudioClip } from '../audio/original-clips.mjs?commercial=cr1';
import { track } from './helpers.mjs?weekly=m4w1';

const AUDIO_PREVIEW_LIMIT_SECONDS = 12;
const HOME_PREVIEW_LIMIT_SECONDS = 12;
const AUDIO_ERROR_WATCHDOG_MS = 3500;
const HEARD_SECONDS = 3;
const PRODUCT_VERSION = 'v2-cr1';

function questionKey(question, option) {
  return `${question.id}:${option.id}`;
}

function updateQuestionAudioDom(app, optionId) {
  const progress = app.audioProgress.get(optionId) || { current: 0, duration: AUDIO_PREVIEW_LIMIT_SECONDS };
  const duration = Math.min(progress.duration || AUDIO_PREVIEW_LIMIT_SECONDS, AUDIO_PREVIEW_LIMIT_SECONDS);
  const current = Math.min(progress.current || 0, duration);
  const ratio = duration ? current / duration : 0;
  const fill = app.root.querySelector(`[data-audio-fill="${CSS.escape(optionId)}"]`);
  const time = app.root.querySelector(`[data-audio-time="${CSS.escape(optionId)}"]`);
  if (fill) fill.style.width = `${Math.round(ratio * 100)}%`;
  if (time) time.textContent = `${Math.floor(current / 60)}:${String(Math.floor(current % 60)).padStart(2, '0')} / ${Math.floor(duration / 60)}:${String(Math.floor(duration % 60)).padStart(2, '0')}`;
}

function updateHomeAudioDom(app, optionId, current, duration) {
  const safeDuration = Math.min(Number.isFinite(duration) ? duration : HOME_PREVIEW_LIMIT_SECONDS, HOME_PREVIEW_LIMIT_SECONDS);
  const safeCurrent = Math.min(current || 0, safeDuration);
  const percent = safeDuration ? Math.round((safeCurrent / safeDuration) * 100) : 0;
  const option = app.root.querySelector(`[data-brand-option="${CSS.escape(optionId)}"]`);
  const fill = app.root.querySelector(`[data-home-progress="${CSS.escape(optionId)}"]`);
  const time = app.root.querySelector(`[data-home-time="${CSS.escape(optionId)}"]`);
  if (fill) fill.style.width = `${percent}%`;
  if (time) time.textContent = `0:${String(Math.floor(safeCurrent)).padStart(2, '0')}`;
  option?.classList.toggle('is-playing', Boolean(app.homePreviewAudio && !app.homePreviewAudio.paused));
}

async function commercialAudioUrl(option) {
  if (!option?.audioClipId || !isCommercialAudioClip(option.audioClipId)) throw new Error('Audio clip is not registered for commercial operation.');
  return createOriginalAudioUrl(option.audioClipId);
}

export const commercialAudioMethods = {
  async togglePreview(optionId) {
    const question = PROFILE_QUESTIONS[this.quizIndex];
    const option = question?.options.find((candidate) => candidate.id === optionId);
    if (!option?.audioClipId) return;
    if (this.previewOptionId === optionId && this.previewAudio && !this.previewAudio.paused) {
      this.stopPreview(false);
      this.renderDiscover();
      return;
    }

    this.stopPreview(false);
    const key = questionKey(question, option);
    let audio;
    let failed = false;
    const markAudioError = () => {
      if (failed) return;
      failed = true;
      window.clearTimeout(this.audioErrorTimer);
      this.audioErrorTimer = null;
      this.audioErrorIds.add(key);
      track('audio_error', { question_id: question.id, option_id: option.id, audio_clip_id: option.audioClipId, product_version: PRODUCT_VERSION });
      this.stopPreview(false);
      this.renderDiscover();
    };

    try {
      audio = new Audio(await commercialAudioUrl(option));
    } catch (_) {
      markAudioError();
      return;
    }

    this.previewAudio = audio;
    this.previewOptionId = optionId;
    audio.preload = 'metadata';
    audio.volume = .68;

    const clearWatchdog = () => {
      window.clearTimeout(this.audioErrorTimer);
      this.audioErrorTimer = null;
    };
    const update = () => {
      const duration = Number.isFinite(audio.duration) ? Math.min(audio.duration, AUDIO_PREVIEW_LIMIT_SECONDS) : AUDIO_PREVIEW_LIMIT_SECONDS;
      const current = Math.min(audio.currentTime || 0, duration);
      this.audioProgress.set(optionId, { current, duration });
      if (current >= HEARD_SECONDS || (duration && current / duration >= .35)) this.heardOptionIds.add(key);
      updateQuestionAudioDom(this, optionId);
      if (current >= AUDIO_PREVIEW_LIMIT_SECONDS) {
        this.heardOptionIds.add(key);
        this.stopPreview(false);
        this.renderDiscover();
      }
    };

    audio.addEventListener('loadedmetadata', () => { clearWatchdog(); update(); });
    audio.addEventListener('playing', clearWatchdog, { once: true });
    audio.addEventListener('timeupdate', update);
    audio.addEventListener('ended', () => {
      clearWatchdog();
      this.heardOptionIds.add(key);
      this.stopPreview(false);
      this.renderDiscover();
    }, { once: true });
    audio.addEventListener('error', markAudioError, { once: true });

    this.audioErrorTimer = window.setTimeout(markAudioError, AUDIO_ERROR_WATCHDOG_MS);
    this.renderDiscover();
    audio.play().then(() => {
      clearWatchdog();
      track('audio_play', { product_version: PRODUCT_VERSION, audio_context: 'profile_question', question_id: question.id, option_id: option.id, audio_clip_id: option.audioClipId, rights_release: 'cr1' });
    }).catch(markAudioError);
  },

  async toggleHomePreview(optionId) {
    const question = PROFILE_QUESTIONS[0];
    const option = question.options.find((candidate) => candidate.id === optionId);
    if (!option?.audioClipId) return;
    if (this.homePreviewOptionId === optionId && this.homePreviewAudio && !this.homePreviewAudio.paused) {
      this.stopHomePreview(true);
      this.renderHome();
      return;
    }

    this.stopHomePreview(true);
    let audio;
    let failed = false;
    const fail = () => {
      if (failed) return;
      failed = true;
      window.clearTimeout(this.homePreviewTimer);
      this.homePreviewTimer = null;
      this.homeAudioErrorIds.add(optionId);
      this.stopHomePreview(true);
      this.renderHome();
      track('audio_error', { product_version: PRODUCT_VERSION, audio_context: 'home_listening_booth', question_id: question.id, option_id: option.id, audio_clip_id: option.audioClipId });
    };

    try {
      audio = new Audio(await commercialAudioUrl(option));
    } catch (_) {
      fail();
      return;
    }

    this.homePreviewAudio = audio;
    this.homePreviewOptionId = optionId;
    audio.preload = 'metadata';
    audio.volume = .68;

    const update = () => {
      updateHomeAudioDom(this, optionId, audio.currentTime, audio.duration);
      if (audio.currentTime >= HEARD_SECONDS) this.homeHeardOptionIds.add(optionId);
      if (audio.currentTime >= HOME_PREVIEW_LIMIT_SECONDS) {
        this.homeHeardOptionIds.add(optionId);
        this.stopHomePreview(true);
        this.renderHome();
      }
    };

    audio.addEventListener('timeupdate', update);
    audio.addEventListener('ended', () => {
      this.homeHeardOptionIds.add(optionId);
      this.stopHomePreview(true);
      this.renderHome();
    }, { once: true });
    audio.addEventListener('error', fail, { once: true });
    this.homePreviewTimer = window.setTimeout(() => {
      if (this.homePreviewAudio === audio && audio.readyState < 2) fail();
    }, AUDIO_ERROR_WATCHDOG_MS);
    this.renderHome();
    audio.play().then(() => {
      window.clearTimeout(this.homePreviewTimer);
      this.homePreviewTimer = null;
      track('audio_play', { product_version: PRODUCT_VERSION, audio_context: 'home_listening_booth', question_id: question.id, option_id: option.id, audio_clip_id: option.audioClipId, rights_release: 'cr1' });
    }).catch(fail);
  }
};
