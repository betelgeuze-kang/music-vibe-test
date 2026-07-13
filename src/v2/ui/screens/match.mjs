import { getProfileArchetype } from '../../domain/profile.mjs?v=qg1';
import { compareProfiles } from '../../domain/match.mjs?engagement=m4f1';
import { buildInviteUrl } from '../../infrastructure/share.mjs?v=qg1';
import { escapeHtml, profileMiniCard, track, trackCard } from '../helpers.mjs?v3=nv1';
import { renderEmptyProfile } from './empty.mjs?v3=nv1';

function refreshPanel(app) {
  if (app.feedbackChangesSinceRefresh < 2) return '';
  const korean = app.language === 'kr';
  return `
    <section class="feedback-refresh feedback-refresh--bridge" aria-live="polite">
      <div>
        <span class="eyebrow">${korean ? '내 쪽에서 두 곡이 달라 보였어요' : 'TWO SONGS FELT DIFFERENT ON YOUR SIDE'}</span>
        <h2>${korean ? '친구의 기록은 그대로 두고, 둘 사이의 다섯 곡만 다시 놓을까요?' : 'Keep your friend’s note untouched and choose the five between you again?'}</h2>
        <p>${korean ? '친구가 좋아할 것이라고 짐작하지 않습니다. 두 기록이 겹치는 자리 안에서 내가 남긴 반응만 조금 읽습니다.' : 'We do not guess what your friend would like. We only read your own notes inside the ground the two profiles share.'}</p>
      </div>
      <button class="button button--primary" type="button" data-action="refresh-recommendations">${korean ? '둘 사이의 다섯 곡 다시 놓기' : 'Choose the five between us again'}</button>
    </section>
  `;
}

export function renderMatch(app) {
  const copy = app.copy();
  const korean = app.language === 'kr';
  if (!app.profile) {
    renderEmptyProfile(app, app.friendProfile ? copy.invitedDesc : copy.matchInviteDesc, copy.beginProfile);
    return;
  }

  if (!app.friendProfile) {
    app.matchResult = null;
    const inviteUrl = buildInviteUrl(app.profile, app.language);
    app.root.innerHTML = `
      <div id="app-notice" class="app-notice"></div>
      <section class="section-heading section-heading--center">
        <span class="eyebrow">${escapeHtml(copy.matchEyebrow)}</span>
        <h1>${escapeHtml(copy.matchInviteTitle)}</h1>
        <p>${escapeHtml(copy.matchInviteDesc)}</p>
      </section>
      <section class="invite-builder">
        ${profileMiniCard(app.profile, copy.matchYou, app.language)}
        <div class="invite-builder__plus" aria-hidden="true">+</div>
        <article class="mini-profile mini-profile--empty"><span aria-hidden="true">?</span><strong>${escapeHtml(copy.matchFriend)}</strong><small>${korean ? '링크를 열고 열 번의 선택 남기기' : 'Open the link and leave ten choices'}</small></article>
        <div class="invite-builder__actions">
          <button class="button button--primary" type="button" data-action="share-profile">${escapeHtml(copy.matchShare)}</button>
          <button class="button button--ghost" type="button" data-action="copy-invite">${escapeHtml(copy.matchCopy)}</button>
        </div>
        <code class="invite-code">${escapeHtml(inviteUrl)}</code>
        <p class="invite-builder__privacy">${korean ? '링크에는 이름이 아니라 여섯 방향과 익명 ID만 담깁니다.' : 'The link carries six directions and an anonymous ID, not a name.'}</p>
      </section>
      <form class="load-invite" data-form="load-invite">
        <label for="invite-input">${escapeHtml(copy.matchPasteLabel)}</label>
        <div><input id="invite-input" name="invite" placeholder="${escapeHtml(copy.matchPastePlaceholder)}" autocomplete="off"><button type="submit">${escapeHtml(copy.matchLoad)}</button></div>
      </form>
    `;
    app.renderNotice();
    track('match_view', { state: 'invite', profile_id: app.profile.id, product_version: 'v3-nv1' });
    return;
  }

  const generated = !app.matchResult;
  const match = app.matchResult || compareProfiles(app.profile, app.friendProfile, app.language, { feedbackRecords: app.trackFeedback });
  app.matchResult = match;
  if (generated) app.feedbackChangesSinceRefresh = 0;
  app.root.innerHTML = `
    <div id="app-notice" class="app-notice"></div>
    <section class="match-hero">
      <span class="eyebrow">${escapeHtml(copy.matchEyebrow)}</span>
      <h1>${escapeHtml(copy.matchTitle)}</h1>
      <div class="match-pair">
        ${profileMiniCard(app.profile, copy.matchYou, app.language)}
        <div class="match-score quality-match-score">
          <div><strong>${escapeHtml(match.resonanceLabel)}</strong><span>${korean ? `함께 편안한 자리 · ${match.resonance}` : `Easy ground · ${match.resonance}`}</span></div>
          <i aria-hidden="true"></i>
          <div><strong>${escapeHtml(match.discoveryLabel)}</strong><span>${korean ? `새 노래를 건넬 여지 · ${match.discovery}` : `Room for a new song · ${match.discovery}`}</span></div>
          <small>${escapeHtml(match.label)}</small>
        </div>
        ${profileMiniCard(app.friendProfile, copy.matchFriend, app.language)}
      </div>
      <p class="match-method-note">${korean ? '첫 숫자는 이미 함께 앉을 수 있는 자리를, 둘째 숫자는 서로에게 아직 건네지 않은 노래의 자리를 가리킵니다.' : 'The first number marks where you can already sit together; the second marks the songs you have not yet handed one another.'}</p>
    </section>
    <section class="match-insights">
      <article class="panel"><span class="eyebrow">${escapeHtml(copy.matchCommon)}</span><ul>${(match.common.length ? match.common : [{ text: copy.matchNoCommon }]).map((item) => `<li>${escapeHtml(item.text)}</li>`).join('')}</ul></article>
      <article class="panel"><span class="eyebrow">${escapeHtml(copy.matchDifference)}</span><ul>${(match.differences.length ? match.differences : [{ text: copy.matchNoDifference }]).map((item) => `<li>${escapeHtml(item.text)}</li>`).join('')}</ul></article>
    </section>
    <section class="recommendation-list recommendation-list--bridge">
      <div class="list-heading"><div><span class="eyebrow">${korean ? '두 사람 사이에 차례로 놓기' : 'SET BETWEEN TWO LISTENERS'}</span><h2>${escapeHtml(copy.matchPlaylist)}</h2></div><span>${korean ? '한쪽을 지우지 않은 다섯 곡' : 'FIVE WITHOUT ERASING EITHER SIDE'}</span></div>
      ${match.bridgeTracks.map((candidate) => trackCard(candidate, app.language, 'bridge_playlist', {
        feedbackEnabled: true,
        feedbackValue: app.trackFeedback[candidate.track.id]?.value || '',
        contextId: 'together'
      })).join('')}
    </section>
    ${refreshPanel(app)}
    <section class="utility-actions">
      <button type="button" data-action="share-profile">${escapeHtml(copy.matchShare)}</button>
      <button type="button" data-action="clear-friend">${korean ? '다른 친구의 기록 놓아보기' : 'Place another friend’s note here'}</button>
    </section>
  `;
  app.renderNotice();

  if (generated) {
    track('match_view', {
      state: 'result', compatibility_score: match.score, resonance: match.resonance, discovery: match.discovery,
      profile_id: app.profile.id, friend_profile_id: app.friendProfile.id, product_version: 'v3-nv1'
    });
    track('ref_complete', { ref_type: app.friendProfile.archetypeId, result_type: getProfileArchetype(app.profile).id, compatibility_score: match.score });
  }
}
