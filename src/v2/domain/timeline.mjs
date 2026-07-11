import { AXES } from '../data/axes.mjs?v=qg1';
import { localize } from './profile.mjs?v=qg1';
import { roundedScore } from './presentation.mjs';

export function profileDelta(current, previous) {
  if (!current?.scores || !previous?.scores) return [];
  return AXES.map((axis) => ({
    axisId: axis.id,
    label: axis.label,
    delta: Number(current.scores[axis.id] || 0) - Number(previous.scores[axis.id] || 0),
    current: Number(current.scores[axis.id] || 0),
    previous: Number(previous.scores[axis.id] || 0)
  })).sort((left, right) => Math.abs(right.delta) - Math.abs(left.delta));
}

export function profileDeltaSummary(current, previous, language = 'kr') {
  const changes = profileDelta(current, previous).filter((item) => Math.abs(item.delta) >= 4).slice(0, 2);
  if (!changes.length) {
    return language === 'kr'
      ? '이전 기록과 비슷한 방향을 유지했어요.'
      : 'This keeps a direction similar to the previous snapshot.';
  }
  const parts = changes.map((item) => {
    const amount = Math.abs(roundedScore(item.delta));
    const direction = item.delta > 0
      ? (language === 'kr' ? '높아짐' : 'higher')
      : (language === 'kr' ? '낮아짐' : 'lower');
    return language === 'kr'
      ? `${localize(item.label, 'kr')} ${direction} ${amount}`
      : `${localize(item.label, 'en')} ${direction} ${amount}`;
  });
  return language === 'kr'
    ? `이전 기록보다 ${parts.join(', ')}.`
    : `Compared with the previous snapshot: ${parts.join(', ')}.`;
}

export function formatSnapshotDate(value, language = 'kr') {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return new Intl.DateTimeFormat(language === 'kr' ? 'ko-KR' : 'en-US', {
    year: 'numeric', month: 'short', day: 'numeric'
  }).format(date);
}
