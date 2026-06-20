import { Link } from 'react-router-dom';
import { AlertTriangle, CalendarCheck, ClipboardList, Loader2, Users } from 'lucide-react';
import {
  deriveAssignedParticipants,
  deriveCoachingQueue,
  deriveSquadSummaries,
  deriveWeek1DayProgress,
  groupInternsBySquad,
} from '../../lib/mentorFrameworkService.js';
import { getPortfolioSettings } from '../../lib/portfolioStorage.js';
import { useCohortHydration } from '../../hooks/useParticipantHydration.js';
import { ROUTES } from '../../routes/paths.js';
import { MentorSquadRatingPanel } from '../staff/MentorSquadRatingPanel.jsx';
import { useCohortProgramDay } from '../../hooks/useCohortProgramDay.js';

/**
 * @param {{
 *   interns: Array<{ id: string, name: string, hours?: number, squad?: string, licensed?: boolean }>,
 *   mentorId?: string,
 *   showToast?: (message: string) => void,
 * }} props
 */
export function MentorDashboardPanels({ interns, mentorId = '', showToast }) {
  const ids = interns.map((i) => i.id);
  const { ready, version } = useCohortHydration(ids, { enabled: interns.length > 0, interns });
  const { programDay } = useCohortProgramDay();
  void version;

  const participants = ready ? deriveAssignedParticipants(interns) : [];
  const squadsGrouped = ready ? groupInternsBySquad(interns) : [];
  const squads = ready ? deriveSquadSummaries(squadsGrouped) : [];
  const queue = ready ? deriveCoachingQueue(interns) : {
    needs_review: [],
    needs_follow_up: [],
    at_risk: [],
    incomplete_outputs: [],
  };
  const weekProgress = ready ? deriveWeek1DayProgress(interns) : [];

  const needsAttention = [
    ...queue.needs_review,
    ...queue.needs_follow_up,
    ...queue.at_risk,
  ];
  const attentionIds = new Set();
  const uniqueAttention = needsAttention.filter((item) => {
    if (attentionIds.has(item.id)) return false;
    attentionIds.add(item.id);
    return true;
  });

  if (!ready && interns.length > 0) {
    return (
      <section className="mt-6 spike-card flex items-center gap-2 text-sm text-slate-600">
        <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
        Loading participant progress from cloud…
      </section>
    );
  }

  return (
    <div className="mt-6 space-y-6">
      <div className="grid gap-4 lg:grid-cols-2">
        <section className="spike-card">
          <h3 className="flex items-center gap-2 text-sm font-semibold text-slate-900">
            <Users size={16} className="text-spike" /> Assigned participants
          </h3>
          <ul className="mt-3 max-h-72 space-y-2 overflow-y-auto">
            {participants.map((p) => {
              const photo = getPortfolioSettings(p.id).photoUrl;
              return (
              <li key={p.id} className="flex items-center justify-between gap-2 rounded-xl bg-slate-50 px-3 py-2 text-sm">
                <div className="flex min-w-0 items-center gap-2">
                  {photo ? (
                    <img src={photo} alt="" className="h-8 w-8 shrink-0 rounded-full object-cover" />
                  ) : (
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-spike-muted text-xs font-bold text-spike">
                      {p.name.charAt(0)}
                    </span>
                  )}
                  <div className="min-w-0">
                  <Link to={`${ROUTES.mentorParticipant}/${p.id}`} className="font-semibold text-slate-900 hover:text-spike">
                    {p.name}
                  </Link>
                  <p className="truncate text-xs text-slate-500">
                    {p.squad} · {p.careerTrack}
                  </p>
                  </div>
                </div>
                <span className="shrink-0 rounded-full bg-spike-muted px-2 py-0.5 text-xs font-bold text-spike">
                  {p.progressPct}%
                </span>
              </li>
            );
            })}
          </ul>
        </section>

        <section className="spike-card">
          <h3 className="flex items-center gap-2 text-sm font-semibold text-slate-900">
            <Users size={16} className="text-sky-700" /> Assigned squads
          </h3>
          <ul className="mt-3 space-y-2">
            {squads.length ? (
              squads.map((squad) => (
                <li key={squad.name} className="rounded-xl bg-slate-50 px-3 py-2 text-sm">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-semibold text-slate-900">{squad.name}</span>
                    <span className="text-xs font-semibold text-slate-500">{squad.status}</span>
                  </div>
                  <p className="mt-1 text-xs text-slate-500">
                    {squad.members} members · {squad.completionPct}% avg progress
                  </p>
                </li>
              ))
            ) : (
              <li className="text-sm text-slate-500">No squads assigned yet.</li>
            )}
          </ul>
        </section>
      </div>

      <section className="spike-card">
        <h3 className="flex items-center gap-2 text-sm font-semibold text-slate-900">
          <ClipboardList size={16} className="text-amber-700" /> Coaching queue
          {uniqueAttention.length + queue.incomplete_outputs.length ? (
            <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-bold text-amber-900">
              {uniqueAttention.length + queue.incomplete_outputs.length}
            </span>
          ) : null}
        </h3>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <QueueColumn title="Needs attention" items={uniqueAttention} accent="text-amber-800" />
          <QueueColumn title="Incomplete outputs" items={queue.incomplete_outputs} />
        </div>
      </section>

      {mentorId && squadsGrouped.length > 0 ? (
        <div className="grid gap-4 lg:grid-cols-2">
          {squadsGrouped.map((squad) => (
            <MentorSquadRatingPanel
              key={squad.name}
              staffId={mentorId}
              squadName={squad.name}
              week={programDay.week}
              day={programDay.day}
              interns={squad.members ?? []}
              showToast={showToast}
            />
          ))}
        </div>
      ) : null}

      <section className="spike-card">
        <h3 className="flex items-center gap-2 text-sm font-semibold text-slate-900">
          <CalendarCheck size={16} className="text-emerald-700" /> Week 1 progress
        </h3>
        <div className="mt-3 grid gap-2 sm:grid-cols-5">
          {weekProgress.map((day) => (
            <div key={day.day} className="rounded-xl bg-slate-50 px-3 py-3 text-center">
              <p className="text-xs font-bold uppercase tracking-wide text-slate-500">{day.label}</p>
              <p className="mt-1 text-lg font-bold text-slate-900">{day.completePct}%</p>
              <p className="text-[10px] text-slate-500">
                {day.completeCount}/{day.total} complete
              </p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

/**
 * @param {{ title: string, items: Array<{ id: string, name: string, reason: string }>, accent?: string }} props
 */
function QueueColumn({ title, items, accent = 'text-slate-800' }) {
  return (
    <div className="rounded-xl border border-slate-100 bg-white p-3">
      <p className={`text-xs font-bold uppercase tracking-wide ${accent}`}>{title}</p>
      <ul className="mt-2 space-y-1.5">
        {items.length ? (
          items.slice(0, 5).map((item) => (
            <li key={`${title}-${item.id}`} className="text-xs">
              <Link to={`${ROUTES.mentorParticipant}/${item.id}`} className="font-semibold text-slate-800 hover:text-spike">
                {item.name}
              </Link>
              <p className="text-slate-500">{item.reason}</p>
            </li>
          ))
        ) : (
          <li className="text-xs text-slate-400">None</li>
        )}
        {items.length > 5 ? (
          <li className="flex items-center gap-1 text-xs text-amber-800">
            <AlertTriangle size={12} /> +{items.length - 5} more
          </li>
        ) : null}
      </ul>
    </div>
  );
}
