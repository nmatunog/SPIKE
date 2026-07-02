/** @typedef {{ theme: string, subtitle: string, segment: 'discover' | 'advise' }} RaSpikeWeekMeta */

/** @type {Record<number, RaSpikeWeekMeta>} */
export const RA_SPIKE_WEEKS = {
  1: { theme: 'Discover Yourself', subtitle: 'Start With You', segment: 'discover' },
  2: { theme: 'Discover Your Market', subtitle: 'Find the People You Want to Serve', segment: 'discover' },
  3: { theme: 'Design Your Business', subtitle: 'Build Your Practice', segment: 'discover' },
  4: { theme: 'Stage Gate 1 — Venture Pitch', subtitle: 'Present Your Business', segment: 'discover' },
  5: { theme: 'Prospecting', subtitle: 'Start Conversations', segment: 'advise' },
  6: { theme: 'Discovery & Approaching', subtitle: 'Build Trust Before Advice', segment: 'advise' },
  7: { theme: 'Presenting Solutions', subtitle: 'Recommend With Confidence', segment: 'advise' },
  8: { theme: 'Stage Gate 2 — Advisor Revalida', subtitle: 'Demonstrate Professional Readiness', segment: 'advise' },
};

/** @param {number} week */
export function getRaSpikeWeekMeta(week) {
  const clamped = Math.max(1, Math.min(8, week));
  return RA_SPIKE_WEEKS[clamped] ?? RA_SPIKE_WEEKS[1];
}
