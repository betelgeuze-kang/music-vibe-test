import { AXES } from '../data/axes.mjs';
import { CONTEXT_BY_ID } from '../data/contexts.mjs';
import { getProfileArchetype, localize, similarityScore, clamp } from './profile.mjs';
import { matchBand } from './presentation.mjs';
import { averageProfiles, EDITORIAL_CATALOG, platformUrl, selectDiverseCandidates } from './recommendation.mjs';

function axisGap(left, right, axisId) {
  return Math.abs(Number(left?.scores?.[axisId] ?? 50) - Number(right?.scores?.[axisId] ?? 50));
}

function matchLabel(resonance, discovery, language) {
  if (language === 'kr') {
    if (resonance >= 84 && discovery >= 70) return '닮은 감각과 새로운 여지가 함께 있어요';
    if (resonance >= 82) return '이미 함께 머무는 지점이 많아요';
    if (discovery >= 78) return '서로의 선곡을 넓혀줄 수 있어요';
    if (resonance >= 68) return '자연스럽게 이어지는 중간 지점이 있어요';
    return '새로운 다리를 만들 수 있는 조합이에요';
  }
  if (resonance >= 84 && discovery >= 70) return 'Familiar ground with room to expand';
  if (resonance >= 82) return 'Many listening points already overlap';
  if (discovery >= 78) return 'Each listener can widen the other’s range';
  if (resonance >= 68) return 'There is a natural middle ground';
  return 'A pair that can build a new bridge';
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
  const editorialBonus = track.editorial ? 4 : 0;
  const total = Math.round(clamp(midpointFit * 0.36 + fairness * 0.27 + togetherFit * 0.2 + Math.min(leftFit, rightFit) * 0.13 + editorialBonus));
  return { score: total, total, leftFit, rightFit, midpointFit, togetherFit, fairness };
}

function bridgeReason(candidate, language) {
  const editorial = localize(candidate.track.editorialNote, language);
  const sharedBand = matchBand(Math.min(candidate.leftFit, candidate.rightFit), language);
  if (editorial) {
    return language === 'kr'
      ? `${editorial} 두 사람 모두에게 ${sharedBand}으로 맞는 중간 지점이에요.`
      : `${editorial} It is ${sharedBand.toLowerCase()} for both listeners, making it a useful middle ground.`;
  }
  return language === 'kr'
    ? `두 사람의 중간 취향과 함께 듣는 상황을 모두 고려했어요. 양쪽 모두에게 ${sharedBand}으로 맞습니다.`
    : `This balances the midpoint with a shared-listening context and is ${sharedBand.toLowerCase()} for both listeners.`;
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
  const ranked = EDITORIAL_CATALOG.map((track) => ({ track, ...bridgeTrackScore(track, leftProfile, rightProfile, midpoint), strategy: 'bridge' })).sort((a, b) => b.score - a.score);
  const bridgeTracks = selectDiverseCandidates(ranked, 5, { lambda: 0.7 }).map((candidate) => Object.freeze({
    ...candidate,
    sharedFit: Math.round((candidate.leftFit + candidate.rightFit) / 2),
    reason: bridgeReason(candidate, language),
    urls: Object.freeze({ spotify: platformUrl(candidate.track, 'spotify'), youtube: platformUrl(candidate.track, 'youtube'), apple: platformUrl(candidate.track, 'apple') }),
    editorial: Boolean(candidate.track.editorial)
  }));

  return Object.freeze({
    score,
    resonance,
    discovery,
    resonanceLabel: matchBand(resonance, language),
    discoveryLabel: matchBand(discovery, language),
    label: matchLabel(resonance, discovery, language),
    common: Object.freeze(common),
    differences: Object.freeze(differences),
    bridgeTracks: Object.freeze(bridgeTracks),
    midpoint: Object.freeze(midpoint),
    leftArchetype: getProfileArchetype(leftProfile),
    rightArchetype: getProfileArchetype(rightProfile)
  });
}
