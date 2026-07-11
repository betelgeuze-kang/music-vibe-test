import { AXES } from '../data/axes.mjs?v=qg1';
import { localize } from '../domain/profile.mjs?v=qg1';
import { axisReading, pairReading, roundedScore, scoreBand } from '../domain/presentation.mjs';
import { escapeHtml } from '../ui/helpers.mjs?v=qg1';

function polarPoint(center, radius, angleDegrees) {
  const angle = (angleDegrees - 90) * Math.PI / 180;
  return [center + Math.cos(angle) * radius, center + Math.sin(angle) * radius];
}

function pointsAtRadius(center, radius) {
  return AXES.map((_, index) => polarPoint(center, radius, index * 60).map((value) => value.toFixed(1)).join(',')).join(' ');
}

export function glyphPoints(profile, size = 280, padding = 50) {
  const center = size / 2;
  const maxRadius = center - padding;
  return AXES.map((axis, index) => {
    const score = Number(profile?.scores?.[axis.id] ?? 50);
    const radius = maxRadius * (0.22 + score / 100 * 0.78);
    return polarPoint(center, radius, index * 60);
  });
}

export function renderVibeGlyph(profile, language = 'kr', options = {}) {
  const size = Number(options.size || 280);
  const id = String(options.id || 'vibe-glyph').replace(/[^a-zA-Z0-9_-]/g, '');
  const center = size / 2;
  const maxRadius = center - 50;
  const polygon = glyphPoints(profile, size, 50).map((point) => point.map((value) => value.toFixed(1)).join(',')).join(' ');
  const summary = AXES.map((axis) => `${localize(axis.label, language)} ${scoreBand(profile.scores[axis.id], language)}`).join(', ');
  const labels = AXES.map((axis, index) => {
    const [x, y] = polarPoint(center, maxRadius + 30, index * 60);
    const anchor = x < center - 8 ? 'end' : x > center + 8 ? 'start' : 'middle';
    return `<text x="${x.toFixed(1)}" y="${(y + 4).toFixed(1)}" text-anchor="${anchor}" class="vibe-glyph__label">${escapeHtml(localize(axis.label, language))}</text>`;
  }).join('');

  return `
    <svg class="vibe-glyph" viewBox="0 0 ${size} ${size}" role="img" aria-labelledby="${id}-title ${id}-desc">
      <title id="${id}-title">${language === 'kr' ? '나의 음악 취향 글리프' : 'My music taste glyph'}</title>
      <desc id="${id}-desc">${escapeHtml(summary)}</desc>
      <g class="vibe-glyph__grid" aria-hidden="true">
        ${[0.25, 0.5, 0.75, 1].map((ratio) => `<polygon points="${pointsAtRadius(center, maxRadius * ratio)}"></polygon>`).join('')}
        ${AXES.map((_, index) => {
          const [x, y] = polarPoint(center, maxRadius, index * 60);
          return `<line x1="${center}" y1="${center}" x2="${x.toFixed(1)}" y2="${y.toFixed(1)}"></line>`;
        }).join('')}
      </g>
      <polygon class="vibe-glyph__shape" points="${polygon}"></polygon>
      ${glyphPoints(profile, size, 50).map(([x, y]) => `<circle class="vibe-glyph__point" cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="4"></circle>`).join('')}
      <circle class="vibe-glyph__core" cx="${center}" cy="${center}" r="8"></circle>
      ${labels}
    </svg>
  `;
}

export function renderBipolarAxes(profile, language = 'kr') {
  return `
    <div class="bipolar-axis-list" role="list" aria-label="${language === 'kr' ? '6가지 음악 취향 지표' : 'Six music taste dimensions'}">
      ${AXES.map((axis) => {
        const score = Number(profile.scores[axis.id]);
        const rounded = roundedScore(score);
        const axisLabel = localize(axis.label, language);
        const lowLabel = localize(axis.low, language);
        const highLabel = localize(axis.high, language);
        return `
          <article class="bipolar-axis" role="listitem">
            <div class="bipolar-axis__heading">
              <strong>${escapeHtml(axisLabel)}</strong>
              <span>${escapeHtml(axisReading(axis, score, language))}</span>
            </div>
            <div class="bipolar-axis__labels"><span>${escapeHtml(lowLabel)}</span><b>${escapeHtml(pairReading(100 - rounded, rounded, language))}</b><span>${escapeHtml(highLabel)}</span></div>
            <div class="bipolar-axis__track" role="meter" aria-label="${escapeHtml(axisLabel)}" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${score}" aria-valuetext="${escapeHtml(axisReading(axis, score, language))}">
              <i class="bipolar-axis__center"></i><em style="left:${score}%"></em>
            </div>
          </article>
        `;
      }).join('')}
    </div>
  `;
}

export function confidenceLabel(profile, language = 'kr') {
  const value = Number(profile.archetypeConfidence || 60);
  if (language === 'kr') {
    if (value >= 78) return '이 취향의 방향이 비교적 선명해요';
    if (value >= 64) return '현재 선택에 가장 가까운 청취 장면이에요';
    return '서로 가까운 두 장면이 함께 보이는 취향이에요';
  }
  if (value >= 78) return 'This listening direction is relatively clear';
  if (value >= 64) return 'Your closest listening scene right now';
  return 'A taste shared by two nearby listening scenes';
}
