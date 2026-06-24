import { deriveSquadDay3CoachMetrics } from '../../../lib/customerDiscovery/week2ReadinessMissionService.js';
import { deriveSquadPctcCertificateMetrics } from '../../../lib/customerDiscovery/week2PctcCertificateService.js';
import { groupInternsBySquad } from '../../../lib/mentorFrameworkService.js';

import { Week2PctcCoachVerification } from './Week2PctcCoachVerification.jsx';

/**
 * Coach / mentor Day 3 dashboard — squad readiness metrics.
 * @param {{ interns: Array<{ id: string, name?: string, squad?: string }> }} props
 */
export function Week2Day3CoachDashboard({ interns }) {
  const squads = groupInternsBySquad(interns);

  if (!squads.length) return null;

  return (
    <section className="rounded-2xl border border-spike/20 bg-white p-4 shadow-sm">
      <header className="mb-4">
        <p className="text-xs font-bold uppercase tracking-wider text-spike">Day 3 dashboard</p>
        <h3 className="text-lg font-bold text-slate-900">Professional Readiness Mission</h3>
        <p className="mt-1 text-sm text-slate-600">
          PCTC, interviews, reflection, UVP checkpoint, and Thursday readiness by squad.
        </p>
      </header>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead>
            <tr className="border-b border-slate-200 text-xs font-bold uppercase text-slate-400">
              <th className="pb-2 pr-4">Squad</th>
              <th className="pb-2 pr-4">PCTC</th>
              <th className="pb-2 pr-4">Certs</th>
              <th className="pb-2 pr-4">Interviews</th>
              <th className="pb-2 pr-4">Reflection</th>
              <th className="pb-2 pr-4">UVP checkpoint</th>
              <th className="pb-2">Thursday readiness</th>
            </tr>
          </thead>
          <tbody>
            {squads.map((squad) => {
              const memberIds = (squad.members ?? []).map((m) => m.id);
              const m = deriveSquadDay3CoachMetrics(memberIds);
              const certs = deriveSquadPctcCertificateMetrics(memberIds);
              return (
                <tr key={squad.name} className="border-b border-slate-100">
                  <td className="py-2.5 pr-4 font-semibold text-slate-900">{squad.name}</td>
                  <td className="py-2.5 pr-4 tabular-nums">{m.pctcPct}%</td>
                  <td className="py-2.5 pr-4 tabular-nums">{certs.bothPct}%</td>
                  <td className="py-2.5 pr-4 tabular-nums">{m.interviewPct}%</td>
                  <td className="py-2.5 pr-4 tabular-nums">{m.reflectionPct}%</td>
                  <td className="py-2.5 pr-4">{m.uvpStatus}</td>
                  <td className="py-2.5 tabular-nums font-semibold text-spike">{m.thursdayReadinessPct}%</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <Week2PctcCoachVerification interns={interns} />
    </section>
  );
}
