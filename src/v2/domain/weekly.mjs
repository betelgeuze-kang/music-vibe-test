import { AXES, AXIS_IDS } from '../data/axes.mjs?v3=nv1';
import { CONTEXT_BY_ID } from '../data/contexts.mjs?v3=nv1';
import { clamp, createProfile, getProfileArchetype, localize } from './profile.mjs';

export const WEEKLY_VERSION = 1;
export const WEEKLY_WINDOW_DAYS = 7;
export const WEEKLY_MIN_INTERACTIONS = 3;
export const WEEKLY_TRACK_LIMIT = 3;
export const WEEKLY_CONTEXT_LIMIT = 3;
export const WEEKLY_TAG_LIMIT = 5;

const QUALIFYING_TYPES = new Set(['context_select', 'track_click', 'feedback_more', 'feedback_less']);
const CONTEXT_WEIGHTS = Object.freeze({ context_select: 3, track_click: 1, feedback_more: 2, feedback_less: 1 });
const TRACK_WEIGHTS = Object.freeze({ track_click: 2, feedback_more: 4, feedback_less: -3 });
const VECTOR_WEIGHTS = Object.freeze({ context_select: 1, track_click: 1, feedback_more: 2, feedback_less: 0 });

const WEEKLY_ALIASES = Object.freeze({
  focus: Object.freeze({ kr: '한곳에 모인 일곱 날', en: 'Seven days gathered in one place' }),
  lift: Object.freeze({ kr: '걸음이 조금 가벼웠던 주', en: 'A week with a lighter step' }),
  night: Object.freeze({ kr: '밤길에 오래 남은 소리', en: 'Sounds that stayed on the night road' }),
  reset: Object.freeze({ kr: '숨을 되찾은 일곱 날', en: 'Seven days of finding the breath again' }),
  explore: Object.freeze({ kr: '낯선 문을 하나 열어본 주', en: 'A week that opened one unfamiliar door' }),
  together: Object.freeze({ kr: '누군가와 같은 방에 있던 주', en: 'A week spent in the same room as someone' }),
  balanced: Object.freeze({ kr: '여러 방을 천천히 오간 주', en: 'A week moving slowly through several rooms' })
});

function timestamp(value) {
  const time = new Date(value || 0).getTime();
  return Number.isFinite(time) ? time : 0;
}

export function utcDayKey(value = new Date()) {
  const date = value instanceof Date ? value : new Date(value);
  if (!Number.isFinite(date.getTime())) return '1970-01-01';
  return date.toISOString().slice(0, 10);
}

export function weeklyWindow(anchor = new Date()) {
  const date = anchor instanceof Date ? new Date(anchor) : new Date(anchor);
  const safe = Number.isFinite(date.getTime()) ? date : new Date(0);
  const endDay = new Date(Date.UTC(safe.getUTCFullYear(), safe.getUTCMonth(), safe.getUTCDate()));
  const start = new Date(endDay);
  start.setUTCDate(start.getUTCDate() - (WEEKLY_WINDOW_DAYS - 1));
  const endExclusive = new Date(endDay);
  endExclusive.setUTCDate(endExclusive.getUTCDate() + 1);
  return Object.freeze({ weekKey: utcDayKey(endDay), startAt: start.toISOString(), endAt: endDay.toISOString(), endExclusiveAt: endExclusive.toISOString() });
}

export function qualifyingWeeklyInteractions(interactions = [], anchor = new Date()) {
  const window = weeklyWindow(anchor);
  const start = timestamp(window.startAt);
  const end = timestamp(window.endExclusiveAt);
  return [...interactions]
    .filter((item) => item && QUALIFYING_TYPES.has(String(item.type || '')))
    .filter((item) => { const time = timestamp(item.createdAt); return time >= start && time < end; })
    .sort((left, right) => timestamp(left.createdAt) - timestamp(right.createdAt) || String(left.id || '').localeCompare(String(right.id || '')));
}

export function weeklyActivityStatus(interactions = [], anchor = new Date()) {
  const qualifying = qualifyingWeeklyInteractions(interactions, anchor);
  return Object.freeze({ count: qualifying.length, required: WEEKLY_MIN_INTERACTIONS, remaining: Math.max(0, WEEKLY_MIN_INTERACTIONS - qualifying.length), ready: qualifying.length >= WEEKLY_MIN_INTERACTIONS, window: weeklyWindow(anchor) });
}

function increment(map, key, amount, details = {}) {
  if (!key) return;
  const current = map.get(key) || { key, score: 0, count: 0, ...details };
  current.score += Number(amount) || 0;
  current.count += 1;
  Object.assign(current, details);
  map.set(key, current);
}

function vectorAccumulator() {
  return { weight: 0, totals: Object.fromEntries(AXIS_IDS.map((axisId) => [axisId, 0])) };
}

function addVector(accumulator, vector, weight) {
  const safeWeight = Number(weight) || 0;
  if (!vector || safeWeight <= 0) return;
  accumulator.weight += safeWeight;
  AXIS_IDS.forEach((axisId) => { accumulator.totals[axisId] += Number(vector[axisId] ?? 50) * safeWeight; });
}

function behaviorScores(profile, accumulator, interactionCount) {
  const base = profile?.scores || Object.fromEntries(AXIS_IDS.map((axisId) => [axisId, 50]));
  if (!accumulator.weight) return Object.freeze({ ...base });
  const blend = Math.min(0.38, 0.12 + Math.max(0, interactionCount) * 0.04);
  return Object.freeze(Object.fromEntries(AXIS_IDS.map((axisId) => {
    const behavior = accumulator.totals[axisId] / accumulator.weight;
    return [axisId, Math.round(clamp(Number(base[axisId] ?? 50) * (1 - blend) + behavior * blend))];
  })));
}

function displayedDelta(value) {
  const raw = Number(value) || 0;
  if (Math.abs(raw) < 3) return 0;
  const magnitude = Math.max(5, Math.round(Math.abs(raw) / 5) * 5);
  return raw < 0 ? -magnitude : magnitude;
}

function topChanges(profile, weeklyScores) {
  return Object.freeze(AXES
    .map((axis) => {
      const rawDelta = Number(weeklyScores[axis.id] || 0) - Number(profile?.scores?.[axis.id] || 50);
      const displayDelta = displayedDelta(rawDelta);
      return Object.freeze({ axisId: axis.id, rawDelta, displayDelta, magnitude: Math.abs(displayDelta), direction: rawDelta >= 0 ? 'high' : 'low' });
    })
    .filter((item) => item.displayDelta !== 0)
    .sort((left, right) => Math.abs(right.rawDelta) - Math.abs(left.rawDelta) || left.axisId.localeCompare(right.axisId))
    .slice(0, 2));
}

function sortedStats(map, limit, options = {}) {
  const minimumScore = options.minimumScore ?? -Infinity;
  return Object.freeze([...map.values()]
    .filter((item) => item.score >= minimumScore)
    .sort((left, right) => right.score - left.score || right.count - left.count || String(left.key).localeCompare(String(right.key)))
    .slice(0, limit)
    .map((item) => Object.freeze({ ...item, score: Math.round(item.score) })));
}

export function buildWeeklyVibe({ profile, interactions = [], trackById = {}, anchor = new Date(), generatedAt = null } = {}) {
  if (!profile?.scores) throw new Error('A profile is required to build a Weekly Vibe.');
  const window = weeklyWindow(anchor);
  const qualifying = qualifyingWeeklyInteractions(interactions, anchor);
  const contextStats = new Map();
  const trackStats = new Map();
  const tagStats = new Map();
  const vectors = vectorAccumulator();

  qualifying.forEach((interaction) => {
    const type = String(interaction.type || '');
    const contextId = String(interaction.contextId || interaction.value || '');
    const context = CONTEXT_BY_ID[contextId];
    if (context) {
      increment(contextStats, contextId, CONTEXT_WEIGHTS[type] || 0, { contextId });
      if (type === 'context_select') addVector(vectors, context.target, VECTOR_WEIGHTS[type]);
    }

    const trackId = String(interaction.trackId || '');
    const track = trackById[trackId];
    if (!track) return;
    const trackWeight = TRACK_WEIGHTS[type] || 0;
    increment(trackStats, trackId, trackWeight, {
      trackId,
      clicks: (trackStats.get(trackId)?.clicks || 0) + (type === 'track_click' ? 1 : 0),
      more: (trackStats.get(trackId)?.more || 0) + (type === 'feedback_more' ? 1 : 0),
      less: (trackStats.get(trackId)?.less || 0) + (type === 'feedback_less' ? 1 : 0)
    });
    if (trackWeight > 0) (track.tags || []).forEach((tag) => increment(tagStats, String(tag), type === 'feedback_more' ? 2 : 1, { tag: String(tag) }));
    else if (trackWeight < 0) (track.tags || []).forEach((tag) => increment(tagStats, String(tag), -1, { tag: String(tag) }));
    addVector(vectors, track.profile, VECTOR_WEIGHTS[type]);
  });

  const scores = behaviorScores(profile, vectors, qualifying.length);
  const weeklyProfile = createProfile({ scores, source: 'weekly_vibe', createdAt: window.endAt });
  const topContexts = sortedStats(contextStats, WEEKLY_CONTEXT_LIMIT, { minimumScore: 1 });
  const topTags = sortedStats(tagStats, WEEKLY_TAG_LIMIT, { minimumScore: 1 });
  const topTracks = sortedStats(trackStats, WEEKLY_TRACK_LIMIT, { minimumScore: 1 });
  const dominantContextId = topContexts[0]?.contextId || '';
  const sufficientData = qualifying.length >= WEEKLY_MIN_INTERACTIONS;

  return Object.freeze({
    version: WEEKLY_VERSION,
    id: `WV-${profile.id}-${window.weekKey}`,
    weekKey: window.weekKey,
    windowStartAt: window.startAt,
    windowEndAt: window.endAt,
    generatedAt: String(generatedAt || new Date(anchor).toISOString()),
    profileId: profile.id,
    profileCreatedAt: profile.createdAt,
    interactionCount: qualifying.length,
    requiredInteractionCount: WEEKLY_MIN_INTERACTIONS,
    sufficientData,
    scores,
    archetypeId: weeklyProfile.archetypeId,
    archetypeConfidence: weeklyProfile.archetypeConfidence,
    dominantContextId,
    aliasId: dominantContextId || 'balanced',
    topContexts,
    topTags,
    topTracks,
    changes: topChanges(profile, scores),
    sourceInteractionIds: Object.freeze(qualifying.map((item) => String(item.id || '')).filter(Boolean))
  });
}

export function weeklySnapshotKey(vibe) {
  if (!vibe?.profileId || !vibe?.weekKey) return '';
  return `${vibe.profileId}::${vibe.weekKey}`;
}

export function weeklyAlias(vibe, language = 'kr') {
  return localize(WEEKLY_ALIASES[vibe?.aliasId] || WEEKLY_ALIASES.balanced, language);
}

export function formatWeeklyRange(vibeOrAnchor, language = 'kr') {
  const window = vibeOrAnchor?.windowStartAt ? { startAt: vibeOrAnchor.windowStartAt, endAt: vibeOrAnchor.windowEndAt } : weeklyWindow(vibeOrAnchor || new Date());
  const start = new Date(window.startAt);
  const end = new Date(window.endAt);
  if (language === 'kr') return `${start.getUTCMonth() + 1}월 ${start.getUTCDate()}일 – ${end.getUTCMonth() + 1}월 ${end.getUTCDate()}일`;
  const formatter = new Intl.DateTimeFormat('en', { month: 'short', day: 'numeric', timeZone: 'UTC' });
  return `${formatter.format(start)} – ${formatter.format(end)}`;
}

export function weeklySummary(vibe, language = 'kr') {
  const archetype = getProfileArchetype(vibe || {});
  const alias = weeklyAlias(vibe, language);
  const context = CONTEXT_BY_ID[vibe?.dominantContextId];
  if (language === 'kr') {
    if (context) return `${alias}. ${localize(context.shortLabel, 'kr')}에서 음악을 가장 자주 찾았고, 그때의 귀는 ${localize(archetype.name, 'kr')} 쪽에 조금 더 오래 머물렀습니다.`;
    return `${alias}. 어느 한 장면에만 머물지 않았고, ${localize(archetype.name, 'kr')}에 가까운 소리가 일곱 날 사이를 느리게 이어주었습니다.`;
  }
  if (context) return `${alias}. You reached for music most often in ${localize(context.shortLabel, 'en').toLowerCase()}, and your ear stayed a little longer near ${localize(archetype.name, 'en')}.`;
  return `${alias}. No single scene held the whole week; sounds near ${localize(archetype.name, 'en')} quietly tied the seven days together.`;
}

export function daysBetween(left, right) {
  const leftTime = timestamp(left);
  const rightTime = timestamp(right);
  if (!leftTime || !rightTime) return null;
  return Math.floor(Math.abs(rightTime - leftTime) / 86_400_000);
}

export function sevenDayReturnStatus(visitRegistration, latestWeeklyVibe = null) {
  const days = Number(visitRegistration?.daysSincePrevious);
  const eligible = Boolean(visitRegistration?.isNewDay && Number.isFinite(days) && days >= 7);
  return Object.freeze({
    eligible,
    daysSincePrevious: Number.isFinite(days) ? days : null,
    anchorAt: visitRegistration?.state?.previousVisitAt || latestWeeklyVibe?.windowEndAt || null,
    eventKey: eligible ? `${utcDayKey(visitRegistration?.state?.currentVisitAt)}::${visitRegistration?.state?.previousVisitAt || ''}` : ''
  });
}
