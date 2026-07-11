import { getProfileArchetype } from '../../domain/profile.mjs?v=qg1';
import { compareProfiles } from '../../domain/match.mjs';
import { buildInviteUrl } from '../../infrastructure/share.mjs?v=qg1';
import { escapeHtml, profileMiniCard, track, trackCard } from '../helpers.mjs?ui=f1';
import { renderEmptyProfile } from './empty.mjs?ui=f1';

export function renderMatch(app) {
  const copy = app.copy();
  if (!app.profile) {
    renderEmptyProfile(app, app.friendProfile ? copy.invitedDesc : copy.matchInviteDesc, copy.beginProfile);
    return;
  }

  if (!app.friendProfile) {
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
        <article class="mini-profile mini-profile--empty"><span aria-hidden="true">?</span><strong>${escapeHtml(copy.matchFriend)}</strong><small>${app.language === 'kr' ? '링크를 열고 취향 기록 만들기' : 'Opens the link and creates taste notes'}</small></article>
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
    track('match_view', { state: 'invite', profile_id: app.profile.id, product_version: 'v2-f1' });
    return;
  }

  const match = compareProfiles(app.profile, app.friendProfile, app.language);
  app.root.innerHTML = `
    <div id="app-notice" class="app-notice"></div>
    <section class="match-hero">
      <span class="eyebrow">${escapeHtml(copy.matchEyebrow)}</span>
      <h1>${escapeHtml(copy.matchTitle)}</h1>
      <div class="match-pair">
        ${profileMiniCard(app.profile, copy.matchYou, app.language)}
        <div class="match-score quality-match-score">
          <div><strong>${escapeHtml(match.resonanceLabel)}</strong><span>${app.language === 'kr' ? `공명도 · ${match.resonance}` : `Resonance · ${match.resonance}`}</span></div>
          <i></i>
          <div><strong>${escapeHtml(match.discoveryLabel)}</strong><span>${app.language === 'kr' ? `발견 가능성 · ${match.discovery}` : `Discovery · ${match.discovery}`}</span></div>
          <small>${escapeHtml(match.label)}</small>
        </div>
        ${profileMiniCard(app.friendProfile, copy.matchFriend, app.language)}
      </div>
      <p class="match-method-note">${app.language === 'kr' ? '공명도는 이미 함께 머무는 지점을, 발견 가능성은 서로의 선곡을 넓힐 여지를 보여줘요.' : 'Resonance shows where you already meet; Discovery shows how each person can widen the other’s listening.'}</p>
    </section>
    <section class="match-insights">
      <article class="panel"><span class="eyebrow">${escapeHtml(copy.matchCommon)}</span><ul>${(match.common.length ? match.common : [{ text: copy.matchNoCommon }]).map((item) => `<li>${escapeHtml(item.text)}</li>`).join('')}</ul></article>
      <article class="panel"><span class="eyebrow">${escapeHtml(copy.matchDifference)}</span><ul>${(match.differences.length ? match.differences : [{ text: copy.matchNoDifference }]).map((item) => `<li>${escapeHtml(item.text)}</li>`).join('')}</ul></article>
    </section>
    <section class="recommendation-list recommendation-list--bridge">
      <div class="list-heading"><div><span class="eyebrow">${app.language === 'kr' ? '두 취향 사이의 선곡' : 'BRIDGE PLAYLIST'}</span><h2>${escapeHtml(copy.matchPlaylist)}</h2></div><span>5 TRACKS</span></div>
      ${match.bridgeTracks.map((candidate) => trackCard(candidate, app.language, 'bridge_playlist')).join('')}
    </section>
    <section class="utility-actions">
      <button type="button" data-action="share-profile">${escapeHtml(copy.matchShare)}</button>
      <button type="button" data-action="clear-friend">${app.language === 'kr' ? '다른 친구와 비교' : 'Compare another friend'}</button>
    </section>
  `;

  track('match_view', {
    state: 'result',
    compatibility_score: match.score,
    resonance: match.resonance,
    discovery: match.discovery,
    profile_id: app.profile.id,
    friend_profile_id: app.friendProfile.id,
    product_version: 'v2-f1'
  });
  track('ref_complete', {
    ref_type: app.friendProfile.archetypeId,
    result_type: getProfileArchetype(app.profile).id,
    compatibility_score: match.score
  });
}
