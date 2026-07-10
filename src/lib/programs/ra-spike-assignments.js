/** @typedef {{ title: string, summary: string, dueHint: string, squadObjective: string, estimatedMinutes: number }} RaSpikeAssignment */

/** @type {Record<number, RaSpikeAssignment>} */
export const RA_SPIKE_WEEKLY_ASSIGNMENTS = {
  1: {
    title: 'Dream Board reflection',
    summary: 'Capture your why, strengths, and the life you are building toward. Bring one insight to share in workshop.',
    dueHint: 'Before this week\'s classroom session',
    squadObjective: 'Each member shares one Dream Board insight with the squad.',
    estimatedMinutes: 45,
  },
  2: {
    title: 'Customer Discovery Canvas + FEC start',
    summary: 'Complete your interview worksheet, then Customer Segment, Problem, and Value Proposition in the FEC wizard.',
    dueHint: 'Before this week\'s classroom session',
    squadObjective: 'Share one discovery insight per squad member — compare who you interviewed and what problems surfaced.',
    estimatedMinutes: 90,
  },
  3: {
    title: 'FEC canvas continuation',
    summary: 'Complete Capture Value, Enable Value, and Unified Venture Proposition on the FEC canvas.',
    dueHint: 'Before this week\'s classroom session',
    squadObjective: 'Peer-review each other\'s canvas sections in squad huddle.',
    estimatedMinutes: 75,
  },
  4: {
    title: 'Venture pitch preparation',
    summary: 'Finalize your business plan summary and rehearse your Stage Gate 1 pitch.',
    dueHint: 'Due at Stage Gate 1 — Venture Pitch',
    squadObjective: 'Run a squad dress rehearsal before panel day.',
    estimatedMinutes: 90,
  },
  5: {
    title: 'Prospecting list',
    summary: 'Build a list of 10 prospects and draft your opening conversation script.',
    dueHint: 'Before this week\'s classroom session',
    squadObjective: 'Role-play prospecting openers with squad feedback.',
    estimatedMinutes: 60,
  },
  6: {
    title: 'Discovery conversation log',
    summary: 'Record notes from discovery conversations — needs, objections, and next steps.',
    dueHint: 'Before this week\'s classroom session',
    squadObjective: 'Share one discovery story and lessons learned.',
    estimatedMinutes: 60,
  },
  7: {
    title: 'Solution presentation practice',
    summary: 'Prepare your recommendation flow and practice presenting solutions with confidence.',
    dueHint: 'Before this week\'s classroom session',
    squadObjective: 'Pair up for solution presentation role-play.',
    estimatedMinutes: 75,
  },
  8: {
    title: 'Advisor Revalida preparation',
    summary: 'Complete the revalida checklist and rehearse your client scenario.',
    dueHint: 'Due at Stage Gate 2 — Advisor Revalida',
    squadObjective: 'Final squad pep session before graduation panel.',
    estimatedMinutes: 90,
  },
};

/** @param {number} week */
export function getRaSpikeAssignment(week) {
  const clamped = Math.max(1, Math.min(8, week));
  return RA_SPIKE_WEEKLY_ASSIGNMENTS[clamped] ?? RA_SPIKE_WEEKLY_ASSIGNMENTS[1];
}
