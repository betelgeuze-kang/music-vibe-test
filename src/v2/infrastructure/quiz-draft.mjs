import { PROFILE_QUESTIONS } from '../data/questions.mjs?commercial=cr1';

export const QUIZ_DRAFT_KEY = 'music-vibe-v2-quiz-draft-v1';
export const QUIZ_DRAFT_TTL_MS = 7 * 24 * 60 * 60 * 1000;
const bank = PROFILE_QUESTIONS.map((q) => `${q.id}:${q.options.map((o) => o.id).join(',')}`).join('|');

// Only bounded question/option IDs are kept, never audio state or analytics IDs.
export function normalizeQuizDraft(value, now = Date.now()) {
  if (!value || value.version !== 1 || value.bank !== bank || !Array.isArray(value.answers)) return null;
  const updatedAt = Number(value.updatedAt);
  const startedAt = Number(value.startedAt);
  if (!Number.isFinite(updatedAt) || updatedAt > now || now - updatedAt >= QUIZ_DRAFT_TTL_MS) return null;
  if (!Number.isFinite(startedAt) || startedAt > updatedAt || startedAt <= 0) return null;
  if (value.answers.length > PROFILE_QUESTIONS.length) return null;
  const answers = [];
  for (const answer of value.answers) {
    const question = PROFILE_QUESTIONS.find((q) => q.id === answer?.questionId);
    if (!question?.options.some((o) => o.id === answer.optionId) || answers.some((a) => a.questionId === question.id)) return null;
    answers.push({ questionId: question.id, optionId: answer.optionId });
  }
  const index = Number(value.index);
  if (!Number.isInteger(index) || index < 0 || index > PROFILE_QUESTIONS.length) return null;
  if (PROFILE_QUESTIONS.slice(0, index).some((q) => !answers.some((a) => a.questionId === q.id))) return null;
  return { version: 1, bank, answers, index, startedAt, updatedAt };
}

export function makeQuizDraft(answers, index, startedAt, now = Date.now()) {
  return normalizeQuizDraft({ version: 1, bank, answers, index, startedAt, updatedAt: now }, now);
}

export function loadQuizDraft() {
  try {
    const raw = window.localStorage.getItem(QUIZ_DRAFT_KEY);
    if (!raw) return null;
    const draft = normalizeQuizDraft(JSON.parse(raw));
    if (!draft) clearQuizDraft();
    return draft;
  } catch (_) { return null; }
}

export function saveQuizDraft(draft) {
  try {
    if (!normalizeQuizDraft(draft)) return false;
    window.localStorage.setItem(QUIZ_DRAFT_KEY, JSON.stringify(draft));
    return true;
  } catch (_) { return false; }
}

export function clearQuizDraft() {
  try { window.localStorage.removeItem(QUIZ_DRAFT_KEY); return true; } catch (_) { return false; }
}
