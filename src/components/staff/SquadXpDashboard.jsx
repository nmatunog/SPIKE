import { useMemo } from 'react';
import { Sparkles, Trophy } from 'lucide-react';
import { getParticipantSquad } from '../../lib/cohortFormationService.js';
import { useCohortProgramDay } from '../../hooks/useCohortProgramDay.js';
import {
  formatStarDisplay,
  getSquadWeeklyXp,
  rankSquadsByXp,
} from '../../lib/staff/squadXpService.js';
import {
  getCommendationsForParticipant,
  getSquadCommendations,
} from '../../lib/staff/squadCommendationService.js';
import { groupInternsBySquad } from '../../lib/facultyMentorFrameworkService.js';

/** Compact XP readout for tables and squad list cards. */
export function SquadXpInline({ totalXp, className = '' }) {
  return (
    <span className={`inline-flex flex-col items-end tabular-nums ${className}`}>
      <span className="font-bold text-spike">{totalXp} XP</span>
      <span className="text-[10px] text-amber-600">{formatStarDisplay(totalXp)}</span>
    </span>
  );
}

/**
 * Shared squad XP card — portfolio, squad hub, coach previews.
 * @param {{ squadName: string, memberIds: string[], week?: number, compact?: boolean, className?: string }} props
 */
export function SquadXpSummaryCard({
  squadName,
  memberIds,
  week: weekProp,
  compact = false,
  className = '',
}) {
  const { programDay } = useCohortProgramDay();
  const week = weekProp ?? programDay.week;
  const xp = useMemo(
    () => getSquadWeeklyXp(squadName, memberIds, week),
    [squadName, memberIds, week],
  );

  if (compact) {
    return (
      <div className={`rounded-xl border border-spike/15 bg-spike-muted/30 px-4 py-3 ${className}`}>
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Squad XP</p>
            <p className="text-xs text-slate-600">{squadName} · Week {week}</p>
          </div>
          <SquadXpInline totalXp={xp.totalXp} />
        </div>
        <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-200">
          <div
            className="h-full rounded-full bg-gradient-to-r from-venture-discover to-spike"
            style={{ width: `${xp.totalXp}%` }}
          />
        </div>
        <p className="mt-1 text-[10px] text-slate-500">
          Auto {xp.autoXp} + Pitch {xp.pitchBonus} · shared by your squad
        </p>
      </div>
    );
  }

  return (
    <section className={`spike-venture-status space-y-4 ${className}`}>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="spike-label">Squad XP · Week {week}</p>
          <h2 className="text-lg font-bold text-slate-900">{squadName}</h2>
          <p className="mt-1 text-3xl font-black tabular-nums text-spike">{xp.totalXp} XP</p>
          <p className="text-sm text-amber-600">{formatStarDisplay(xp.totalXp)}</p>
        </div>
        <p className="text-xs text-slate-500">{xp.completionPct}% mission completion</p>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-slate-200/80">
        <div
          className="h-full rounded-full bg-gradient-to-r from-venture-discover to-spike transition-all"
          style={{ width: `${xp.totalXp}%` }}
        />
      </div>
      <ul className="space-y-1 text-sm text-slate-700">
        {xp.checklist.map((item) => (
          <li key={item.id} className="flex items-center gap-2">
            <span className={item.done ? 'text-emerald-600' : 'text-slate-300'}>
              {item.done ? '✔' : '○'}
            </span>
            {item.label}
          </li>
        ))}
      </ul>
      <p className="text-[10px] text-slate-400">
        Auto {xp.autoXp}/80 · Pitch {xp.pitchBonus}/20 · Shared by all squad members
      </p>
    </section>
  );
}

/**
 * Resolves squad from participant and shows XP card.
 * @param {{ participantId: string, week?: number, compact?: boolean, className?: string }} props
 */
export function ParticipantSquadXpCard({ participantId, week, compact = false, className = '' }) {
  const squad = getParticipantSquad(participantId);
  if (!squad) return null;
  const memberIds = (squad.members ?? []).map((m) => m.participantId);
  return (
    <SquadXpSummaryCard
      squadName={squad.name}
      memberIds={memberIds}
      week={week}
      compact={compact}
      className={className}
    />
  );
}

/**
 * Squad XP dashboard — team game view for participants and staff.
 * @param {{
 *   squadName: string,
 *   memberIds: string[],
 *   participantId?: string,
 *   week?: number,
 *   allSquads?: Array<{ name: string, members: Array<{ id: string, name: string }> }>,
 * }} props
 */
export function SquadXpDashboard({
  squadName,
  memberIds,
  participantId,
  week = 2,
  allSquads = [],
}) {
  const xp = useMemo(
    () => getSquadWeeklyXp(squadName, memberIds, week),
    [squadName, memberIds, week],
  );

  const ranks = useMemo(() => {
    if (!allSquads.length) return [];
    return rankSquadsByXp(allSquads, week);
  }, [allSquads, week]);

  const myRank = ranks.find((r) => r.squadName === squadName)?.rank;
  const commendations = getSquadCommendations(squadName, week);
  const myCommendations = participantId ? getCommendationsForParticipant(participantId, week) : [];

  const gateLabel =
    xp.gate?.decision === 'ready'
      ? 'READY FOR STAGE GATE'
      : xp.gate?.decision === 'almost_ready'
        ? 'ALMOST READY'
        : xp.gate?.decision === 'not_ready'
          ? 'NOT READY'
          : xp.totalXp >= 75
            ? 'READY FOR STAGE GATE'
            : 'IN PROGRESS';
  const gateColor =
    xp.gate?.decision === 'ready'
      ? 'text-emerald-700'
      : xp.gate?.decision === 'almost_ready'
        ? 'text-amber-700'
        : xp.gate?.decision === 'not_ready'
          ? 'text-red-700'
          : 'text-slate-600';

  return (
    <section className="spike-venture-status space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="spike-label">Squad XP · Week {week}</p>
          <h2 className="text-xl font-bold text-slate-900">{squadName}</h2>
          <p className="mt-1 text-3xl font-black tabular-nums text-spike">{xp.totalXp} XP</p>
          <p className="text-sm text-amber-600">{formatStarDisplay(xp.totalXp)}</p>
        </div>
        <div className="text-right text-sm">
          {myRank ? (
            <p className="flex items-center justify-end gap-1 font-bold text-slate-800">
              <Trophy size={16} className="text-amber-500" /> Rank #{myRank}
            </p>
          ) : null}
          <p className={`mt-1 font-semibold ${gateColor}`}>{gateLabel}</p>
          <p className="text-xs text-slate-500">{xp.completionPct}% squad completion</p>
        </div>
      </div>

      <div className="h-2 overflow-hidden rounded-full bg-slate-200/80">
        <div
          className="h-full rounded-full bg-gradient-to-r from-venture-discover to-spike transition-all"
          style={{ width: `${xp.totalXp}%` }}
        />
      </div>

      <ul className="space-y-1.5 text-sm">
        {xp.checklist.map((item) => (
          <li key={item.id} className="flex items-center gap-2 text-slate-700">
            <span className={item.done ? 'text-emerald-600' : 'text-slate-300'}>
              {item.done ? '✔' : '○'}
            </span>
            {item.label}
          </li>
        ))}
      </ul>

      {xp.review?.aiSummary ? (
        <div className="rounded-xl bg-slate-50 px-4 py-3 text-sm text-slate-700">
          <p className="mb-1 flex items-center gap-1 text-xs font-semibold text-spike">
            <Sparkles size={14} /> AI coaching summary
          </p>
          {xp.review.aiSummary}
        </div>
      ) : null}

      {commendations.length > 0 ? (
        <div>
          <p className="spike-label mb-2">Squad commendations</p>
          <ul className="space-y-1 text-sm">
            {commendations.map((c) => (
              <li key={`${c.participantId}-${c.typeId}`} className="text-slate-800">
                {c.emoji} {c.label} — {c.participantName}
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {myCommendations.length > 0 ? (
        <div className="rounded-xl bg-amber-50/60 px-4 py-3">
          <p className="text-xs font-semibold text-amber-900">Your commendations</p>
          <ul className="mt-1 space-y-1 text-sm text-amber-950">
            {myCommendations.map((c) => (
              <li key={c.typeId}>
                {c.emoji} {c.label}
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      <p className="text-[10px] text-slate-400">
        Auto XP {xp.autoXp}/80 · Pitch bonus {xp.pitchBonus}/20 · Shared by all squad members
      </p>
    </section>
  );
}

/** Leaderboard for faculty / mentor home */
export function SquadXpLeaderboard({ interns, week = 2 }) {
  const squads = groupInternsBySquad(interns);
  const ranks = rankSquadsByXp(squads, week);

  return (
    <section className="spike-surface space-y-3">
      <p className="spike-label">Squad XP leaderboard</p>
      <ol className="space-y-2">
        {ranks.map((row) => (
          <li
            key={row.squadName}
            className="flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2 text-sm"
          >
            <span className="font-semibold text-slate-900">
              #{row.rank} {row.squadName}
            </span>
            <span className="font-bold tabular-nums text-spike">{row.totalXp} XP</span>
          </li>
        ))}
      </ol>
    </section>
  );
}
