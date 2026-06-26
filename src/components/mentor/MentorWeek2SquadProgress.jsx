import { Link } from 'react-router-dom';
import { ArrowRight, CheckCircle2, Circle, Users } from 'lucide-react';
import { useEffect, useState } from 'react';
import { groupInternsBySquad } from '../../lib/mentorFrameworkService.js';
import { deriveSquadWeek2Progress } from '../../lib/customerDiscovery/week2MentorSquadService.js';
import { MIN_ENCODED_INTERVIEWS, TARGET_ENCODED_INTERVIEWS } from '../../lib/customerDiscovery/week2Constants.js';
import { getSquadWeeklyXp } from '../../lib/staff/squadXpService.js';
import { PitchPanelSquadSummaryPanel } from '../staff/PitchPanelSquadSummaryPanel.jsx';
import { SquadXpInline } from '../staff/SquadXpDashboard.jsx';
import { usePitchPanelLive } from '../../hooks/usePitchPanelLive.js';
import { SQUAD_COACH_BONUS_EVENT } from '../../lib/staff/squadCoachBonusService.js';
import { ROUTES } from '../../routes/paths.js';
import { useCohortProgramDay } from '../../hooks/useCohortProgramDay.js';

/**
 * Mentor Week 2 — assigned squad progress (interviews, portfolio, readiness, pitch).
 * @param {{ interns: Array<{ id: string, name: string, squad?: string }> }} props
 */
export function MentorWeek2SquadProgress({ interns }) {
  const squads = groupInternsBySquad(interns);
  const { programDay } = useCohortProgramDay();
  const { version: panelVersion } = usePitchPanelLive(true);
  const [bonusVersion, setBonusVersion] = useState(0);
  const showDay3 = programDay.week >= 2 && programDay.day >= 3;
  const showDay4 = programDay.week >= 2 && programDay.day >= 4;

  useEffect(() => {
    const bump = () => setBonusVersion((v) => v + 1);
    window.addEventListener(SQUAD_COACH_BONUS_EVENT, bump);
    return () => window.removeEventListener(SQUAD_COACH_BONUS_EVENT, bump);
  }, []);

  if (!squads.length) {
    return (
      <section className="mt-10 rounded-2xl border border-dashed border-slate-200 bg-slate-50/80 p-6 text-sm text-slate-600">
        <p className="font-semibold text-slate-900">Squad progress</p>
        <p className="mt-2">Assign squads in cohort formation to track Week 2 mission progress.</p>
      </section>
    );
  }

  return (
    <section className="mt-10 space-y-4 border-t border-slate-200 pt-8">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.15em] text-spike">Week 2</p>
          <h2 className="mt-1 text-xl font-bold text-slate-900">Squad progress</h2>
          <p className="mt-1 max-w-2xl text-sm text-slate-600">
            Mission-driven journey — interviews, portfolio, professional readiness, and pitch readiness
            for your assigned squads.
          </p>
        </div>
        <Link
          to={ROUTES.mentorSquads}
          className="inline-flex shrink-0 items-center gap-1.5 text-sm font-semibold text-spike hover:underline"
        >
          Squad hub
          <ArrowRight size={14} aria-hidden />
        </Link>
      </header>

      <div className="grid gap-4 lg:grid-cols-2">
        {squads.map((squad) => {
          const memberIds = (squad.members ?? []).map((m) => m.id);
          const progress = deriveSquadWeek2Progress(memberIds);
          const xp = getSquadWeeklyXp(squad.name, memberIds, programDay.week);
          void panelVersion;
          void bonusVersion;
          return (
            <article key={squad.name} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="flex items-center gap-1.5 text-sm font-bold text-slate-900">
                    <Users size={15} className="text-spike" aria-hidden />
                    {squad.name}
                  </p>
                  <p className="mt-0.5 text-xs text-slate-500">
                    {progress.memberCount} member{progress.memberCount === 1 ? '' : 's'} ·{' '}
                    {progress.weekProgressPct}% week complete
                  </p>
                </div>
                <div className="text-right">
                  <SquadXpInline totalXp={xp.totalXp} />
                  {xp.panelAverage != null ? (
                    <p className="mt-1 text-[11px] font-medium text-amber-700">
                      Panel ★ {xp.panelAverage.toFixed(1)}
                      {xp.panelPending && xp.provisionalWeek2PanelXp
                        ? ` · ~${xp.provisionalWeek2PanelXp} pending`
                        : ''}
                    </p>
                  ) : null}
                </div>
              </div>

              <div className="mt-3">
                <PitchPanelSquadSummaryPanel
                  squadName={squad.name}
                  memberIds={memberIds}
                  compact
                  fetchDetails={false}
                />
              </div>

              <ul className="mt-4 space-y-2 text-sm">
                <ProgressRow
                  label="Interviews encoded"
                  detail={`${progress.interviewCount} / ${TARGET_ENCODED_INTERVIEWS} (min ${MIN_ENCODED_INTERVIEWS})`}
                  done={progress.interviewsMet}
                />
                <ProgressRow label="Portfolio synced" done={progress.portfolioComplete} />
                <ProgressRow label="Professional readiness" done={progress.readinessComplete} />
                <ProgressRow label="FEC Validation Lab" done={progress.fecComplete} />
                <ProgressRow label="Pitch started" done={progress.pitchReady} />
                <ProgressRow label="Pitch submitted" done={progress.pitchSubmitted} />
              </ul>

              {showDay3 ? (
                <div className="mt-4 space-y-3 border-t border-slate-100 pt-4">
                  <p className="text-xs font-bold uppercase text-slate-400">Day 3 — Professional Readiness</p>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <MetricPill label="PCTC (1+ cert)" value={`${progress.day3Metrics?.pctcPct ?? 0}%`} />
                    <MetricPill label="Reflection" value={`${progress.day3Metrics?.reflectionPct ?? 0}%`} />
                    <MetricPill label="UVP" value={progress.day3Metrics?.uvpStatus ?? '—'} />
                    <MetricPill label="Thursday" value={`${progress.day3Metrics?.thursdayReadinessPct ?? 0}%`} highlight />
                  </div>
                  {progress.interviewIntelligence?.mostCommonQuotes?.[0] ? (
                    <p className="text-xs italic text-slate-600">
                      Top quote: &ldquo;{progress.interviewIntelligence.mostCommonQuotes[0]}&rdquo;
                    </p>
                  ) : null}
                </div>
              ) : null}

              {showDay4 ? (
                <div className="mt-3 space-y-2 border-t border-slate-100 pt-3">
                  <p className="text-xs font-bold uppercase text-slate-400">Day 4 — FEC Validation Lab</p>
                  <div className="grid grid-cols-3 gap-2 text-xs">
                    <MetricPill label="Clarity" value={`${progress.day4Metrics?.clarityScore ?? 0}%`} highlight />
                    <MetricPill label="Pitch" value={progress.day4Metrics?.pitchReady ? 'Ready' : 'Draft'} />
                    <MetricPill label="Build" value={progress.day4Metrics?.buildReady ? 'Ready' : '—'} />
                  </div>
                </div>
              ) : null}
            </article>
          );
        })}
      </div>
    </section>
  );
}

/** @param {{ label: string, detail?: string, done: boolean }} props */
function ProgressRow({ label, detail, done }) {
  const Icon = done ? CheckCircle2 : Circle;
  return (
    <li className="flex items-center gap-2 text-slate-700">
      <Icon size={16} className={done ? 'text-emerald-600' : 'text-slate-300'} aria-hidden />
      <span className={done ? 'font-medium text-slate-900' : ''}>{label}</span>
      {detail ? <span className="ml-auto text-xs text-slate-500">{detail}</span> : null}
    </li>
  );
}

/** @param {{ label: string, value: string, highlight?: boolean }} props */
function MetricPill({ label, value, highlight }) {
  return (
    <div className={`rounded-lg px-2 py-1.5 ${highlight ? 'bg-spike/10 text-spike' : 'bg-slate-50 text-slate-700'}`}>
      <span className="text-[10px] font-bold uppercase text-slate-400">{label}</span>
      <p className="font-semibold">{value}</p>
    </div>
  );
}
