import { AXES } from '../../data/axes.mjs?v3=nv1';
import { getProfileArchetype, localize } from '../../domain/profile.mjs?v=qg1';
import { axisReading, roundedScore, scoreBand } from '../../domain/presentation.mjs?v3=nv1';
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
import { escapeHtml, track, trackCard } from '../helpers.mjs?v3=nv1';
import { renderEmptyProfile } from './empty.mjs?v3=nv1';

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
  const korean = app.language === 'kr';
  return `
    <li class="timeline-entry ${active ? 'is-current' : ''}" data-timeline-entry data-snapshot-key="${escapeHtml(key)}" ${active ? 'aria-current="true"' : ''}>
      <div class="timeline-entry__date">
        <time datetime="${escapeHtml(profile.createdAt)}">${escapeHtml(formatProfileDate(profile, app.language))}</time>
        ${active ? `<span>${korean ? '지금 펼쳐둔 장' : 'The page open now'}</span>` : ''}
      </div>
      <div class="timeline-entry__identity">
        <span aria-hidden="true">${escapeHtml(archetype.symbol)}</span>
        <div><strong>${escapeHtml(localize(archetype.name, app.language))}</strong><small>${escapeHtml(localize(archetype.tagline, app.language))}</small></div>
      </div>
      <div class="timeline-entry__highlights">${timelineHighlights(profile, app.language)}</div>
      ${active ? '' : `<button type="button" class="timeline-entry__restore" data-action="restore-profile-snapshot" data-snapshot-key="${escapeHtml(key)}">${korean ? '이날의 귀로 돌아가기' : 'Return to this day’s ear'}</button>`}
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
  const korean = app.language === 'kr';
  const changeCards = comparison.visibleChanges.map((change) => `
    <div class="timeline-change">
      <span>${escapeHtml(change.label)}</span><strong>${escapeHtml(change.direction)}</strong><b>${change.displayDelta > 0 ? '+' : '−'}${change.magnitude}</b>
    </div>
  `).join('');

  return `
    <section class="profile-timeline" aria-labelledby="profile-timeline-title">
      <header class="profile-timeline__heading">
        <div>
          <span class="eyebrow">${korean ? '날짜가 다른 몇 장' : 'PAGES FROM DIFFERENT DAYS'}</span>
          <h2 id="profile-timeline-title">${korean ? '그날의 귀가 오래 붙잡은 소리를 남겨둡니다.' : 'We keep what your ear held onto that day.'}</h2>
          <p>${korean ? '취향은 돌에 새긴 이름이 아닙니다. 잠을 덜 잔 날, 오래 걸은 날, 누군가를 떠올린 날마다 같은 사람도 다른 쪽에 조금 더 머뭅니다.' : 'Taste is not a name cut into stone. The same listener leans differently after little sleep, a long walk, or the thought of someone.'}</p>
        </div>
        <span class="profile-timeline__count">${korean ? `최근 ${entries.length}장 · 모두 ${history.length}장` : `${entries.length} recent pages · ${history.length} altogether`}</span>
      </header>

      ${reference ? `
        <article class="timeline-comparison" aria-labelledby="timeline-comparison-title">
          <div class="timeline-comparison__dates"><span>${escapeHtml(formatProfileDate(reference, app.language))}</span><i aria-hidden="true">→</i><strong>${escapeHtml(formatProfileDate(app.profile, app.language))}</strong></div>
          <h3 id="timeline-comparison-title">${korean ? '두 날 사이에서 조금 달라진 것' : 'What moved between the two days'}</h3>
          <p>${escapeHtml(comparison.summary)}</p>
          ${changeCards ? `<div class="timeline-change-grid">${changeCards}</div>` : ''}
          <small>${korean ? '작은 흔들림을 큰 변화라고 부르지 않기 위해 5점 미만은 적지 않고, 수치는 10단위로 둥글립니다.' : 'To avoid turning a small tremor into a grand change, differences under five points are left unspoken and visible numbers are rounded to tens.'}</small>
        </article>
      ` : `
        <article class="timeline-empty">
          <span aria-hidden="true">○</span>
          <div><h3>${korean ? '아직 한 장뿐입니다.' : 'There is only one page so far.'}</h3><p>${korean ? '다른 계절이나 다른 마음으로 다시 열 번을 고르면, 두 날 사이의 작은 움직임을 나란히 놓아드릴게요.' : 'Choose ten again in another season or another state of mind, and we will place the small movement between the days side by side.'}</p></div>
        </article>
      `}

      <ol class="profile-timeline__list">${entries.map((profile) => timelineEntry(profile, app, activeKey)).join('')}</ol>
      <footer class="profile-timeline__footer">
        <p>${korean ? '지난 장을 비워도 지금 펼쳐둔 기록과 곡 반응은 남습니다.' : 'Clearing earlier pages leaves the current note and track feedback in place.'}</p>
        <button type="button" data-action="clear-profile-history" ${history.length <= 1 ? 'disabled' : ''}>${korean ? '지난 장들 비우기' : 'Clear earlier pages'}</button>
      </footer>
    </section>
  `;
}

export function renderProfile(app) {
  const copy = app.copy();
  const korean = app.language === 'kr';
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
      <div class="profile-hero__radar quality-glyph-shell">${renderVibeGlyph(app.profile, app.language, { id: `profile-${app.profile.id}-${Date.parse(app.profile.createdAt) || 0}`, size: 300 })}</div>
    </section>

    <section class="profile-layout">
      <article class="panel">
        <span class="eyebrow">${escapeHtml(copy.profileWhy)}</span>
        <h2>${escapeHtml(localize(archetype.tagline, app.language))}</h2>
        <p class="long-copy">${escapeHtml(localize(archetype.description, app.language))}</p>
        <ul class="why-list">
          ${strongest.map(({ axis, score }) => `<li><strong>${escapeHtml(localize(axis.label, app.language))}</strong><span>${escapeHtml(axisReading(axis, score, app.language))} <small>${roundedScore(score)}</small></span></li>`).join('')}
        </ul>
        <p class="fine-print">${escapeHtml(copy.profileMeaning)}</p>
      </article>
      <article class="panel panel--axes"><span class="eyebrow">${escapeHtml(copy.profileAxes)}</span>${renderBipolarAxes(app.profile, app.language)}</article>
    </section>

    ${timelineSection(app)}

    <section class="profile-signature recommendation-list">
      <div class="list-heading"><div><span class="eyebrow">${korean ? '이 기록을 음악으로 다시 읽기' : 'READ THE NOTE BACK IN MUSIC'}</span><h2>${korean ? '설명보다 먼저 들려주고 싶은 세 곡' : 'Three songs to play before explaining'}</h2></div><span>${korean ? '서로 다른 세 개의 입구' : 'THREE DIFFERENT DOORS'}</span></div>
      <p class="profile-signature__intro">${korean ? '결과 이름이 마음에 맞는지 따지기보다, 세 곡 가운데 어디에서 귀가 다시 멈추는지 들어보세요.' : 'Rather than decide whether the label fits, notice where your ear stops again among the three songs.'}</p>
      ${signature.map((candidate) => trackCard(candidate, app.language, 'profile_signature')).join('')}
    </section>

    <section class="action-band">
      <div><span class="eyebrow">${korean ? '이 장 다음에' : 'AFTER THIS PAGE'}</span><h2>${korean ? '이번 주를 돌아보거나, 오늘 들을 곡을 고르거나, 친구의 기록을 곁에 놓아보세요.' : 'Look back at the week, choose music for today, or place a friend’s note beside yours.'}</h2></div>
      <div class="action-band__buttons">
        <button class="button button--light" type="button" data-action="open-weekly">${korean ? '이번 주의 장 펼치기' : 'Open this week’s page'}</button>
        <button class="button button--ghost" type="button" data-route="now">${escapeHtml(copy.profileNow)}</button>
        <button class="button button--ghost" type="button" data-route="match">${escapeHtml(copy.profileMatch)}</button>
      </div>
    </section>

    <section class="utility-actions">
      <button type="button" data-action="share-profile">${escapeHtml(copy.profileShare)}</button>
      <button type="button" data-action="download-card">${escapeHtml(copy.profileDownload)}</button>
      <button type="button" data-action="retake-profile">${escapeHtml(copy.profileRetake)}</button>
      <button type="button" data-route="settings">${korean ? '내 기록 챙기거나 비우기' : 'Take or clear my data'}</button>
      <button type="button" data-action="clear-profile" class="danger-link">${korean ? '현재 기록과 지난 장 모두 지우기' : 'Delete the current note and earlier pages'}</button>
    </section>
  `;

  track('result_view', { product_version: 'v3-nv1', result_type: archetype.id, profile_id: app.profile.id, result_origin: app.profile.source, strongest_band: scoreBand(strongest[0]?.score || 50, app.language) });
  track('profile_quality_view', { result_type: archetype.id, archetype_confidence: app.profile.archetypeConfidence, product_version: 'v3-nv1' });
  track('profile_timeline_view', { product_version: 'v3-nv1', profile_id: app.profile.id, snapshot_count: app.profileHistory.length, comparison_available: app.profileHistory.length > 1 });
}
