import { deriveSquadDay4CoachMetrics } from '../../../lib/customerDiscovery/week2FecStudioService.js';
import { groupInternsBySquad } from '../../../lib/mentorFrameworkService.js';

/**
 * Coach / mentor Day 4 dashboard — FEC Validation Lab metrics.
 * @param {{ interns: Array<{ id: string, name?: string, squad?: string }> }} props
 */
export function Week2Day4CoachDashboard({ interns }) {
  const squads = groupInternsBySquad(interns);

  if (!squads.length) return null;

  return (
    <section className="rounded-2xl border border-venture-activate/25 bg-white p-4 shadow-sm">
      <header className="mb-4">
        <p className="text-xs font-bold uppercase tracking-wider text-venture-activate">Day 4 dashboard</p>
        <h3 className="text-lg font-bold text-slate-900">FEC Validation Lab™</h3>
        <p className="mt-1 text-sm text-slate-600">
          Evidence, FEC evolution, canvas clarity, pitch readiness, and build readiness by squad.
        </p>
      </header>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[680px] text-left text-sm">
          <thead>
            <tr className="border-b border-slate-200 text-xs font-bold uppercase text-slate-400">
              <th className="pb-2 pr-4">Squad</th>
              <th className="pb-2 pr-4">Evidence</th>
              <th className="pb-2 pr-4">FEC updated</th>
              <th className="pb-2 pr-4">Clarity</th>
              <th className="pb-2 pr-4">Pitch</th>
              <th className="pb-2">Build ready</th>
            </tr>
          </thead>
          <tbody>
            {squads.map((squad) => {
              const memberIds = (squad.members ?? []).map((m) => m.id);
              const m = deriveSquadDay4CoachMetrics(memberIds);
              return (
                <tr key={squad.name} className="border-b border-slate-100">
                  <td className="py-2.5 pr-4 font-semibold text-slate-900">{squad.name}</td>
                  <td className="py-2.5 pr-4 tabular-nums">{m.evidencePct}%</td>
                  <td className="py-2.5 pr-4 tabular-nums">{m.fecUpdatedPct}%</td>
                  <td className="py-2.5 pr-4 tabular-nums font-semibold text-emerald-700">{m.clarityScore}%</td>
                  <td className="py-2.5 pr-4 tabular-nums">{m.pitchReadinessPct}%</td>
                  <td className="py-2.5 tabular-nums font-semibold text-spike">{m.buildReadinessPct}%</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}
