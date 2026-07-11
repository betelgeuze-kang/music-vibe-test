import { AXES } from '../../data/axes.mjs?v=qg1';
import { getProfileArchetype, localize } from '../../domain/profile.mjs?v=qg1';
import { axisReading, roundedScore, scoreBand } from '../../domain/presentation.mjs';
import { recommendProfileTracks } from '../../domain/recommendation.mjs';
import { confidenceLabel, renderBipolarAxes, renderVibeGlyph } from '../../quality/visuals.mjs?v=qg1';
import { escapeHtml, track, trackCard } from '../helpers.mjs?ui=f1';
import { renderEmptyProfile } from './empty.mjs?ui=f1';

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
  const signature = recommendProfileTracks(app.profile, { language: app.language, limit: 3 });

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
        <small>${escapeHtml(app.profile.id)} · ${escapeHtml(copy.profileSaved)}</small>
      </div>
      <div class="profile-hero__radar quality-glyph-shell">
        ${renderVibeGlyph(app.profile, app.language, { id: `profile-${app.profile.id}`, size: 300 })}
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
      <button type="button" data-action="clear-profile" class="danger-link">${app.language === 'kr' ? '저장된 취향 삭제' : 'Delete saved taste'}</button>
    </section>
  `;

  track('result_view', {
    product_version: 'v2-f1',
    result_type: archetype.id,
    profile_id: app.profile.id,
    result_origin: app.profile.source,
    strongest_band: scoreBand(strongest[0]?.score || 50, app.language)
  });
  track('profile_quality_view', {
    result_type: archetype.id,
    archetype_confidence: app.profile.archetypeConfidence,
    product_version: 'v2-f1'
  });
}
