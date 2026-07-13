import { clamp, localize } from './profile.mjs?v=qg1';

const SCORE_BANDS = Object.freeze([
  Object.freeze({ max: 19, kr: '거의 드러나지 않음', en: 'barely present' }),
  Object.freeze({ max: 39, kr: '조금 기우는 편', en: 'a slight lean' }),
  Object.freeze({ max: 59, kr: '두 쪽을 오가는 편', en: 'moves between both sides' }),
  Object.freeze({ max: 79, kr: '분명히 기우는 편', en: 'a clear lean' }),
  Object.freeze({ max: 100, kr: '아주 또렷한 편', en: 'a strong, clear lean' })
]);

const MATCH_BANDS = Object.freeze([
  Object.freeze({ max: 49, kr: '서로 건널 다리가 필요한 사이', en: 'a pair that needs a bridge' }),
  Object.freeze({ max: 64, kr: '몇 곡이면 금세 가까워질 사이', en: 'a pair a few songs can bring closer' }),
  Object.freeze({ max: 79, kr: '함께 들어도 편한 사이', en: 'easy company for listening' }),
  Object.freeze({ max: 89, kr: '같은 곡에 자주 머물 사이', en: 'often likely to stay with the same song' }),
  Object.freeze({ max: 100, kr: '말 없이도 다음 곡을 고를 사이', en: 'a pair that can choose the next song without speaking' })
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
  const distance = Math.abs(score - 50);
  const direction = score >= 50 ? localize(axis.high, language) : localize(axis.low, language);
  if (distance < 10) {
    return language === 'kr'
      ? `${localize(axis.label, 'kr')}은 어느 한쪽에 눌러앉지 않고 장면에 따라 자리를 바꿉니다.`
      : `${localize(axis.label, 'en')} does not settle on one side; it changes seats with the scene.`;
  }
  const strength = scoreBand(distance * 2, language);
  if (language === 'kr') {
    if (distance < 20) return `${direction} 쪽으로 조금 더 자주 걸어갑니다.`;
    if (distance < 35) return `${direction} 쪽에 머무는 시간이 분명히 깁니다.`;
    return `${direction} 쪽이 이 기록에서 가장 또렷하게 들립니다.`;
  }
  if (distance < 20) return `You walk a little more often toward ${direction.toLowerCase()}.`;
  if (distance < 35) return `You spend clearly more time on the ${direction.toLowerCase()} side.`;
  return `${direction} is one of the clearest sounds in this note.`;
}

export function pairReading(left, right) {
  return `${roundedScore(left)} · ${roundedScore(right)}`;
}
