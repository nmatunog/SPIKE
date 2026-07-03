/** @typedef {{ theme: string, subtitle: string, segment: 'discover' | 'advise' }} RaSpikeWeekMeta */

/** @type {Record<number, RaSpikeWeekMeta>} */
export const RA_SPIKE_WEEKS = {
  1: { theme: 'Start With You', subtitle: 'Build yourself before you build your business', segment: 'discover' },
  2: { theme: 'Discover Your Customer', subtitle: 'FEC Customer — Who & Why', segment: 'discover' },
  3: { theme: 'Design Your Business', subtitle: 'FEC Value, Activities, Income', segment: 'discover' },
  4: { theme: 'Business Plan & Pitch', subtitle: '3-Year Plan · Stage Gate 1', segment: 'discover' },
  5: { theme: 'Prospecting', subtitle: 'Start conversations', segment: 'advise' },
  6: { theme: 'Discovery & Approaching', subtitle: 'Build trust before advice', segment: 'advise' },
  7: { theme: 'Presenting Solutions', subtitle: 'Recommend with confidence', segment: 'advise' },
  8: { theme: 'Advisor Revalida', subtitle: 'Demonstrate. Deliver. Succeed.', segment: 'advise' },
};

/** @param {number} week */
export function getRaSpikeWeekMeta(week) {
  const clamped = Math.max(1, Math.min(8, week));
  return RA_SPIKE_WEEKS[clamped] ?? RA_SPIKE_WEEKS[1];
}
