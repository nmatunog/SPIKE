import { PROGRAM_SLUGS } from './programs/constants.js';
import { resolveProgramSlug } from './programs/index.js';
import { RA_SPIKE_PROGRAM } from './programs/ra-spike.js';
import { getRaSpikeGateStatus } from './raSpikeGateService.js';

/**
 * @typedef {{
 *   id: string,
 *   name: string,
 *   squad: string,
 *   week: number,
 *   segment: number,
 *   gate1: string | null,
 *   gate2: string | null,
 *   gate1EvaluatedAt: string | null,
 *   gate2EvaluatedAt: string | null,
 *   graduated: boolean,
 * }} RaSpikeGateRow
 */

/** @param {Array<{ id: string, name?: string, squad?: string, internProgress?: object }>} interns */
export function filterRaSpikeInterns(interns) {
  return (interns ?? []).filter(
    (intern) => resolveProgramSlug(intern.internProgress ?? intern) === PROGRAM_SLUGS.RA_SPIKE,
  );
}

/** @param {Array<object>} interns */
export function hasRaSpikeInterns(interns) {
  return filterRaSpikeInterns(interns).length > 0;
}

/** @param {Array<object>} interns @returns {RaSpikeGateRow[]} */
export function buildRaSpikeGateRows(interns) {
  return filterRaSpikeInterns(interns)
    .map((intern) => {
      const progress = intern.internProgress ?? intern;
      return {
        id: intern.id,
        name: intern.name ?? 'Participant',
        squad: intern.squad ?? progress.squad ?? '—',
        week: Math.max(1, Math.min(8, Number(progress.ra_spike_current_week) || 1)),
        segment: Number(progress.ra_spike_segment) >= 2 ? 2 : 1,
        gate1: getRaSpikeGateStatus(progress, 1),
        gate2: getRaSpikeGateStatus(progress, 2),
        gate1EvaluatedAt: progress.gate_1_evaluated_at ?? null,
        gate2EvaluatedAt: progress.gate_2_evaluated_at ?? null,
        graduated: Boolean(progress.graduated_at) || progress.gate_2_status === 'passed',
      };
    })
    .sort((a, b) => {
      const rank = (row) => {
        const pending =
          (row.gate1 === 'pending' ? 0 : 4)
          + (row.gate2 === 'pending' ? 0 : 4);
        return pending;
      };
      const diff = rank(a) - rank(b);
      if (diff !== 0) return diff;
      return a.name.localeCompare(b.name);
    });
}

/** @param {RaSpikeGateRow[]} rows */
export function countRaSpikePendingGates(rows) {
  let count = 0;
  for (const row of rows) {
    if (row.gate1 === 'pending') count += 1;
    if (row.gate2 === 'pending') count += 1;
  }
  return count;
}

/** @param {number} gateNum */
export function raSpikeGateLabel(gateNum) {
  const gate = RA_SPIKE_PROGRAM.stageGates.find((g) =>
    (gateNum === 1 ? g.id === 'venture-pitch' : g.id === 'advisor-revalida'));
  return gate ? `${gate.label} — ${gate.title}` : `Gate ${gateNum}`;
}

/** @param {string | null | undefined} status */
export function raSpikeGateStatusLabel(status) {
  if (status === 'pending') return 'Awaiting evaluation';
  if (status === 'passed') return 'Passed';
  if (status === 'failed') return 'Needs retry';
  return 'Not submitted';
}
