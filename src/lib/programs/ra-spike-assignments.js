/** @typedef {{ title: string, summary: string, dueHint: string, squadObjective: string, estimatedMinutes: number }} RaSpikeAssignment */

/**
 * Assignments only for weeks with authored RA-SPIKE content.
 * Unpublished weeks return null — never invent internship-style tasks.
 * @type {Partial<Record<number, RaSpikeAssignment>>}
 */
export const RA_SPIKE_WEEKLY_ASSIGNMENTS = {
  1: {
    title: 'Vision & Success Blueprint',
    summary: 'Complete Dream Builder (lifestyle, income, travel + 3 images), your Personal Vision Statement, and Success Blueprint.',
    dueHint: 'Submit your Week 1 portfolio before your coach publishes Week 2',
    squadObjective: 'Each member shares one Dream Board insight with the squad.',
    estimatedMinutes: 45,
  },
};

/** @param {number} week @returns {RaSpikeAssignment | null} */
export function getRaSpikeAssignment(week) {
  const clamped = Math.max(1, Math.min(8, week));
  return RA_SPIKE_WEEKLY_ASSIGNMENTS[clamped] ?? null;
}
