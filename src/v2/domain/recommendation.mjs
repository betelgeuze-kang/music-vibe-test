import { AXES, AXIS_IDS } from '../data/axes.mjs';
import { TRACKS } from '../data/tracks.mjs';
import { CONTEXT_BY_ID } from '../data/contexts.mjs';
import { clamp, localize, similarityScore } from './profile.mjs';

const REASON_COPY = Object.freeze({
  kr: Object.freeze({
    intro: '당신의',
    context: '현재 상황과 잘 맞아요.',
    energy: '에너지 강도',
    warmth: '감정의 온도',
    novelty: '새로운 소리에 대한 개방성',
    organic: '음향 질감',
    complexity: '구조의 깊이',
    sociality: '감상 방식'
  }),
  en: Object.freeze({
    intro: 'It aligns with your',
    context: 'and fits this moment.',
    energy: 'energy level',
    warmth: 'emotional warmth',
    novelty: 'openness to new sound',
    organic: 'sound texture',
    complexity: 'structural depth',
    sociality: 'listening style'
  })
});

function axisSimilarity(left, right, axisId) {
  return 100 - Math.abs(Number(left?.[axisId] || 50) - Number(right?.[axisId] || 50));
}

function contextKeywordBonus(track, context) {
  if (!context) return 0;
  const matches = context.keywords.filter((keyword) => track.tags.includes(keyword)).length;
  return Math.min(100, matches * 34);
}

function buildReason(profile, track, context, language) {
  const copy = REASON_COPY[language] || REASON_COPY.en;
  const alignedAxes = AXIS_IDS
    .map((axisId) => ({ axisId, score: axisSimilarity(profile.scores, track.profile, axisId) }))
    .sort((left, right) => right.score - left.score)
    .slice(0, 2);

  if (language === 'kr') {
    return `${copy.intro} ${copy[alignedAxes[0].axisId]}와 ${copy[alignedAxes[1].axisId]}에 가깝고, ${localize(context?.shortLabel, 'kr') || '지금'}에 필요한 흐름과 ${copy.context}`;
  }
  return `${copy.intro} ${copy[alignedAxes[0].axisId]} and ${copy[alignedAxes[1].axisId]}, ${copy.context}`;
}

export function platformUrl(track, platform = 'spotify') {
  const query = encodeURIComponent(`${track.title} ${track.artist}`);
  if (platform === 'youtube') return `https://www.youtube.com/results?search_query=${query}`;
  if (platform === 'apple') return `https://music.apple.com/us/search?term=${query}`;
  return `https://open.spotify.com/search/${query}`;
}

export function recommendTracks(profile, contextId, options = {}) {
  if (!profile?.scores) return [];
  const context = CONTEXT_BY_ID[contextId] || CONTEXT_BY_ID.focus;
  const limit = Math.max(1, Math.min(10, Number(options.limit || 5)));
  const language = options.language === 'en' ? 'en' : 'kr';
  const artists = new Set();

  const ranked = TRACKS
    .map((track) => {
      const profileFit = similarityScore(profile.scores, track.profile, {
        energy: 1.15,
        warmth: 1,
        novelty: 1.05,
        organic: 0.85,
        complexity: 1,
        sociality: 1
      });
      const contextFit = similarityScore(context.target, track.profile, {
        energy: 1.2,
        warmth: 1,
        novelty: 1,
        organic: 0.8,
        complexity: 1,
        sociality: 1.15
      });
      const keywordFit = contextKeywordBonus(track, context);
      const score = Math.round(profileFit * 0.58 + contextFit * 0.34 + keywordFit * 0.08);
      return { track, score, profileFit, contextFit };
    })
    .sort((left, right) => right.score - left.score);

  const selected = [];
  for (const candidate of ranked) {
    if (artists.has(candidate.track.artist)) continue;
    artists.add(candidate.track.artist);
    selected.push(Object.freeze({
      ...candidate,
      reason: buildReason(profile, candidate.track, context, language),
      urls: Object.freeze({
        spotify: platformUrl(candidate.track, 'spotify'),
        youtube: platformUrl(candidate.track, 'youtube'),
        apple: platformUrl(candidate.track, 'apple')
      })
    }));
    if (selected.length >= limit) break;
  }

  return selected;
}

export function recommendationSummary(profile, contextId, language = 'kr') {
  const context = CONTEXT_BY_ID[contextId] || CONTEXT_BY_ID.focus;
  const gaps = AXES.map((axis) => ({
    axis,
    difference: Math.abs(profile.scores[axis.id] - context.target[axis.id])
  })).sort((left, right) => left.difference - right.difference);

  if (language === 'kr') {
    return `${localize(context.label, 'kr')}라는 목적에 맞춰, 당신의 ${localize(gaps[0].axis.label, 'kr')}와 ${localize(gaps[1].axis.label, 'kr')}를 유지하면서 지금 필요한 방향으로 선곡했어요.`;
  }
  return `Built for “${localize(context.label, 'en')}” while preserving your ${localize(gaps[0].axis.label, 'en').toLowerCase()} and ${localize(gaps[1].axis.label, 'en').toLowerCase()}.`;
}

export function averageProfiles(left, right) {
  return Object.fromEntries(AXIS_IDS.map((axisId) => [
    axisId,
    Math.round(clamp((Number(left?.[axisId] || 50) + Number(right?.[axisId] || 50)) / 2))
  ]));
}
