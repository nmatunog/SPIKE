import { Link } from 'react-router-dom';
import { getParticipantSquad } from '../../lib/cohortFormationService.js';
import { playbookWeek2MissionHref } from '../../lib/customerDiscovery/week2MissionService.js';
import { getSquadWeeklyXp } from '../../lib/staff/squadXpService.js';
import {
  MENTOR_REVIEW_DIMENSIONS,
  MENTOR_VS_PANEL_NOTE,
  PITCH_PANEL_INVESTMENT_CRITERIA,
  SQUAD_XP_LAYERS,
  SQUAD_XP_TOTAL_LABEL,
} from '../../lib/staff/squadScoringGuide.js';
import { formatPitchPeso } from '../../lib/staff/pitchPanelConstants.js';
import { usePitchPanelLive } from '../../hooks/usePitchPanelLive.js';

/**
 * How squad XP and pitch scoring work — intern portfolio + playbook task.
 * @param {{ variant?: 'compact' | 'task' | 'portfolio', participantId?: string, week?: number }} props
 */
export function SquadScoringExplainer({ variant = 'portfolio', participantId = '', week = 2 }) {
  usePitchPanelLive(Boolean(participantId));
  const squad = participantId ? getParticipantSquad(participantId) : null;
  const memberIds = (squad?.members ?? []).map((m) => m.participantId).filter(Boolean);
  const xp = squad?.name
    ? getSquadWeeklyXp(squad.name, memberIds, week)
    : null;

  const shellClass =
    variant === 'task'
      ? 'rounded-xl border border-indigo-100 bg-indigo-50/60 p-4'
      : 'rounded-xl border border-slate-200 bg-slate-50/80 p-4 sm:p-5';

  return (
    <section className={shellClass}>
      <p className="text-xs font-bold uppercase tracking-wider text-slate-500">How your squad is scored</p>
      <p className="mt-1 text-sm text-slate-700">{SQUAD_XP_TOTAL_LABEL}. {MENTOR_VS_PANEL_NOTE}</p>

      <ul className="mt-4 space-y-2 text-sm text-slate-700">
        {SQUAD_XP_LAYERS.map((layer) => (
          <li key={layer.id}>
            <strong className="text-slate-900">{layer.title}</strong>
            <span className="text-slate-600"> — {layer.detail}</span>
          </li>
        ))}
      </ul>

      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        <ScoringDimensionList
          title="SPIKE Venture Capital (Demo Day)"
          subtitle="₱1M per investor — allocate across squads"
          dimensions={PITCH_PANEL_INVESTMENT_CRITERIA.map((label) => ({ label }))}
        />
        <ScoringDimensionList
          title="Mentor & coach (whole week)"
          subtitle="~1 min squad review — not re-grading the pitch"
          dimensions={MENTOR_REVIEW_DIMENSIONS}
        />
      </div>

      {xp && variant !== 'task' ? (
        <p className="mt-4 text-xs text-slate-600">
          Current squad total: <strong className="text-spike">{xp.totalXp} XP</strong>
          {xp.panelFinalized && xp.totalInvestment != null && xp.totalInvestment > 0
            ? ` · Demo Day ${formatPitchPeso(xp.totalInvestment)}`
            : xp.panelPending
              ? ' · Demo Day funding pending finalize'
              : ''}
          {xp.review?.aiSummary ? ' · Mentor summary saved' : ''}
        </p>
      ) : null}

      {variant === 'portfolio' && participantId ? (
        <Link
          to={playbookWeek2MissionHref('week-wrap-up', { day: 5 })}
          className="mt-4 inline-block text-sm font-semibold text-spike hover:underline"
        >
          Edit week wrap-up in playbook →
        </Link>
      ) : null}
    </section>
  );
}

/**
 * @param {{ title: string, subtitle: string, dimensions: Array<{ label: string, hint?: string }> }} props
 */
function ScoringDimensionList({ title, subtitle, dimensions }) {
  return (
    <div className="rounded-lg bg-white/90 px-3 py-3 ring-1 ring-slate-200/80">
      <p className="text-xs font-bold text-slate-900">{title}</p>
      <p className="text-[11px] text-slate-500">{subtitle}</p>
      <ul className="mt-2 space-y-1.5">
        {dimensions.map((dim) => (
          <li key={dim.label} className="text-xs text-slate-700">
            <span className="font-semibold text-slate-800">{dim.label}</span>
            {dim.hint ? <span className="text-slate-500"> — {dim.hint}</span> : null}
          </li>
        ))}
      </ul>
    </div>
  );
}
