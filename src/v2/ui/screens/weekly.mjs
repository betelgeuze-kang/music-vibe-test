import { AXES } from '../../data/axes.mjs?v=qg1';
import { CONTEXT_BY_ID } from '../../data/contexts.mjs?v=qg1';
import { getProfileArchetype, localize } from '../../domain/profile.mjs?v=qg1';
import {
  buildWeeklyVibe,
  formatWeeklyRange,
  weeklyActivityStatus,
  weeklyAlias,
  weeklySummary
} from '../../domain/weekly.mjs?weekly=m4w1';
import {
  loadInteractions,
  loadLatestWeeklyVibe,
  saveWeeklyVibe
} from '../../infrastructure/storage.mjs?weekly=m4w1';
import { renderVibeGlyph } from '../../quality/visuals.mjs?v=qg1';
import { escapeHtml, track } from '../helpers.mjs?weekly=m4w1';
import { renderEmptyProfile } from './empty.mjs?ui=f1';

function activitySuggestions(app, status) {
  const items = app.language === 'kr'
    ? [
        ['오늘의 분위기 고르기', '상황 하나를 고르면 첫 기록이 생겨요.'],
        ['추천곡 열어보기', '음악 서비스 링크를 열면 실제로 머문 곡을 기록해요.'],
        ['곡 반응 남기기', '더 듣고 싶은지, 덜 듣고 싶은지 표시해보세요.']
      ]
    : [
        ['Choose a listening moment', 'Selecting one context creates the first note.'],
        ['Open a recommended track', 'A music-service click records what held your attention.'],
        ['Leave track feedback', 'Mark whether you want more or less in that direction.']
      ];
  return `
    <div class="weekly-progress" role="progressbar" aria-valuemin="0" aria-valuemax="${status.required}" aria-valuenow="${Math.min(status.count, status.required)}">
      <i style="width:${Math.min(100, status.count / status.required * 100)}%"></i>
    </div>
    <p class="weekly-progress__label">${app.language === 'kr' ? `${status.count} / ${status.required}개 행동 기록` : `${status.count} / ${status.required} listening actions`}</p>
    <ol class="weekly-suggestions">
      ${items.map(([title, description], index) => `<li><span>${index + 1}</span><div><strong>${escapeHtml(title)}</strong><p>${escapeHtml(description)}</p></div></li>`).join('')}
    </ol>
  `;
}

function contextCards(vibe, language) {
  if (!vibe.topContexts.length) return '';
  return `
    <section class="weekly-section" aria-labelledby="weekly-contexts-title">
      <div class="weekly-section__heading"><span class="eyebrow">${language === 'kr' ? '자주 고른 장면' : 'TOP MOMENTS'}</span><h2 id="weekly-contexts-title">${language === 'kr' ? '이번 주에는 이런 순간에 음악을 찾았어요.' : 'These were the moments you returned to.'}</h2></div>
      <div class="weekly-context-grid">
        ${vibe.topContexts.map((item, index) => {
          const context = CONTEXT_BY_ID[item.contextId];
          if (!context) return '';
          return `<article class="weekly-context-card ${index === 0 ? 'is-primary' : ''}"><span aria-hidden="true">${escapeHtml(context.icon)}</span><div><small>${String(index + 1).padStart(2, '0')}</small><h3>${escapeHtml(localize(context.shortLabel, language))}</h3><p>${escapeHtml(localize(context.description, language))}</p></div></article>`;
        }).join('')}
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
          <span class="weekly-track__number">${String(index + 1).padStart(2, '0')}</span>
          <div><strong>${escapeHtml(song.title)}</strong><span>${escapeHtml(song.artist)}</span><p>${language === 'kr' ? `${item.clicks || 0}회 열어보고, 더 듣기 ${item.more || 0}회` : `${item.clicks || 0} opens · ${item.more || 0} more-like-this marks`}</p></div>
          <div class="weekly-track__links" role="group" aria-label="${language === 'kr' ? '음악 서비스에서 듣기' : 'Listen on a music service'}">
            <a href="${escapeHtml(platformUrl(song, 'spotify'))}" target="_blank" rel="noopener noreferrer" data-track-link data-platform="spotify" data-placement="weekly_vibe">Spotify</a>
            <a href="${escapeHtml(platformUrl(song, 'youtube'))}" target="_blank" rel="noopener noreferrer" data-track-link data-platform="youtube" data-placement="weekly_vibe">YouTube</a>
          </div>
        </article>`;
      }).join('')}
    </div>
  `;
}

function tagList(vibe, language) {
  if (!vibe.topTags.length) return '';
  return `
    <section class="weekly-tags" aria-labelledby="weekly-tags-title">
      <div><span class="eyebrow">${language === 'kr' ? '남은 질감' : 'TEXTURES THAT STAYED'}</span><h2 id="weekly-tags-title">${language === 'kr' ? '이번 주에 자주 겹친 소리' : 'Sounds that kept overlapping this week'}</h2></div>
      <div class="weekly-tags__list">${vibe.topTags.map((item) => `<span>#${escapeHtml(item.tag.replaceAll(' ', '-'))}</span>`).join('')}</div>
    </section>
  `;
}

function renderInsufficient(app, status, recent) {
  const copy = app.copy();
  app.root.innerHTML = `
    <div id="app-notice" class="app-notice"></div>
    <section class="weekly-empty">
      <span class="eyebrow">${app.language === 'kr' ? '이번 주의 듣기 기록' : 'WEEKLY VIBE'}</span>
      <h1>${app.language === 'kr' ? '이번 주 기록을 만드는 중이에요.' : 'Your weekly note is taking shape.'}</h1>
      <p>${app.language === 'kr' ? `최소 ${status.required}개의 실제 청취 행동이 모이면, 자주 찾은 장면과 곡을 한 장의 기록으로 정리합니다.` : `After ${status.required} real listening actions, we will turn your moments and tracks into one weekly note.`}</p>
      ${activitySuggestions(app, status)}
      <div class="weekly-empty__actions">
        <button class="button button--primary" type="button" data-route="now">${escapeHtml(copy.openNow)}</button>
        ${recent ? `<button class="button button--ghost" type="button" data-action="open-weekly" data-weekly-anchor="${escapeHtml(recent.windowEndAt)}">${app.language === 'kr' ? '최근 주간 기록 보기' : 'Open the latest weekly note'}</button>` : ''}
      </div>
      <small>${app.language === 'kr' ? '이 기록은 브라우저 안에만 저장되며 외부 스트리밍 청취 이력을 가져오지 않아요.' : 'This note stays in your browser and does not import external streaming history.'}</small>
    </section>
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
  const latest = loadLatestWeeklyVibe(app.profile.id);
  const { TRACK_BY_ID, platformUrl } = await import('../../domain/recommendation.mjs?weekly=m4w1');
  const vibe = buildWeeklyVibe({ profile: app.profile, interactions, trackById: TRACK_BY_ID, anchor });

  if (!vibe.sufficientData) {
    renderInsufficient(app, status, latest);
    return;
  }

  saveWeeklyVibe(vibe);
  app.latestWeeklyVibe = vibe;
  const archetype = getProfileArchetype(vibe);
  const [start, middle, end] = archetype.gradient;
  const primaryContext = CONTEXT_BY_ID[vibe.dominantContextId];

  app.root.innerHTML = `
    <div id="app-notice" class="app-notice"></div>
    <div class="weekly-page">
      <section class="weekly-hero" style="--weekly-start:${start};--weekly-middle:${middle};--weekly-end:${end}">
        <div class="weekly-hero__copy">
          <span class="eyebrow">${app.language === 'kr' ? '이번 주의 듣기 기록' : 'WEEKLY VIBE'}</span>
          <small>${escapeHtml(formatWeeklyRange(vibe, app.language))}</small>
          <h1>${escapeHtml(weeklyAlias(vibe, app.language))}</h1>
          <p>${escapeHtml(weeklySummary(vibe, app.language))}</p>
          <div class="weekly-hero__meta">
            <span>${app.language === 'kr' ? `${vibe.interactionCount}개 행동` : `${vibe.interactionCount} actions`}</span>
            <span>${escapeHtml(localize(archetype.name, app.language))}</span>
            ${primaryContext ? `<span>${escapeHtml(localize(primaryContext.shortLabel, app.language))}</span>` : ''}
          </div>
          <div class="weekly-hero__actions">
            <button type="button" class="button button--light" data-action="weekly-listen" data-context-id="${escapeHtml(vibe.dominantContextId || 'explore')}">${app.language === 'kr' ? '이 흐름으로 5곡 더 듣기' : 'Hear five more in this direction'}</button>
            <button type="button" class="button button--ghost" data-action="share-weekly-card">${app.language === 'kr' ? '주간 카드 공유·저장' : 'Share or save weekly card'}</button>
          </div>
        </div>
        <div class="weekly-hero__glyph">${renderVibeGlyph(vibe, app.language, { id: `weekly-${vibe.weekKey}`, size: 320 })}<span>${escapeHtml(archetype.symbol)}</span></div>
      </section>

      ${contextCards(vibe, app.language)}

      <section class="weekly-section weekly-section--changes" aria-labelledby="weekly-changes-title">
        <div class="weekly-section__heading"><span class="eyebrow">${app.language === 'kr' ? '기본 취향과 비교' : 'AGAINST YOUR BASELINE'}</span><h2 id="weekly-changes-title">${app.language === 'kr' ? '이번 주에 조금 더 머문 방향' : 'Directions you stayed with a little longer'}</h2><p>${app.language === 'kr' ? '현재 프로필을 덮어쓰지 않고, 최근 행동에서 보인 작은 기울기만 표시합니다.' : 'Your profile stays intact; this only shows a small lean in recent activity.'}</p></div>
        ${changeCards(vibe, app.profile, app.language)}
      </section>

      ${tagList(vibe, app.language)}

      <section class="weekly-section" aria-labelledby="weekly-tracks-title">
        <div class="weekly-section__heading"><span class="eyebrow">${app.language === 'kr' ? '이번 주의 세 곡' : 'THREE TRACKS THIS WEEK'}</span><h2 id="weekly-tracks-title">${app.language === 'kr' ? '열어보고 반응을 남긴 음악' : 'Tracks you opened and responded to'}</h2></div>
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
    state: 'ready',
    profile_id: app.profile.id,
    week_key: vibe.weekKey,
    interaction_count: vibe.interactionCount,
    archetype_id: vibe.archetypeId,
    dominant_context_id: vibe.dominantContextId
  });
}
