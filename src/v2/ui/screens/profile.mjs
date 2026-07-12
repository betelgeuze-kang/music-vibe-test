import { AXES } from '../../data/axes.mjs?v=qg1';
import { getProfileArchetype, localize } from '../../domain/profile.mjs?v=qg1';
import { axisReading, roundedScore, scoreBand } from '../../domain/presentation.mjs';
import { recommendProfileTracks } from '../../domain/recommendation.mjs';
import {
  compareProfileSnapshots,
  findReferenceSnapshot,
  formatProfileDate,
  mergeActiveSnapshot,
  profileSnapshotKey,
  TIMELINE_VISIBLE_LIMIT
} from '../../domain/timeline.mjs?timeline=m4t1';
import { loadProfileHistory } from '../../infrastructure/storage.mjs?timeline=m4t1';
import { confidenceLabel, renderBipolarAxes, renderVibeGlyph } from '../../quality/visuals.mjs?v=qg1';
import { escapeHtml, track, trackCard } from '../helpers.mjs?engagement=m4f1';
import { renderEmptyProfile } from './empty.mjs?ui=f1';

function timelineHighlights(profile, language) {
  return AXES
    .map((axis) => ({ axis, score: Number(profile.scores[axis.id] || 50), distance: Math.abs(Number(profile.scores[axis.id] || 50) - 50) }))
    .sort((left, right) => right.distance - left.distance || left.axis.id.localeCompare(right.axis.id))
    .slice(0, 2)
    .map(({ axis, score }) => `<span><b>${escapeHtml(localize(axis.label, language))}</b>${escapeHtml(axisReading(axis, score, language))}</span>`)
    .join('');
}

function timelineEntry(profile, app, activeKey) {
  const key = profileSnapshotKey(profile);
  const active = key === activeKey;
  const archetype = getProfileArchetype(profile);
  return `
    <li class="timeline-entry ${active ? 'is-current' : ''}" data-timeline-entry data-snapshot-key="${escapeHtml(key)}" ${active ? 'aria-current="true"' : ''}>
      <div class="timeline-entry__date">
        <time datetime="${escapeHtml(profile.createdAt)}">${escapeHtml(formatProfileDate(profile, app.language))}</time>
        ${active ? `<span>${app.language === 'kr' ? '현재 기록' : 'Current note'}</span>` : ''}
      </div>
      <div class="timeline-entry__identity">
        <span aria-hidden="true">${escapeHtml(archetype.symbol)}</span>
        <div>
          <strong>${escapeHtml(localize(archetype.name, app.language))}</strong>
          <small>${escapeHtml(localize(archetype.tagline, app.language))}</small>
        </div>
      </div>
      <div class="timeline-entry__highlights">${timelineHighlights(profile, app.language)}</div>
      ${active ? '' : `
        <button type="button" class="timeline-entry__restore" data-action="restore-profile-snapshot" data-snapshot-key="${escapeHtml(key)}">
          ${app.language === 'kr' ? '이 기록으로 돌아가기' : 'Restore this note'}
        </button>
      `}
    </li>
  `;
}

function timelineSection(app) {
  const history = mergeActiveSnapshot(app.profile, loadProfileHistory());
  app.profileHistory = history;
  const activeKey = profileSnapshotKey(app.profile);
  const reference = findReferenceSnapshot(app.profile, history);
  const comparison = compareProfileSnapshots(app.profile, reference, app.language);
  const entries = history.slice(0, TIMELINE_VISIBLE_LIMIT);
  const changeCards = comparison.visibleChanges.map((change) => `
    <div class="timeline-change">
      <span>${escapeHtml(change.label)}</span>
      <strong>${escapeHtml(change.direction)}</strong>
      <b>${change.displayDelta > 0 ? '+' : '−'}${change.magnitude}</b>
    </div>
  `).join('');

  return `
    <section class="profile-timeline" aria-labelledby="profile-timeline-title">
      <header class="profile-timeline__heading">
        <div>
          <span class="eyebrow">${app.language === 'kr' ? '듣기 기록' : 'LISTENING TIMELINE'}</span>
          <h2 id="profile-timeline-title">${app.language === 'kr' ? '선택이 달라진 순간을 남겨두었어요.' : 'A record of how your choices changed.'}</h2>
          <p>${app.language === 'kr' ? '결과를 고정된 성격으로 보지 않고, 그날 더 오래 머문 소리의 기록으로 비교합니다.' : 'These notes compare the sounds you stayed with on each day, rather than treating the result as a fixed personality.'}</p>
        </div>
        <span class="profile-timeline__count">${app.language === 'kr' ? `최근 ${entries.length}개 · 전체 ${history.length}개` : `${entries.length} recent · ${history.length} total`}</span>
      </header>

      ${reference ? `
        <article class="timeline-comparison" aria-labelledby="timeline-comparison-title">
          <div class="timeline-comparison__dates">
            <span>${escapeHtml(formatProfileDate(reference, app.language))}</span>
            <i aria-hidden="true">→</i>
            <strong>${escapeHtml(formatProfileDate(app.profile, app.language))}</strong>
          </div>
          <h3 id="timeline-comparison-title">${app.language === 'kr' ? '이전 기록과 달라진 지점' : 'What shifted from the nearby note'}</h3>
          <p>${escapeHtml(comparison.summary)}</p>
          ${changeCards ? `<div class="timeline-change-grid">${changeCards}</div>` : ''}
          <small>${app.language === 'kr' ? '5점 미만의 작은 차이는 변화로 표시하지 않고, 보이는 수치는 10단위로 완화합니다.' : 'Differences under five points are treated as stable, and displayed changes are softened to ten-point steps.'}</small>
        </article>
      ` : `
        <article class="timeline-empty">
          <span aria-hidden="true">○</span>
          <div><h3>${app.language === 'kr' ? '첫 번째 기록이에요.' : 'This is your first note.'}</h3><p>${app.language === 'kr' ? '다음에 다시 듣고 고르면 여섯 방향이 어떻게 달라졌는지 보여드릴게요.' : 'Listen and choose again later to see how the six directions move.'}</p></div>
        </article>
      `}

      <ol class="profile-timeline__list">
        ${entries.map((profile) => timelineEntry(profile, app, activeKey)).join('')}
      </ol>

      <footer class="profile-timeline__footer">
        <p>${app.language === 'kr' ? '과거 기록을 지워도 현재 취향과 추천 피드백은 유지됩니다.' : 'Clearing earlier notes keeps your current taste and recommendation feedback.'}</p>
        <button type="button" data-action="clear-profile-history" ${history.length <= 1 ? 'disabled' : ''}>${app.language === 'kr' ? '과거 기록 지우기' : 'Clear earlier notes'}</button>
      </footer>
    </section>
  `;
}

export function renderProfile(app) {
  const copy = app.copy();
  if (!app.profile) {
    renderEmptyProfile(app, copy.profileMeaning, copy.beginProfile);
    return;
  }

  const archetype = getProfileArchetype(app.profile);
  const [start, middle, end] = archetype.gradient;
  const strongest = AXES
    .map((axis) => ({ axis, distance: Math.abs(app.profile.scores[axis.id] - 50), score: app.profile.scores[axis.id] }))
    .sort((left, right) => right.distance - left.distance)
    .slice(0, 3);
  const signature = recommendProfileTracks(app.profile, { language: app.language, limit: 3, feedbackRecords: app.trackFeedback });

  app.root.innerHTML = `
    <div id="app-notice" class="app-notice"></div>
    <section class="profile-hero" style="--profile-start:${start};--profile-middle:${middle};--profile-end:${end}">
      <div class="profile-hero__copy">
        <span class="eyebrow">${escapeHtml(copy.profileEyebrow)}</span>
        <span class="profile-hero__symbol" aria-hidden="true">${escapeHtml(archetype.symbol)}</span>
        <h1>${escapeHtml(localize(archetype.name, app.language))}</h1>
        <p class="profile-hero__tagline">${escapeHtml(localize(archetype.tagline, app.language))}</p>
        <div class="keyword-row">${localize(archetype.keywords, app.language).map((keyword) => `<span>${escapeHtml(keyword)}</span>`).join('')}</div>
        <p class="profile-confidence">${escapeHtml(confidenceLabel(app.profile, app.language))}</p>
        <small>${escapeHtml(formatProfileDate(app.profile, app.language))} · ${escapeHtml(copy.profileSaved)}</small>
      </div>
      <div class="profile-hero__radar quality-glyph-shell">
        ${renderVibeGlyph(app.profile, app.language, { id: `profile-${app.profile.id}-${Date.parse(app.profile.createdAt) || 0}`, size: 300 })}
      </div>
    </section>

    <section class="profile-layout">
      <article class="panel">
        <span class="eyebrow">${escapeHtml(copy.profileWhy)}</span>
        <h2>${escapeHtml(localize(archetype.tagline, app.language))}</h2>
        <p class="long-copy">${escapeHtml(localize(archetype.description, app.language))}</p>
        <ul class="why-list">
          ${strongest.map(({ axis, score }) => `
            <li>
              <strong>${escapeHtml(localize(axis.label, app.language))}</strong>
              <span>${escapeHtml(axisReading(axis, score, app.language))} <small>${roundedScore(score)}</small></span>
            </li>
          `).join('')}
        </ul>
        <p class="fine-print">${escapeHtml(copy.profileMeaning)}</p>
      </article>
      <article class="panel panel--axes">
        <span class="eyebrow">${escapeHtml(copy.profileAxes)}</span>
        ${renderBipolarAxes(app.profile, app.language)}
      </article>
    </section>

    ${timelineSection(app)}

    <section class="profile-signature recommendation-list">
      <div class="list-heading"><div><span class="eyebrow">${app.language === 'kr' ? '이 취향을 설명하는 음악' : 'SIGNATURE LISTEN'}</span><h2>${app.language === 'kr' ? '지금의 취향을 가장 잘 들려주는 3곡' : 'Three tracks that explain this taste'}</h2></div><span>3 TRACKS</span></div>
      <p class="profile-signature__intro">${app.language === 'kr' ? '결과 이름보다 실제 음악으로 내 취향을 확인해보세요.' : 'Validate the result through music, not only a label.'}</p>
      ${signature.map((candidate) => trackCard(candidate, app.language, 'profile_signature')).join('')}
    </section>

    <section class="action-band">
      <div><span class="eyebrow">${app.language === 'kr' ? '다음에 들을 것' : 'NEXT LISTEN'}</span><h2>${app.language === 'kr' ? '이 기록을 오늘의 선곡과 친구 사이의 음악으로 이어보세요.' : 'Continue these notes into music for today or music for two.'}</h2></div>
      <div class="action-band__buttons">
        <button class="button button--light" type="button" data-route="now">${escapeHtml(copy.profileNow)}</button>
        <button class="button button--ghost" type="button" data-route="match">${escapeHtml(copy.profileMatch)}</button>
      </div>
    </section>

    <section class="utility-actions">
      <button type="button" data-action="share-profile">${escapeHtml(copy.profileShare)}</button>
      <button type="button" data-action="download-card">${escapeHtml(copy.profileDownload)}</button>
      <button type="button" data-action="retake-profile">${escapeHtml(copy.profileRetake)}</button>
      <button type="button" data-action="clear-profile" class="danger-link">${app.language === 'kr' ? '저장된 취향과 기록 삭제' : 'Delete saved taste and notes'}</button>
    </section>
  `;

  track('result_view', {
    product_version: 'v2-m4t1',
    result_type: archetype.id,
    profile_id: app.profile.id,
    result_origin: app.profile.source,
    strongest_band: scoreBand(strongest[0]?.score || 50, app.language)
  });
  track('profile_quality_view', {
    result_type: archetype.id,
    archetype_confidence: app.profile.archetypeConfidence,
    product_version: 'v2-m4t1'
  });
  track('profile_timeline_view', {
    product_version: 'v2-m4t1',
    profile_id: app.profile.id,
    snapshot_count: app.profileHistory.length,
    comparison_available: app.profileHistory.length > 1
  });
}
