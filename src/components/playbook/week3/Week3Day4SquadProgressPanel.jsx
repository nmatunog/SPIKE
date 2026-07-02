import { deriveMemberWeek3Day4Signals } from '../../../lib/week3Day4MentorService.js';
import { saveGrowthEngineWorksheet, loadGrowthEngineWorksheet } from '../../../lib/growthEngineWorksheet/storage.js';

/**
 * Mentor panel — Week 3 Day 4 Growth Engine squad progress.
 * @param {{ memberIds: string[], memberNames?: Record<string, string> }} props
 */
export function Week3Day4SquadProgressPanel({ memberIds, memberNames = {} }) {
  const ids = memberIds.filter(Boolean);
  if (!ids.length) return null;

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <h3 className="text-sm font-bold text-slate-900">Week 3 Day 4 · Growth Engine</h3>
      <p className="mt-1 text-xs text-slate-500">Worksheet completion, revenue targets, FEC sync</p>
      <ul className="mt-4 space-y-3">
        {ids.map((id) => {
          const signals = deriveMemberWeek3Day4Signals(id);
          const name = memberNames[id] ?? id;
          return (
            <li key={id} className="rounded-xl border border-slate-100 bg-slate-50 p-3">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <p className="font-semibold text-slate-900">{name}</p>
                <span className="text-xs font-bold text-orange-600">{signals.progressPct}%</span>
              </div>
              <dl className="mt-2 grid grid-cols-2 gap-x-3 gap-y-1 text-xs text-slate-600">
                <div>
                  <dt>Year 1 goal</dt>
                  <dd className="font-semibold text-slate-800">
                    {signals.yearRevenueGoal ? `₱${signals.yearRevenueGoal.toLocaleString()}` : '—'}
                  </dd>
                </div>
                <div>
                  <dt>Clients needed</dt>
                  <dd className="font-semibold text-slate-800">{signals.requiredClients || '—'}</dd>
                </div>
                <div>
                  <dt>FEC synced</dt>
                  <dd className="font-semibold">{signals.fecSynced ? 'Yes' : 'No'}</dd>
                </div>
                <div>
                  <dt>Pitch checklist</dt>
                  <dd className="font-semibold">{signals.pitchChecklistDone ? 'Complete' : 'Pending'}</dd>
                </div>
              </dl>
              {signals.missingFields.length ? (
                <p className="mt-2 text-xs text-amber-800">
                  Missing: {signals.missingFields.join(', ')}
                </p>
              ) : null}
              <div className="mt-3 flex flex-wrap gap-2">
                <MentorActionButton
                  label="Approve"
                  active={signals.mentorStatus === 'approved'}
                  onClick={() => setMentorStatus(id, 'approved')}
                />
                <MentorActionButton
                  label="Needs revision"
                  active={signals.mentorStatus === 'needs_revision'}
                  onClick={() => setMentorStatus(id, 'needs_revision')}
                />
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

function MentorActionButton({ label, active, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-lg border px-3 py-1.5 text-xs font-semibold ${
        active
          ? 'border-orange-400 bg-orange-50 text-orange-900'
          : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
      }`}
    >
      {label}
    </button>
  );
}

function setMentorStatus(participantId, status) {
  const ws = loadGrowthEngineWorksheet(participantId);
  saveGrowthEngineWorksheet(participantId, { ...ws, mentorStatus: status });
}
