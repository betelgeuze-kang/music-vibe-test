import { recordTheme, renderRecordArt } from '../../brand/record-art.mjs?result=rs1';
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
import { escapeHtml, track, trackCard } from '../helpers.mjs?weekly=m4w1';
import { renderEmptyProfile } from './empty.mjs?ui=f1';

function timelineHighlights(profile, language) {
  return AXES
    .map((axis) => ({ axis, score: Number(profile.scores[axis.id] ?? 50), distance: Math.abs(Number(profile.scores[axis.id] ?? 50) - 50) }))
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
  const korean = app.language !== 'en';
  const archetype = getProfileArchetype(app.profile);
  const theme = recordTheme(archetype.id);
  const name = localize(archetype.name, app.language);
  const strongest = AXES
    .map((axis) => ({ axis, distance: Math.abs(app.profile.scores[axis.id] - 50), score: app.profile.scores[axis.id] }))
    .sort((left, right) => right.distance - left.distance)
    .slice(0, 3);
  const signature = recommendProfileTracks(app.profile, { language: app.language, limit: 3, feedbackRecords: app.trackFeedback });
  const timeline = timelineSection(app);
  const open = (section) => app.profileDetailsOpen?.[section] ? 'open' : '';

  app.root.innerHTML = `
    <div id="app-notice" class="app-notice"></div>
    <div class="result-editorial" style="--record-paper:${theme.paper};--record-ink:${theme.ink}">
      <section class="profile-hero result-hero" aria-labelledby="result-name">
        <div class="profile-hero__copy">
          <span class="notes-kicker">${korean ? '열 번의 선택, 한 장의 음악 기록' : 'TEN CHOICES. ONE LISTENING NOTE.'}</span>
          <h1 id="result-name">${escapeHtml(name)}</h1>
          <p class="profile-hero__tagline">${escapeHtml(localize(archetype.tagline, app.language))}</p>
          <div class="keyword-row">${localize(archetype.keywords, app.language).map((keyword) => `<span>${escapeHtml(keyword)}</span>`).join('')}</div>
          <div class="result-hero__actions"><button type="button" class="notes-button notes-button--primary" data-action="download-card">${korean ? '내 취향 카드 공유' : 'Share my taste card'} ↗</button><button type="button" class="notes-button" data-action="share-profile">${korean ? '친구에게 비교 링크 보내기' : 'Invite a friend to compare'} ↗</button></div>
          <small>${escapeHtml(formatProfileDate(app.profile, app.language))} · ${escapeHtml(copy.profileSaved)}</small>
        </div>
        <figure class="result-record" aria-hidden="true"><div class="result-record__vinyl"></div><div class="result-record__sleeve"><div class="result-record__label"><span>LISTENING NOTE</span><span>SIDE A</span></div>${renderRecordArt(archetype.id)}<p>${escapeHtml(name)}</p><small>THE WAY YOU LISTEN.</small></div></figure>
      </section>

      <section class="profile-signature recommendation-list result-signature" aria-labelledby="result-songs-title">
        <div class="result-section-heading"><div><span class="notes-kicker">YOUR FIRST THREE TRACKS</span><h2 id="result-songs-title">${korean ? '이 취향을 들려주는 세 곡.' : 'Three songs that sound like you.'}</h2></div><p>${korean ? '어떤 음악인지 직접 들어보세요. 곡은 선택한 음악 서비스에서 열립니다.' : 'Let the music tell the story. Each song opens on your chosen music service.'}</p></div>
        <div class="result-track-grid">${signature.map((candidate) => trackCard(candidate, app.language, 'profile_signature')).join('')}</div>
        <div class="result-listen-next"><span>${korean ? '지금의 장면까지 더해볼까요?' : 'Add the moment you are in.'}</span><button type="button" class="notes-text-button" data-route="now">${korean ? '오늘 들을 다섯 곡 찾기' : 'Find five songs for today'} ↗</button></div>
      </section>

      <section class="result-share-band" aria-labelledby="result-share-title"><div><span class="notes-kicker">PASS THE RECORD.</span><h2 id="result-share-title">${korean ? '좋아하는 소리도,<br>나누면 새로운 음악이 돼요.' : 'Pass your taste along.<br>Find something new together.'}</h2><p>${korean ? '내 취향을 카드 한 장에 담아보세요. 친구가 QR이나 초대 링크로 들어오면 두 사람 사이의 음악을 찾을 수 있어요.' : 'Put your taste on a card. A friend can use its QR or your invite link to discover the music between you.'}</p></div><div class="result-share-band__actions"><button type="button" class="notes-button notes-button--primary" data-action="open-profile-card">${korean ? '카드 미리보기 · 저장' : 'Preview & save my card'} ↗</button><button type="button" class="notes-text-button" data-route="match">${korean ? '친구와 함께 들을 곡 찾기' : 'Find music for two'} ↗</button><span>${korean ? '피드 4:5 · 스토리 9:16' : 'FEED 4:5 · STORY 9:16'}</span></div></section>

      <section class="result-details" aria-labelledby="result-details-title">
        <div class="result-section-heading"><div><span class="notes-kicker">A CLOSER LISTEN</span><h2 id="result-details-title">${korean ? '내 취향, 조금 더 들여다보기.' : 'A closer look at your listening.'}</h2></div><p>${escapeHtml(copy.profileMeaning)}</p></div>
        <details class="result-disclosure" data-profile-disclosure="axes" ${open('axes')}><summary><span><b>${korean ? '왜 이런 취향이 나왔나요?' : 'Why does this taste fit me?'}</b><small>${korean ? '취향 설명과 여섯 가지 방향' : 'The story and six directions'}</small></span><i aria-hidden="true">＋</i></summary>
          <div class="profile-layout"><article class="panel"><span class="notes-kicker">${escapeHtml(copy.profileWhy)}</span><h3>${escapeHtml(localize(archetype.tagline, app.language))}</h3><p class="long-copy">${escapeHtml(localize(archetype.description, app.language))}</p><ul class="why-list">${strongest.map(({ axis, score }) => `<li><strong>${escapeHtml(localize(axis.label, app.language))}</strong><span>${escapeHtml(axisReading(axis, score, app.language))}</span></li>`).join('')}</ul><p class="profile-confidence">${escapeHtml(confidenceLabel(app.profile, app.language))}</p><div class="result-glyph">${renderVibeGlyph(app.profile, app.language, { id: 'result-profile-glyph', size: 300 })}</div></article><article class="panel panel--axes"><span class="notes-kicker">${escapeHtml(copy.profileAxes)}</span>${renderBipolarAxes(app.profile, app.language)}</article></div>
        </details>
        <details class="result-disclosure" data-profile-disclosure="timeline" ${open('timeline')}><summary><span><b>${korean ? '지난 취향 기록' : 'My listening timeline'}</b><small>${korean ? `${app.profileHistory.length}개의 기록 · 비교하고 다시 열기` : `${app.profileHistory.length} notes · compare and revisit`}</small></span><i aria-hidden="true">＋</i></summary>${timeline}</details>
      </section>
      <section class="result-continue"><div><span class="notes-kicker">KEEP LISTENING.</span><h2>${korean ? '취향은, 계속 이어지는 기록.' : 'Your taste keeps a record.'}</h2><p>${korean ? '다시 선택하거나, 이번 주에 머문 음악을 모아보세요.' : 'Listen again, or revisit the music that stayed with you this week.'}</p></div><div><button type="button" class="notes-button" data-action="retake-profile">${escapeHtml(copy.profileRetake)} ↗</button><button type="button" class="notes-text-button" data-action="open-weekly">${korean ? '이번 주 기록 보기' : 'Open Weekly Vibe'} ↗</button></div></section>
      <section class="utility-actions result-data-actions"><span>${korean ? '취향 기록은 이 브라우저에 저장됩니다.' : 'Taste notes stay in this browser.'}</span><button type="button" data-action="clear-profile" class="danger-link">${korean ? '저장된 취향과 기록 삭제' : 'Delete saved taste and notes'}</button></section>
    </div>`;

  app.root.querySelectorAll('[data-profile-disclosure]').forEach((details) => details.addEventListener('toggle', () => {
    app.profileDetailsOpen ||= {};
    app.profileDetailsOpen[details.dataset.profileDisclosure] = details.open;
    if (details.open && details.dataset.profileDisclosure === 'timeline') track('profile_timeline_view', { product_version: 'v2-rs1', snapshot_count: app.profileHistory.length, comparison_available: app.profileHistory.length > 1 });
  }));
  track('result_view', { product_version: 'v2-rs1', result_type: archetype.id, result_origin: app.profile.source, strongest_band: scoreBand(strongest[0]?.score ?? 50, app.language) });
  track('profile_quality_view', { result_type: archetype.id, archetype_confidence: app.profile.archetypeConfidence, product_version: 'v2-rs1' });
}
