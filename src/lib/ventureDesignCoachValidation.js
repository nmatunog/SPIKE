/**
 * Reject AI coach replies that echo user drafts or Day 1 personal-goal copy.
 */
import { looksLikeInternSelfGoal } from './ventureDesignCoachReadiness.js';

/**
 * @param {string} coach
 * @param {Record<string, string>} fields
 */
export function isVentureDesignCoachEcho(coach, fields) {
  const text = String(coach ?? '').trim();
  if (!text) return true;

  if (looksLikeInternSelfGoal(text)) return true;

  const values = Object.values(fields)
    .map((v) => String(v ?? '').trim())
    .filter((v) => v.length >= 20);

  for (const value of values) {
    if (text === value) return true;
    if (value.length > 40 && text.includes(value)) return true;
    if (text.length > 40 && value.includes(text)) return true;
  }

  const coachingSignals =
    /\b(you|your|try|ask|challenge|urgent|client|segment|squad|simplify|consolidat|before|after|UVP|proposition|canvas|FEC)\b/i;
  if (text.length > 30 && !coachingSignals.test(text)) return true;

  return false;
}

/**
 * @param {string} coach
 * @param {import('./ventureDesignStudioCoach.js').VentureDesignCoachFeedback} fallback
 * @param {Record<string, string>} fields
 */
export function acceptVentureDesignCoachResponse(coach, fallback, fields) {
  const trimmed = String(coach ?? '').trim();
  if (!trimmed || isVentureDesignCoachEcho(trimmed, fields)) {
    return fallback;
  }
  return { ...fallback, coach: trimmed };
}
