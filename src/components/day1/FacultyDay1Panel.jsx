import { CheckCircle, Clock, Users } from 'lucide-react';
import { Link } from 'react-router-dom';
import { getDay1MissionProgress, getAllDay1BuilderData } from '../../lib/day1BuilderStorage.js';
import { listAllSquadCharters } from '../../lib/squadCharterService.js';
import { getFormationFacultyStats } from '../../lib/cohortFormationService.js';
import { RESEARCH_MARKETS } from '../../lib/day1BuilderConstants.js';
import { useCohortHydration } from '../../hooks/useParticipantHydration.js';
import { ROUTES } from '../../routes/paths.js';

/**
 * @param {{ interns: Array<{ id: string, name: string }> }} props
 */
export function FacultyDay1Panel({ interns }) {
  const { ready, version } = useCohortHydration(interns.map((i) => i.id), { interns });
  void version;

  const charters = listAllSquadCharters();
  const formationStats = getFormationFacultyStats();

  const rows = interns.map((intern) => {
    const progress = getDay1MissionProgress(intern.id);
    const data = getAllDay1BuilderData(intern.id);
    return { intern, progress, data };
  });

  const avgCompletion = rows.length
    ? Math.round(rows.reduce((sum, r) => sum + r.progress.percent, 0) / rows.length)
    : 0;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard label="Cohort suggestions" value={String(formationStats.suggestionCount)} />
        <StatCard label="Active squads" value={String(formationStats.squadCount)} />
        <StatCard label="Day 1 avg" value={`${avgCompletion}%`} />
        <StatCard label="Charters signed" value={String(formationStats.signedCharters)} />
      </div>

      <div className="flex flex-wrap gap-2">
        <Link to={ROUTES.adminSquads} className="spike-btn-secondary text-sm">
          Assign squads
        </Link>
      </div>

      <div className="spike-card overflow-x-auto">
        <h3 className="mb-3 text-sm font-semibold text-slate-900">Participant engagement — Day 1 Builders</h3>
        {!ready ? (
          <p className="mb-3 text-sm text-slate-500">Loading participant work from the server…</p>
        ) : null}
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead>
            <tr className="border-b border-slate-200 text-2xs uppercase tracking-wide text-slate-500">
              <th className="py-2 pr-4">Participant</th>
              <th className="py-2 pr-4">Completion</th>
              <th className="py-2 pr-4">Dream Board</th>
              <th className="py-2 pr-4">Squad markets</th>
              <th className="py-2">Charter</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(({ intern, progress, data }) => (
              <tr key={intern.id} className="border-b border-slate-100">
                <td className="py-3 pr-4 font-medium text-slate-900">{intern.name}</td>
                <td className="py-3 pr-4">
                  <span className="rounded-full bg-spike-muted px-2 py-1 text-xs font-bold text-spike">
                    {progress.percent}%
                  </span>
                </td>
                <td className="py-3 pr-4">
                  {data['dream-board']?.completedAt ? (
                    <CheckCircle size={16} className="text-emerald-600" />
                  ) : (
                    <Clock size={16} className="text-slate-400" />
                  )}
                </td>
                <td className="py-3 pr-4 text-xs text-slate-600">
                  {(data['squad-formation']?.data?.marketPreferences ?? [])
                    .map((id) => RESEARCH_MARKETS.find((m) => m.id === id)?.label)
                    .filter(Boolean)
                    .join(', ') || '—'}
                </td>
                <td className="py-3">
                  {data['squad-charter']?.completedAt ? (
                    <span className="text-xs font-semibold text-emerald-700">Signed</span>
                  ) : (
                    <span className="text-xs text-slate-400">Pending</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {charters.length > 0 ? (
        <div className="spike-card">
          <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-900">
            <Users size={16} className="text-spike" /> Squad charter status
          </h3>
          <ul className="space-y-2 text-sm">
            {charters.map((c) => (
              <li key={c.squadId} className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-slate-50 px-3 py-2">
                <span className="font-medium">{c.squadName || c.squadId}</span>
                <span className="text-xs text-slate-500">
                  {c.signatures?.length ?? 0} signature(s)
                  {c.facultyApproved ? ' · Approved' : ''}
                </span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}

/** @param {{ label: string, value: string }} props */
function StatCard({ label, value }) {
  return (
    <div className="spike-card text-center">
      <p className="spike-label">{label}</p>
      <p className="mt-1 text-2xl font-bold text-slate-900">{value}</p>
    </div>
  );
}
