import { useEffect, useMemo, useState } from 'react';
import { CheckCircle2, ChevronDown, ChevronRight, Circle, Loader2, RefreshCw } from 'lucide-react';
import { deriveSquadWeekMissionProgress } from '../../lib/customerDiscovery/week2SquadMissionProgressService.js';
import { useCohortProgramDay } from '../../hooks/useCohortProgramDay.js';

/**
 * Coach / mentor — per-squad Week 2 mission progress by day (synced to cohort calendar).
 * @param {{
 *   squadName: string,
 *   memberIds: string[],
 *   members: Array<{ id: string, name?: string }>,
 *   cohortReady?: boolean,
 *   compact?: boolean,
 *   embedded?: boolean,
 * }} props
 */
export function SquadWeek2MissionProgressPanel({
  squadName,
  memberIds,
  members,
  cohortReady = true,
  compact = false,
  embedded = false,
}) {
  const { programDay, ready: calendarReady } = useCohortProgramDay();
  const [tick, setTick] = useState(0);
  const [expandedDay, setExpandedDay] = useState(null);

  const progress = useMemo(
    () => deriveSquadWeekMissionProgress(memberIds, members, programDay),
    [memberIds, members, programDay, tick],
  );

  useEffect(() => {
    if (expandedDay == null && progress.currentDay) {
      setExpandedDay(progress.currentDay);
    }
  }, [progress.currentDay, expandedDay]);

  useEffect(() => {
    const onFocus = () => setTick((t) => t + 1);
    window.addEventListener('focus', onFocus);
    return () => window.removeEventListener('focus', onFocus);
  }, []);

  if (!calendarReady || programDay.week < 2) return null;
  if (!memberIds.length) return null;

  const todayLabel = progress.currentPhase
    ? `Day ${progress.currentDay} — ${progress.currentPhase.theme}`
    : `Day ${progress.currentDay}`;

  return (
    <section
      className={
        embedded
          ? 'bg-white'
          : 'rounded-2xl border border-spike/20 bg-white shadow-sm'
      }
    >
      <header className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-100 px-5 py-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.15em] text-spike">Week 2 missions</p>
          {compact && embedded ? null : (
            <h2 className="mt-1 text-lg font-bold text-slate-900">{squadName}</h2>
          )}
          <p className={`text-sm text-slate-600 ${compact && embedded ? 'mt-1' : 'mt-1'}`}>
            Today: <span className="font-semibold text-slate-900">{todayLabel}</span>
            {progress.currentDay === 3 ? (
              <span className="ml-1 text-emerald-700">· PCTC complete with 1+ certificate</span>
            ) : null}
          </p>
        </div>
        <button
          type="button"
          onClick={() => setTick((t) => t + 1)}
          className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50"
        >
          <RefreshCw size={13} />
          Refresh
        </button>
      </header>

      {!cohortReady ? (
        <p className="flex items-center gap-2 px-5 py-6 text-sm text-slate-500">
          <Loader2 size={16} className="animate-spin text-spike" />
          Syncing intern work from the server…
        </p>
      ) : (
        <div className="divide-y divide-slate-100">
          {progress.days.map((dayRow) => {
            const expanded = compact
              ? dayRow.isCurrent || expandedDay === dayRow.day
              : expandedDay === dayRow.day;
            const showTable = expanded && (!dayRow.isFuture || dayRow.isCurrent);

            return (
              <div key={dayRow.day}>
                <DaySummaryRow
                  dayRow={dayRow}
                  expanded={expanded}
                  onToggle={() => {
                    if (dayRow.isFuture && !dayRow.isCurrent) return;
                    if (expandedDay === dayRow.day) {
                      setExpandedDay(compact ? progress.currentDay : null);
                    } else {
                      setExpandedDay(dayRow.day);
                    }
                  }}
                  highlight={dayRow.isCurrent}
                  disabled={dayRow.isFuture && !dayRow.isCurrent}
                />
                {showTable ? (
                  <div className="overflow-x-auto bg-slate-50/60 px-5 pb-4">
                    <MemberTaskTable dayRow={dayRow} />
                  </div>
                ) : null}
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}

/** @param {{ dayRow: object, expanded: boolean, onToggle: () => void, highlight?: boolean, disabled?: boolean }} props */
function DaySummaryRow({ dayRow, expanded, onToggle, highlight, disabled }) {
  const Chevron = expanded ? ChevronDown : ChevronRight;

  return (
    <button
      type="button"
      onClick={onToggle}
      disabled={disabled}
      className={`flex w-full items-center gap-3 px-5 py-3 text-left transition hover:bg-slate-50 disabled:cursor-default disabled:opacity-60 ${
        highlight ? 'bg-spike/5' : ''
      }`}
    >
      <Chevron size={18} className="shrink-0 text-slate-400" aria-hidden />
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-slate-900">
          Day {dayRow.day} — {dayRow.shortLabel}
          {highlight ? (
            <span className="ml-2 rounded-full bg-spike px-2 py-0.5 text-[10px] font-bold uppercase text-white">
              Today
            </span>
          ) : null}
          {dayRow.isFuture ? (
            <span className="ml-2 text-xs font-normal text-slate-400">Upcoming</span>
          ) : null}
        </p>
        <p className="text-xs text-slate-500">{dayRow.theme}</p>
      </div>
      <div className="flex shrink-0 items-center gap-3">
        <div className="hidden h-1.5 w-24 overflow-hidden rounded-full bg-slate-200 sm:block">
          <div
            className={`h-full rounded-full ${dayRow.squadComplete ? 'bg-emerald-500' : 'bg-spike'}`}
            style={{ width: `${dayRow.squadPct}%` }}
          />
        </div>
        <span
          className={`text-sm font-bold tabular-nums ${
            dayRow.squadComplete ? 'text-emerald-700' : 'text-slate-700'
          }`}
        >
          {dayRow.squadPct}%
        </span>
        {dayRow.squadComplete ? (
          <CheckCircle2 size={18} className="text-emerald-600" aria-label="Day complete" />
        ) : (
          <Circle size={18} className="text-slate-300" aria-hidden />
        )}
      </div>
    </button>
  );
}

/** @param {{ dayRow: { members: Array<object>, taskColumns: Array<{ id: string, label: string }> } }} props */
function MemberTaskTable({ dayRow }) {
  const columns = dayRow.taskColumns;

  return (
    <table className="mt-2 w-full min-w-[480px] text-left text-sm">
      <thead>
        <tr className="text-xs font-bold uppercase text-slate-400">
          <th className="pb-2 pr-4">Intern</th>
          {columns.map((col) => (
            <th key={col.id} className="pb-2 pr-3">
              {col.label}
            </th>
          ))}
          <th className="pb-2 text-right">Day</th>
        </tr>
      </thead>
      <tbody>
        {dayRow.members.map((member) => (
          <tr key={member.participantId} className="border-t border-slate-200/80">
            <td className="py-2.5 pr-4 font-medium text-slate-900">{member.name}</td>
            {member.tasks.map((task) => (
              <td key={task.id} className="py-2.5 pr-3">
                <TaskCell task={task} emphasize={task.id === 'pctc'} />
              </td>
            ))}
            <td className="py-2.5 text-right tabular-nums font-semibold text-slate-600">
              {member.progressPct}%
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

/** @param {{ task: { complete: boolean, detail?: string }, emphasize?: boolean }} props */
function TaskCell({ task, emphasize }) {
  const Icon = task.complete ? CheckCircle2 : Circle;
  return (
    <span
      className={`inline-flex items-center gap-1.5 ${
        task.complete
          ? emphasize
            ? 'font-semibold text-emerald-700'
            : 'text-emerald-700'
          : 'text-slate-400'
      }`}
    >
      <Icon size={15} className="shrink-0" aria-hidden />
      <span className="text-xs">
        {task.complete ? 'Done' : '—'}
        {task.detail && task.detail !== '—' ? (
          <span className="ml-1 text-slate-500">({task.detail})</span>
        ) : null}
      </span>
    </span>
  );
}
