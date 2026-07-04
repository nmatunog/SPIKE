/** @typedef {{ theme: string, subtitle: string, segment: 'discover' | 'advise' }} RaSpikeWeekMeta */

/**
 * Curriculum outline only (guidelines). Playbook body lives in content/ra-spike/week-N.json.
 * @type {Record<number, RaSpikeWeekMeta>}
 */
export const RA_SPIKE_WEEKS = {
  1: { theme: 'Start With You', subtitle: 'Build yourself before you build your business', segment: 'discover' },
  2: { theme: 'Discover Your Customer', subtitle: 'Who you serve and why', segment: 'discover' },
  3: { theme: 'Design Your Business', subtitle: 'How your practice creates and captures value', segment: 'discover' },
  4: { theme: 'Business Plan & Pitch', subtitle: 'Stage Gate 1 — present your plan', segment: 'discover' },
  5: { theme: 'Prospecting', subtitle: 'Start conversations', segment: 'advise' },
  6: { theme: 'Discovery & Approaching', subtitle: 'Build trust before advice', segment: 'advise' },
  7: { theme: 'Presenting Solutions', subtitle: 'Recommend with confidence', segment: 'advise' },
  8: { theme: 'Advisor Revalida', subtitle: 'Stage Gate 2 — demonstrate readiness', segment: 'advise' },
};

/** @param {number} week */
export function getRaSpikeWeekMeta(week) {
  const clamped = Math.max(1, Math.min(8, week));
  return RA_SPIKE_WEEKS[clamped] ?? RA_SPIKE_WEEKS[1];
}
