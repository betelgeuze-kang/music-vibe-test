import { AXES, AXIS_IDS } from '../data/axes.mjs';
import { CONTEXT_BY_ID } from '../data/contexts.mjs';
import { TRACKS } from '../data/tracks.mjs';
import { getProfileArchetype, localize, similarityScore } from './profile.mjs';
import { averageProfiles, platformUrl } from './recommendation.mjs';

function axisGap(left, right, axisId) {
  return Math.abs(Number(left?.scores?.[axisId] || 50) - Number(right?.scores?.[axisId] || 50));
}

function matchLabel(score, language) {
  if (language === 'kr') {
    if (score >= 88) return '강하게 공명하는 듀오';
    if (score >= 76) return '자연스럽게 섞이는 믹스';
    if (score >= 64) return '차이가 매력적인 조합';
    return '새로운 다리를 만드는 조합';
  }
  if (score >= 88) return 'Deeply resonant duo';
  if (score >= 76) return 'Naturally blended mix';
  if (score >= 64) return 'Compelling contrast';
  return 'A bridge-building pair';
}

function axisSentence(axis, gap, leftScore, rightScore, language, common) {
  const label = localize(axis.label, language);
  if (language === 'kr') {
    if (common) {
      const direction = ((leftScore + rightScore) / 2) >= 50
        ? localize(axis.high, 'kr')
        : localize(axis.low, 'kr');
      return `${label}에서 둘 다 ${direction} 쪽에 가까워요.`;
    }
    const leftDirection = leftScore >= rightScore
      ? localize(axis.high, 'kr')
      : localize(axis.low, 'kr');
    const rightDirection = rightScore >= leftScore
      ? localize(axis.high, 'kr')
      : localize(axis.low, 'kr');
    return `${label}에서 한 사람은 ${leftDirection}, 다른 사람은 ${rightDirection} 쪽이라 서로의 선곡을 넓혀줄 수 있어요.`;
  }

  if (common) {
    const direction = ((leftScore + rightScore) / 2) >= 50
      ? localize(axis.high, 'en')
      : localize(axis.low, 'en');
    return `You both lean ${direction.toLowerCase()} on ${label.toLowerCase()}.`;
  }
  const leftDirection = leftScore >= rightScore
    ? localize(axis.high, 'en')
    : localize(axis.low, 'en');
  const rightDirection = rightScore >= leftScore
    ? localize(axis.high, 'en')
    : localize(axis.low, 'en');
  return `On ${label.toLowerCase()}, one leans ${leftDirection.toLowerCase()} while the other leans ${rightDirection.toLowerCase()}, expanding the shared range.`;
}

function bridgeTrackScore(track, leftProfile, rightProfile, midpoint) {
  const leftFit = similarityScore(leftProfile.scores, track.profile);
  const rightFit = similarityScore(rightProfile.scores, track.profile);
  const midpointFit = similarityScore(midpoint, track.profile);
  const togetherFit = similarityScore(CONTEXT_BY_ID.together.target, track.profile);
  const fairness = 100 - Math.abs(leftFit - rightFit);
  return {
    total: Math.round(midpointFit * 0.42 + fairness * 0.28 + togetherFit * 0.2 + Math.min(leftFit, rightFit) * 0.1),
    leftFit,
    rightFit,
    midpointFit
  };
}

export function compareProfiles(leftProfile, rightProfile, language = 'kr') {
  if (!leftProfile?.scores || !rightProfile?.scores) return null;

  const gaps = AXES.map((axis) => ({
    axis,
    gap: axisGap(leftProfile, rightProfile, axis.id),
    leftScore: leftProfile.scores[axis.id],
    rightScore: rightProfile.scores[axis.id]
  }));

  const averageGap = gaps.reduce((sum, item) => sum + item.gap, 0) / gaps.length;
  const moderateContrast = gaps.filter((item) => item.gap >= 18 && item.gap <= 38).length;
  const extremeContrast = gaps.filter((item) => item.gap > 55).length;
  const complementBonus = Math.min(8, moderateContrast * 2) - extremeContrast * 3;
  const score = Math.max(42, Math.min(98, Math.round(100 - averageGap * 0.78 + complementBonus)));

  const common = gaps
    .filter((item) => item.gap <= 16)
    .sort((left, right) => left.gap - right.gap)
    .slice(0, 3)
    .map((item) => ({
      axisId: item.axis.id,
      label: localize(item.axis.label, language),
      text: axisSentence(item.axis, item.gap, item.leftScore, item.rightScore, language, true)
    }));

  const differences = gaps
    .filter((item) => item.gap >= 26)
    .sort((left, right) => right.gap - left.gap)
    .slice(0, 3)
    .map((item) => ({
      axisId: item.axis.id,
      label: localize(item.axis.label, language),
      text: axisSentence(item.axis, item.gap, item.leftScore, item.rightScore, language, false)
    }));

  const midpoint = averageProfiles(leftProfile.scores, rightProfile.scores);
  const artists = new Set();
  const bridgeTracks = TRACKS
    .map((track) => ({ track, ...bridgeTrackScore(track, leftProfile, rightProfile, midpoint) }))
    .sort((left, right) => right.total - left.total)
    .filter((candidate) => {
      if (artists.has(candidate.track.artist)) return false;
      artists.add(candidate.track.artist);
      return true;
    })
    .slice(0, 5)
    .map((candidate) => Object.freeze({
      ...candidate,
      reason: language === 'kr'
        ? `두 사람 모두에게 ${Math.min(candidate.leftFit, candidate.rightFit)}점 이상 맞으면서, 함께 듣기 좋은 리듬을 가진 곡이에요.`
        : `Fits both profiles at ${Math.min(candidate.leftFit, candidate.rightFit)}+ while carrying a strong shared-listening rhythm.`,
      urls: Object.freeze({
        spotify: platformUrl(candidate.track, 'spotify'),
        youtube: platformUrl(candidate.track, 'youtube'),
        apple: platformUrl(candidate.track, 'apple')
      })
    }));

  const leftArchetype = getProfileArchetype(leftProfile);
  const rightArchetype = getProfileArchetype(rightProfile);

  return Object.freeze({
    score,
    label: matchLabel(score, language),
    common: Object.freeze(common),
    differences: Object.freeze(differences),
    bridgeTracks: Object.freeze(bridgeTracks),
    midpoint: Object.freeze(midpoint),
    leftArchetype,
    rightArchetype
  });
}
