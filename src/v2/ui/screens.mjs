import { AXES } from '../data/axes.mjs';
import { PROFILE_QUESTIONS } from '../data/questions.mjs';
import { VIBE_CONTEXTS, CONTEXT_BY_ID } from '../data/contexts.mjs';
import { getProfileArchetype, localize } from '../domain/profile.mjs';
import { recommendationSummary } from '../domain/recommendation.mjs';
import { compareProfiles } from '../domain/match.mjs';
import { loadNowHistory } from '../infrastructure/storage.mjs';
import { buildInviteUrl } from '../infrastructure/share.mjs';
import { axisDirection, escapeHtml, profileMiniCard, track, trackCard } from './helpers.mjs';

export const screenMethods = {
  renderHome() {
    const copy = this.copy();
    const hasProfile = Boolean(this.profile);
    const profile = this.profile ? getProfileArchetype(this.profile) : null;
    const invite = this.friendProfile ? `
      <section class="invite-banner">
        <div class="invite-banner__symbol">${escapeHtml(getProfileArchetype(this.friendProfile).symbol)}</div>
        <div>
          <span class="eyebrow">VIBE MATCH INVITE</span>
          <h2>${escapeHtml(copy.invitedTitle)}</h2>
          <p>${escapeHtml(copy.invitedDesc)}</p>
          ${this.friendSource.startsWith('legacy_') ? `<small>${escapeHtml(copy.legacyInvite)}</small>` : ''}
        </div>
        <button class="button button--light" type="button" data-route="${hasProfile ? 'match' : 'discover'}">${escapeHtml(hasProfile ? copy.openMatch : copy.beginProfile)}</button>
      </section>
    ` : '';

    this.root.innerHTML = `
      <div id="app-notice" class="app-notice"></div>
      <section class="hero">
        <div class="hero__glow hero__glow--one"></div>
        <div class="hero__glow hero__glow--two"></div>
        <div class="hero__copy">
          <span class="eyebrow">${escapeHtml(copy.homeEyebrow)}</span>
          <h1>${escapeHtml(copy.homeTitle).replaceAll('\n', '<br>')}</h1>
          <p>${escapeHtml(copy.homeDescription)}</p>
          <div class="hero__actions">
            <button class="button button--primary" type="button" data-route="${hasProfile ? 'profile' : 'discover'}">${escapeHtml(hasProfile ? copy.continueProfile : copy.beginProfile)}</button>
            <button class="button button--ghost" type="button" data-route="now">${escapeHtml(copy.openNow)}</button>
          </div>
          ${hasProfile ? `
            <div class="saved-profile-chip">
              <span>${escapeHtml(profile.symbol)}</span>
              <div><small>${escapeHtml(copy.existingProfile)}</small><strong>${escapeHtml(localize(profile.name, this.language))}</strong></div>
            </div>
          ` : ''}
        </div>
        <div class="hero__visual" aria-hidden="true">
          <div class="orbit orbit--outer"></div>
          <div class="orbit orbit--inner"></div>
          <div class="vibe-disc"><span>${hasProfile ? escapeHtml(profile.symbol) : '♫'}</span></div>
          <span class="floating-label floating-label--one">ENERGY</span>
          <span class="floating-label floating-label--two">TEXTURE</span>
          <span class="floating-label floating-label--three">NOVELTY</span>
        </div>
      </section>
      ${invite}
      <section class="product-grid" aria-label="Product features">
        <article class="product-card product-card--profile">
          <span class="product-card__number">01</span><span class="product-card__icon">◉</span>
          <h2>${escapeHtml(copy.homeProfileTitle)}</h2><p>${escapeHtml(copy.homeProfileDesc)}</p>
          <button type="button" data-route="${hasProfile ? 'profile' : 'discover'}">${escapeHtml(hasProfile ? copy.continueProfile : copy.beginProfile)} <span>→</span></button>
        </article>
        <article class="product-card product-card--now">
          <span class="product-card__number">02</span><span class="product-card__icon">☾</span>
          <h2>${escapeHtml(copy.homeNowTitle)}</h2><p>${escapeHtml(copy.homeNowDesc)}</p>
          <button type="button" data-route="now">${escapeHtml(copy.openNow)} <span>→</span></button>
        </article>
        <article class="product-card product-card--match">
          <span class="product-card__number">03</span><span class="product-card__icon">∞</span>
          <h2>${escapeHtml(copy.homeMatchTitle)}</h2><p>${escapeHtml(copy.homeMatchDesc)}</p>
          <button type="button" data-route="match">${escapeHtml(copy.openMatch)} <span>→</span></button>
        </article>
      </section>
      <section class="dimension-preview">
        <div><span class="eyebrow">SIX-DIMENSION PROFILE</span><h2>${this.language === 'kr' ? '한 글자 유형이 아니라, 취향의 모양을 보여줘요.' : 'Not a four-letter type—a shape of taste.'}</h2></div>
        <div class="dimension-preview__bars">
          ${AXES.map((axis, index) => `<div><span>${escapeHtml(localize(axis.label, this.language))}</span><i style="--value:${[72, 84, 61, 47, 77, 39][index]}%"></i></div>`).join('')}
        </div>
      </section>
    `;

    track('landing_view', {
      product_version: 'v2',
      has_profile: hasProfile,
      referral_present: Boolean(this.friendProfile)
    });
  },

  renderDiscover() {
    const copy = this.copy();
    const question = PROFILE_QUESTIONS[this.quizIndex];
    if (!question) {
      this.finishProfile();
      return;
    }
    const progress = ((this.quizIndex + 1) / PROFILE_QUESTIONS.length) * 100;
    const isAudio = question.kind === 'audio';

    this.root.innerHTML = `
      <div id="app-notice" class="app-notice"></div>
      <section class="quiz-shell">
        <div class="quiz-topline">
          <button type="button" class="text-button" data-action="quit-quiz">← ${escapeHtml(copy.quitQuiz)}</button>
          <span>${this.quizIndex + 1} / ${PROFILE_QUESTIONS.length}</span>
        </div>
        <div class="progress"><i style="width:${progress}%"></i></div>
        <div class="quiz-copy">
          <span class="eyebrow">${escapeHtml(copy.quizEyebrow)}</span>
          <div class="quiz-kind"><span>${isAudio ? '♫' : '◇'}</span>${escapeHtml(isAudio ? copy.quizAudio : copy.quizChoice)}</div>
          <h1>${escapeHtml(localize(question.prompt, this.language))}</h1>
          <p>${escapeHtml(localize(question.helper, this.language))}</p>
        </div>
        <div class="option-grid ${isAudio ? 'option-grid--audio' : ''}">
          ${question.options.map((option, index) => `
            <article class="option-card">
              <div class="option-card__top"><span>${index === 0 ? 'A' : 'B'}</span><div><h2>${escapeHtml(localize(option.label, this.language))}</h2><p>${escapeHtml(localize(option.description, this.language))}</p></div></div>
              ${isAudio ? `<button type="button" class="preview-button ${this.previewOptionId === option.id ? 'is-playing' : ''}" data-action="preview" data-option-id="${escapeHtml(option.id)}"><span>${this.previewOptionId === option.id ? 'Ⅱ' : '▶'}</span>${escapeHtml(this.previewOptionId === option.id ? copy.stop : copy.preview)}</button>` : ''}
              <button type="button" class="button button--option" data-action="choose-option" data-option-id="${escapeHtml(option.id)}">${escapeHtml(copy.choose)} <span>→</span></button>
            </article>
          `).join('')}
        </div>
      </section>
    `;
  },

  renderProfile() {
    const copy = this.copy();
    if (!this.profile) {
      this.renderEmptyProfile(copy.profileMeaning, copy.beginProfile);
      return;
    }
    const archetype = getProfileArchetype(this.profile);
    const [start, middle, end] = archetype.gradient;
    const strongest = AXES
      .map((axis) => ({ axis, distance: Math.abs(this.profile.scores[axis.id] - 50), score: this.profile.scores[axis.id] }))
      .sort((left, right) => right.distance - left.distance)
      .slice(0, 3);

    this.root.innerHTML = `
      <div id="app-notice" class="app-notice"></div>
      <section class="profile-hero" style="--profile-start:${start};--profile-middle:${middle};--profile-end:${end}">
        <div class="profile-hero__copy">
          <span class="eyebrow">${escapeHtml(copy.profileEyebrow)}</span>
          <span class="profile-hero__symbol">${escapeHtml(archetype.symbol)}</span>
          <h1>${escapeHtml(localize(archetype.name, this.language))}</h1>
          <p class="profile-hero__tagline">${escapeHtml(localize(archetype.tagline, this.language))}</p>
          <div class="keyword-row">${localize(archetype.keywords, this.language).map((keyword) => `<span>${escapeHtml(keyword)}</span>`).join('')}</div>
          <small>${escapeHtml(this.profile.id)} · ${escapeHtml(copy.profileSaved)}</small>
        </div>
        <div class="profile-hero__radar" aria-label="Music taste dimensions">
          ${AXES.map((axis, index) => {
            const score = this.profile.scores[axis.id];
            return `<div class="radar-spoke" style="--angle:${index * 60}deg;--score:${score}%"><i></i><span>${escapeHtml(localize(axis.label, this.language))}</span></div>`;
          }).join('')}
          <div class="radar-core">${escapeHtml(archetype.symbol)}</div>
        </div>
      </section>
      <section class="profile-layout">
        <article class="panel">
          <span class="eyebrow">${escapeHtml(copy.profileWhy)}</span>
          <h2>${escapeHtml(localize(archetype.tagline, this.language))}</h2>
          <p class="long-copy">${escapeHtml(localize(archetype.description, this.language))}</p>
          <ul class="why-list">
            ${strongest.map(({ axis, score }) => `<li><strong>${escapeHtml(localize(axis.label, this.language))}</strong><span>${escapeHtml(axisDirection(axis, score, this.language))} · ${score}</span></li>`).join('')}
          </ul>
          <p class="fine-print">${escapeHtml(copy.profileMeaning)}</p>
        </article>
        <article class="panel panel--axes">
          <span class="eyebrow">${escapeHtml(copy.profileAxes)}</span>
          <div class="axis-list">
            ${AXES.map((axis) => {
              const score = this.profile.scores[axis.id];
              return `<div class="axis-row"><div><strong>${escapeHtml(localize(axis.label, this.language))}</strong><span>${escapeHtml(axisDirection(axis, score, this.language))}</span></div><b>${score}</b><i><em style="width:${score}%"></em></i></div>`;
            }).join('')}
          </div>
        </article>
      </section>
      <section class="action-band">
        <div><span class="eyebrow">NEXT LISTEN</span><h2>${this.language === 'kr' ? '프로필을 결과가 아니라 출발점으로 사용해보세요.' : 'Use the profile as a starting point, not an ending.'}</h2></div>
        <div class="action-band__buttons">
          <button class="button button--light" type="button" data-route="now">${escapeHtml(copy.profileNow)}</button>
          <button class="button button--ghost" type="button" data-route="match">${escapeHtml(copy.profileMatch)}</button>
        </div>
      </section>
      <section class="utility-actions">
        <button type="button" data-action="share-profile">${escapeHtml(copy.profileShare)}</button>
        <button type="button" data-action="download-card">${escapeHtml(copy.profileDownload)}</button>
        <button type="button" data-action="retake-profile">${escapeHtml(copy.profileRetake)}</button>
        <button type="button" data-action="clear-profile" class="danger-link">${this.language === 'kr' ? '프로필 삭제' : 'Delete profile'}</button>
      </section>
    `;

    track('result_view', {
      product_version: 'v2',
      result_type: archetype.id,
      profile_id: this.profile.id,
      result_origin: this.profile.source
    });
  },

  renderEmptyProfile(description, buttonLabel) {
    this.root.innerHTML = `
      <div id="app-notice" class="app-notice"></div>
      <section class="empty-state">
        <span class="empty-state__symbol">♫</span>
        <span class="eyebrow">VIBE PROFILE REQUIRED</span>
        <h1>${this.language === 'kr' ? '먼저 나의 음악 취향을 만들어볼까요?' : 'Create your music identity first.'}</h1>
        <p>${escapeHtml(description)}</p>
        <button type="button" class="button button--primary" data-route="discover">${escapeHtml(buttonLabel)}</button>
      </section>
    `;
  },

  renderNow() {
    const copy = this.copy();
    if (!this.profile) {
      this.renderEmptyProfile(copy.nowNeedProfile, copy.beginProfile);
      return;
    }

    if (!this.selectedContextId) {
      const recent = loadNowHistory()[0];
      this.root.innerHTML = `
        <div id="app-notice" class="app-notice"></div>
        <section class="section-heading">
          <span class="eyebrow">${escapeHtml(copy.nowEyebrow)}</span>
          <h1>${escapeHtml(copy.nowTitle)}</h1>
          <p>${escapeHtml(copy.nowDescription)}</p>
        </section>
        ${recent ? `<button class="recent-session" type="button" data-action="restore-context" data-context-id="${escapeHtml(recent.contextId)}"><span>${this.language === 'kr' ? '최근 선택' : 'Recent'}</span><strong>${escapeHtml(localize(CONTEXT_BY_ID[recent.contextId]?.label, this.language))}</strong><em>→</em></button>` : ''}
        <section class="context-grid">
          ${VIBE_CONTEXTS.map((context) => `
            <button type="button" class="context-card" data-action="select-context" data-context-id="${escapeHtml(context.id)}">
              <span>${escapeHtml(context.icon)}</span><h2>${escapeHtml(localize(context.label, this.language))}</h2><p>${escapeHtml(localize(context.description, this.language))}</p><em>→</em>
            </button>
          `).join('')}
        </section>
      `;
      track('vibe_now_view', { state: 'context_picker', profile_id: this.profile.id });
      return;
    }

    const context = CONTEXT_BY_ID[this.selectedContextId];
    this.root.innerHTML = `
      <div id="app-notice" class="app-notice"></div>
      <section class="now-hero">
        <button type="button" class="text-button" data-action="change-context">← ${escapeHtml(copy.nowChange)}</button>
        <div class="now-hero__symbol">${escapeHtml(context.icon)}</div>
        <span class="eyebrow">${escapeHtml(copy.nowEyebrow)} · ${escapeHtml(localize(context.shortLabel, this.language))}</span>
        <h1>${escapeHtml(localize(context.label, this.language))}</h1>
        <p>${escapeHtml(recommendationSummary(this.profile, context.id, this.language))}</p>
      </section>
      <section class="recommendation-list" aria-label="${escapeHtml(copy.nowResultTitle)}">
        <div class="list-heading"><h2>${escapeHtml(copy.nowResultTitle)}</h2><span>${this.recommendations.length} TRACKS</span></div>
        ${this.recommendations.map((candidate) => trackCard(candidate, this.language, 'vibe_now')).join('')}
      </section>
      <section class="action-band action-band--compact">
        <div><span class="eyebrow">VIBE MATCH</span><h2>${this.language === 'kr' ? '이 선곡을 친구 취향과 섞어볼까요?' : 'Blend this direction with a friend’s taste.'}</h2></div>
        <button class="button button--light" type="button" data-route="match">${escapeHtml(copy.openMatch)}</button>
      </section>
    `;
  },

  renderMatch() {
    const copy = this.copy();
    if (!this.profile) {
      this.renderEmptyProfile(this.friendProfile ? copy.invitedDesc : copy.matchInviteDesc, copy.beginProfile);
      return;
    }

    if (!this.friendProfile) {
      const inviteUrl = buildInviteUrl(this.profile, this.language);
      this.root.innerHTML = `
        <div id="app-notice" class="app-notice"></div>
        <section class="section-heading section-heading--center">
          <span class="eyebrow">${escapeHtml(copy.matchEyebrow)}</span>
          <h1>${escapeHtml(copy.matchInviteTitle)}</h1>
          <p>${escapeHtml(copy.matchInviteDesc)}</p>
        </section>
        <section class="invite-builder">
          ${profileMiniCard(this.profile, copy.matchYou, this.language)}
          <div class="invite-builder__plus">+</div>
          <article class="mini-profile mini-profile--empty"><span>?</span><strong>${escapeHtml(copy.matchFriend)}</strong><small>${this.language === 'kr' ? '링크를 열고 프로필 생성' : 'Opens link and creates a profile'}</small></article>
          <div class="invite-builder__actions">
            <button class="button button--primary" type="button" data-action="share-profile">${escapeHtml(copy.matchShare)}</button>
            <button class="button button--ghost" type="button" data-action="copy-invite">${escapeHtml(copy.matchCopy)}</button>
          </div>
          <code class="invite-code">${escapeHtml(inviteUrl)}</code>
        </section>
        <form class="load-invite" data-form="load-invite">
          <label for="invite-input">${escapeHtml(copy.matchPasteLabel)}</label>
          <div><input id="invite-input" name="invite" placeholder="${escapeHtml(copy.matchPastePlaceholder)}" autocomplete="off"><button type="submit">${escapeHtml(copy.matchLoad)}</button></div>
        </form>
      `;
      track('match_view', { state: 'invite', profile_id: this.profile.id });
      return;
    }

    const match = compareProfiles(this.profile, this.friendProfile, this.language);
    this.root.innerHTML = `
      <div id="app-notice" class="app-notice"></div>
      <section class="match-hero">
        <span class="eyebrow">${escapeHtml(copy.matchEyebrow)}</span>
        <h1>${escapeHtml(copy.matchTitle)}</h1>
        <div class="match-pair">
          ${profileMiniCard(this.profile, copy.matchYou, this.language)}
          <div class="match-score"><strong>${match.score}</strong><span>%</span><small>${escapeHtml(match.label)}</small></div>
          ${profileMiniCard(this.friendProfile, copy.matchFriend, this.language)}
        </div>
      </section>
      <section class="match-insights">
        <article class="panel"><span class="eyebrow">${escapeHtml(copy.matchCommon)}</span><ul>${(match.common.length ? match.common : [{ text: copy.matchNoCommon }]).map((item) => `<li>${escapeHtml(item.text)}</li>`).join('')}</ul></article>
        <article class="panel"><span class="eyebrow">${escapeHtml(copy.matchDifference)}</span><ul>${(match.differences.length ? match.differences : [{ text: copy.matchNoDifference }]).map((item) => `<li>${escapeHtml(item.text)}</li>`).join('')}</ul></article>
      </section>
      <section class="recommendation-list recommendation-list--bridge">
        <div class="list-heading"><div><span class="eyebrow">BRIDGE PLAYLIST</span><h2>${escapeHtml(copy.matchPlaylist)}</h2></div><span>5 TRACKS</span></div>
        ${match.bridgeTracks.map((candidate) => trackCard(candidate, this.language, 'bridge_playlist')).join('')}
      </section>
      <section class="utility-actions">
        <button type="button" data-action="share-profile">${escapeHtml(copy.matchShare)}</button>
        <button type="button" data-action="clear-friend">${this.language === 'kr' ? '다른 친구와 비교' : 'Compare another friend'}</button>
      </section>
    `;

    track('match_view', {
      state: 'result',
      compatibility_score: match.score,
      profile_id: this.profile.id,
      friend_profile_id: this.friendProfile.id
    });
    track('ref_complete', {
      ref_type: this.friendProfile.archetypeId,
      result_type: getProfileArchetype(this.profile).id,
      compatibility_score: match.score
    });
  }
};
