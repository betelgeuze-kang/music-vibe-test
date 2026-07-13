import { AXES } from '../../data/axes.mjs?v3=nv1';
import { CONTEXT_BY_ID } from '../../data/contexts.mjs?v3=nv1';
import { getProfileArchetype, localize } from '../../domain/profile.mjs?v=qg1';
import { visibleWeeklyTags } from '../../domain/tag-visibility.mjs?weekly=m4w1';
import {
  buildWeeklyVibe,
  formatWeeklyRange,
  weeklyActivityStatus,
  weeklyAlias,
  weeklySummary,
  weeklyWindow
} from '../../domain/weekly.mjs?v3=nv1';
import { loadInteractions, loadLatestWeeklyVibe, loadWeeklyVibes, saveWeeklyVibe } from '../../infrastructure/storage.mjs?weekly=m4w1';
import { renderVibeGlyph } from '../../quality/visuals.mjs?v=qg1';
import { escapeHtml, track } from '../helpers.mjs?v3=nv1';
import { renderEmptyProfile } from './empty.mjs?v3=nv1';

function activitySuggestions(app, status) {
  const korean = app.language === 'kr';
  const items = korean
    ? [
        ['오늘의 방 하나 고르기', '지금의 장면을 고르면 첫 줄이 적힙니다.'],
        ['추천곡 한 곡 열어보기', '실제로 귀가 간 곡을 기록할 수 있습니다.'],
        ['곡 곁에 짧은 표시 남기기', '더 듣고 싶은지, 여기서는 멀어지고 싶은지 알려주세요.']
      ]
    : [
        ['Choose one room for today', 'Selecting a moment writes the first line.'],
        ['Open one recommended song', 'This records where your ear actually went.'],
        ['Leave a small mark beside a song', 'Say whether you would stay longer or turn another way.']
      ];
  return `
    <div class="weekly-progress" role="progressbar" aria-label="${korean ? '이번 주 기록이 채워진 정도' : 'How much of the weekly note is written'}" aria-valuemin="0" aria-valuemax="${status.required}" aria-valuenow="${Math.min(status.count, status.required)}"><i style="width:${Math.min(100, status.count / status.required * 100)}%"></i></div>
    <p class="weekly-progress__label">${korean ? `${status.required}줄 가운데 ${status.count}줄` : `${status.count} of ${status.required} lines`}</p>
    <ol class="weekly-suggestions">${items.map(([title, description], index) => `<li><span aria-hidden="true">${index + 1}</span><div><strong>${escapeHtml(title)}</strong><p>${escapeHtml(description)}</p></div></li>`).join('')}</ol>
  `;
}

function contextCards(vibe, language) {
  const korean = language === 'kr';
  const cards = vibe.topContexts.map((item, index) => {
    const context = CONTEXT_BY_ID[item.contextId];
    if (!context) return '';
    return `<article class="weekly-context-card ${index === 0 ? 'is-primary' : ''}"><span aria-hidden="true">${escapeHtml(context.icon)}</span><div><small>${String(index + 1).padStart(2, '0')}</small><h3>${escapeHtml(localize(context.shortLabel, language))}</h3><p>${escapeHtml(localize(context.description, language))}</p></div></article>`;
  }).filter(Boolean);
  if (!cards.length) return '';
  return `
    <section class="weekly-section" aria-labelledby="weekly-contexts-title">
      <div class="weekly-section__heading"><span class="eyebrow">${korean ? '음악을 찾았던 시간' : 'THE HOURS THAT ASKED FOR MUSIC'}</span><h2 id="weekly-contexts-title">${korean ? '이번 주에는 이런 장면에서 재생 버튼을 눌렀습니다.' : 'These were the rooms in which you pressed play.'}</h2></div>
      <div class="weekly-context-grid is-count-${Math.min(3, cards.length)}">${cards.join('')}</div>
    </section>
  `;
}

function changeCards(vibe, language) {
  const korean = language === 'kr';
  if (!vibe.changes.length) {
    return `<article class="weekly-stable"><span aria-hidden="true">＝</span><div><h3>${korean ? '큰 방향은 움직이지 않았습니다.' : 'The larger direction did not move.'}</h3><p>${korean ? '작은 흔들림까지 변화라고 부르지 않고, 이번 주는 익숙한 자리 곁에 두었습니다.' : 'We did not call every tremor a change; this week stayed close to the familiar chair.'}</p></div></article>`;
  }
  return `<div class="weekly-change-grid">${vibe.changes.map((change) => {
    const axis = AXES.find((candidate) => candidate.id === change.axisId);
    const direction = localize(change.direction === 'high' ? axis.high : axis.low, language);
    return `<article class="weekly-change"><span>${escapeHtml(localize(axis.label, language))}</span><strong>${escapeHtml(direction)}</strong><b>${change.displayDelta > 0 ? '+' : '−'}${change.magnitude}</b><small>${korean ? '평소 기록에서 조금 이동' : 'a small move from the usual note'}</small></article>`;
  }).join('')}</div>`;
}

function trackRows(vibe, trackById, platformUrl, language) {
  const korean = language === 'kr';
  if (!vibe.topTracks.length) {
    return `<div class="weekly-no-tracks"><p>${korean ? '아직 곡 이름보다 장면의 기록이 더 많습니다. 몇 곡을 실제로 열어보면 여기에 제목이 남습니다.' : 'The week still contains more scenes than song titles. Open a few tracks and their names will remain here.'}</p></div>`;
  }
  return `
    <div class="weekly-tracklist">
      ${vibe.topTracks.map((item, index) => {
        const song = trackById[item.trackId];
        if (!song) return '';
        return `<article class="weekly-track" data-track-id="${escapeHtml(song.id)}" data-track-artist="${escapeHtml(song.artist)}">
          <span class="weekly-track__number" aria-hidden="true">${String(index + 1).padStart(2, '0')}</span>
          <div><strong>${escapeHtml(song.title)}</strong><span>${escapeHtml(song.artist)}</span><p>${korean ? `${item.clicks || 0}번 문을 열었고, ${item.more || 0}번 더 듣고 싶다고 남겼습니다.` : `Opened ${item.clicks || 0} time${item.clicks === 1 ? '' : 's'} and marked for more ${item.more || 0} time${item.more === 1 ? '' : 's'}.`}</p></div>
          <div class="weekly-track__links" role="group" aria-label="${korean ? '음악 서비스에서 이 곡 찾기' : 'Find this song in a music service'}">
            <a href="${escapeHtml(platformUrl(song, 'spotify'))}" target="_blank" rel="noopener noreferrer" data-track-link data-platform="spotify" data-placement="weekly_vibe">Spotify</a>
            <a href="${escapeHtml(platformUrl(song, 'youtube'))}" target="_blank" rel="noopener noreferrer" data-track-link data-platform="youtube" data-placement="weekly_vibe">YouTube</a>
          </div>
        </article>`;
      }).join('')}
    </div>
  `;
}

function tagList(vibe, language) {
  const tags = visibleWeeklyTags(vibe.topTags, 5);
  if (!tags.length) return '';
  const korean = language === 'kr';
  return `
    <section class="weekly-tags" aria-labelledby="weekly-tags-title">
      <div><span class="eyebrow">${korean ? '곡들 사이에 남은 낱말' : 'WORDS LEFT BETWEEN THE SONGS'}</span><h2 id="weekly-tags-title">${korean ? '이번 주의 소리를 짧게 적으면' : 'A few short words for this week'}</h2></div>
      <div class="weekly-tags__list">${tags.map((item) => `<span>#${escapeHtml(item.tag.replaceAll(' ', '-'))}</span>`).join('')}</div>
    </section>
  `;
}

function renderInsufficient(app, status, recent) {
  const korean = app.language === 'kr';
  app.root.innerHTML = `
    <div id="app-notice" class="app-notice"></div>
    <section class="weekly-empty">
      <span class="eyebrow">${korean ? '아직 쓰는 중인 이번 주' : 'THIS WEEK IS STILL BEING WRITTEN'}</span>
      <h1>${korean ? '세 번만 더 귀가 머문 자리를 남겨주세요.' : 'Leave just a few places where your ear stopped.'}</h1>
      <p>${korean ? `장면을 고르거나 곡을 열어본 기록이 ${status.required}개 모이면, 한 주를 과장하지 않고 한 장으로 적습니다.` : `When ${status.required} real moments—choosing a scene or opening a song—have gathered, we will write the week down without exaggerating it.`}</p>
      ${activitySuggestions(app, status)}
      <div class="weekly-empty__actions">
        <button class="button button--primary" type="button" data-route="now">${escapeHtml(app.copy().openNow)}</button>
        ${recent ? `<button class="button button--ghost" type="button" data-action="open-weekly" data-weekly-anchor="${escapeHtml(recent.windowEndAt)}">${korean ? '전에 남긴 주간 기록 펼치기' : 'Open the last weekly page'}</button>` : ''}
      </div>
      <small>${korean ? '외부 음악 서비스의 청취 기록은 읽지 않습니다. 여기에서 고른 장면과 직접 누른 링크만 셉니다.' : 'We do not read streaming history. Only scenes chosen here and links you opened yourself are counted.'}</small>
    </section>
  `;
  app.renderNotice();
  track('weekly_vibe_view', { product_version: 'v3-nv1', state: 'insufficient', interaction_count: status.count, required_count: status.required, profile_id: app.profile.id });
}

export async function renderWeekly(app) {
  const korean = app.language === 'kr';
  if (!app.profile) {
    renderEmptyProfile(app, korean ? '먼저 열 번의 선택을 남겨주세요. 그 다음부터 한 주의 음악이 한 장씩 쌓입니다.' : 'Leave ten choices first. After that, each week of listening can become a page.', app.copy().beginProfile);
    return;
  }

  const anchor = app.weeklyAnchorAt || new Date();
  const interactions = loadInteractions();
  const status = weeklyActivityStatus(interactions, anchor);
  const week = weeklyWindow(anchor);
  const savedForWindow = loadWeeklyVibes({ profileId: app.profile.id }).find((item) => item.weekKey === week.weekKey) || null;
  const latest = loadLatestWeeklyVibe(app.profile.id);
  const { TRACK_BY_ID, platformUrl } = await import('../../domain/recommendation.mjs?weekly=m4w1');
  const computed = buildWeeklyVibe({ profile: app.profile, interactions, trackById: TRACK_BY_ID, anchor });
  const rawVibe = computed.sufficientData ? computed : savedForWindow;

  if (!rawVibe?.sufficientData) {
    renderInsufficient(app, status, latest);
    return;
  }

  if (computed.sufficientData) saveWeeklyVibe(computed);
  const vibe = Object.freeze({ ...rawVibe, topTags: visibleWeeklyTags(rawVibe.topTags, 5) });
  app.latestWeeklyVibe = vibe;
  const archetype = getProfileArchetype(vibe);
  const [start, middle, end] = archetype.gradient;
  const primaryContext = CONTEXT_BY_ID[vibe.dominantContextId];

  app.root.innerHTML = `
    <div id="app-notice" class="app-notice"></div>
    <div class="weekly-page">
      <section class="weekly-hero" style="--weekly-start:${start};--weekly-middle:${middle};--weekly-end:${end}">
        <div class="weekly-hero__copy">
          <span class="eyebrow">${korean ? '지난 일곱 날의 귀' : 'THE EAR OF THE LAST SEVEN DAYS'}</span>
          <small>${escapeHtml(formatWeeklyRange(vibe, app.language))}</small>
          <h1>${escapeHtml(weeklyAlias(vibe, app.language))}</h1>
          <p>${escapeHtml(weeklySummary(vibe, app.language))}</p>
          <div class="weekly-hero__meta">
            <span>${korean ? `${vibe.interactionCount}개의 작은 흔적` : `${vibe.interactionCount} small traces`}</span>
            <span>${escapeHtml(localize(archetype.name, app.language))}</span>
            ${primaryContext ? `<span>${escapeHtml(localize(primaryContext.shortLabel, app.language))}</span>` : ''}
          </div>
          <div class="weekly-hero__actions">
            <button type="button" class="button button--light" data-action="weekly-listen" data-context-id="${escapeHtml(vibe.dominantContextId || 'explore')}">${korean ? '이 흐름 곁에 다섯 곡 더 놓기' : 'Set five more songs beside this current'}</button>
            <button type="button" class="button button--ghost" data-action="share-weekly-card">${korean ? '이 한 장을 저장하거나 건네기' : 'Save or pass on this page'}</button>
          </div>
        </div>
        <div class="weekly-hero__glyph">${renderVibeGlyph(vibe, app.language, { id: `weekly-${vibe.weekKey}`, size: 320 })}<span aria-hidden="true">${escapeHtml(archetype.symbol)}</span></div>
      </section>

      ${contextCards(vibe, app.language)}

      <section class="weekly-section weekly-section--changes" aria-labelledby="weekly-changes-title">
        <div class="weekly-section__heading"><span class="eyebrow">${korean ? '평소의 기록 옆에 놓으면' : 'BESIDE YOUR USUAL NOTE'}</span><h2 id="weekly-changes-title">${korean ? '이번 주에 조금 더 오래 머문 쪽' : 'Where you stayed a little longer this week'}</h2><p>${korean ? '현재 프로필을 새 이름으로 바꾸지 않습니다. 지난 일곱 날에 보인 작은 기울기만 연필로 덧씁니다.' : 'We do not rename your profile. We add only a pencil note about the small lean seen in the last seven days.'}</p></div>
        ${changeCards(vibe, app.language)}
      </section>

      ${tagList(vibe, app.language)}

      <section class="weekly-section" aria-labelledby="weekly-tracks-title">
        <div class="weekly-section__heading"><span class="eyebrow">${korean ? '제목까지 남은 곡' : 'SONGS WHOSE NAMES REMAINED'}</span><h2 id="weekly-tracks-title">${korean ? '이번 주에 실제로 문을 열어본 음악' : 'Music whose door you actually opened this week'}</h2></div>
        ${trackRows(vibe, TRACK_BY_ID, platformUrl, app.language)}
      </section>

      <section class="weekly-footer-cta">
        <div><span class="eyebrow">${korean ? '다음 장은 저절로 달라집니다' : 'THE NEXT PAGE WILL CHANGE ON ITS OWN'}</span><h2>${korean ? '취향을 고치려 하지 말고, 다음에 귀가 멈춘 곳만 남겨두세요.' : 'Do not try to correct your taste. Just leave the next place where your ear stops.'}</h2><p>${korean ? '오늘의 선곡에서 한 곡을 열거나 짧은 반응을 남기면, 다음 일곱 날은 그 흔적부터 이어 씁니다.' : 'Open a song or leave a small reaction in Music for Today; the next seven days will begin from that trace.'}</p></div>
        <button type="button" class="editorial-text-link" data-route="now">${escapeHtml(app.copy().openNow)} →</button>
      </section>
    </div>
  `;

  app.renderNotice();
  track('weekly_vibe_view', { product_version: 'v3-nv1', state: computed.sufficientData ? 'ready' : 'saved', profile_id: app.profile.id, week_key: vibe.weekKey, interaction_count: vibe.interactionCount, archetype_id: vibe.archetypeId, dominant_context_id: vibe.dominantContextId });
}
