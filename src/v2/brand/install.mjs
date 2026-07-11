import { BRAND_COPY } from './copy.mjs?brand=bd1';
import { PROFILE_QUESTIONS } from '../data/questions.mjs?v=qg1';
import { HOME_SHOWCASE, localizedShowcaseReason } from '../data/home-showcase.mjs';
import { profileFromArchetype, getProfileArchetype, localize } from '../domain/profile.mjs?v=qg1';
import { renderVibeGlyph } from '../quality/visuals.mjs?v=qg1';
import { escapeHtml, track } from '../ui/helpers.mjs?v=qg1';

const BRAND_RELEASE = 'bd1';
const HOME_PREVIEW_SECONDS = 15;
const sampleProfile = profileFromArchetype(HOME_SHOWCASE.profileArchetypeId, 'brand_sample');
const sampleFriend = profileFromArchetype(HOME_SHOWCASE.friendArchetypeId, 'brand_sample');

function trackRows(candidates, language, placement, limit = candidates.length) {
  return candidates.slice(0, limit).map((candidate, index) => `
    <article class="editorial-track" data-track-id="${escapeHtml(candidate.track.id)}">
      <span class="editorial-track__number">${String(index + 1).padStart(2, '0')}</span>
      <div class="editorial-track__copy">
        <strong>${escapeHtml(candidate.track.title)}</strong>
        <span>${escapeHtml(candidate.track.artist)}</span>
        <p>${escapeHtml(localizedShowcaseReason(candidate, language))}</p>
      </div>
      <div class="editorial-track__links">
        <a href="${escapeHtml(candidate.urls.spotify)}" target="_blank" rel="noopener noreferrer" data-track-link data-platform="spotify" data-placement="${placement}">Spotify</a>
        <a href="${escapeHtml(candidate.urls.youtube)}" target="_blank" rel="noopener noreferrer" data-track-link data-platform="youtube" data-placement="${placement}">YouTube</a>
      </div>
    </article>
  `).join('');
}

function renderHeader(app) {
  const copy = app.copy();
  const nav = (route, label) => `
    <button type="button" data-route="${route}" class="site-nav__link ${app.route === route ? 'is-active' : ''}" ${app.route === route ? 'aria-current="page"' : ''}>${escapeHtml(label)}</button>
  `;
  app.header.innerHTML = `
    <div class="site-header__inner editorial-header">
      <button class="brand editorial-wordmark" type="button" data-route="home" aria-label="My Music Vibe home">
        <span class="editorial-wordmark__name">MY MUSIC VIBE</span>
        <span class="editorial-wordmark__issue">LISTENING NOTES / ${BRAND_RELEASE.toUpperCase()}</span>
      </button>
      <nav class="site-nav editorial-nav" aria-label="${app.language === 'kr' ? '주요 메뉴' : 'Primary navigation'}">
        ${nav('home', copy.navHome)}
        ${nav('profile', copy.navProfile)}
        ${nav('now', copy.navNow)}
        ${nav('match', copy.navMatch)}
      </nav>
      <button type="button" class="language-toggle editorial-language" data-action="toggle-language" aria-label="${app.language === 'kr' ? '영어로 보기' : '한국어로 보기'}">${app.language === 'kr' ? 'EN' : '한국어'}</button>
    </div>
  `;
}

function renderFooter(app) {
  const copy = app.copy();
  app.footer.innerHTML = `
    <div class="site-footer__inner editorial-footer">
      <div><strong>MY MUSIC VIBE</strong><span>© ${new Date().getFullYear()}</span></div>
      <p>${escapeHtml(copy.footerNote)}</p>
      <button type="button" data-action="privacy">${escapeHtml(copy.footerPrivacy)} ↗</button>
    </div>
  `;
}

function homeOption(app, question, option, index) {
  const copy = app.copy();
  const isPlaying = app.brandPreviewOptionId === option.id && app.brandPreviewAudio && !app.brandPreviewAudio.paused;
  const heard = app.brandHeardIds.has(option.id);
  const failed = app.brandAudioErrors.has(option.id);
  return `
    <article class="listening-choice ${isPlaying ? 'is-playing' : ''} ${heard ? 'is-heard' : ''} ${failed ? 'has-error' : ''}" data-brand-option="${escapeHtml(option.id)}">
      <header><span>${index === 0 ? 'A' : 'B'}</span><small>${heard ? `✓ ${copy.boothHeard}` : failed ? (app.language === 'kr' ? '텍스트로 선택 가능' : 'Text choice available') : '15 SEC'}</small></header>
      <h3>${escapeHtml(localize(option.label, app.language))}</h3>
      <p>${escapeHtml(localize(option.description, app.language))}</p>
      <div class="listening-choice__transport">
        <button type="button" data-action="brand-preview" data-option-id="${escapeHtml(option.id)}" aria-pressed="${isPlaying}"><span>${isPlaying ? 'Ⅱ' : '▶'}</span>${escapeHtml(isPlaying ? copy.stop : copy.preview)}</button>
        <div class="listening-choice__progress" aria-hidden="true"><i data-brand-progress="${escapeHtml(option.id)}"></i></div>
        <time data-brand-time="${escapeHtml(option.id)}">0:00</time>
      </div>
      <button type="button" class="listening-choice__choose" data-action="brand-choose" data-option-id="${escapeHtml(option.id)}">${escapeHtml(copy.boothContinue)} <span>→</span></button>
    </article>
  `;
}

function renderHome(app) {
  const copy = app.copy();
  const question = PROFILE_QUESTIONS[0];
  const hasProfile = Boolean(app.profile);
  const currentArchetype = hasProfile ? getProfileArchetype(app.profile) : null;
  const sampleArchetype = getProfileArchetype(sampleProfile);
  const sampleTracks = HOME_SHOWCASE.signature;
  const todayTracks = HOME_SHOWCASE.night;
  const sampleMatch = HOME_SHOWCASE.match;
  const friendArchetype = getProfileArchetype(sampleFriend);
  const resonanceLabel = sampleMatch.resonanceLabel[app.language] || sampleMatch.resonanceLabel.en;
  const discoveryLabel = sampleMatch.discoveryLabel[app.language] || sampleMatch.discoveryLabel.en;

  const invite = app.friendProfile ? `
    <section class="editorial-invite">
      <span class="editorial-kicker">A FRIEND SENT A LISTENING NOTE</span>
      <div><h2>${escapeHtml(copy.invitedTitle)}</h2><p>${escapeHtml(copy.invitedDesc)}</p></div>
      <button type="button" data-route="${hasProfile ? 'match' : 'discover'}">${escapeHtml(hasProfile ? copy.openMatch : copy.beginProfile)} →</button>
    </section>
  ` : '';

  app.root.innerHTML = `
    <div id="app-notice" class="app-notice"></div>
    <div class="editorial-home">
      <section class="editorial-hero">
        <div class="editorial-hero__copy">
          <span class="editorial-kicker">${escapeHtml(copy.homeEyebrow)}</span>
          <h1>${escapeHtml(copy.homeTitle).replaceAll('\n', '<br>')}</h1>
          <p class="editorial-dek">${escapeHtml(copy.homeDescription)}</p>
          <div class="editorial-hero__actions">
            ${hasProfile
              ? `<button class="editorial-button editorial-button--ink" type="button" data-route="profile">${escapeHtml(copy.continueProfile)} →</button><button class="editorial-button editorial-button--line" type="button" data-route="now">${escapeHtml(copy.openNow)}</button>`
              : `<button class="editorial-button editorial-button--ink" type="button" data-action="brand-focus-booth">${escapeHtml(copy.beginProfile)} ↓</button><button class="editorial-button editorial-button--line" type="button" data-action="brand-scroll-sample">${escapeHtml(copy.viewSample)}</button>`
            }
          </div>
          <div class="editorial-hero__note">
            <span>${app.language === 'kr' ? '회원가입 없음' : 'No account'}</span>
            <span>${app.language === 'kr' ? '브라우저에만 저장' : 'Saved in your browser'}</span>
            <span>${app.language === 'kr' ? '음악 API 로그인 없음' : 'No streaming login'}</span>
          </div>
          ${hasProfile ? `<div class="editorial-saved"><span>${escapeHtml(currentArchetype.symbol)}</span><div><small>${escapeHtml(copy.existingProfile)}</small><strong>${escapeHtml(localize(currentArchetype.name, app.language))}</strong></div></div>` : ''}
        </div>

        <aside class="listening-booth" id="listening-booth" aria-labelledby="booth-title">
          <header class="listening-booth__header"><span>${escapeHtml(copy.boothLabel)}</span><b>MY MUSIC VIBE</b></header>
          <div class="listening-booth__copy"><h2 id="booth-title">${escapeHtml(copy.boothTitle)}</h2><p>${escapeHtml(copy.boothHint)}</p></div>
          <div class="listening-booth__choices">
            ${question.options.map((option, index) => homeOption(app, question, option, index)).join('')}
          </div>
        </aside>
      </section>

      ${invite}

      <section class="editorial-spread" id="result-example">
        <div class="editorial-spread__intro">
          <span class="editorial-kicker">${escapeHtml(copy.sampleEyebrow)}</span>
          <h2>${escapeHtml(copy.sampleTitle)}</h2>
          <p>${escapeHtml(copy.sampleBody)}</p>
          <div class="editorial-folio"><span>01</span><i></i><b>${app.language === 'kr' ? '취향 예시' : 'PROFILE SAMPLE'}</b></div>
        </div>
        <article class="sample-sleeve" style="--sample-start:${sampleArchetype.gradient[0]};--sample-end:${sampleArchetype.gradient[2]}">
          <div class="sample-sleeve__glyph">${renderVibeGlyph(sampleProfile, app.language, { id: 'sample-profile', size: 260 })}</div>
          <span>${escapeHtml(sampleArchetype.symbol)}</span>
          <h3>${escapeHtml(localize(sampleArchetype.name, app.language))}</h3>
          <p>${escapeHtml(localize(sampleArchetype.tagline, app.language))}</p>
          <small>EXAMPLE / ${escapeHtml(sampleProfile.id)}</small>
        </article>
        <div class="editorial-spread__tracks">
          <span class="editorial-kicker">${escapeHtml(copy.sampleTracks)}</span>
          ${trackRows(sampleTracks, app.language, 'brand_profile_sample')}
        </div>
      </section>

      <section class="editorial-section editorial-section--today">
        <header><span class="editorial-kicker">${escapeHtml(copy.todayEyebrow)}</span><h2>${escapeHtml(copy.todayTitle)}</h2><p>${escapeHtml(copy.todayBody)}</p></header>
        <div class="editorial-scene-tabs" aria-label="${app.language === 'kr' ? '선곡 장면 예시' : 'Listening moment examples'}">
          <span>${app.language === 'kr' ? '집중' : 'Focus'}</span><span class="is-active">${app.language === 'kr' ? '밤 산책' : 'Night walk'}</span><span>${app.language === 'kr' ? '회복' : 'Reset'}</span><span>${app.language === 'kr' ? '새로운 음악' : 'Explore'}</span>
        </div>
        <div class="editorial-tracklist">${trackRows(todayTracks, app.language, 'brand_now_sample')}</div>
        <button class="editorial-text-link" type="button" data-route="now">${escapeHtml(copy.openNow)} →</button>
      </section>

      <section class="editorial-section editorial-section--together">
        <header><span class="editorial-kicker">${escapeHtml(copy.togetherEyebrow)}</span><h2>${escapeHtml(copy.togetherTitle)}</h2><p>${escapeHtml(copy.togetherBody)}</p></header>
        <div class="sample-match">
          <article class="sample-match__person"><span>${escapeHtml(sampleArchetype.symbol)}</span><strong>${escapeHtml(localize(sampleArchetype.name, app.language))}</strong><small>${app.language === 'kr' ? '내 취향 예시' : 'My sample taste'}</small></article>
          <div class="sample-match__scores"><div><b>${escapeHtml(resonanceLabel)}</b><span>${app.language === 'kr' ? `공명도 · ${sampleMatch.resonance}` : `Resonance · ${sampleMatch.resonance}`}</span></div><i></i><div><b>${escapeHtml(discoveryLabel)}</b><span>${app.language === 'kr' ? `발견 가능성 · ${sampleMatch.discovery}` : `Discovery · ${sampleMatch.discovery}`}</span></div></div>
          <article class="sample-match__person"><span>${escapeHtml(friendArchetype.symbol)}</span><strong>${escapeHtml(localize(friendArchetype.name, app.language))}</strong><small>${app.language === 'kr' ? '친구 취향 예시' : 'Friend sample taste'}</small></article>
        </div>
        <div class="editorial-tracklist editorial-tracklist--compact">${trackRows(sampleMatch.bridgeTracks, app.language, 'brand_match_sample', 3)}</div>
        <button class="editorial-text-link" type="button" data-route="match">${escapeHtml(copy.openMatch)} →</button>
      </section>

      <section class="editorial-privacy">
        <span class="editorial-privacy__mark">LOCAL<br>FIRST</span>
        <div><span class="editorial-kicker">PRIVATE BY DEFAULT</span><h2>${escapeHtml(copy.privacyTitle)}</h2><p>${escapeHtml(copy.privacyBody)}</p></div>
        <button type="button" data-action="privacy">${escapeHtml(copy.footerPrivacy)} →</button>
      </section>
    </div>
  `;

  app.renderNotice();
  track('landing_view', { product_version: 'v2-bd1', has_profile: hasProfile, referral_present: Boolean(app.friendProfile), design_release: BRAND_RELEASE, showcase_version: 'e1-fixed' });
}

function updateHomeAudioDom(app, optionId, current, duration) {
  const safeDuration = Math.min(Number.isFinite(duration) ? duration : HOME_PREVIEW_SECONDS, HOME_PREVIEW_SECONDS);
  const safeCurrent = Math.min(current || 0, safeDuration);
  const percent = safeDuration ? Math.round((safeCurrent / safeDuration) * 100) : 0;
  const option = app.root.querySelector(`[data-brand-option="${CSS.escape(optionId)}"]`);
  const fill = app.root.querySelector(`[data-brand-progress="${CSS.escape(optionId)}"]`);
  const time = app.root.querySelector(`[data-brand-time="${CSS.escape(optionId)}"]`);
  if (fill) fill.style.width = `${percent}%`;
  if (time) time.textContent = `0:${String(Math.floor(safeCurrent)).padStart(2, '0')}`;
  option?.classList.toggle('is-playing', Boolean(app.brandPreviewAudio && !app.brandPreviewAudio.paused));
}

function stopHomePreview(app, reset = false) {
  window.clearTimeout(app.brandPreviewTimer);
  app.brandPreviewTimer = null;
  const audio = app.brandPreviewAudio;
  const optionId = app.brandPreviewOptionId;
  app.brandPreviewAudio = null;
  app.brandPreviewOptionId = '';
  if (audio) {
    audio.pause();
    if (reset) audio.currentTime = 0;
    audio.removeAttribute('src');
    audio.load();
  }
  if (optionId && app.route === 'home') {
    const option = app.root.querySelector(`[data-brand-option="${CSS.escape(optionId)}"]`);
    option?.classList.remove('is-playing');
    const button = option?.querySelector('[data-action="brand-preview"]');
    if (button) button.innerHTML = `<span>▶</span>${escapeHtml(app.copy().preview)}`;
  }
}

function playHomePreview(app, optionId) {
  const question = PROFILE_QUESTIONS[0];
  const option = question.options.find((candidate) => candidate.id === optionId);
  if (!option?.audioSrc) return;
  if (app.brandPreviewOptionId === optionId && app.brandPreviewAudio && !app.brandPreviewAudio.paused) {
    stopHomePreview(app, true);
    return;
  }

  stopHomePreview(app, true);
  const audio = new Audio(option.audioSrc);
  app.brandPreviewAudio = audio;
  app.brandPreviewOptionId = optionId;
  audio.preload = 'metadata';
  audio.volume = 0.68;

  const optionElement = app.root.querySelector(`[data-brand-option="${CSS.escape(optionId)}"]`);
  const button = optionElement?.querySelector('[data-action="brand-preview"]');
  optionElement?.classList.add('is-playing');
  if (button) button.innerHTML = `<span>Ⅱ</span>${escapeHtml(app.copy().stop)}`;

  const fail = () => {
    app.brandAudioErrors.add(optionId);
    optionElement?.classList.add('has-error');
    optionElement?.classList.remove('is-playing');
    stopHomePreview(app, true);
    track('audio_error', { product_version: 'v2-bd1', audio_context: 'home_listening_booth', question_id: question.id, option_id: option.id });
  };
  audio.addEventListener('timeupdate', () => {
    updateHomeAudioDom(app, optionId, audio.currentTime, audio.duration);
    if (audio.currentTime >= 3) {
      app.brandHeardIds.add(optionId);
      optionElement?.classList.add('is-heard');
    }
    if (audio.currentTime >= HOME_PREVIEW_SECONDS) {
      app.brandHeardIds.add(optionId);
      stopHomePreview(app, true);
    }
  });
  audio.addEventListener('ended', () => {
    app.brandHeardIds.add(optionId);
    optionElement?.classList.add('is-heard');
    stopHomePreview(app, true);
  }, { once: true });
  audio.addEventListener('error', fail, { once: true });
  app.brandPreviewTimer = window.setTimeout(() => {
    if (app.brandPreviewAudio === audio && audio.readyState < 2) fail();
  }, 2500);
  audio.play().then(() => {
    window.clearTimeout(app.brandPreviewTimer);
    track('audio_play', { product_version: 'v2-bd1', audio_context: 'home_listening_booth', question_id: question.id, option_id: option.id });
  }).catch(fail);
}

function startFromHomeChoice(app, optionId) {
  const question = PROFILE_QUESTIONS[0];
  const option = question.options.find((candidate) => candidate.id === optionId);
  if (!option) return;
  stopHomePreview(app, true);
  app.answers = [{ questionId: question.id, optionId: option.id }];
  app.quizIndex = 1;
  app.startedAt = Date.now();
  app.selectionLocked = false;
  track('start_test', { product_version: 'v2-bd1', test_mode: 'vibe_profile_10', question_count: PROFILE_QUESTIONS.length, entry_point: 'home_listening_booth' });
  track('question_answer', { product_version: 'v2-bd1', test_mode: 'vibe_profile_10', question_id: question.id, question_number: 1, question_kind: question.kind, selected_option: option.id, entry_point: 'home_listening_booth' });
  app.navigate('discover');
}

function install(app) {
  if (app.__brandDesignInstalled) return;
  app.__brandDesignInstalled = true;
  app.brandPreviewAudio = null;
  app.brandPreviewOptionId = '';
  app.brandPreviewTimer = null;
  app.brandHeardIds = new Set();
  app.brandAudioErrors = new Set();

  app.copy = function brandCopy() {
    return BRAND_COPY[this.language === 'en' ? 'en' : 'kr'];
  };
  app.renderHeader = function brandHeader() { renderHeader(this); };
  app.renderFooter = function brandFooter() { renderFooter(this); };
  app.renderHome = function brandHome() { renderHome(this); };

  const originalHandleClick = app.handleClick.bind(app);
  app.handleClick = function brandHandleClick(event) {
    const action = event.target.closest('[data-action]')?.dataset.action;
    if (action === 'brand-preview') {
      event.preventDefault();
      playHomePreview(this, event.target.closest('[data-option-id]')?.dataset.optionId);
      return;
    }
    if (action === 'brand-choose') {
      event.preventDefault();
      startFromHomeChoice(this, event.target.closest('[data-option-id]')?.dataset.optionId);
      return;
    }
    if (action === 'brand-focus-booth') {
      event.preventDefault();
      const booth = document.getElementById('listening-booth');
      booth?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      booth?.querySelector('[data-action="brand-preview"]')?.focus({ preventScroll: true });
      return;
    }
    if (action === 'brand-scroll-sample') {
      event.preventDefault();
      document.getElementById('result-example')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      return;
    }
    return originalHandleClick(event);
  };

  const originalHandleRouteChange = app.handleRouteChange.bind(app);
  app.handleRouteChange = function brandRouteChange() {
    stopHomePreview(this, true);
    return originalHandleRouteChange();
  };

  const originalRender = app.render.bind(app);
  app.render = function brandRender() {
    document.body.dataset.route = this.route;
    document.body.dataset.brandRelease = BRAND_RELEASE;
    const result = originalRender();
    document.body.classList.remove('brand-pending');
    return result;
  };

  document.documentElement.dataset.brandRelease = BRAND_RELEASE;
  app.render();
}

function bootBrandDesign() {
  const ready = window.__musicVibeV2;
  if (ready) {
    install(ready);
    return;
  }
  let attempts = 0;
  const timer = window.setInterval(() => {
    attempts += 1;
    if (window.__musicVibeV2) {
      window.clearInterval(timer);
      install(window.__musicVibeV2);
    } else if (attempts > 100) {
      window.clearInterval(timer);
      document.body.classList.remove('brand-pending');
    }
  }, 25);
}

bootBrandDesign();
