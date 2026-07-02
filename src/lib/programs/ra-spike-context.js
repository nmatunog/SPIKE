import { RA_SPIKE_PROGRAM } from './ra-spike.js';
import { getRaSpikeWeekMeta } from './ra-spike-weeks.js';

/**
 * @param {object | null | undefined} internProgress
 */
export function getRaSpikeContext(internProgress) {
  const week = Math.max(1, Math.min(RA_SPIKE_PROGRAM.totalWeeks, internProgress?.ra_spike_current_week ?? 1));
  const segmentNum = internProgress?.ra_spike_segment ?? (week <= 4 ? 1 : 2);
  const weekMeta = getRaSpikeWeekMeta(week);
  const segment = RA_SPIKE_PROGRAM.segments.find((s) => s.weeks.includes(week))
    ?? RA_SPIKE_PROGRAM.segments[segmentNum >= 2 ? 1 : 0];
  const stageGate = RA_SPIKE_PROGRAM.stageGates.find((g) => g.week === week) ?? null;
  const gate1Status = internProgress?.gate_1_status ?? null;
  const gate2Status = internProgress?.gate_2_status ?? null;

  return {
    program: RA_SPIKE_PROGRAM,
    week,
    totalWeeks: RA_SPIKE_PROGRAM.totalWeeks,
    segmentId: segment.id,
    segmentLabel: segment.label,
    weekTheme: weekMeta.theme,
    weekSubtitle: weekMeta.subtitle,
    stageGate,
    gate1Status,
    gate2Status,
    segment2Unlocked: gate1Status === 'passed' || week >= 5,
  };
}
