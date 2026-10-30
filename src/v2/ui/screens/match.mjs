import { getProfileArchetype } from '../../domain/profile.mjs?v=qg1';
import { compareProfiles } from '../../domain/match.mjs?engagement=m4f1&listening=ln1&journal=jn1';
import { escapeHtml, track, trackCard } from '../helpers.mjs?weekly=m4w1&listening=ln1&journal=jn1';
import { listenerCard } from '../components/listener-card.mjs?journal=jn1';
import { renderEmptyProfile } from './empty.mjs?ui=f1&listening=ln1';

function invitationSteps(language) {
  const steps = language === 'kr'
    ? [['링크 보내기', '내 취향이 담긴 초대 링크를 친구에게 보내요.'], ['각자의 취향 만들기', '친구도 열 번의 선택을 마치면 비교가 열려요.'], ['다섯 곡 함께 고르기', '닮은 점과 다른 점을 살펴보고 한 곡부터 열어봐요.']]
    : [['Send an invitation', 'Share a link containing your taste notes.'], ['Bring two tastes', 'Your friend makes ten choices to open the comparison.'], ['Start with one song', 'Explore five shared picks and open one you both like.']];
  return `<ol class="match-steps">${steps.map(([title, text], index) => `<li><span aria-hidden="true">0${index + 1}</span><div><strong>${title}</strong><p>${text}</p></div></li>`).join('')}</ol>`;
}

function pasteForm(app) {
  const copy = app.copy();
  return `<form class="load-invite" data-form="load-invite">
    <div class="load-invite__copy"><span class="notes-kicker">${app.language === 'kr' ? '이미 링크를 받았다면' : 'ALREADY HAVE AN INVITATION?'}</span><label for="invite-input">${escapeHtml(copy.matchPasteLabel)}</label><p id="invite-help">${app.language === 'kr' ? '친구의 전체 초대 링크를 붙여넣으면 내 취향과 바로 비교해요.' : 'Paste the full invitation link to compare it with your taste.'}</p></div>
    <div class="load-invite__controls"><input id="invite-input" name="invite" placeholder="${escapeHtml(copy.matchPastePlaceholder)}" autocomplete="off" autocapitalize="off" spellcheck="false" required maxlength="4096" aria-describedby="invite-help invite-error"><button class="notes-button notes-button--primary" type="submit">${escapeHtml(copy.matchLoad)} →</button></div>
    <p id="invite-error" class="invite-error" role="alert"></p>
  </form>`;
}

function refreshPanel(app) {
  if (app.feedbackChangesSinceRefresh < 2) return '';
  return `<section class="feedback-refresh feedback-refresh--bridge" aria-live="polite">
    <div><span class="eyebrow">${app.language === 'kr' ? '내 반응 반영' : 'USE MY FEEDBACK'}</span><h2>${app.language === 'kr' ? '이 반응으로 다섯 곡을 다시 골라볼까요?' : 'Find five tracks with this feedback?'}</h2><p>${app.language === 'kr' ? '친구의 취향 값은 유지하고, 두 취향 사이에서 내 반응을 조금 반영해요.' : 'Your friend’s taste stays intact; your feedback makes a small adjustment within the shared range.'}</p></div>
    <button class="notes-button notes-button--primary" type="button" data-action="refresh-recommendations">${app.language === 'kr' ? '둘이 들을 5곡 다시 고르기' : 'Refresh our five tracks'}</button>
  </section>`;
}

export function renderMatch(app) {
  const copy = app.copy();
  const korean = app.language === 'kr';
  if (!app.profile) {
    if (!app.friendProfile) {
      renderEmptyProfile(app, copy.matchInviteDesc, copy.beginProfile);
      return;
    }
    app.root.innerHTML = `<div id="app-notice" class="app-notice"></div>
      <section class="empty-state match-welcome">
        <div><span class="notes-kicker">${korean ? '친구에게 온 초대' : 'A FRIEND INVITED YOU'}</span><h1>${korean ? '친구의 선곡 옆에, 내 취향을 놓아보세요.' : 'Bring your taste to a friend’s listening table.'}</h1><p>${korean ? '내 취향을 만든 뒤, 두 사람의 닮은 점과 서로에게 새로울 다섯 곡을 만나요.' : 'Create your music taste notes first, then find your common ground and five songs to explore together.'}</p><button class="notes-button notes-button--primary" type="button" data-route="discover">${app.quizDraft ? (korean ? '이어서 선택하고 비교하기' : 'Continue and compare') : (korean ? '내 취향 만들고 비교하기' : 'Create my taste and compare')} →</button><small>${korean ? '가입 없이 이 브라우저에서 비교해요. 초대 링크에는 취향 수치와 익명 식별자가 담겨요.' : 'Compare in this browser without signing up. Invitations contain taste values and an anonymous identifier.'}</small><button class="notes-text-button" type="button" data-action="clear-friend">${korean ? '초대 닫기' : 'Dismiss invitation'}</button></div>
        ${listenerCard(app.friendProfile, copy.matchFriend, app.language)}
      </section>`;
    app.renderNotice();
    return;
  }

  if (!app.friendProfile) {
    app.matchResult = null;
    app.root.innerHTML = `<div id="app-notice" class="app-notice"></div>
      <div class="match-editorial">
        <section class="match-invitation">
          <div class="section-heading match-invitation__copy"><span class="notes-kicker">${escapeHtml(copy.matchEyebrow)}</span><h1>${korean ? '좋아하는 음악 사이에, 친구를 초대해요.' : 'Make room for a friend in your listening notes.'}</h1><p>${escapeHtml(copy.matchInviteDesc)}</p><div class="invite-builder__actions"><button class="notes-button notes-button--primary" type="button" data-action="share-profile">${escapeHtml(copy.matchShare)} ↗</button><button class="notes-button" type="button" data-action="copy-invite">${escapeHtml(copy.matchCopy)}</button></div><small class="match-sharing-note">${korean ? '링크를 받은 사람이 내 취향 수치와 익명 식별자를 볼 수 있어요. 이름·연락처·답변 원문은 포함하지 않아요.' : 'Anyone with the link can read your taste values and anonymous identifier. Names, contacts and individual answers are excluded.'}</small></div>
          <div class="invite-builder">${listenerCard(app.profile, copy.matchYou, app.language)}<span class="invite-builder__plus" aria-hidden="true">＋</span><article class="listener-card listener-card--empty"><span class="listener-card__label">${escapeHtml(copy.matchFriend)}</span><div class="listener-card__empty-art" aria-hidden="true">?</div><strong>${korean ? '아직 만나지 않은 선곡' : 'A taste to discover'}</strong><p>${korean ? '친구가 링크를 열고 취향을 만들면, 두 기록이 만나요.' : 'Your notes meet when your friend opens the link and creates a taste profile.'}</p></article></div>
        </section>
        ${invitationSteps(app.language)}
        ${pasteForm(app)}
        <a class="match-essay-link" href="${korean ? '/listening/between-conversations/' : '/en/listening/between-conversations/'}">${korean ? '먼저 읽어보기 · 대화 사이에 놓는 음악' : 'A listening note · Music between conversations'} <span aria-hidden="true">↗</span></a>
      </div>`;
    app.renderNotice();
    track('match_view', { state: 'invite', profile_id: app.profile.id, product_version: 'v2-m4' });
    return;
  }

  const generated = !app.matchResult;
  const match = app.matchResult || compareProfiles(app.profile, app.friendProfile, app.language, { feedbackRecords: app.trackFeedback });
  app.matchResult = match;
  if (generated) app.feedbackChangesSinceRefresh = 0;
  app.root.innerHTML = `<div id="app-notice" class="app-notice"></div>
    <div class="match-editorial">
      <section class="match-hero">
        <div class="match-hero__heading"><div><span class="notes-kicker">${escapeHtml(copy.matchEyebrow)}</span><h1>${escapeHtml(copy.matchTitle)}</h1><p>${escapeHtml(match.label)}</p></div><button class="notes-button notes-button--primary" type="button" data-action="focus-bridge">${korean ? '둘이 들을 5곡 보기' : 'Explore our five tracks'} ↓</button></div>
        <div class="match-pair">${listenerCard(app.profile, copy.matchYou, app.language)}<div class="match-score quality-match-score"><div><strong>${escapeHtml(match.resonanceLabel)}</strong><span>${korean ? `공명도 · ${match.resonance}` : `Resonance · ${match.resonance}`}</span></div><i aria-hidden="true"></i><div><strong>${escapeHtml(match.discoveryLabel)}</strong><span>${korean ? `발견 가능성 · ${match.discovery}` : `Discovery · ${match.discovery}`}</span></div></div>${listenerCard(app.friendProfile, copy.matchFriend, app.language)}</div>
        <details class="match-method"><summary>${korean ? '이 비교를 읽는 법' : 'How to read this comparison'}</summary><p>${korean ? '공명도는 취향 수치가 겹치는 정도, 발견 가능성은 적당히 다른 방향이 있는지를 나타내는 사이트 내부 지표예요. 관계의 궁합이나 함께 좋아할 확률을 측정하지 않아요. 친구의 기록은 초대 링크를 만들었을 때의 취향입니다.' : 'Resonance describes overlap in taste values. Discovery reflects moderate differences. These are site indices, not relationship compatibility or the probability of liking a song. Your friend’s note reflects the moment the invitation was created.'}</p></details>
      </section>
      <section class="match-insights" aria-label="${korean ? '두 취향의 연결' : 'How your tastes connect'}"><article class="panel"><span class="notes-kicker">01 / ${escapeHtml(copy.matchCommon)}</span><ul>${(match.common.length ? match.common : [{ text: copy.matchNoCommon }]).map(item => `<li>${escapeHtml(item.text)}</li>`).join('')}</ul></article><article class="panel"><span class="notes-kicker">02 / ${escapeHtml(copy.matchDifference)}</span><ul>${(match.differences.length ? match.differences : [{ text: copy.matchNoDifference }]).map(item => `<li>${escapeHtml(item.text)}</li>`).join('')}</ul></article></section>
      <section class="recommendation-list recommendation-list--bridge" aria-labelledby="match-playlist-title"><div class="list-heading"><div><span class="notes-kicker">${korean ? '두 취향 사이의 선곡' : 'BETWEEN TWO TASTES'}</span><h2 id="match-playlist-title" tabindex="-1">${escapeHtml(copy.matchPlaylist)}</h2></div><span>05 TRACKS</span></div><p class="listening-service-note">${korean ? '한 곡부터 열어보고 각자의 느낌을 나눠보세요. 곡 열기는 검토한 목적지로, 검색은 서비스의 검색 결과로 이동해요. 반응은 내 쪽 선곡에만 반영합니다.' : 'Open one song and compare notes. Open track leads to a reviewed destination; Search opens service results. Feedback adjusts only your side of the selection.'}</p>${match.bridgeTracks.map(candidate => trackCard(candidate, app.language, 'bridge_playlist', { feedbackEnabled: true, feedbackValue: app.trackFeedback[candidate.track.id]?.value || '', contextId: 'together' })).join('')}</section>
      ${refreshPanel(app)}
      <section class="match-next"><div><span class="notes-kicker">${korean ? '다음에 함께 들을 때' : 'FOR THE NEXT LISTEN'}</span><h2>${korean ? '이 선곡을 대화의 시작으로.' : 'Let a song start the conversation.'}</h2><p>${korean ? '친구도 내 초대 링크를 열면 같은 두 취향을 비교할 수 있어요. 각자 남긴 반응에 따라 추천 순서는 달라질 수 있습니다.' : 'Send your invitation back so your friend can compare the same two tastes. Personal feedback can change the recommendation order.'}</p></div><div><button class="notes-button notes-button--primary" type="button" data-action="share-profile">${korean ? '내 초대 링크 보내기' : 'Send my invitation'} ↗</button><button class="notes-text-button" type="button" data-action="clear-friend">${korean ? '다른 친구와 비교' : 'Compare another friend'}</button></div></section>
    </div>`;
  app.renderNotice();
  if (generated) {
    track('match_view', { state: 'result', compatibility_score: match.score, resonance: match.resonance, discovery: match.discovery, profile_id: app.profile.id, friend_profile_id: app.friendProfile.id, product_version: 'v2-m4' });
    track('ref_complete', { ref_type: app.friendProfile.archetypeId, result_type: getProfileArchetype(app.profile).id, compatibility_score: match.score });
  }
}
