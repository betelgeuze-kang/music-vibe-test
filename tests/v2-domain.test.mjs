import assert from 'node:assert/strict';
import { PROFILE_QUESTIONS } from '../src/v2/data/questions.mjs';
import { ARCHETYPES } from '../src/v2/data/archetypes.mjs';
import { TRACKS } from '../src/v2/data/tracks.mjs';
import {
  createProfile,
  createProfileFromAnswers,
  decodeProfile,
  encodeProfile,
  getProfileArchetype,
  profileFromLegacyType,
  scoreAnswers
} from '../src/v2/domain/profile.mjs';
import { recommendTracks } from '../src/v2/domain/recommendation.mjs';
import { compareProfiles } from '../src/v2/domain/match.mjs';

assert.equal(PROFILE_QUESTIONS.length, 10, 'V2 onboarding must contain ten choices');
assert.equal(PROFILE_QUESTIONS.filter((question) => question.kind === 'audio').length, 4, 'V2 onboarding must contain four audio A/B choices');
assert(PROFILE_QUESTIONS.every((question) => question.options.length === 2), 'Every V2 question must be A/B');
assert(PROFILE_QUESTIONS.every((question) => question.options.every((option) => option.vector)), 'Every option must contribute a taste vector');
assert.equal(ARCHETYPES.length, 8, 'V2 must expose eight memorable music archetypes');
assert(TRACKS.length >= 30, 'The API-independent track catalog must have enough variety');

const firstAnswers = PROFILE_QUESTIONS.map((question) => ({ questionId: question.id, optionId: question.options[0].id }));
const secondAnswers = PROFILE_QUESTIONS.map((question) => ({ questionId: question.id, optionId: question.options[1].id }));
const firstScores = scoreAnswers(PROFILE_QUESTIONS, firstAnswers);
const firstScoresAgain = scoreAnswers(PROFILE_QUESTIONS, firstAnswers);
assert.deepEqual(firstScores, firstScoresAgain, 'Scoring must be deterministic');
assert(Object.values(firstScores).every((score) => score >= 0 && score <= 100), 'Every dimension must be clamped to 0..100');

const firstProfile = createProfileFromAnswers(PROFILE_QUESTIONS, firstAnswers, 'test');
const secondProfile = createProfileFromAnswers(PROFILE_QUESTIONS, secondAnswers, 'test');
assert.match(firstProfile.id, /^MV2-[A-Z0-9]{7}$/);
assert.equal(firstProfile.id, createProfileFromAnswers(PROFILE_QUESTIONS, firstAnswers, 'test').id, 'Profile ID must be deterministic for the same scores');
assert(getProfileArchetype(firstProfile));
assert.notDeepEqual(firstProfile.scores, secondProfile.scores, 'Opposite answers should produce a different profile shape');

const token = encodeProfile(firstProfile);
const decoded = decodeProfile(token);
assert(decoded, 'A valid share token must decode');
assert.deepEqual(decoded.scores, firstProfile.scores, 'Share tokens must preserve six taste scores');
assert.equal(decoded.id, firstProfile.id, 'Share tokens must preserve anonymous profile IDs');
assert.equal(decodeProfile('not-a-token'), null, 'Invalid share tokens must fail closed');
assert.equal(decodeProfile('x'.repeat(501)), null, 'Oversized share tokens must fail closed');

const focusRecommendations = recommendTracks(firstProfile, 'focus', { language: 'en', limit: 5 });
assert.equal(focusRecommendations.length, 5, 'Vibe Now must return five tracks');
assert.equal(new Set(focusRecommendations.map((item) => item.track.artist)).size, 5, 'Vibe Now must de-duplicate artists');
assert(focusRecommendations.every((item) => item.reason && item.urls.spotify && item.urls.youtube && item.urls.apple), 'Every recommendation must be explainable and platform-linkable');

const match = compareProfiles(firstProfile, secondProfile, 'en');
assert(match.score >= 42 && match.score <= 98, 'Compatibility score must stay in the designed range');
assert.equal(match.bridgeTracks.length, 5, 'Vibe Match must return a five-track Bridge Playlist');
assert(match.bridgeTracks.every((item) => item.leftFit >= 0 && item.rightFit >= 0), 'Bridge tracks must include fairness inputs');

const legacyProfile = profileFromLegacyType('ENFP');
assert(legacyProfile, 'Legacy referral types must migrate to a V2 profile');
assert.equal(profileFromLegacyType('XXXX'), null, 'Unknown legacy types must not invent a profile');

const sanitized = createProfile({ scores: { energy: 999, warmth: -10 } });
assert.equal(sanitized.scores.energy, 100);
assert.equal(sanitized.scores.warmth, 0);
assert.equal(sanitized.scores.novelty, 50);

console.log('V2 domain checks passed.');
