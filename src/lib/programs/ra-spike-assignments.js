/** @typedef {{ title: string, summary: string, dueHint: string, squadObjective: string, estimatedMinutes: number }} RaSpikeAssignment */

/** @type {Record<number, RaSpikeAssignment>} */
export const RA_SPIKE_WEEKLY_ASSIGNMENTS = {
  1: {
    title: 'Vision & Success Blueprint',
    summary: 'Complete Dream Builder (lifestyle, income, travel + 3 images), your Personal Vision Statement, and Success Blueprint.',
    dueHint: 'Submit your Week 1 portfolio before your coach publishes Week 2',
    squadObjective: 'Each member shares one Dream Board insight with the squad.',
    estimatedMinutes: 45,
  },
  2: {
    title: 'Customer persona draft',
    summary: 'Identify who you want to serve and document their needs, fears, and goals.',
    dueHint: 'Before this week\'s classroom session',
    squadObjective: 'Compare personas and agree on one shared segment to explore.',
    estimatedMinutes: 60,
  },
  3: {
    title: 'Business model canvas',
    summary: 'Map your value proposition, channels, and revenue model on the FEC canvas.',
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
