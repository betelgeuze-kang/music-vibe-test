import { PROFILE_QUESTIONS } from '../data/questions.mjs?v=qg1';
import { CONTEXT_BY_ID } from '../data/contexts.mjs?v=qg1';
import { createProfileFromAnswers, decodeProfile, getProfileArchetype } from '../domain/profile.mjs?v=qg1';
import { clearProfile, saveLanguage, saveNowSession, saveProfile } from '../infrastructure/storage.mjs?v=qg1';
import { buildInviteUrl, copyText, downloadProfileCard, shareProfileInvite } from '../infrastructure/share.mjs?v=qg1';
import { extractToken, fragmentState, routeUrl, track } from './helpers.mjs?ui=f1';

const AUDIO_PREVIEW_LIMIT_SECONDS = 20;
const HOME_PREVIEW_LIMIT_SECONDS = 15;
const AUDIO_ERROR_WATCHDOG_MS = 2500;
const HEARD_SECONDS = 3;

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

export const actionMethods = {
  handleClick(event) {
    const trackLink = event.target.closest('[data-track-link]');
    if (trackLink) {
      const card = trackLink.closest('[data-track-id]');
      track('playlist_click', {
        product_version: 'v2-f1',
        track_id: card?.dataset.trackId || '',
        platform: trackLink.dataset.platform,
        placement: trackLink.dataset.placement,
        context_id: this.selectedContextId,
        strategy: card?.dataset.strategy || ''
      });
      return;
    }

    const actionTarget = event.target.closest('[data-action]');
    if (actionTarget) {
      event.preventDefault();
      const action = actionTarget.dataset.action;
      if (action === 'toggle-language') this.toggleLanguage();
      else if (action === 'quit-quiz') this.quitQuiz();
      else if (action === 'previous-question') this.previousQuestion();
      else if (action === 'choose-option') this.chooseOption(actionTarget.dataset.optionId);
      else if (action === 'preview') this.togglePreview(actionTarget.dataset.optionId);
      else if (action === 'home-preview' || action === 'brand-preview') this.toggleHomePreview(actionTarget.dataset.optionId);
      else if (action === 'home-choose' || action === 'brand-choose') this.startFromHomeChoice(actionTarget.dataset.optionId);
      else if (action === 'focus-booth' || action === 'brand-focus-booth') this.focusListeningBooth();
      else if (action === 'scroll-sample' || action === 'brand-scroll-sample') this.scrollToSample();
      else if (action === 'retake-profile') this.startQuiz(true);
      else if (action === 'clear-profile') this.deleteProfile();
      else if (action === 'share-profile') this.shareProfile();
      else if (action === 'copy-invite') this.copyInvite();
      else if (action === 'download-card') this.downloadCard();
      else if (action === 'select-context' || action === 'restore-context') this.selectContext(actionTarget.dataset.contextId);
      else if (action === 'change-context') this.changeContext();
      else if (action === 'clear-friend') this.clearFriend();
      else if (action === 'privacy') this.showPrivacy();
      return;
    }

    const routeButton = event.target.closest('button[data-route], a[data-route]');
    if (!routeButton) return;
    event.preventDefault();
    if (routeButton.dataset.route === 'discover') this.startQuiz(false);
    else this.navigate(routeButton.dataset.route);
  },

  handleSubmit(event) {
    const form = event.target.closest('[data-form="load-invite"]');
    if (!form) return;
    event.preventDefault();
    const token = extractToken(new FormData(form).get('invite'));
    const profile = decodeProfile(token);
    if (!profile) { this.setNotice(this.copy().invalidInvite, 'error'); return; }
    this.friendProfile = profile;
    this.friendSource = 'manual';
    this.renderMatch();
  },

  handleKeydown(event) {
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
  },

  toggleLanguage() {
    this.language = this.language === 'kr' ? 'en' : 'kr';
    saveLanguage(this.language);
    document.documentElement.lang = this.language === 'kr' ? 'ko' : 'en';
    const url = new URL(window.location.href);
    url.searchParams.set('lang', this.language);
    const fragment = fragmentState(url.hash);
    if (fragment.params.has('compare')) fragment.params.set('lang', this.language);
    url.hash = routeUrl(fragment.route, Object.fromEntries(fragment.params)).slice(1);
    window.history.replaceState({}, '', url);
    track('language_change', { language: this.language, product_version: 'v2-f1' });
    this.render();
  },

  startQuiz(force = false) {
    if (force || !this.startedAt) {
      this.answers = [];
      this.quizIndex = 0;
      this.startedAt = Date.now();
    }
    if (force) {
      this.heardOptionIds.clear();
      this.audioProgress.clear();
      this.audioErrorIds.clear();
    }
    this.navigate('discover');
    track('start_test', { product_version: 'v2-f1', test_mode: 'vibe_profile_10', question_count: PROFILE_QUESTIONS.length });
  },

  startFromHomeChoice(optionId) {
    const question = PROFILE_QUESTIONS[0];
    const option = question.options.find((candidate) => candidate.id === optionId);
    if (!option) return;
    this.stopHomePreview(true);
    this.answers = [{ questionId: question.id, optionId: option.id }];
    this.quizIndex = 1;
    this.startedAt = Date.now();
    this.selectionLocked = false;
    track('start_test', { product_version: 'v2-f1', test_mode: 'vibe_profile_10', question_count: PROFILE_QUESTIONS.length, entry_point: 'home_listening_booth' });
    track('question_answer', { product_version: 'v2-f1', test_mode: 'vibe_profile_10', question_id: question.id, question_number: 1, question_kind: question.kind, selected_option: option.id, entry_point: 'home_listening_booth' });
    this.navigate('discover');
  },

  focusListeningBooth() {
    const booth = document.getElementById('listening-booth');
    booth?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    booth?.querySelector('[data-action="home-preview"]')?.focus({ preventScroll: true });
  },

  scrollToSample() {
    document.getElementById('result-example')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  },

  quitQuiz() {
    this.stopPreview();
    track('test_abandon', { product_version: 'v2-f1', test_mode: 'vibe_profile_10', last_question: this.quizIndex + 1, question_count: PROFILE_QUESTIONS.length, elapsed_ms: this.startedAt ? Date.now() - this.startedAt : 0 });
    this.navigate('home');
  },

  previousQuestion() {
    if (this.quizIndex <= 0) return;
    window.clearTimeout(this.selectionTimer);
    this.selectionLocked = false;
    this.stopPreview(false);
    this.quizIndex -= 1;
    track('question_back', { question_number: this.quizIndex + 1, test_mode: 'vibe_profile_10', product_version: 'v2-f1' });
    this.renderDiscover();
  },

  chooseOption(optionId) {
    if (this.selectionLocked) return;
    const question = PROFILE_QUESTIONS[this.quizIndex];
    const option = question?.options.find((candidate) => candidate.id === optionId);
    if (!option) return;
    this.stopPreview(false);
    const previous = this.answers.find((answer) => answer.questionId === question.id)?.optionId || '';
    this.answers = [...this.answers.filter((answer) => answer.questionId !== question.id), { questionId: question.id, optionId: option.id }];
    track('question_answer', {
      product_version: 'v2-f1', test_mode: 'vibe_profile_10', question_id: question.id,
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
  },

  finishProfile() {
    const profile = createProfileFromAnswers(PROFILE_QUESTIONS, this.answers, 'v2_onboarding_f1');
    saveProfile(profile);
    this.profile = profile;
    const archetype = getProfileArchetype(profile);
    track('test_complete', { product_version: 'v2-f1', test_mode: 'vibe_profile_10', result_type: archetype.id, profile_id: profile.id, question_count: PROFILE_QUESTIONS.length, elapsed_ms: this.startedAt ? Date.now() - this.startedAt : 0 });
    track('profile_complete', { product_version: 'v2-f1', result_type: archetype.id, profile_id: profile.id, archetype_confidence: profile.archetypeConfidence });
    this.startedAt = 0;
    this.navigate(this.friendProfile ? 'match' : 'profile');
  },

  togglePreview(optionId) {
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
    let failed = false;
    this.previewAudio = audio;
    this.previewOptionId = optionId;
    audio.preload = 'metadata';
    audio.volume = 0.68;

    const clearWatchdog = () => {
      window.clearTimeout(this.audioErrorTimer);
      this.audioErrorTimer = null;
    };
    const markAudioError = () => {
      if (failed || this.previewAudio !== audio) return;
      failed = true;
      clearWatchdog();
      this.audioErrorIds.add(key);
      track('audio_error', { question_id: question.id, option_id: option.id, product_version: 'v2-f1' });
      this.stopPreview(false);
      this.renderDiscover();
    };
    const update = () => {
      const duration = Number.isFinite(audio.duration) ? Math.min(audio.duration, AUDIO_PREVIEW_LIMIT_SECONDS) : AUDIO_PREVIEW_LIMIT_SECONDS;
      const current = Math.min(audio.currentTime || 0, duration);
      this.audioProgress.set(optionId, { current, duration });
      if (current >= HEARD_SECONDS || (duration && current / duration >= 0.35)) this.heardOptionIds.add(key);
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
      track('audio_play', { product_version: 'v2-f1', audio_context: 'profile_question', question_id: question.id, option_id: option.id });
    }).catch(markAudioError);
  },

  stopPreview(render = false) {
    window.clearTimeout(this.audioErrorTimer);
    this.audioErrorTimer = null;
    const activeAudio = this.previewAudio;
    this.previewAudio = null;
    this.previewOptionId = '';
    if (activeAudio) {
      activeAudio.pause();
      activeAudio.removeAttribute('src');
      activeAudio.load();
    }
    if (render && this.route === 'discover') this.renderDiscover();
  },

  toggleHomePreview(optionId) {
    const question = PROFILE_QUESTIONS[0];
    const option = question.options.find((candidate) => candidate.id === optionId);
    if (!option?.audioSrc) return;
    if (this.homePreviewOptionId === optionId && this.homePreviewAudio && !this.homePreviewAudio.paused) {
      this.stopHomePreview(true);
      this.renderHome();
      return;
    }

    this.stopHomePreview(true);
    const audio = new Audio(option.audioSrc);
    this.homePreviewAudio = audio;
    this.homePreviewOptionId = optionId;
    audio.preload = 'metadata';
    audio.volume = 0.68;

    const fail = () => {
      if (this.homePreviewAudio !== audio) return;
      this.homeAudioErrorIds.add(optionId);
      this.stopHomePreview(true);
      this.renderHome();
      track('audio_error', { product_version: 'v2-f1', audio_context: 'home_listening_booth', question_id: question.id, option_id: option.id });
    };
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
      track('audio_play', { product_version: 'v2-f1', audio_context: 'home_listening_booth', question_id: question.id, option_id: option.id });
    }).catch(fail);
  },

  stopHomePreview(reset = false) {
    window.clearTimeout(this.homePreviewTimer);
    this.homePreviewTimer = null;
    const audio = this.homePreviewAudio;
    this.homePreviewAudio = null;
    this.homePreviewOptionId = '';
    if (audio) {
      audio.pause();
      if (reset) audio.currentTime = 0;
      audio.removeAttribute('src');
      audio.load();
    }
  },

  deleteProfile() {
    if (!window.confirm(this.copy().resetConfirm)) return;
    clearProfile();
    this.profile = null;
    this.selectedContextId = '';
    this.recommendations = [];
    track('profile_deleted', { product_version: 'v2-f1' });
    this.setNotice(this.copy().profileCleared, 'success');
    this.navigate('home');
  },

  async shareProfile() {
    if (!this.profile) return;
    track('share_click', { product_version: 'v2-f1', placement: this.route, share_type: 'vibe_match_invite' });
    try {
      const result = await shareProfileInvite(this.profile, this.language);
      if (result.status === 'cancelled') { track('share_cancel', { product_version: 'v2-f1', share_method: result.method, placement: this.route }); this.setNotice(this.copy().shareCancelled); return; }
      track('share_success', { product_version: 'v2-f1', share_method: result.method, placement: this.route });
      track('match_invite_created', { product_version: 'v2-f1', profile_id: this.profile.id, method: result.method, token_location: 'fragment' });
      if (result.method === 'copy') this.setNotice(this.copy().copySuccess, 'success');
    } catch (error) {
      track('share_error', { product_version: 'v2-f1', error_name: error?.name || 'Error' });
      this.setNotice(this.copy().shareError, 'error');
    }
  },

  async copyInvite() {
    if (!this.profile) return;
    try {
      await copyText(buildInviteUrl(this.profile, this.language));
      track('share_success', { product_version: 'v2-f1', share_method: 'copy', placement: 'match_invite' });
      track('match_invite_created', { product_version: 'v2-f1', profile_id: this.profile.id, method: 'copy', token_location: 'fragment' });
      this.setNotice(this.copy().copySuccess, 'success');
    } catch (_) {
      this.setNotice(this.copy().shareError, 'error');
    }
  },

  async downloadCard() {
    if (!this.profile) return;
    track('image_save', { product_version: 'v2-f1', profile_id: this.profile.id, card_version: 'svg-glyph-e1' });
    try {
      await downloadProfileCard(this.profile, this.language);
      track('image_save_success', { product_version: 'v2-f1', profile_id: this.profile.id, card_version: 'svg-glyph-e1' });
    } catch (error) {
      track('test_error', { product_version: 'v2-f1', error_type: 'profile_card', error_message: error?.message || 'Card export failed' });
      this.setNotice(this.language === 'kr' ? '카드를 저장하지 못했어요.' : 'Could not save the card.', 'error');
    }
  },

  async selectContext(contextId) {
    if (!CONTEXT_BY_ID[contextId] || !this.profile) return;
    const { recommendTracks } = await import('../domain/recommendation.mjs?content=e1');
    this.selectedContextId = contextId;
    this.recommendations = recommendTracks(this.profile, contextId, { language: this.language, limit: 5 });
    saveNowSession({ id: `${Date.now()}-${contextId}`, contextId, profileId: this.profile.id, trackIds: this.recommendations.map((candidate) => candidate.track.id), createdAt: new Date().toISOString() });
    track('vibe_now_generate', { product_version: 'v2-f1', context_id: contextId, profile_id: this.profile.id, track_count: this.recommendations.length, strategies: this.recommendations.map((item) => item.strategy).join(',') });
    this.renderNow();
  },

  changeContext() {
    this.selectedContextId = '';
    this.recommendations = [];
    this.renderNow();
  },

  clearFriend() {
    this.friendProfile = null;
    this.friendSource = '';
    const url = new URL(window.location.href);
    url.searchParams.delete('compare');
    url.searchParams.delete('ref');
    url.hash = routeUrl('match').slice(1);
    window.history.replaceState({}, '', url);
    this.renderMatch();
  },

  showPrivacy() {
    document.getElementById('privacy-dialog')?.remove();
    const dialog = document.createElement('dialog');
    dialog.id = 'privacy-dialog';
    dialog.className = 'privacy-dialog';
    dialog.innerHTML = `<form method="dialog"><button class="privacy-dialog__close" aria-label="${this.copy().close}">×</button><span class="eyebrow">PRIVACY</span><h2>${this.language === 'kr' ? '취향 기록은 어떻게 저장되나요?' : 'How are taste notes stored?'}</h2><p>${this.language === 'kr' ? '취향 기록과 최근 선곡은 이 브라우저에 저장됩니다. 친구 비교 값은 URL의 # 뒤에 들어가 서버나 CDN 요청에 포함되지 않으며, 이름이나 이메일 없이 여섯 개 취향 값과 익명 ID만 담습니다. 선택적 분석은 동의한 경우에만 전송됩니다.' : 'Taste notes and recent selections stay in this browser. Comparison data lives after # in the URL, so it is not sent in server or CDN requests. It contains six taste values and an anonymous ID, not a name or email. Optional analytics are sent only after consent.'}</p><p>${this.copy().footerNote}</p><button class="button button--light" value="close">${this.copy().close}</button></form>`;
    document.body.appendChild(dialog);
    dialog.addEventListener('close', () => dialog.remove(), { once: true });
    dialog.showModal();
  }
};
