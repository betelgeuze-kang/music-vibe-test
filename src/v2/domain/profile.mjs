import { AXIS_IDS } from '../data/axes.mjs';
import { ARCHETYPES, ARCHETYPE_BY_ID, LEGACY_TYPE_TO_ARCHETYPE } from '../data/archetypes.mjs';

export const PROFILE_VERSION = 2;

export function clamp(value, min = 0, max = 100) {
  return Math.min(max, Math.max(min, Number(value) || 0));
}

export function localize(value, language = 'kr') {
  if (typeof value === 'string') return value;
  return value?.[language] || value?.en || value?.kr || '';
}

export function scoreAnswers(questions, answers) {
  const totals = Object.fromEntries(AXIS_IDS.map((axisId) => [axisId, 0]));
  const capacities = Object.fromEntries(AXIS_IDS.map((axisId) => [axisId, 0]));

  questions.forEach((question) => {
    AXIS_IDS.forEach((axisId) => {
      const maxMagnitude = Math.max(
        ...question.options.map((option) => Math.abs(Number(option.vector?.[axisId] || 0)))
      );
      capacities[axisId] += maxMagnitude;
    });
  });

  answers.forEach((answer) => {
    const question = questions.find((candidate) => candidate.id === answer.questionId);
    const option = question?.options.find((candidate) => candidate.id === answer.optionId);
    if (!option) return;

    AXIS_IDS.forEach((axisId) => {
      totals[axisId] += Number(option.vector?.[axisId] || 0);
    });
  });

  return Object.fromEntries(AXIS_IDS.map((axisId) => {
    const capacity = capacities[axisId] || 1;
    const normalized = 50 + (totals[axisId] / capacity) * 50;
    return [axisId, Math.round(clamp(normalized))];
  }));
}

export function vectorDistance(left, right, weights = {}) {
  const weighted = AXIS_IDS.reduce((state, axisId) => {
    const weight = Number(weights[axisId] || 1);
    const difference = Number(left?.[axisId] || 50) - Number(right?.[axisId] || 50);
    state.sum += difference * difference * weight;
    state.weight += weight;
    return state;
  }, { sum: 0, weight: 0 });

  return Math.sqrt(weighted.sum / Math.max(1, weighted.weight));
}

export function similarityScore(left, right, weights = {}) {
  const distance = vectorDistance(left, right, weights);
  return clamp(Math.round(100 - distance), 0, 100);
}

export function findArchetype(scores) {
  return ARCHETYPES
    .map((archetype) => ({
      archetype,
      distance: vectorDistance(scores, archetype.centroid, {
        energy: 1.15,
        warmth: 1,
        novelty: 1.15,
        organic: 0.9,
        complexity: 1,
        sociality: 1.1
      })
    }))
    .sort((left, right) => left.distance - right.distance)[0]?.archetype || ARCHETYPES[0];
}

export function stableHash(value) {
  let hash = 2166136261;
  const input = String(value);
  for (let index = 0; index < input.length; index += 1) {
    hash ^= input.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0).toString(36).toUpperCase().padStart(7, '0').slice(0, 7);
}

export function createProfile({ scores, answers = [], source = 'onboarding', createdAt = new Date().toISOString() }) {
  const normalizedScores = Object.fromEntries(
    AXIS_IDS.map((axisId) => [axisId, Math.round(clamp(scores?.[axisId] ?? 50))])
  );
  const archetype = findArchetype(normalizedScores);
  const signature = AXIS_IDS.map((axisId) => normalizedScores[axisId]).join('-');

  return Object.freeze({
    version: PROFILE_VERSION,
    id: `MV2-${stableHash(`${signature}|${archetype.id}`)}`,
    archetypeId: archetype.id,
    scores: Object.freeze(normalizedScores),
    answers: Object.freeze(answers.map((answer) => Object.freeze({ ...answer }))),
    source,
    createdAt
  });
}

export function createProfileFromAnswers(questions, answers, source = 'onboarding') {
  return createProfile({ scores: scoreAnswers(questions, answers), answers, source });
}

export function getProfileArchetype(profile) {
  return ARCHETYPE_BY_ID[profile?.archetypeId] || findArchetype(profile?.scores || {});
}

export function profileFromArchetype(archetypeId, source = 'synthetic') {
  const archetype = ARCHETYPE_BY_ID[archetypeId] || ARCHETYPES[0];
  return createProfile({ scores: archetype.centroid, source, answers: [] });
}

export function profileFromLegacyType(type) {
  const normalized = String(type || '').toUpperCase();
  const archetypeId = LEGACY_TYPE_TO_ARCHETYPE[normalized];
  if (!archetypeId) return null;
  return profileFromArchetype(archetypeId, `legacy_${normalized.toLowerCase()}`);
}

function toBase64Url(value) {
  const bytes = new TextEncoder().encode(value);
  let binary = '';
  bytes.forEach((byte) => { binary += String.fromCharCode(byte); });
  return btoa(binary)
    .replaceAll('+', '-')
    .replaceAll('/', '_')
    .replaceAll('=', '');
}

function fromBase64Url(value) {
  const padded = String(value).replaceAll('-', '+').replaceAll('_', '/')
    + '='.repeat((4 - (String(value).length % 4)) % 4);
  const binary = atob(padded);
  const bytes = Uint8Array.from(binary, (character) => character.charCodeAt(0));
  return new TextDecoder().decode(bytes);
}

export function encodeProfile(profile) {
  if (!profile?.scores) throw new Error('A valid profile is required.');
  const payload = {
    v: PROFILE_VERSION,
    a: profile.archetypeId,
    s: AXIS_IDS.map((axisId) => Math.round(clamp(profile.scores[axisId]))),
    i: profile.id
  };
  return toBase64Url(JSON.stringify(payload));
}

export function decodeProfile(token) {
  if (!token || String(token).length > 500) return null;
  try {
    const payload = JSON.parse(fromBase64Url(token));
    if (Number(payload.v) !== PROFILE_VERSION || !Array.isArray(payload.s) || payload.s.length !== AXIS_IDS.length) {
      return null;
    }
    const scores = Object.fromEntries(
      AXIS_IDS.map((axisId, index) => [axisId, Math.round(clamp(payload.s[index]))])
    );
    const profile = createProfile({ scores, source: 'shared', answers: [] });
    return Object.freeze({
      ...profile,
      id: typeof payload.i === 'string' && /^MV2-[A-Z0-9]{7}$/.test(payload.i) ? payload.i : profile.id,
      archetypeId: ARCHETYPE_BY_ID[payload.a] ? payload.a : profile.archetypeId
    });
  } catch (_) {
    return null;
  }
}
