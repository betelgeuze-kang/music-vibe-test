import { AXES } from '../../data/axes.mjs?v=qg1';
import { CONTEXT_BY_ID } from '../../data/contexts.mjs?v=qg1';
import { getProfileArchetype, localize } from '../../domain/profile.mjs?v=qg1';
import { visibleWeeklyTags } from '../../domain/tag-visibility.mjs?weekly=m4w1';
import {
  buildWeeklyVibe,
  formatWeeklyRange,
  weeklyActivityStatus,
  weeklyAlias,
  weeklySummary,
  weeklyWindow
} from '../../domain/weekly.mjs?weekly=m4w1&journal=jn1';
import {
  loadInteractions,
  loadLatestWeeklyVibe,
  loadWeeklyVibes,
  saveWeeklyVibe
} from '../../infrastructure/storage.mjs?weekly=m4w1';
import { renderRecordArt } from '../../brand/record-art.mjs?result=rs1';
import { escapeHtml, track } from '../helpers.mjs?weekly=m4w1&listening=ln1&journal=jn1';
import { renderEmptyProfile } from './empty.mjs?ui=f1&listening=ln1';

function activitySuggestions(app, status) {
  const items = app.language === 'kr'
    ? [
        ['오늘의 분위기 고르기', '상황 하나를 고르면 첫 기록이 생겨요.'],
        ['추천곡 열어보기', '음악 서비스로 이동한 클릭을 기록해요. 재생 여부는 가져오지 않아요.'],
        ['곡 반응 남기기', '더 듣고 싶은지, 덜 듣고 싶은지 표시해보세요.']
      ]
    : [
        ['Choose a listening moment', 'Selecting one context creates the first note.'],
        ['Open a recommended track', 'We note the service-link click, without importing playback.'],
        ['Leave track feedback', 'Mark whether you want more or less in that direction.']
      ];
  return `
    <div class="weekly-progress" role="progressbar" aria-label="${app.language === 'kr' ? '주간 기록 준비 진행률' : 'Weekly note readiness'}" aria-valuemin="0" aria-valuemax="${status.required}" aria-valuenow="${Math.min(status.count, status.required)}">
      <i style="width:${Math.min(100, status.count / status.required * 100)}%"></i>
    </div>
    <p class="weekly-progress__label">${app.language === 'kr' ? `${status.count} / ${status.required}개 행동 기록 · 앞으로 ${status.remaining}개` : `${status.count} / ${status.required} site actions · ${status.remaining} to go`}</p>
    <ol class="weekly-suggestions">
      ${items.map(([title, description], index) => `<li><span aria-hidden="true">${index + 1}</span><div><strong>${escapeHtml(title)}</strong><p>${escapeHtml(description)}</p></div></li>`).join('')}
    </ol>
  `;
}

function contextCards(vibe, language) {
  const cards = vibe.topContexts.map((item, index) => {
    const context = CONTEXT_BY_ID[item.contextId];
    if (!context) return '';
    return `<article class="weekly-context-card ${index === 0 ? 'is-primary' : ''}"><span aria-hidden="true">${escapeHtml(context.icon)}</span><div><small>${String(index + 1).padStart(2, '0')}</small><h3>${escapeHtml(localize(context.shortLabel, language))}</h3><p>${escapeHtml(localize(context.description, language))}</p></div></article>`;
  }).filter(Boolean);
  if (!cards.length) return '';
  return `
    <section class="weekly-section" aria-labelledby="weekly-contexts-title">
      <div class="weekly-section__heading"><span class="eyebrow">${language === 'kr' ? '기록에 남은 장면' : 'MOMENTS IN THIS NOTE'}</span><h2 id="weekly-contexts-title">${language === 'kr' ? '음악을 찾던 순간들' : 'Moments you chose music for'}</h2></div>
      <div class="weekly-context-grid is-count-${Math.min(3, cards.length)}">
        ${cards.join('')}
      </div>
    </section>
  `;
}

function changeCards(vibe, profile, language) {
  const copy = language === 'kr';
  if (!vibe.changes.length) {
    return `<article class="weekly-stable"><span aria-hidden="true">＝</span><div><h3>${copy ? '기본 취향과 비슷한 한 주였어요.' : 'This week stayed close to your baseline.'}</h3><p>${copy ? '작은 차이는 과장하지 않고 안정된 방향으로 남겨두었습니다.' : 'Small differences are intentionally left unamplified.'}</p></div></article>`;
  }
  return `<div class="weekly-change-grid">${vibe.changes.map((change) => {
    const axis = AXES.find((candidate) => candidate.id === change.axisId);
    const direction = localize(change.direction === 'high' ? axis.high : axis.low, language);
    return `<article class="weekly-change"><span>${escapeHtml(localize(axis.label, language))}</span><strong>${escapeHtml(direction)}</strong><b>${change.displayDelta > 0 ? '+' : '−'}${change.magnitude}</b><small>${copy ? '기본 취향 대비' : 'from baseline'}</small></article>`;
  }).join('')}</div>`;
}

function trackRows(vibe, trackById, platformUrl, language) {
  if (!vibe.topTracks.length) {
    return `<div class="weekly-no-tracks"><p>${language === 'kr' ? '아직 특정 곡보다 청취 장면의 기록이 더 많아요.' : 'Your week currently contains more moment choices than track activity.'}</p></div>`;
  }
  return `
    <div class="weekly-tracklist">
      ${vibe.topTracks.map((item, index) => {
        const song = trackById[item.trackId];
        if (!song) return '';
        return `<article class="weekly-track" data-track-id="${escapeHtml(song.id)}" data-track-artist="${escapeHtml(song.artist)}">
          <span class="weekly-track__number" aria-hidden="true">${String(index + 1).padStart(2, '0')}</span>
          <div><strong>${escapeHtml(song.title)}</strong><span>${escapeHtml(song.artist)}</span><p>${language === 'kr' ? `${item.clicks || 0}회 열어보고, 더 듣기 ${item.more || 0}회` : `${item.clicks || 0} opens · ${item.more || 0} more-like-this marks`}</p></div>
          <div class="weekly-track__links" role="group" aria-label="${language === 'kr' ? '음악 서비스에서 듣기' : 'Listen on a music service'}">
            ${['spotify', 'youtube'].map(platform => {
              const direct = Boolean(song.platforms?.[platform]);
              const name = platform === 'spotify' ? 'Spotify' : 'YouTube';
              const label = direct ? (language === 'kr' ? '곡 열기' : 'Open track') : (language === 'kr' ? '검색' : 'Search');
              return `<a href="${escapeHtml(platformUrl(song, platform))}" target="_blank" rel="noopener noreferrer" data-track-link data-platform="${platform}" data-placement="weekly_vibe" data-context-id="${escapeHtml(vibe.dominantContextId || '')}" data-link-kind="${direct ? 'direct' : 'search'}" aria-label="${escapeHtml(`${song.title} · ${name} · ${label}${language === 'kr' ? ' · 새 창' : ' · new tab'}`)}">${name}<small>${label} ↗</small></a>`;
            }).join('')}
          </div>
        </article>`;
      }).join('')}
    </div>
  `;
}

function tagList(vibe, language) {
  const tags = visibleWeeklyTags(vibe.topTags, 5);
  if (!tags.length) return '';
  return `
    <section class="weekly-tags" aria-labelledby="weekly-tags-title">
      <div><span class="eyebrow">${language === 'kr' ? '남은 질감' : 'TEXTURES THAT STAYED'}</span><h2 id="weekly-tags-title">${language === 'kr' ? '이번 주에 자주 겹친 소리' : 'Sounds that kept overlapping this week'}</h2></div>
      <div class="weekly-tags__list">${tags.map((item) => `<span>#${escapeHtml(item.tag.replaceAll(' ', '-'))}</span>`).join('')}</div>
    </section>
  `;
}

function savedHistory(app, activeWeekKey) {
  const saved = loadWeeklyVibes({ profileId: app.profile.id }).filter(item => item.sufficientData);
  if (!saved.length) return '';
  const currentKey = weeklyWindow().weekKey;
  return `<nav class="weekly-history" aria-label="${app.language === 'kr' ? '이 브라우저에 저장된 주간 기록' : 'Weekly notes saved in this browser'}"><div><span class="notes-kicker">${app.language === 'kr' ? '이 브라우저의 기록' : 'SAVED IN THIS BROWSER'}</span><p>${app.language === 'kr' ? '날짜를 골라 다시 펼쳐보세요.' : 'Choose a date to reopen a note.'}</p></div><div class="weekly-history__dates"><button class="notes-button" type="button" data-action="open-weekly" aria-pressed="${activeWeekKey === currentKey}">${app.language === 'kr' ? '최근 7일' : 'Latest seven days'}</button>${saved.filter(item => item.weekKey !== currentKey).map(item => `<button class="notes-button" type="button" data-action="open-weekly" data-weekly-anchor="${escapeHtml(item.windowEndAt)}" aria-pressed="${activeWeekKey === item.weekKey}">${escapeHtml(item.weekKey.slice(0, 4))} · ${escapeHtml(formatWeeklyRange(item, app.language))}</button>`).join('')}</div></nav>`;
}

function renderInsufficient(app, status, recent) {
  const copy = app.copy();
  app.root.innerHTML = `
    <div id="app-notice" class="app-notice"></div>
    <section class="weekly-empty">
      <span class="notes-kicker">${app.language === 'kr' ? '일주일의 듣기 기록' : 'SEVEN DAYS OF LISTENING'}</span>
      <h1>${app.language === 'kr' ? '이번 주 기록을 만드는 중이에요.' : 'Your weekly note is taking shape.'}</h1>
      <p>${app.language === 'kr' ? `최근 7일 동안 이 사이트에서 남긴 분위기 선택·곡 링크 클릭·반응이 ${status.required}개 모이면, 한 장의 기록으로 정리해요. 세 종류를 모두 할 필요는 없어요.` : `After ${status.required} context choices, song-link clicks or feedback actions on this site in seven days, a note is ready. You do not need one of each.`}</p>
      ${activitySuggestions(app, status)}
      <div class="weekly-empty__actions">
        <button class="button button--primary" type="button" data-route="now">${escapeHtml(copy.openNow)}</button>
        ${recent ? `<button class="button button--ghost" type="button" data-action="open-weekly" data-weekly-anchor="${escapeHtml(recent.windowEndAt)}">${app.language === 'kr' ? '최근 주간 기록 보기' : 'Open the latest weekly note'}</button>` : ''}
      </div>
      <small>${app.language === 'kr' ? '이 기록은 브라우저 안에만 저장되며 외부 스트리밍 청취 이력을 가져오지 않아요.' : 'This note stays in your browser and does not import external streaming history.'}</small>
    </section>
    ${savedHistory(app, status.window.weekKey)}
  `;
  app.renderNotice();
  track('weekly_vibe_view', { product_version: 'v2-m4w1', state: 'insufficient', interaction_count: status.count, required_count: status.required, profile_id: app.profile.id });
}

export async function renderWeekly(app) {
  if (!app.profile) {
    renderEmptyProfile(app, app.language === 'kr' ? '먼저 내 취향을 만든 뒤 이번 주의 청취 기록을 시작할 수 있어요.' : 'Create your taste notes before starting a weekly listening recap.', app.copy().beginProfile);
    return;
  }

  const anchor = app.weeklyAnchorAt || new Date();
  const interactions = loadInteractions();
  const status = weeklyActivityStatus(interactions, anchor);
  const window = weeklyWindow(anchor);
  const savedForWindow = loadWeeklyVibes({ profileId: app.profile.id }).find((item) => item.weekKey === window.weekKey) || null;
  const latest = loadLatestWeeklyVibe(app.profile.id);
  const { TRACK_BY_ID, platformUrl } = await import('../../domain/recommendation.mjs?weekly=m4w1&listening=ln1');
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
  const primaryContext = CONTEXT_BY_ID[vibe.dominantContextId];

  app.root.innerHTML = `
    <div id="app-notice" class="app-notice"></div>
    <div class="weekly-page">
      <section class="weekly-hero">
        <div class="weekly-hero__copy">
          <span class="notes-kicker">${app.language === 'kr' ? '일주일의 듣기 기록' : 'SEVEN DAYS OF LISTENING'}</span>
          <small>${escapeHtml(formatWeeklyRange(vibe, app.language))}</small>
          <h1>${escapeHtml(weeklyAlias(vibe, app.language))}</h1>
          <p>${escapeHtml(weeklySummary(vibe, app.language))}</p>
          <div class="weekly-hero__meta">
            <span>${app.language === 'kr' ? `${vibe.interactionCount}개 행동` : `${vibe.interactionCount} actions`}</span>
            <span>${escapeHtml(localize(archetype.name, app.language))}</span>
            ${primaryContext ? `<span>${escapeHtml(localize(primaryContext.shortLabel, app.language))}</span>` : ''}
          </div>
          <div class="weekly-hero__actions">
            <button type="button" class="notes-button notes-button--primary" data-action="weekly-listen" data-context-id="${escapeHtml(vibe.dominantContextId || 'explore')}">${app.language === 'kr' ? '이 흐름의 5곡 고르기' : 'Find five in this direction'} →</button>
            <button type="button" class="notes-button" data-action="share-weekly-card">${app.language === 'kr' ? '주간 카드 공유·저장' : 'Share or save weekly card'}</button>
          </div>
        </div>
        <figure class="weekly-record"><div class="weekly-record__label"><span>MY MUSIC VIBE</span><span>WEEKLY NOTES</span></div>${renderRecordArt(archetype.id)}<figcaption>${escapeHtml(weeklyAlias(vibe, app.language))}<small>${escapeHtml(formatWeeklyRange(vibe, app.language))}</small></figcaption></figure>
      </section>

      <p class="weekly-data-note">${app.language === 'kr' ? '이 사이트의 선택·링크 클릭·반응을 바탕으로 만든 기록이에요. 외부 서비스의 재생 여부나 청취 시간은 측정하지 않아요.' : 'Based on your choices, link clicks and feedback on this site. External playback and listening time are not measured.'}</p>
      ${savedHistory(app, vibe.weekKey)}

      ${contextCards(vibe, app.language)}

      <details class="weekly-disclosure"><summary>${app.language === 'kr' ? '취향의 변화와 소리 질감 자세히 보기' : 'Explore changes and sound textures'}</summary>
      <section class="weekly-section weekly-section--changes" aria-labelledby="weekly-changes-title">
        <div class="weekly-section__heading"><span class="eyebrow">${app.language === 'kr' ? '기본 취향과 비교' : 'AGAINST YOUR BASELINE'}</span><h2 id="weekly-changes-title">${app.language === 'kr' ? '이번 기록에서 달라진 방향' : 'Directions that shifted in this note'}</h2><p>${app.language === 'kr' ? '현재 프로필을 덮어쓰지 않고, 최근 행동에서 보인 작은 기울기만 표시합니다.' : 'Your profile stays intact; this only shows a small lean in recent activity.'}</p></div>
        ${changeCards(vibe, app.profile, app.language)}
      </section>

      ${tagList(vibe, app.language)}
      </details>

      <section class="weekly-section" aria-labelledby="weekly-tracks-title">
        <div class="weekly-section__heading"><span class="notes-kicker">${app.language === 'kr' ? '다시 펼쳐볼 음악' : 'TRACKS TO REVISIT'}</span><h2 id="weekly-tracks-title">${app.language === 'kr' ? '열어보거나 반응을 남긴 음악' : 'Tracks you opened or responded to'}</h2></div>
        ${trackRows(vibe, TRACK_BY_ID, platformUrl, app.language)}
      </section>

      <section class="weekly-footer-cta">
        <div><span class="eyebrow">${app.language === 'kr' ? '다음 주의 기록' : 'THE NEXT NOTE'}</span><h2>${app.language === 'kr' ? '취향을 바꾸기보다, 다음에 머문 소리를 이어서 기록해요.' : 'Keep noting what stays with you, rather than trying to change your taste.'}</h2><p>${app.language === 'kr' ? '오늘의 선곡에서 곡을 열고 반응을 남기면 다음 주 기록이 자연스럽게 달라집니다.' : 'Open tracks and leave feedback in Music for Today; the next weekly note will change naturally.'}</p></div>
        <button type="button" class="editorial-text-link" data-route="now">${escapeHtml(app.copy().openNow)} →</button>
      </section>
    </div>
  `;

  app.renderNotice();
  track('weekly_vibe_view', {
    product_version: 'v2-m4w1',
    state: computed.sufficientData ? 'ready' : 'saved',
    profile_id: app.profile.id,
    week_key: vibe.weekKey,
    interaction_count: vibe.interactionCount,
    archetype_id: vibe.archetypeId,
    dominant_context_id: vibe.dominantContextId
  });
}
