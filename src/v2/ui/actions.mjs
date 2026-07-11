import { PROFILE_QUESTIONS } from '../data/questions.mjs?v=qg1';
import { CONTEXT_BY_ID } from '../data/contexts.mjs?v=qg1';
import { createProfileFromAnswers, decodeProfile, getProfileArchetype } from '../domain/profile.mjs?v=qg1';
import { recommendTracks } from '../domain/recommendation.mjs?v=qg1';
import { clearProfile, saveLanguage, saveNowSession, saveProfile } from '../infrastructure/storage.mjs?v=qg1';
import { buildInviteUrl, copyText, downloadProfileCard, shareProfileInvite } from '../infrastructure/share.mjs?v=qg1';
import { extractToken, fragmentState, routeUrl, track } from './helpers.mjs?v=qg1';

export const actionMethods = {
  handleClick(event) {
    const routeButton = event.target.closest('[data-route]');
    if (routeButton) {
      event.preventDefault();
      if (routeButton.dataset.route === 'discover') this.startQuiz(false);
      else this.navigate(routeButton.dataset.route);
      return;
    }
    const trackLink = event.target.closest('[data-track-link]');
    if (trackLink) {
      const card = trackLink.closest('[data-track-id]');
      track('playlist_click', { product_version: 'v2-qg1', track_id: card?.dataset.trackId || '', platform: trackLink.dataset.platform, placement: trackLink.dataset.placement, context_id: this.selectedContextId, strategy: card?.dataset.strategy || '' });
      return;
    }
    const actionTarget = event.target.closest('[data-action]');
    if (!actionTarget) return;
    const action = actionTarget.dataset.action;
    if (action === 'toggle-language') this.toggleLanguage();
    else if (action === 'quit-quiz') this.quitQuiz();
    else if (action === 'choose-option') this.chooseOption(actionTarget.dataset.optionId);
    else if (action === 'preview') this.togglePreview(actionTarget.dataset.optionId);
    else if (action === 'retake-profile') this.startQuiz(true);
    else if (action === 'clear-profile') this.deleteProfile();
    else if (action === 'share-profile') this.shareProfile();
    else if (action === 'copy-invite') this.copyInvite();
    else if (action === 'download-card') this.downloadCard();
    else if (action === 'select-context' || action === 'restore-context') this.selectContext(actionTarget.dataset.contextId);
    else if (action === 'change-context') this.changeContext();
    else if (action === 'clear-friend') this.clearFriend();
    else if (action === 'privacy') this.showPrivacy();
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
    track('language_change', { language: this.language, product_version: 'v2-qg1' });
    this.render();
  },

  startQuiz(force = false) {
    if (force || !this.startedAt) { this.answers = []; this.quizIndex = 0; this.startedAt = Date.now(); }
    this.navigate('discover');
    track('start_test', { product_version: 'v2-qg1', test_mode: 'vibe_profile_10', question_count: PROFILE_QUESTIONS.length });
  },

  quitQuiz() {
    this.stopPreview();
    track('test_abandon', { product_version: 'v2-qg1', test_mode: 'vibe_profile_10', last_question: this.quizIndex + 1, question_count: PROFILE_QUESTIONS.length, elapsed_ms: this.startedAt ? Date.now() - this.startedAt : 0 });
    this.navigate('home');
  },

  chooseOption(optionId) {
    const question = PROFILE_QUESTIONS[this.quizIndex];
    const option = question?.options.find((candidate) => candidate.id === optionId);
    if (!option) return;
    this.stopPreview();
    this.answers = [...this.answers.filter((answer) => answer.questionId !== question.id), { questionId: question.id, optionId: option.id }];
    track('question_answer', { product_version: 'v2-qg1', test_mode: 'vibe_profile_10', question_id: question.id, question_number: this.quizIndex + 1, question_kind: question.kind, selected_option: option.id });
    if (this.quizIndex >= PROFILE_QUESTIONS.length - 1) this.finishProfile();
    else { this.quizIndex += 1; this.renderDiscover(); }
  },

  finishProfile() {
    const profile = createProfileFromAnswers(PROFILE_QUESTIONS, this.answers, 'v2_onboarding_qg1');
    saveProfile(profile);
    this.profile = profile;
    const archetype = getProfileArchetype(profile);
    track('test_complete', { product_version: 'v2-qg1', test_mode: 'vibe_profile_10', result_type: archetype.id, profile_id: profile.id, question_count: PROFILE_QUESTIONS.length, elapsed_ms: this.startedAt ? Date.now() - this.startedAt : 0 });
    track('profile_complete', { product_version: 'v2-qg1', result_type: archetype.id, profile_id: profile.id, archetype_confidence: profile.archetypeConfidence });
    this.startedAt = 0;
    this.navigate(this.friendProfile ? 'match' : 'profile');
  },

  togglePreview(optionId) {
    const question = PROFILE_QUESTIONS[this.quizIndex];
    const option = question?.options.find((candidate) => candidate.id === optionId);
    if (!option?.audioSrc) return;
    if (this.previewOptionId === optionId && this.previewAudio && !this.previewAudio.paused) { this.stopPreview(); this.renderDiscover(); return; }
    this.stopPreview();
    this.previewAudio = new Audio(option.audioSrc);
    this.previewAudio.preload = 'metadata';
    this.previewAudio.volume = 0.68;
    this.previewOptionId = optionId;
    this.previewAudio.addEventListener('ended', () => { this.stopPreview(); this.renderDiscover(); }, { once: true });
    this.previewAudio.play().then(() => track('audio_play', { product_version: 'v2-qg1', audio_context: 'profile_question', question_id: question.id, option_id: option.id })).catch(() => { this.stopPreview(); this.setNotice(this.language === 'kr' ? '오디오를 재생하지 못했어요.' : 'Could not play the preview.', 'error'); });
  },

  stopPreview() {
    window.clearTimeout(this.previewTimeout);
    if (this.previewAudio) { this.previewAudio.pause(); this.previewAudio.currentTime = 0; }
    this.previewAudio = null;
    this.previewOptionId = '';
  },

  deleteProfile() {
    if (!window.confirm(this.copy().resetConfirm)) return;
    clearProfile();
    this.profile = null;
    this.selectedContextId = '';
    this.recommendations = [];
    track('profile_deleted', { product_version: 'v2-qg1' });
    this.setNotice(this.copy().profileCleared, 'success');
    this.navigate('home');
  },

  async shareProfile() {
    if (!this.profile) return;
    track('share_click', { product_version: 'v2-qg1', placement: this.route, share_type: 'vibe_match_invite' });
    try {
      const result = await shareProfileInvite(this.profile, this.language);
      if (result.status === 'cancelled') { track('share_cancel', { product_version: 'v2-qg1', share_method: result.method, placement: this.route }); this.setNotice(this.copy().shareCancelled); return; }
      track('share_success', { product_version: 'v2-qg1', share_method: result.method, placement: this.route });
      track('match_invite_created', { product_version: 'v2-qg1', profile_id: this.profile.id, method: result.method, token_location: 'fragment' });
      if (result.method === 'copy') this.setNotice(this.copy().copySuccess, 'success');
    } catch (error) { track('share_error', { product_version: 'v2-qg1', error_name: error?.name || 'Error' }); this.setNotice(this.copy().shareError, 'error'); }
  },

  async copyInvite() {
    if (!this.profile) return;
    try {
      await copyText(buildInviteUrl(this.profile, this.language));
      track('share_success', { product_version: 'v2-qg1', share_method: 'copy', placement: 'match_invite' });
      track('match_invite_created', { product_version: 'v2-qg1', profile_id: this.profile.id, method: 'copy', token_location: 'fragment' });
      this.setNotice(this.copy().copySuccess, 'success');
    } catch (_) { this.setNotice(this.copy().shareError, 'error'); }
  },

  async downloadCard() {
    if (!this.profile) return;
    track('image_save', { product_version: 'v2-qg1', profile_id: this.profile.id, card_version: 'svg-glyph-qg1' });
    try { await downloadProfileCard(this.profile, this.language); track('image_save_success', { product_version: 'v2-qg1', profile_id: this.profile.id, card_version: 'svg-glyph-qg1' }); }
    catch (error) { track('test_error', { product_version: 'v2-qg1', error_type: 'profile_card', error_message: error?.message || 'Card export failed' }); this.setNotice(this.language === 'kr' ? '카드를 저장하지 못했어요.' : 'Could not save the card.', 'error'); }
  },

  selectContext(contextId) {
    if (!CONTEXT_BY_ID[contextId] || !this.profile) return;
    this.selectedContextId = contextId;
    this.recommendations = recommendTracks(this.profile, contextId, { language: this.language, limit: 5 });
    saveNowSession({ id: `${Date.now()}-${contextId}`, contextId, profileId: this.profile.id, trackIds: this.recommendations.map((candidate) => candidate.track.id), createdAt: new Date().toISOString() });
    track('vibe_now_generate', { product_version: 'v2-qg1', context_id: contextId, profile_id: this.profile.id, track_count: this.recommendations.length, strategies: this.recommendations.map((item) => item.strategy).join(',') });
    this.renderNow();
  },

  changeContext() { this.selectedContextId = ''; this.recommendations = []; this.renderNow(); },

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
    dialog.innerHTML = `<form method="dialog"><button class="privacy-dialog__close" aria-label="${this.copy().close}">×</button><span class="eyebrow">PRIVACY</span><h2>${this.language === 'kr' ? '프로필 데이터 처리' : 'How profile data is handled'}</h2><p>${this.language === 'kr' ? 'Vibe Profile과 최근 추천 기록은 이 브라우저에 저장됩니다. 친구 비교 토큰은 URL의 # 뒤 fragment에 들어가 서버·CDN 요청에 포함되지 않으며, 이름·이메일 없이 6개 취향 점수와 익명 프로필 식별자만 담습니다. 선택적 분석은 동의한 경우에만 전송됩니다.' : 'Your profile and recent recommendations stay in this browser. The comparison token lives after # in the URL fragment, so it is not sent in server or CDN requests. It contains only six taste scores and an anonymous profile ID—no name or email. Optional analytics are sent only after consent.'}</p><p>${this.copy().footerNote}</p><button class="button button--light" value="close">${this.copy().close}</button></form>`;
    document.body.appendChild(dialog);
    dialog.addEventListener('close', () => dialog.remove(), { once: true });
    dialog.showModal();
  }
};
