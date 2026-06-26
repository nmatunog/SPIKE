/**
 * Shared rules for Week 2 interview encode completion.
 */
import {
  MIN_INTERVIEW_ANSWER_CHARS,
  MAX_INTERVIEW_QUESTIONS,
} from './week2Constants.js';
import { padInterviewAnswers } from './week2DiscoveryStorage.js';
import { extractInterviewInsights } from './week2InsightSynthesis.js';

/** @param {string[] | null | undefined} answers */
export function countMeaningfulInterviewAnswers(answers) {
  return padInterviewAnswers(answers).filter((a) => String(a).trim().length >= MIN_INTERVIEW_ANSWER_CHARS).length;
}

/** @param {string[] | null | undefined} answers */
export function countSubstantialInterviewAnswers(answers) {
  return padInterviewAnswers(answers).filter((a) => String(a).trim().length > 8).length;
}

/**
 * @param {{ alias?: string, answers?: string[] | null }} input
 */
export function isInterviewEncoded(input) {
  const alias = String(input.alias ?? '').trim();
  return countMeaningfulInterviewAnswers(input.answers) >= 3 && alias.length > 1;
}

/**
 * @param {import('./week2DiscoveryTypes.js').Week2EncodedInterview | undefined} prior
 * @param {{ alias?: string, occupation?: string, answers?: string[], reflection?: string }} data
 */
export function buildEncodedInterviewRecord(prior, data) {
  const answers = padInterviewAnswers(data.answers ?? prior?.answers).map((a) => String(a ?? ''));
  const alias = String(data.alias ?? prior?.alias ?? '').trim();
  const occupation = String(data.occupation ?? prior?.occupation ?? '').trim();
  const reflection = String(data.reflection ?? prior?.reflection ?? '').trim();
  const encoded = isInterviewEncoded({ alias, answers });
  const aiInsights = encoded ? extractInterviewInsights(answers) : null;

  return {
    ...prior,
    id: prior?.id ?? `iv-${Date.now()}`,
    alias,
    occupation,
    answers,
    reflection,
    encoded,
    aiInsights,
    encodedAt: encoded ? prior?.encodedAt ?? new Date().toISOString() : null,
  };
}
