import { AXES, AXIS_IDS } from '../data/axes.mjs';
import { TRACKS } from '../data/tracks.mjs';
import { enrichTrack } from '../data/editorial-tracks.mjs';
import { CONTEXT_BY_ID } from '../data/contexts.mjs';
import { clamp, localize, similarityScore } from './profile.mjs';
import { feedbackAdjustment, feedbackDirection } from './feedback.mjs';

const AXIS_COPY = Object.freeze({
  kr: { energy: '에너지 강도', warmth: '감정의 온도', novelty: '새로운 소리', organic: '음향 질감', complexity: '구조의 깊이', sociality: '감상 방식' },
  en: { energy: 'energy level', warmth: 'emotional warmth', novelty: 'openness to new sound', organic: 'sound texture', complexity: 'structural depth', sociality: 'listening style' }
});

const STRATEGY_COPY = Object.freeze({
  kr: {
    safe: '핵심 취향', adjacent: '한 걸음 옆', explore: '조금 낯선 곡',
    safeLead: '지금 취향의 중심과 자연스럽게 이어져요.',
    adjacentLead: '익숙한 감각을 유지하면서 한 방향을 조금 넓혀줘요.',
    exploreLead: '현재 장면에는 맞지만 일부러 낯선 방향을 섞었어요.'
  },
  en: {
    safe: 'Core fit', adjacent: 'One step sideways', explore: 'Less familiar',
    safeLead: 'This follows the center of your current taste naturally.',
    adjacentLead: 'It keeps a familiar anchor while widening one direction.',
    exploreLead: 'It fits the moment while deliberately adding a less familiar direction.'
  }
});

export const EDITORIAL_CATALOG = Object.freeze(TRACKS.map(enrichTrack));
export const TRACK_BY_ID = Object.freeze(Object.fromEntries(EDITORIAL_CATALOG.map((track) => [track.id, track])));

function axisSimilarity(left, right, axisId) {
  return 100 - Math.abs(Number(left?.[axisId] ?? 50) - Number(right?.[axisId] ?? 50));
}

function contextKeywordBonus(track, context) {
  if (!context) return 0;
  const matches = context.keywords.filter((keyword) => track.tags.includes(keyword)).length;
  return Math.min(100, matches * 34);
}

function naturalStrategy(profile, track, profileFit) {
  const noveltyDelta = Number(track.profile.novelty) - Number(profile.scores.novelty);
  const axisDistance = AXIS_IDS.reduce((sum, axisId) => sum + Math.abs(track.profile[axisId] - profile.scores[axisId]), 0) / AXIS_IDS.length;
  if (profileFit >= 68 && axisDistance <= 32) return 'safe';
  if (noveltyDelta >= 18 || profileFit < 56 || axisDistance >= 38) return 'explore';
  return 'adjacent';
}

function trackOverlap(left, right) {
  if (!left || !right) return 0;
  if (left.artist === right.artist) return 100;
  const sharedGenres = left.genres.filter((genre) => right.genres.includes(genre)).length;
  const sharedTags = left.tags.filter((tag) => right.tags.includes(tag)).length;
  const profileOverlap = similarityScore(left.profile, right.profile);
  const region = left.region === right.region ? 100 : 0;
  const decade = left.decade === right.decade ? 100 : 0;
  return clamp(Math.round(
    profileOverlap * 0.45
    + Math.min(100, sharedGenres * 45) * 0.25
    + Math.min(100, sharedTags * 24) * 0.15
    + region * 0.1
    + decade * 0.05
  ));
}

function noveltyAgainstSelected(track, selected) {
  if (!selected.length) return 100;
  return 100 - Math.max(...selected.map((candidate) => trackOverlap(track, candidate.track)));
}

export function selectDiverseCandidates(candidates, limit, options = {}) {
  const lambda = clamp(options.lambda ?? 0.76, 0, 1);
  const selected = [];
  const pool = [...candidates];
  while (selected.length < limit && pool.length) {
    let bestIndex = 0;
    let bestMmr = -Infinity;
    pool.forEach((candidate, index) => {
      const diversity = noveltyAgainstSelected(candidate.track, selected);
      const regionCount = selected.filter((item) => item.track.region === candidate.track.region).length;
      const decadeCount = selected.filter((item) => item.track.decade === candidate.track.decade).length;
      const repetitionPenalty = regionCount * 5 + decadeCount * 2;
      const mmr = candidate.score * lambda + diversity * (1 - lambda) - repetitionPenalty;
      if (mmr > bestMmr) {
        bestMmr = mmr;
        bestIndex = index;
      }
    });
    const [best] = pool.splice(bestIndex, 1);
    selected.push({ ...best, diversityScore: noveltyAgainstSelected(best.track, selected), mmrScore: Math.round(bestMmr) });
  }
  return selected;
}

function contrastSentence(profile, candidate, language) {
  const axes = AXIS_COPY[language] || AXIS_COPY.en;
  const contrast = AXIS_IDS
    .map((axisId) => ({ axisId, delta: candidate.track.profile[axisId] - profile.scores[axisId] }))
    .sort((left, right) => Math.abs(right.delta) - Math.abs(left.delta))[0];
  const direction = contrast.delta >= 0
    ? (language === 'kr' ? '높은' : 'higher')
    : (language === 'kr' ? '낮은' : 'lower');
  if (language === 'kr') {
    return candidate.strategy === 'adjacent'
      ? `다른 핵심 후보보다 ${axes[contrast.axisId]}를 조금 더 ${direction} 쪽으로 넓혀줘요.`
      : `핵심 후보보다 ${axes[contrast.axisId]}가 더 ${direction} 방향이라 새로운 감각을 만들어요.`;
  }
  return candidate.strategy === 'adjacent'
    ? `Compared with the core candidates, it moves slightly ${direction} on ${axes[contrast.axisId]}.`
    : `Compared with the core candidates, it moves further ${direction} on ${axes[contrast.axisId]} and creates a new edge.`;
}

function buildReason(profile, candidate, context, language) {
  const copy = STRATEGY_COPY[language] || STRATEGY_COPY.en;
  const editorial = localize(candidate.track.editorialNote, language);
  const learned = candidate.feedbackAdjustment
    ? language === 'kr'
      ? `이전 반응을 ${candidate.feedbackAdjustment > 0 ? '조금 반영한' : '과도하게 반복하지 않도록 낮춘'} 추천이에요.`
      : `This recommendation ${candidate.feedbackAdjustment > 0 ? 'lightly reflects' : 'avoids over-repeating'} your earlier feedback.`
    : '';
  if (editorial) {
    const base = candidate.strategy === 'safe' ? editorial : `${editorial} ${contrastSentence(profile, candidate, language)}`;
    return learned ? `${base} ${learned}` : base;
  }

  const axes = AXIS_COPY[language] || AXIS_COPY.en;
  const aligned = AXIS_IDS
    .map((axisId) => ({ axisId, score: axisSimilarity(profile.scores, candidate.track.profile, axisId) }))
    .sort((left, right) => right.score - left.score)
    .slice(0, 2);
  const base = language === 'kr'
    ? `${copy[`${candidate.strategy}Lead`]} ${axes[aligned[0].axisId]}와 ${axes[aligned[1].axisId]}가 가깝고, ${localize(context.shortLabel, 'kr')} 흐름에 맞아요.`
    : `${copy[`${candidate.strategy}Lead`]} It aligns with your ${axes[aligned[0].axisId]} and ${axes[aligned[1].axisId]}, while fitting “${localize(context.shortLabel, 'en')}.”`;
  const withContrast = candidate.strategy === 'safe' ? base : `${base} ${contrastSentence(profile, candidate, language)}`;
  return learned ? `${withContrast} ${learned}` : withContrast;
}

export function platformUrl(track, platform = 'spotify') {
  if (track.platforms?.[platform]) return track.platforms[platform];
  if (track.listenLinks?.[platform]) return track.listenLinks[platform];
  const query = encodeURIComponent(`${track.title} ${track.artist}`);
  if (platform === 'youtube') return `https://www.youtube.com/results?search_query=${query}`;
  if (platform === 'apple') return `https://music.apple.com/us/search?term=${query}`;
  return `https://open.spotify.com/search/${query}`;
}

function scoreTrack(profile, context, track, feedback = []) {
  const profileFit = similarityScore(profile.scores, track.profile, {
    energy: 1.15, warmth: 1, novelty: 1.05, organic: 0.85, complexity: 1, sociality: 1
  });
  const contextFit = similarityScore(context.target, track.profile, {
    energy: 1.2, warmth: 1, novelty: 1, organic: 0.8, complexity: 1, sociality: 1.15
  });
  const keywordFit = contextKeywordBonus(track, context);
  const editorialBonus = track.editorial ? 4 : 0;
  const learnedAdjustment = feedbackAdjustment(track, feedback, context.id);
  const score = Math.round(clamp(profileFit * 0.56 + contextFit * 0.32 + keywordFit * 0.08 + editorialBonus + learnedAdjustment));
  const axisDistance = AXIS_IDS.reduce((sum, axisId) => sum + Math.abs(track.profile[axisId] - profile.scores[axisId]), 0) / AXIS_IDS.length;
  return {
    track,
    score,
    profileFit,
    contextFit,
    keywordFit,
    axisDistance,
    feedbackAdjustment: learnedAdjustment,
    naturalStrategy: naturalStrategy(profile, track, profileFit)
  };
}

function strategySuitability(candidate, strategy) {
  if (strategy === 'safe') return candidate.score * 0.62 + candidate.profileFit * 0.34 - candidate.axisDistance * 0.18;
  if (strategy === 'adjacent') {
    const targetDistance = 29;
    return candidate.score * 0.52 + candidate.contextFit * 0.18 + (100 - Math.abs(candidate.axisDistance - targetDistance) * 2.2) * 0.3;
  }
  const noveltyDelta = Math.max(0, candidate.track.profile.novelty - candidate.profileFit * 0.18);
  const targetDistance = 45;
  return candidate.contextFit * 0.42 + candidate.score * 0.25 + noveltyDelta * 0.18 + (100 - Math.abs(candidate.axisDistance - targetDistance) * 1.7) * 0.15;
}

function decorateSelected(profile, context, candidate, language, strategy, feedback, placement) {
  const selected = {
    ...candidate,
    strategy,
    strategyLabel: STRATEGY_COPY[language]?.[strategy] || STRATEGY_COPY.en[strategy]
  };
  return Object.freeze({
    ...selected,
    reason: buildReason(profile, selected, context, language),
    urls: Object.freeze({
      spotify: platformUrl(candidate.track, 'spotify'),
      youtube: platformUrl(candidate.track, 'youtube'),
      apple: platformUrl(candidate.track, 'apple')
    }),
    exactPlatforms: Object.freeze(Object.keys(candidate.track.platforms || {})),
    editorial: Boolean(candidate.track.editorial),
    feedbackDirection: feedbackDirection(candidate.track.id, feedback, context.id, placement)
  });
}

function strategyPlan(limit, exploration = true) {
  if (!exploration || limit < 5) {
    const safe = Math.max(1, Math.ceil(limit * 0.67));
    const adjacent = Math.max(0, Math.min(limit - safe, Math.floor(limit * 0.33)));
    return { safe, adjacent, explore: Math.max(0, limit - safe - adjacent) };
  }
  return { safe: Math.min(3, limit), adjacent: limit >= 4 ? 1 : 0, explore: Math.max(0, limit - 4) };
}

function selectStrategySlots(ranked, plan, limit) {
  const selected = [];
  const selectedIds = new Set();
  const selectedArtists = new Set();
  for (const strategy of ['safe', 'adjacent', 'explore']) {
    const count = Math.min(limit - selected.length, Math.max(0, Number(plan[strategy] || 0)));
    if (!count) continue;
    const preferred = ranked
      .filter((candidate) => !selectedIds.has(candidate.track.id) && !selectedArtists.has(candidate.track.artist))
      .sort((left, right) => strategySuitability(right, strategy) - strategySuitability(left, strategy));
    const picked = selectDiverseCandidates(preferred, count, { lambda: strategy === 'explore' ? 0.6 : 0.76 });
    picked.forEach((candidate) => {
      selectedIds.add(candidate.track.id);
      selectedArtists.add(candidate.track.artist);
      selected.push({ ...candidate, assignedStrategy: strategy });
    });
  }
  if (selected.length < limit) {
    const remainder = ranked.filter((candidate) => !selectedIds.has(candidate.track.id) && !selectedArtists.has(candidate.track.artist));
    selectDiverseCandidates(remainder, limit - selected.length, { lambda: 0.7 }).forEach((candidate) => {
      selectedIds.add(candidate.track.id);
      selectedArtists.add(candidate.track.artist);
      selected.push({ ...candidate, assignedStrategy: candidate.naturalStrategy || 'safe' });
    });
  }
  return selected.slice(0, limit);
}

export function recommendTracks(profile, contextId, options = {}) {
  if (!profile?.scores) return [];
  const context = CONTEXT_BY_ID[contextId] || CONTEXT_BY_ID.focus;
  const limit = Math.max(1, Math.min(10, Number(options.limit || 5)));
  const language = options.language === 'en' ? 'en' : 'kr';
  const feedback = Array.isArray(options.feedback) ? options.feedback : [];
  const placement = options.placement || 'vibe_now';
  const plan = options.plan || strategyPlan(limit, options.exploration !== false);
  const ranked = EDITORIAL_CATALOG.map((track) => scoreTrack(profile, context, track, feedback)).sort((left, right) => right.score - left.score);
  return selectStrategySlots(ranked, plan, limit)
    .map((candidate) => decorateSelected(profile, context, candidate, language, candidate.assignedStrategy, feedback, placement));
}

export function recommendProfileTracks(profile, options = {}) {
  return recommendTracks(profile, 'explore', {
    language: options.language,
    limit: options.limit || 3,
    exploration: false,
    feedback: options.feedback || [],
    placement: 'profile_signature',
    plan: { safe: 2, adjacent: 1, explore: 0 }
  });
}

export function recommendationSummary(profile, contextId, language = 'kr') {
  const context = CONTEXT_BY_ID[contextId] || CONTEXT_BY_ID.focus;
  const gaps = AXES.map((axis) => ({ axis, difference: Math.abs(profile.scores[axis.id] - context.target[axis.id]) }))
    .sort((left, right) => left.difference - right.difference);
  if (language === 'kr') {
    return `${localize(context.label, 'kr')}에 맞춰 ${localize(gaps[0].axis.label, 'kr')}와 ${localize(gaps[1].axis.label, 'kr')}는 유지했어요. 가까운 세 곡, 한 걸음 옆의 한 곡, 조금 낯선 한 곡을 함께 골랐습니다.`;
  }
  return `Built for “${localize(context.label, 'en')}” while preserving your ${localize(gaps[0].axis.label, 'en').toLowerCase()} and ${localize(gaps[1].axis.label, 'en').toLowerCase()}: three close fits, one step sideways, and one less familiar track.`;
}

export function averageProfiles(left, right) {
  return Object.fromEntries(AXIS_IDS.map((axisId) => [
    axisId,
    Math.round(clamp((Number(left?.[axisId] ?? 50) + Number(right?.[axisId] ?? 50)) / 2))
  ]));
}
