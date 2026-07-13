import { AXES } from '../data/axes.mjs?v3=nv1';
import { CONTEXT_BY_ID } from '../data/contexts.mjs?v3=nv1';
import { feedbackAdjustmentForTrack } from './feedback.mjs';
import { getProfileArchetype, localize, similarityScore, clamp } from './profile.mjs';
import { matchBand } from './presentation.mjs?v3=nv1';
import { averageProfiles, EDITORIAL_CATALOG, platformUrl, selectDiverseCandidates } from './recommendation.mjs?engagement=m4f1';

function axisGap(left, right, axisId) {
  return Math.abs(Number(left?.scores?.[axisId] ?? 50) - Number(right?.scores?.[axisId] ?? 50));
}

function matchLabel(resonance, discovery, language) {
  if (language === 'kr') {
    if (resonance >= 84 && discovery >= 70) return '같은 의자에 앉을 자리도, 서로에게 건넬 새 노래도 넉넉합니다.';
    if (resonance >= 82) return '이미 여러 곡에서 같은 속도로 걸을 수 있는 사이입니다.';
    if (discovery >= 78) return '서로가 아직 열어보지 않은 문을 하나씩 들고 있습니다.';
    if (resonance >= 68) return '조금만 곡의 순서를 고르면 편안한 중간이 생깁니다.';
    return '처음에는 먼 두 방이지만, 좋은 다섯 곡이면 복도를 만들 수 있습니다.';
  }
  if (resonance >= 84 && discovery >= 70) return 'There is room both to sit together and to hand each other something new.';
  if (resonance >= 82) return 'You can already walk at the same pace through many songs.';
  if (discovery >= 78) return 'Each of you is holding a door the other has not opened yet.';
  if (resonance >= 68) return 'A careful order of songs can make a comfortable middle.';
  return 'The rooms begin far apart, but five good songs can build a hallway.';
}

function axisSentence(axis, leftScore, rightScore, language, common) {
  const label = localize(axis.label, language);
  if (language === 'kr') {
    if (common) {
      const direction = ((leftScore + rightScore) / 2) >= 50 ? localize(axis.high, 'kr') : localize(axis.low, 'kr');
      return `${label}에서는 두 사람 모두 ${direction} 쪽에 의자를 놓습니다.`;
    }
    const leftDirection = leftScore >= 50 ? localize(axis.high, 'kr') : localize(axis.low, 'kr');
    const rightDirection = rightScore >= 50 ? localize(axis.high, 'kr') : localize(axis.low, 'kr');
    return `${label}에서 나는 ${leftDirection} 쪽에, 친구는 ${rightDirection} 쪽에 더 오래 머뭅니다. 이 차이가 서로에게 새 곡을 건넬 틈이 됩니다.`;
  }
  if (common) {
    const direction = ((leftScore + rightScore) / 2) >= 50 ? localize(axis.high, 'en') : localize(axis.low, 'en');
    return `On ${label.toLowerCase()}, both of you place the chair closer to ${direction.toLowerCase()}.`;
  }
  const leftDirection = leftScore >= 50 ? localize(axis.high, 'en') : localize(axis.low, 'en');
  const rightDirection = rightScore >= 50 ? localize(axis.high, 'en') : localize(axis.low, 'en');
  return `On ${label.toLowerCase()}, you stay longer with ${leftDirection.toLowerCase()} while your friend stays with ${rightDirection.toLowerCase()}. The distance leaves room to hand each other a new song.`;
}

function bridgeTrackScore(track, leftProfile, rightProfile, midpoint, feedbackRecords = {}) {
  const leftFit = similarityScore(leftProfile.scores, track.profile);
  const rightFit = similarityScore(rightProfile.scores, track.profile);
  const midpointFit = similarityScore(midpoint, track.profile);
  const togetherFit = similarityScore(CONTEXT_BY_ID.together.target, track.profile);
  const fairness = 100 - Math.abs(leftFit - rightFit);
  const editorialBonus = track.editorial ? 4 : 0;
  const baseTotal = Math.round(clamp(midpointFit * 0.36 + fairness * 0.27 + togetherFit * 0.2 + Math.min(leftFit, rightFit) * 0.13 + editorialBonus));
  const feedbackAdjustment = feedbackAdjustmentForTrack(track, 'together', feedbackRecords);
  const total = Math.round(clamp(baseTotal + feedbackAdjustment));
  return { score: total, total, baseTotal, feedbackAdjustment, leftFit, rightFit, midpointFit, togetherFit, fairness };
}

function bridgeReason(candidate, language) {
  const editorial = localize(candidate.track.editorialNote, language);
  const sharedBand = matchBand(Math.min(candidate.leftFit, candidate.rightFit), language);
  if (editorial) {
    return language === 'kr'
      ? `${editorial} 두 사람이 함께 듣기에는 ${sharedBand}에 가까운 곡입니다.`
      : `${editorial} For the two of you together, it sits in ${sharedBand.toLowerCase()}.`;
  }
  return language === 'kr'
    ? `두 기록의 중간과 같은 방에서 듣는 장면을 함께 살폈습니다. 어느 한쪽에만 기대지 않고 ${sharedBand}에 가까이 놓입니다.`
    : `This reads both the midpoint and the feeling of sharing a room. It leans toward neither person alone and sits in ${sharedBand.toLowerCase()}.`;
}

export function compareProfiles(leftProfile, rightProfile, language = 'kr', options = {}) {
  if (!leftProfile?.scores || !rightProfile?.scores) return null;
  const gaps = AXES.map((axis) => ({ axis, gap: axisGap(leftProfile, rightProfile, axis.id), leftScore: leftProfile.scores[axis.id], rightScore: rightProfile.scores[axis.id] }));
  const averageGap = gaps.reduce((sum, item) => sum + item.gap, 0) / gaps.length;
  const moderateContrast = gaps.filter((item) => item.gap >= 18 && item.gap <= 42).length;
  const extremeContrast = gaps.filter((item) => item.gap > 58).length;
  const resonance = clamp(Math.round(100 - averageGap * 0.9), 35, 98);
  const idealContrastDistance = Math.abs(averageGap - 27);
  const discovery = clamp(Math.round(92 - idealContrastDistance * 1.45 + moderateContrast * 3 - extremeContrast * 5), 38, 97);
  const score = Math.round(resonance * 0.64 + discovery * 0.36);

  const common = gaps.filter((item) => item.gap <= 16).sort((a, b) => a.gap - b.gap).slice(0, 3).map((item) => ({ axisId: item.axis.id, label: localize(item.axis.label, language), text: axisSentence(item.axis, item.leftScore, item.rightScore, language, true) }));
  const differences = gaps.filter((item) => item.gap >= 26).sort((a, b) => b.gap - a.gap).slice(0, 3).map((item) => ({ axisId: item.axis.id, label: localize(item.axis.label, language), text: axisSentence(item.axis, item.leftScore, item.rightScore, language, false) }));

  const midpoint = averageProfiles(leftProfile.scores, rightProfile.scores);
  const feedbackRecords = options.feedbackRecords || {};
  const ranked = EDITORIAL_CATALOG
    .map((track) => ({ track, ...bridgeTrackScore(track, leftProfile, rightProfile, midpoint, feedbackRecords), strategy: 'bridge' }))
    .sort((left, right) => right.score - left.score || right.baseTotal - left.baseTotal || left.track.id.localeCompare(right.track.id));
  const bridgeTracks = selectDiverseCandidates(ranked, 5, { lambda: 0.7 }).map((candidate) => Object.freeze({
    ...candidate,
    sharedFit: Math.round((candidate.leftFit + candidate.rightFit) / 2),
    reason: bridgeReason(candidate, language),
    urls: Object.freeze({ spotify: platformUrl(candidate.track, 'spotify'), youtube: platformUrl(candidate.track, 'youtube'), apple: platformUrl(candidate.track, 'apple') }),
    editorial: Boolean(candidate.track.editorial)
  }));

  return Object.freeze({
    score, resonance, discovery,
    resonanceLabel: matchBand(resonance, language),
    discoveryLabel: matchBand(discovery, language),
    label: matchLabel(resonance, discovery, language),
    common: Object.freeze(common), differences: Object.freeze(differences), bridgeTracks: Object.freeze(bridgeTracks), midpoint: Object.freeze(midpoint),
    leftArchetype: getProfileArchetype(leftProfile), rightArchetype: getProfileArchetype(rightProfile)
  });
}
