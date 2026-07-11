import { clamp, localize } from './profile.mjs?v=qg1';

const SCORE_BANDS = Object.freeze([
  Object.freeze({ max: 19, kr: '매우 낮은 편', en: 'Very low' }),
  Object.freeze({ max: 39, kr: '낮은 편', en: 'Low' }),
  Object.freeze({ max: 59, kr: '균형', en: 'Balanced' }),
  Object.freeze({ max: 79, kr: '높은 편', en: 'High' }),
  Object.freeze({ max: 100, kr: '매우 높은 편', en: 'Very high' })
]);

const MATCH_BANDS = Object.freeze([
  Object.freeze({ max: 49, kr: '새로운 연결', en: 'A new connection' }),
  Object.freeze({ max: 64, kr: '가능성이 있는 편', en: 'Promising' }),
  Object.freeze({ max: 79, kr: '높은 편', en: 'High' }),
  Object.freeze({ max: 89, kr: '매우 높은 편', en: 'Very high' }),
  Object.freeze({ max: 100, kr: '특히 뚜렷함', en: 'Especially strong' })
]);

export function roundedScore(value, step = 10) {
  const safeStep = Math.max(1, Number(step) || 10);
  return Math.round(clamp(value) / safeStep) * safeStep;
}

export function scoreBand(value, language = 'kr') {
  const score = clamp(value);
  const band = SCORE_BANDS.find((candidate) => score <= candidate.max) || SCORE_BANDS.at(-1);
  return band[language === 'en' ? 'en' : 'kr'];
}

export function matchBand(value, language = 'kr') {
  const score = clamp(value);
  const band = MATCH_BANDS.find((candidate) => score <= candidate.max) || MATCH_BANDS.at(-1);
  return band[language === 'en' ? 'en' : 'kr'];
}

export function axisReading(axis, value, language = 'kr') {
  const score = clamp(value);
  const direction = score >= 50 ? localize(axis.high, language) : localize(axis.low, language);
  const strength = scoreBand(Math.abs(score - 50) * 2, language);
  if (Math.abs(score - 50) < 10) {
    return language === 'kr'
      ? `${localize(axis.label, 'kr')}은 두 방향을 상황에 따라 고르게 사용하는 편이에요.`
      : `${localize(axis.label, 'en')} is balanced and shifts with the listening context.`;
  }
  return language === 'kr'
    ? `${direction} 쪽이 ${strength}이에요.`
    : `${direction} is ${strength.toLowerCase()}.`;
}

export function pairReading(left, right, language = 'kr') {
  const roundedLeft = roundedScore(left);
  const roundedRight = roundedScore(right);
  return language === 'kr'
    ? `${roundedLeft} · ${roundedRight}`
    : `${roundedLeft} · ${roundedRight}`;
}
