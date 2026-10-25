import { PROFILE_QUESTIONS } from '../../data/questions.mjs?commercial=cr1';
import { HOME_SHOWCASE, HOME_SCENES, localizedShowcaseReason } from '../../data/home-showcase.mjs?home=he2';
import { profileFromArchetype, getProfileArchetype, localize } from '../../domain/profile.mjs?v=qg1';
import { formatWeeklyRange, weeklyActivityStatus, weeklyAlias } from '../../domain/weekly.mjs?weekly=m4w1';
import { loadInteractions } from '../../infrastructure/storage.mjs?weekly=m4w1';
import { renderVibeGlyph } from '../../quality/visuals.mjs?v=qg1';
import { escapeHtml, track } from '../helpers.mjs?weekly=m4w1';

const sampleProfile = profileFromArchetype(HOME_SHOWCASE.profileArchetypeId, 'home_showcase');
const sampleFriend = profileFromArchetype(HOME_SHOWCASE.friendArchetypeId, 'home_showcase');

function trackRows(candidates, language, placement, limit = candidates.length) {
  return candidates.slice(0, limit).map((candidate, index) => `
    <article class="editorial-track" data-track-id="${escapeHtml(candidate.track.id)}" data-track-artist="${escapeHtml(candidate.track.artist)}">
      <span class="editorial-track__number" aria-hidden="true">${String(index + 1).padStart(2, '0')}</span>
      <div class="editorial-track__copy">
        <strong>${escapeHtml(candidate.track.title)}</strong>
        <span>${escapeHtml(candidate.track.artist)}</span>
        <p>${escapeHtml(localizedShowcaseReason(candidate, language))}</p>
      </div>
      <div class="editorial-track__links" role="group" aria-label="${language === 'kr' ? '음악 서비스에서 듣기' : 'Listen on a music service'}">
        <a href="${escapeHtml(candidate.urls.spotify)}" target="_blank" rel="noopener noreferrer" data-track-link data-platform="spotify" data-placement="${placement}">Spotify</a>
        <a href="${escapeHtml(candidate.urls.youtube)}" target="_blank" rel="noopener noreferrer" data-track-link data-platform="youtube" data-placement="${placement}">YouTube</a>
      </div>
    </article>
  `).join('');
}

function homeOption(app, question, option, index) {
  const copy = app.copy();
  const isPlaying = app.homePreviewOptionId === option.id && app.homePreviewAudio && !app.homePreviewAudio.paused;
  const heard = app.homeHeardOptionIds.has(option.id);
  const failed = app.homeAudioErrorIds.has(option.id);
  return `
    <article class="listening-choice ${isPlaying ? 'is-playing' : ''} ${heard ? 'is-heard' : ''} ${failed ? 'has-error' : ''}" data-brand-option="${escapeHtml(option.id)}">
      <header><span>${index === 0 ? 'A' : 'B'}</span><small>${heard ? `✓ ${copy.boothHeard}` : failed ? (app.language === 'kr' ? '텍스트로 선택 가능' : 'Text choice available') : (app.language === 'kr' ? '12초 · 직접 만든 소리' : '12 SEC · ORIGINAL')}</small></header>
      <div class="choice-sound choice-sound--${index}" aria-hidden="true">${Array.from({ length: 25 }, (_, i) => `<i style="--wave-height:${18 + ((i * 17 + index * 13) % 43)}px"></i>`).join('')}</div><h4>${escapeHtml(localize(option.label, app.language))}</h4>
      <p>${escapeHtml(localize(option.description, app.language))}</p>
      <div class="listening-choice__transport">
        <button type="button" data-action="home-preview" data-option-id="${escapeHtml(option.id)}" aria-pressed="${isPlaying}"><span aria-hidden="true">${isPlaying ? 'Ⅱ' : '▶'}</span>${escapeHtml(isPlaying ? copy.stop : copy.preview)}</button>
        <div class="listening-choice__progress" aria-hidden="true"><i data-home-progress="${escapeHtml(option.id)}"></i></div>
        <time data-home-time="${escapeHtml(option.id)}">0:00</time>
      </div>
      <button type="button" class="listening-choice__choose" data-action="home-choose" data-option-id="${escapeHtml(option.id)}">${escapeHtml(copy.boothContinue)} <span aria-hidden="true">→</span></button>
    </article>
  `;
}

function weeklyBand(app) {
  if (!app.profile) return '';
  const interactions = loadInteractions();
  const current = weeklyActivityStatus(interactions, new Date());
  const latest = app.latestWeeklyVibe;
  const returning = app.returnStatus?.eligible;

  if (returning) {
    const anchor = app.returnStatus.anchorAt || latest?.windowEndAt || '';
    return `
      <section class="home-weekly-band home-weekly-band--return">
        <div class="home-weekly-band__mark" aria-hidden="true">7D</div>
        <div><span class="eyebrow">${app.language === 'kr' ? '다시 왔네요' : 'WELCOME BACK'}</span><h2>${app.language === 'kr' ? '지난 방문까지의 음악 기록을 다시 열어보세요.' : 'Reopen the listening note from your last visit.'}</h2><p>${app.language === 'kr' ? `${app.returnStatus.daysSincePrevious}일 만의 방문이에요. 그때 머문 장면과 곡을 한 장으로 정리합니다.` : `It has been ${app.returnStatus.daysSincePrevious} days. See the moments and tracks that stayed with you then.`}</p></div>
        <button type="button" data-action="open-weekly" data-weekly-anchor="${escapeHtml(anchor)}">${app.language === 'kr' ? '지난 기록 보기' : 'Open the previous note'} →</button>
      </section>
    `;
  }

  if (current.ready) {
    return `
      <section class="home-weekly-band">
        <div class="home-weekly-band__mark" aria-hidden="true">W</div>
        <div><span class="eyebrow">${app.language === 'kr' ? '이번 주 기록 준비됨' : 'WEEKLY NOTE READY'}</span><h2>${app.language === 'kr' ? '최근에 머문 음악을 한 장으로 모았어요.' : 'Your recent listening is ready as one weekly note.'}</h2><p>${app.language === 'kr' ? `${current.count}개의 청취 행동에서 자주 고른 장면과 곡을 정리합니다.` : `A recap built from ${current.count} listening actions.`}</p></div>
        <button type="button" data-action="open-weekly">${app.language === 'kr' ? '이번 주 기록 보기' : 'Open Weekly Vibe'} →</button>
      </section>
    `;
  }

  if (latest) {
    return `
      <section class="home-weekly-band home-weekly-band--saved">
        <div class="home-weekly-band__mark" aria-hidden="true">W</div>
        <div><span class="eyebrow">${escapeHtml(formatWeeklyRange(latest, app.language))}</span><h2>${escapeHtml(weeklyAlias(latest, app.language))}</h2><p>${app.language === 'kr' ? '저장된 주간 기록을 다시 보고, 오늘의 선곡으로 이어갈 수 있어요.' : 'Revisit the saved weekly note and continue into music for today.'}</p></div>
        <button type="button" data-action="open-weekly" data-weekly-anchor="${escapeHtml(latest.windowEndAt)}">${app.language === 'kr' ? '최근 기록 열기' : 'Open saved note'} →</button>
      </section>
    `;
  }

  return `
    <section class="home-weekly-band home-weekly-band--progress">
      <div class="home-weekly-band__mark" aria-hidden="true">${current.count}/${current.required}</div>
      <div><span class="eyebrow">${app.language === 'kr' ? '이번 주의 듣기 기록' : 'WEEKLY VIBE'}</span><h2>${app.language === 'kr' ? '조금만 더 들으면 주간 기록이 완성돼요.' : 'A few more listening actions will complete your weekly note.'}</h2><p>${app.language === 'kr' ? `오늘의 선곡에서 ${current.remaining}개 행동을 더 남겨보세요.` : `Leave ${current.remaining} more action${current.remaining === 1 ? '' : 's'} in Music for Today.`}</p></div>
      <button type="button" data-route="now">${app.language === 'kr' ? '오늘의 선곡 열기' : 'Open music for today'} →</button>
    </section>
  `;
}

function matchPortrait(archetype, label, language, tone) {
  return `
    <article class="human-match__person human-match__person--${tone}">
      <span class="human-match__role">${escapeHtml(label)}</span>
      <span class="human-match__symbol" aria-hidden="true">${escapeHtml(archetype.symbol)}</span>
      <div>
        <h3>${escapeHtml(localize(archetype.name, language))}</h3>
        <p>${escapeHtml(localize(archetype.tagline, language))}</p>
      </div>
    </article>
  `;
}

function matchMeter(label, score) {
  return `
    <div class="human-match__meter" style="--match-score:${Math.max(0, Math.min(100, score))}%">
      <div><span>${escapeHtml(label)}</span><b>${score}</b></div>
      <i aria-hidden="true"><em></em></i>
    </div>
  `;
}

function homeScene(app, sceneId) {
  const scene = HOME_SCENES.find((entry) => entry.id === sceneId) || HOME_SCENES[0];
  const korean = app.language === 'kr';
  return `<div class="scene-note scene-note--${scene.id}">
    <div class="scene-note__art" aria-hidden="true"><span>${scene.symbol}</span><i></i><b>${scene.number}</b></div>
    <div class="scene-note__copy"><span class="editorial-kicker">${korean ? '편집 선곡 · 세 곡의 이야기' : 'EDITORIAL SELECTION · THREE TRACKS'}</span><h3>${escapeHtml(localize(scene.title, app.language))}</h3><p>${escapeHtml(localize(scene.description, app.language))}</p><small>${korean ? '곡은 선택한 음악 서비스의 검색 화면에서 찾을 수 있어요.' : 'Links open a search on your chosen music service.'}</small></div>
  </div><div class="scene-tracklist">${trackRows(scene.tracks, app.language, 'home_now_sample', 3)}</div>`;
}

export function renderHome(app) {
  const copy = app.copy();
  const korean = app.language === 'kr';
  const question = PROFILE_QUESTIONS[0];
  const hasProfile = Boolean(app.profile);
  const sampleArchetype = getProfileArchetype(sampleProfile);
  const friendArchetype = getProfileArchetype(sampleFriend);
  const sampleMatch = HOME_SHOWCASE.match;
  const heading = (text) => escapeHtml(text).replaceAll('\n', '<br> ');
  const sceneId = HOME_SCENES.some((scene) => scene.id === app.homeSceneId) ? app.homeSceneId : 'night';
  const invite = app.friendProfile ? `<section class="editorial-invite"><span class="editorial-kicker">${korean ? '친구가 보낸 초대' : 'A NOTE FROM A FRIEND'}</span><div><h2>${escapeHtml(copy.invitedTitle)}</h2><p>${escapeHtml(copy.invitedDesc)}</p></div><button type="button" data-route="${hasProfile ? 'match' : 'discover'}">${escapeHtml(hasProfile ? copy.openMatch : copy.beginProfile)} →</button></section>` : '';

  app.root.innerHTML = `
    <div id="app-notice" class="app-notice"></div>
    <div class="editorial-home human-editorial-home">
      ${invite}
      <section class="editorial-hero human-hero">
        <div class="editorial-hero__copy">
          <span class="editorial-kicker"><i class="home-live-dot" aria-hidden="true"></i>${escapeHtml(copy.homeEyebrow)}</span>
          <h1>${heading(copy.homeTitle)}</h1>
          <p class="editorial-dek">${escapeHtml(copy.homeDescription)}</p>
          <div class="editorial-hero__actions">
            ${hasProfile
              ? `<button class="editorial-button editorial-button--ink" type="button" data-route="now">${korean ? '오늘 들을 음악 찾기' : 'Find music for today'} <span aria-hidden="true">↗</span></button><button class="editorial-button editorial-button--line" type="button" data-route="profile">${korean ? '내 취향 다시 보기' : 'Revisit my taste'}</button>`
              : `<button class="editorial-button editorial-button--ink" type="button" data-action="focus-booth">${korean ? '내 취향 찾기' : 'Find my music taste'} <span aria-hidden="true">↗</span></button><button class="editorial-button editorial-button--line" type="button" data-action="scroll-sample">${korean ? '결과 먼저 둘러보기' : 'See a sample result'} <span aria-hidden="true">↓</span></button>`}
          </div>
          <p class="human-hero__whisper">${korean ? '가입 없이 · 10번의 선택 · 나만의 음악 기록' : 'No sign-up · Ten choices · A note that feels like you'}</p>
        </div>
        <figure class="hero-record">
          <img src="/assets/images/listening-room.svg" width="640" height="540" alt="" fetchpriority="high">
          <figcaption><span>YOUR TASTE, ON THE RECORD.</span><span aria-hidden="true">SIDE A / 01</span></figcaption>
        </figure>
      </section>

      <ol class="home-journey" aria-label="${korean ? '이렇게 이용해요' : 'How it works'}">
        <li><span>01</span><div><strong>${korean ? '듣고, 골라요' : 'Listen & choose'}</strong><p>${korean ? '마음이 가는 소리와 장면을 선택해요.' : 'Pick the sounds and scenes you lean toward.'}</p></div></li>
        <li><span>02</span><div><strong>${korean ? '내 음악을 발견해요' : 'Find your music'}</strong><p>${korean ? '취향의 이유와 어울리는 곡을 만나요.' : 'Meet your taste, its story, and matching songs.'}</p></div></li>
        <li><span>03</span><div><strong>${korean ? '친구와 이어 들어요' : 'Share the discovery'}</strong><p>${korean ? '서로 다른 취향 사이의 음악을 찾아요.' : 'Find the music between two different tastes.'}</p></div></li>
      </ol>

      ${weeklyBand(app)}

      <section class="home-first-listen" aria-labelledby="booth-title">
        <div class="home-first-listen__intro"><span class="editorial-kicker">THE FIRST LISTEN</span><h2>${korean ? '첫 곡을 고르듯,<br>가볍게 시작해요.' : 'Start with<br>a little listening.'}</h2><p>${korean ? '두 소리를 들어보고 더 끌리는 쪽을 골라보세요. 이 선택이 취향 기록의 첫 번째가 됩니다.' : 'Try both sounds and choose the one you prefer. This becomes the first choice in your taste note.'}</p><span class="home-headphone-note">${korean ? '헤드폰이 있다면 더 좋아요' : 'Even better with headphones'}</span></div>
        <div class="listening-booth" id="listening-booth" aria-labelledby="booth-title">
          <header class="listening-booth__header"><span>${escapeHtml(copy.boothLabel)}</span><b>${korean ? '직접 만든 테스트 소리' : 'ORIGINAL TEST SOUNDS'}</b></header>
          <div class="listening-booth__copy"><h3 id="booth-title">${korean ? '지금 더 끌리는 소리는?' : 'Which sound draws you in?'}</h3><p>${korean ? '정답은 없어요. 소리를 듣기 어려우면 설명으로 골라도 괜찮아요.' : 'There is no right answer. You can also choose using the descriptions.'}</p></div>
          <div class="listening-booth__choices">${question.options.map((option, index) => homeOption(app, question, option, index)).join('')}</div>
          <a class="listening-booth__rights" href="/audio-credits/">${korean ? '테스트 소리는 어떻게 만들었나요?' : 'How are the test sounds made?'} ↗</a>
        </div>
      </section>

      <section class="editorial-spread" id="result-example">
        <div class="editorial-spread__intro"><span class="editorial-kicker">YOUR LISTENING PORTRAIT</span><h2>${heading(copy.sampleTitle)}</h2><p>${escapeHtml(copy.sampleBody)}</p><div class="editorial-folio"><span>01—06</span><i></i><b>${korean ? '취향을 바라보는 여섯 방향' : 'SIX DIRECTIONS OF TASTE'}</b></div><p class="sample-disclaimer">${korean ? '아래는 이해를 돕는 예시예요. 내 결과는 선택을 마친 뒤 확인할 수 있어요.' : 'This is a sample. Your own portrait appears after your choices.'}</p></div>
        <article class="sample-sleeve"><div class="sample-sleeve__top"><span>LISTENING NOTE</span><span>01</span></div><div class="sample-sleeve__glyph">${renderVibeGlyph(sampleProfile, app.language, { id: 'sample-profile', size: 260 })}</div><span aria-hidden="true">${escapeHtml(sampleArchetype.symbol)}</span><h3>${escapeHtml(localize(sampleArchetype.name, app.language))}</h3><p>${escapeHtml(localize(sampleArchetype.tagline, app.language))}</p><small>${korean ? '취향 기록 예시' : 'SAMPLE TASTE NOTE'}</small></article>
        <div class="editorial-spread__tracks"><span class="editorial-kicker">${korean ? '이 취향과 어울리는 세 곡' : 'THREE SONGS FOR THIS TASTE'}</span>${trackRows(HOME_SHOWCASE.signature, app.language, 'home_profile_sample')}<button class="editorial-text-link" type="button" data-action="focus-booth">${korean ? '내 취향도 찾아보기' : 'Find my own taste'} ↗</button></div>
      </section>

      <section class="editorial-section editorial-section--today" aria-labelledby="today-heading">
        <header><span class="editorial-kicker">MUSIC FOR THE MOMENT</span><h2 id="today-heading">${heading(copy.todayTitle)}</h2><p>${escapeHtml(copy.todayBody)}</p></header>
        <div class="editorial-scene-tabs" data-home-scenes role="group" aria-label="${korean ? '선곡 장면 선택' : 'Choose a listening moment'}">${HOME_SCENES.map((scene) => `<button type="button" data-home-scene="${scene.id}" aria-pressed="${scene.id === sceneId}" aria-controls="home-scene-panel"><span aria-hidden="true">${scene.symbol}</span>${escapeHtml(localize(scene.label, app.language))}</button>`).join('')}</div>
        <div class="home-scene-panel" id="home-scene-panel" data-home-scene-panel aria-live="polite" aria-atomic="true">${homeScene(app, sceneId)}</div>
        <div class="home-section-end"><p>${korean ? '내 취향을 더하면, 지금에 맞는 다섯 곡을 찾을 수 있어요.' : 'Add your taste to find five songs for this moment.'}</p><button class="editorial-text-link" type="button" data-route="now">${escapeHtml(copy.openNow)} ↗</button></div>
      </section>

      <section class="editorial-section editorial-section--together human-together">
        <header><span class="editorial-kicker">BETTER TOGETHER</span><h2>${heading(copy.togetherTitle)}</h2><p>${escapeHtml(copy.togetherBody)}</p></header>
        <p class="match-example-label">${korean ? '두 가지 취향을 비교한 예시' : 'AN EXAMPLE OF TWO TASTES'}</p>
        <div class="human-match">
          ${matchPortrait(sampleArchetype, copy.togetherYouLabel, app.language, 'paper')}
          <div class="human-match__bridge"><span class="human-match__bridge-label">${escapeHtml(copy.togetherBridgeLabel)}</span><blockquote>${escapeHtml(copy.togetherBridgeNote)}</blockquote><div class="human-match__meters">${matchMeter(copy.togetherEaseLabel, sampleMatch.resonance)}${matchMeter(copy.togetherDiscoveryLabel, sampleMatch.discovery)}</div></div>
          ${matchPortrait(friendArchetype, copy.togetherFriendLabel, app.language, 'ink')}
        </div>
        <div class="human-together__tracks"><div class="human-together__track-intro"><span>${korean ? '둘 사이를 이어주는 세 곡' : 'THREE SONGS BETWEEN YOU'}</span><p>${korean ? '익숙함과 새로움을 조금씩 나눠 담은 편집 선곡이에요.' : 'An editorial selection with a little familiarity and discovery for each of you.'}</p></div><div class="editorial-tracklist editorial-tracklist--compact">${trackRows(HOME_SHOWCASE.match.bridgeTracks, app.language, 'home_match_sample', 3)}</div></div>
        <button class="editorial-button editorial-button--ink" type="button" data-route="match">${korean ? '친구와 같이 들을 곡 찾기' : 'Find music for two'} ↗</button>
      </section>

      <section class="home-notes" aria-labelledby="home-notes-title"><div><span class="editorial-kicker">GOOD TO KNOW</span><h2 id="home-notes-title">${korean ? '시작 전에,<br>궁금할 수 있는 것들.' : 'A few notes<br>before you begin.'}</h2></div><div class="home-notes__questions">
        <details><summary>${korean ? '음악을 잘 몰라도 할 수 있나요?' : 'Do I need to know much about music?'}</summary><p>${korean ? '물론이에요. 장르나 아티스트 이름을 몰라도 괜찮아요. 짧은 소리와 일상의 장면 중 더 마음에 드는 쪽을 선택하면 됩니다.' : 'Not at all. Choose the short sounds and everyday scenes you prefer. No genre or artist knowledge is needed.'}</p></details>
        <details><summary>${korean ? '실제 노래를 여기서 들을 수 있나요?' : 'Can I play the recommended songs here?'}</summary><p>${korean ? '테스트에서는 직접 만든 짧은 소리를 사용해요. 추천곡은 Spotify·YouTube 등 선택한 음악 서비스에서 검색해 들을 수 있습니다. 각 서비스의 이용 조건이 적용돼요.' : 'The test uses original short sounds. Recommended songs open in searches on services such as Spotify and YouTube, under their own access conditions.'}</p></details>
        <details><summary>${korean ? '취향 결과가 바뀔 수도 있나요?' : 'Can my taste change?'}</summary><p>${korean ? '그럼요. 이 결과는 성격 진단이 아니라 지금의 선택을 정리한 음악 기록이에요. 나중에 다시 선택하고, 추천곡에 피드백을 남기며 취향을 이어갈 수 있어요.' : 'Of course. This is a music note based on your choices, not a personality diagnosis. Return, try again, and leave feedback on your recommendations.'}</p></details>
      </div></section>

      <section class="editorial-privacy"><span class="editorial-privacy__mark" aria-hidden="true">YOUR<br>OWN NOTE.</span><div><span class="editorial-kicker">${korean ? '내가 선택하는 기록' : 'YOUR NOTES, YOUR CHOICE'}</span><h2>${escapeHtml(copy.privacyTitle.replace(/\n/g, ' '))}</h2><p>${escapeHtml(copy.privacyBody)}</p></div><button type="button" data-action="privacy">${escapeHtml(copy.footerPrivacy)} ↗</button></section>
    </div>`;

  app.root.querySelector('[data-home-scenes]').addEventListener('click', (event) => {
    const button = event.target.closest('[data-home-scene]');
    if (!button || !HOME_SCENES.some((scene) => scene.id === button.dataset.homeScene)) return;
    app.homeSceneId = button.dataset.homeScene;
    app.root.querySelectorAll('[data-home-scene]').forEach((item) => item.setAttribute('aria-pressed', String(item === button)));
    app.root.querySelector('[data-home-scene-panel]').innerHTML = homeScene(app, app.homeSceneId);
    track('home_scene_select', { context_id: app.homeSceneId, placement: 'home_editorial' });
  });
  app.renderNotice();
  track('landing_view', { product_version: 'v2-cr1', has_profile: hasProfile, referral_present: Boolean(app.friendProfile), ui_release: 'f1', home_release: 'he2', commercial_release: 'cr1', showcase_version: 'he2-scenes', weekly_ready: Boolean(hasProfile && weeklyActivityStatus(loadInteractions(), new Date()).ready), return_eligible: Boolean(app.returnStatus?.eligible) });
}
