import { PROFILE_QUESTIONS } from '../../data/questions.mjs?commercial=cr1';
import { HOME_SHOWCASE, localizedShowcaseReason } from '../../data/home-showcase.mjs';
import { profileFromArchetype, getProfileArchetype, localize } from '../../domain/profile.mjs?v=qg1';
import { formatWeeklyRange, weeklyActivityStatus, weeklyAlias } from '../../domain/weekly.mjs?weekly=m4w1';
import { loadInteractions } from '../../infrastructure/storage.mjs?weekly=m4w1';
import { renderVibeGlyph } from '../../quality/visuals.mjs?v=qg1';
import { escapeHtml, track } from '../helpers.mjs?weekly=m4w1';

const sampleProfile = profileFromArchetype(HOME_SHOWCASE.profileArchetypeId, 'home_showcase');
const sampleFriend = profileFromArchetype(HOME_SHOWCASE.friendArchetypeId, 'home_showcase');

function trackRows(candidates, language, placement, limit = candidates.length) {
  return candidates.slice(0, limit).map((candidate, index) => `
    <article class="editorial-track" data-track-id="${escapeHtml(candidate.track.id)}">
      <span class="editorial-track__number">${String(index + 1).padStart(2, '0')}</span>
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
      <header><span>${index === 0 ? 'A' : 'B'}</span><small>${heard ? `✓ ${copy.boothHeard}` : failed ? (app.language === 'kr' ? '텍스트로 선택 가능' : 'Text choice available') : '12 SEC · ORIGINAL'}</small></header>
      <h3>${escapeHtml(localize(option.label, app.language))}</h3>
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

export function renderHome(app) {
  const copy = app.copy();
  const question = PROFILE_QUESTIONS[0];
  const hasProfile = Boolean(app.profile);
  const currentArchetype = hasProfile ? getProfileArchetype(app.profile) : null;
  const sampleArchetype = getProfileArchetype(sampleProfile);
  const friendArchetype = getProfileArchetype(sampleFriend);
  const sampleMatch = HOME_SHOWCASE.match;

  const invite = app.friendProfile ? `
    <section class="editorial-invite">
      <span class="editorial-kicker">${app.language === 'kr' ? '친구가 건넨 듣기 기록' : 'A FRIEND SENT A LISTENING NOTE'}</span>
      <div><h2>${escapeHtml(copy.invitedTitle)}</h2><p>${escapeHtml(copy.invitedDesc)}</p></div>
      <button type="button" data-route="${hasProfile ? 'match' : 'discover'}">${escapeHtml(hasProfile ? copy.openMatch : copy.beginProfile)} →</button>
    </section>
  ` : '';

  app.root.innerHTML = `
    <div id="app-notice" class="app-notice"></div>
    <div class="editorial-home human-editorial-home">
      <section class="editorial-hero human-hero">
        <div class="editorial-hero__copy">
          <span class="editorial-kicker">${escapeHtml(copy.homeEyebrow)}</span>
          <h1>${escapeHtml(copy.homeTitle).replaceAll('\n', '<br>')}</h1>
          <p class="editorial-dek">${escapeHtml(copy.homeDescription)}</p>
          <p class="human-hero__whisper">${app.language === 'kr' ? '좋아하는 이유를 아직 몰라도 괜찮아요. 귀가 먼저 고른 쪽에서 시작하면 됩니다.' : 'You do not need the reason yet. Start with the sound your ear chooses first.'}</p>
          <div class="editorial-hero__actions">
            ${hasProfile
              ? `<button class="editorial-button editorial-button--ink" type="button" data-route="profile">${escapeHtml(copy.continueProfile)} →</button><button class="editorial-button editorial-button--line" type="button" data-route="now">${escapeHtml(copy.openNow)}</button>`
              : `<button class="editorial-button editorial-button--ink" type="button" data-action="focus-booth">${escapeHtml(copy.beginProfile)} ↓</button><button class="editorial-button editorial-button--line" type="button" data-action="scroll-sample">${escapeHtml(copy.viewSample)}</button>`
            }
          </div>
          <div class="editorial-hero__note">
            <span>${app.language === 'kr' ? '이름은 묻지 않아요' : 'No name required'}</span>
            <span>${app.language === 'kr' ? '기록은 이 브라우저에' : 'Notes stay in this browser'}</span>
            <span>${app.language === 'kr' ? '직접 만든 테스트 소리' : 'Original test audio'}</span>
          </div>
          ${hasProfile ? `<div class="editorial-saved"><span aria-hidden="true">${escapeHtml(currentArchetype.symbol)}</span><div><small>${escapeHtml(copy.existingProfile)}</small><strong>${escapeHtml(localize(currentArchetype.name, app.language))}</strong></div></div>` : ''}
        </div>

        <aside class="listening-booth" id="listening-booth" aria-labelledby="booth-title">
          <header class="listening-booth__header"><span>${escapeHtml(copy.boothLabel)}</span><b>ORIGINAL AUDIO · CR1</b></header>
          <div class="listening-booth__copy"><h2 id="booth-title">${escapeHtml(copy.boothTitle)}</h2><p>${escapeHtml(copy.boothHint)} <a class="listening-booth__rights" href="/audio-credits/">${app.language === 'kr' ? '오디오 권리 보기' : 'Audio rights'}</a></p></div>
          <div class="listening-booth__choices">
            ${question.options.map((option, index) => homeOption(app, question, option, index)).join('')}
          </div>
        </aside>
      </section>

      ${weeklyBand(app)}
      ${invite}

      <section class="editorial-spread" id="result-example">
        <div class="editorial-spread__intro">
          <span class="editorial-kicker">${escapeHtml(copy.sampleEyebrow)}</span>
          <h2>${escapeHtml(copy.sampleTitle)}</h2>
          <p>${escapeHtml(copy.sampleBody)}</p>
          <div class="editorial-folio"><span>01</span><i></i><b>${app.language === 'kr' ? '다른 사람의 듣기 기록' : 'ANOTHER LISTENING NOTE'}</b></div>
        </div>
        <article class="sample-sleeve" style="--sample-start:${sampleArchetype.gradient[0]};--sample-end:${sampleArchetype.gradient[2]}">
          <div class="sample-sleeve__glyph">${renderVibeGlyph(sampleProfile, app.language, { id: 'sample-profile', size: 260 })}</div>
          <span aria-hidden="true">${escapeHtml(sampleArchetype.symbol)}</span>
          <h3>${escapeHtml(localize(sampleArchetype.name, app.language))}</h3>
          <p>${escapeHtml(localize(sampleArchetype.tagline, app.language))}</p>
          <small>${app.language === 'kr' ? '듣기 기록 예시' : 'LISTENING NOTE SAMPLE'} / ${escapeHtml(sampleProfile.id)}</small>
        </article>
        <div class="editorial-spread__tracks">
          <span class="editorial-kicker">${escapeHtml(copy.sampleTracks)}</span>
          ${trackRows(HOME_SHOWCASE.signature, app.language, 'home_profile_sample')}
        </div>
      </section>

      <section class="editorial-section editorial-section--today">
        <header><span class="editorial-kicker">${escapeHtml(copy.todayEyebrow)}</span><h2>${escapeHtml(copy.todayTitle)}</h2><p>${escapeHtml(copy.todayBody)}</p></header>
        <div class="editorial-scene-tabs" aria-label="${app.language === 'kr' ? '선곡 장면 예시' : 'Listening moment examples'}">
          <span>${app.language === 'kr' ? '집중' : 'Focus'}</span><span class="is-active">${app.language === 'kr' ? '밤 산책' : 'Night walk'}</span><span>${app.language === 'kr' ? '회복' : 'Reset'}</span><span>${app.language === 'kr' ? '새로운 음악' : 'Explore'}</span>
        </div>
        <div class="editorial-tracklist">${trackRows(HOME_SHOWCASE.night, app.language, 'home_now_sample')}</div>
        <button class="editorial-text-link" type="button" data-route="now">${escapeHtml(copy.openNow)} →</button>
      </section>

      <section class="editorial-section editorial-section--together human-together">
        <header><span class="editorial-kicker">${escapeHtml(copy.togetherEyebrow)}</span><h2>${escapeHtml(copy.togetherTitle)}</h2><p>${escapeHtml(copy.togetherBody)}</p></header>
        <div class="human-match">
          ${matchPortrait(sampleArchetype, copy.togetherYouLabel, app.language, 'paper')}
          <div class="human-match__bridge">
            <span class="human-match__bridge-label">${escapeHtml(copy.togetherBridgeLabel)}</span>
            <blockquote>${escapeHtml(copy.togetherBridgeNote)}</blockquote>
            <div class="human-match__meters">
              ${matchMeter(copy.togetherEaseLabel, sampleMatch.resonance)}
              ${matchMeter(copy.togetherDiscoveryLabel, sampleMatch.discovery)}
            </div>
          </div>
          ${matchPortrait(friendArchetype, copy.togetherFriendLabel, app.language, 'ink')}
        </div>
        <div class="human-together__tracks">
          <div class="human-together__track-intro"><span>${app.language === 'kr' ? '둘 사이를 이어주는 세 곡' : 'THREE SONGS BETWEEN YOU'}</span><p>${app.language === 'kr' ? '한 사람의 취향을 지우지 않고, 두 사람이 함께 머물 수 있는 순서로 골랐어요.' : 'Chosen in an order that leaves room for both people without erasing either taste.'}</p></div>
          <div class="editorial-tracklist editorial-tracklist--compact">${trackRows(HOME_SHOWCASE.match.bridgeTracks, app.language, 'home_match_sample', 3)}</div>
        </div>
        <button class="editorial-text-link" type="button" data-route="match">${escapeHtml(copy.openMatch)} →</button>
      </section>

      <section class="editorial-privacy">
        <span class="editorial-privacy__mark" aria-hidden="true">LOCAL<br>FIRST</span>
        <div><span class="editorial-kicker">${app.language === 'kr' ? '기록은 가까이에' : 'PRIVATE BY DEFAULT'}</span><h2>${escapeHtml(copy.privacyTitle)}</h2><p>${escapeHtml(copy.privacyBody)}</p></div>
        <button type="button" data-action="privacy">${escapeHtml(copy.footerPrivacy)} →</button>
      </section>
    </div>
  `;

  app.renderNotice();
  track('landing_view', { product_version: 'v2-cr1', has_profile: hasProfile, referral_present: Boolean(app.friendProfile), ui_release: 'f1', home_release: 'he1', commercial_release: 'cr1', showcase_version: 'e1-fixed', weekly_ready: Boolean(hasProfile && weeklyActivityStatus(loadInteractions(), new Date()).ready), return_eligible: Boolean(app.returnStatus?.eligible) });
}
