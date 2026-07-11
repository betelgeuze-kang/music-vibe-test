import { AXES } from '../data/axes.mjs';
import { CONTEXT_BY_ID } from '../data/contexts.mjs';
import { TRACKS } from '../data/tracks.mjs';
import { getProfileArchetype, localize, similarityScore, clamp } from './profile.mjs';
import { averageProfiles, platformUrl, selectDiverseCandidates } from './recommendation.mjs';

function axisGap(left, right, axisId) {
  return Math.abs(Number(left?.scores?.[axisId] ?? 50) - Number(right?.scores?.[axisId] ?? 50));
}

function matchLabel(resonance, discovery, language) {
  if (language === 'kr') {
    if (resonance >= 84 && discovery >= 70) return '닮았지만 새로운 듀오';
    if (resonance >= 82) return '강하게 공명하는 듀오';
    if (discovery >= 78) return '서로를 넓혀주는 믹스';
    if (resonance >= 68) return '자연스럽게 섞이는 믹스';
    return '새로운 다리를 만드는 조합';
  }
  if (resonance >= 84 && discovery >= 70) return 'Familiar, yet expansive';
  if (resonance >= 82) return 'Deeply resonant duo';
  if (discovery >= 78) return 'A taste-expanding mix';
  if (resonance >= 68) return 'Naturally blended mix';
  return 'A bridge-building pair';
}

function axisSentence(axis, leftScore, rightScore, language, common) {
  const label = localize(axis.label, language);
  if (language === 'kr') {
    if (common) {
      const direction = ((leftScore + rightScore) / 2) >= 50 ? localize(axis.high, 'kr') : localize(axis.low, 'kr');
      return `${label}에서 둘 다 ${direction} 쪽에 가까워요.`;
    }
    const leftDirection = leftScore >= 50 ? localize(axis.high, 'kr') : localize(axis.low, 'kr');
    const rightDirection = rightScore >= 50 ? localize(axis.high, 'kr') : localize(axis.low, 'kr');
    return `${label}에서 나는 ${leftDirection}, 친구는 ${rightDirection} 쪽이라 서로의 선곡 범위를 넓혀줄 수 있어요.`;
  }
  if (common) {
    const direction = ((leftScore + rightScore) / 2) >= 50 ? localize(axis.high, 'en') : localize(axis.low, 'en');
    return `You both lean ${direction.toLowerCase()} on ${label.toLowerCase()}.`;
  }
  const leftDirection = leftScore >= 50 ? localize(axis.high, 'en') : localize(axis.low, 'en');
  const rightDirection = rightScore >= 50 ? localize(axis.high, 'en') : localize(axis.low, 'en');
  return `On ${label.toLowerCase()}, you lean ${leftDirection.toLowerCase()} while your friend leans ${rightDirection.toLowerCase()}, expanding the shared range.`;
}

function bridgeTrackScore(track, leftProfile, rightProfile, midpoint) {
  const leftFit = similarityScore(leftProfile.scores, track.profile);
  const rightFit = similarityScore(rightProfile.scores, track.profile);
  const midpointFit = similarityScore(midpoint, track.profile);
  const togetherFit = similarityScore(CONTEXT_BY_ID.together.target, track.profile);
  const fairness = 100 - Math.abs(leftFit - rightFit);
  const total = Math.round(midpointFit * 0.38 + fairness * 0.27 + togetherFit * 0.2 + Math.min(leftFit, rightFit) * 0.15);
  return { score: total, total, leftFit, rightFit, midpointFit, togetherFit, fairness };
}

export function compareProfiles(leftProfile, rightProfile, language = 'kr') {
  if (!leftProfile?.scores || !rightProfile?.scores) return null;
  const gaps = AXES.map((axis) => ({ axis, gap: axisGap(leftProfile, rightProfile, axis.id), leftScore: leftProfile.scores[axis.id], rightScore: rightProfile.scores[axis.id] }));
  const averageGap = gaps.reduce((sum, item) => sum + item.gap, 0) / gaps.length;
  const moderateContrast = gaps.filter((item) => item.gap >= 18 && item.gap <= 42).length;
  const extremeContrast = gaps.filter((item) => item.gap > 58).length;
  const resonance = clamp(Math.round(100 - averageGap * 0.9), 35, 98);
  const idealContrastDistance = Math.abs(averageGap - 27);
  const discovery = clamp(Math.round(92 - idealContrastDistance * 1.45 + moderateContrast * 3 - extremeContrast * 5), 38, 97);
  const score = Math.round(resonance * 0.64 + discovery * 0.36);

  const common = gaps.filter((item) => item.gap <= 16).sort((a, b) => a.gap - b.gap).slice(0, 3).map((item) => ({
    axisId: item.axis.id,
    label: localize(item.axis.label, language),
    text: axisSentence(item.axis, item.leftScore, item.rightScore, language, true)
  }));
  const differences = gaps.filter((item) => item.gap >= 26).sort((a, b) => b.gap - a.gap).slice(0, 3).map((item) => ({
    axisId: item.axis.id,
    label: localize(item.axis.label, language),
    text: axisSentence(item.axis, item.leftScore, item.rightScore, language, false)
  }));

  const midpoint = averageProfiles(leftProfile.scores, rightProfile.scores);
  const ranked = TRACKS.map((track) => ({ track, ...bridgeTrackScore(track, leftProfile, rightProfile, midpoint), strategy: 'bridge' })).sort((a, b) => b.score - a.score);
  const bridgeTracks = selectDiverseCandidates(ranked, 5, { lambda: 0.7 }).map((candidate) => Object.freeze({
    ...candidate,
    sharedFit: Math.round((candidate.leftFit + candidate.rightFit) / 2),
    reason: language === 'kr'
      ? `나에게 ${candidate.leftFit}, 친구에게 ${candidate.rightFit}의 적합도를 가지며 두 사람의 중간 취향과 함께 듣기 상황을 모두 고려했어요.`
      : `Fits you at ${candidate.leftFit} and your friend at ${candidate.rightFit}, balancing the midpoint with a shared-listening context.`,
    urls: Object.freeze({ spotify: platformUrl(candidate.track, 'spotify'), youtube: platformUrl(candidate.track, 'youtube'), apple: platformUrl(candidate.track, 'apple') })
  }));

  return Object.freeze({
    score,
    resonance,
    discovery,
    label: matchLabel(resonance, discovery, language),
    common: Object.freeze(common),
    differences: Object.freeze(differences),
    bridgeTracks: Object.freeze(bridgeTracks),
    midpoint: Object.freeze(midpoint),
    leftArchetype: getProfileArchetype(leftProfile),
    rightArchetype: getProfileArchetype(rightProfile)
  });
}
