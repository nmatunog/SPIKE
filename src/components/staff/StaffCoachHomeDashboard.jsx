import { createElement, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  BookOpen,
  Briefcase,
  CalendarDays,
  ChevronRight,
  ClipboardList,
  Lightbulb,
  MessageSquarePlus,
  Presentation,
  Trophy,
  Users,
  FlaskConical,
  TrendingUp,
} from 'lucide-react';
import { deriveStaffCoachHome } from '../../lib/staffCoachHomeService.js';
import { getProgramDefinition, resolveProgramSlug } from '../../lib/programs/index.js';
import { SquadXpInline } from './SquadXpDashboard.jsx';
import {
  ROUTES,
  playbookWeek2StudioHref,
  playbookBusinessEngineCanvasPreviewHref,
  playbookWeek4FecPreviewHref,
  playbookWeek4BlueprintPreviewHref,
  playbookHref,
  staffSquadHubHref,
  staffSquadsListHref,
} from '../../routes/paths.js';
import { UNLOCK_WEEK2 } from '../../lib/programUnlocks.js';

/**
 * @param {{
 *   role: 'faculty' | 'mentor',
 *   staffName?: string,
 *   interns: Array<{ id: string, name: string, squad?: string, hours?: number, internProgress?: object }>,
 *   homeHref: string,
 *   cohortStartDate?: string | null,
 * }} props
 */
export function StaffCoachHomeDashboard({
  role,
  staffName = 'Coach',
  interns,
  homeHref,
  cohortStartDate,
}) {
  const model = deriveStaffCoachHome(interns, { role, staffName, cohortStartDate });
  const hero = model.todayHero;
  const roleLabel = role === 'faculty' ? 'Program Coach' : 'Mentor';
  const squadsHref = staffSquadsListHref(role);
  const dominantProgramSlug = useMemo(() => {
    const counts = new Map();
    for (const intern of interns) {
      const slug = resolveProgramSlug(intern.internProgress ?? intern);
      counts.set(slug, (counts.get(slug) ?? 0) + 1);
    }
    let top = 'spike-internship';
    let max = 0;
    for (const [slug, count] of counts) {
      if (count > max) {
        max = count;
        top = slug;
      }
    }
    return top;
  }, [interns]);
  const cohortProgram = getProgramDefinition(dominantProgramSlug);

  return (
    <div className="space-y-8">
      <header>
        <p className="text-sm font-medium text-slate-500">{roleLabel}</p>
        <div className="mt-1 flex flex-wrap items-center gap-2">
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
            Welcome back, {model.staffName}
          </h1>
          <span className="rounded-full bg-spike/10 px-3 py-1 text-xs font-bold uppercase tracking-wider text-spike">
            {cohortProgram.title}
          </span>
        </div>
      </header>

      {/* Today hero */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-950 via-slate-900 to-spike-dark p-6 text-white shadow-xl sm:p-8">
        <div
          aria-hidden
          className="pointer-events-none absolute -right-20 -top-16 h-56 w-56 rounded-full bg-spike/25 blur-3xl"
        />
        <div className="relative">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-spike px-3 py-1 text-xs font-bold uppercase tracking-wider text-white">
              Today
            </span>
            <span className="rounded-full border border-white/20 px-3 py-1 text-xs font-semibold text-slate-200">
              {hero.dayLabel}
            </span>
            <span className="rounded-full border border-white/20 px-3 py-1 text-xs font-semibold text-slate-300">
              {hero.themeLabel}
            </span>
          </div>
          <h2 className="mt-4 text-2xl font-bold tracking-tight sm:text-3xl lg:text-4xl">{hero.title}</h2>
          <p className="mt-3 max-w-2xl text-base leading-relaxed text-slate-300">{hero.subtitle}</p>
          {hero.expectedOutputs.length ? (
            <ul className="mt-4 flex flex-wrap gap-2">
              {hero.expectedOutputs.map((output) => (
                <li
                  key={output}
                  className="rounded-full bg-white/10 px-3 py-1 text-xs font-medium text-slate-200"
                >
                  {output}
                </li>
              ))}
            </ul>
          ) : null}
          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              to={model.frameworkPlaybookHref}
              className="inline-flex min-h-[48px] items-center gap-2 rounded-xl bg-white px-6 py-3 text-sm font-semibold text-slate-900 transition hover:bg-spike-muted"
            >
              Open Day {model.day} playbook
              <ArrowRight size={18} />
            </Link>
            <Link
              to={model.playbookHref}
              className="inline-flex min-h-[48px] items-center gap-2 rounded-xl border border-white/25 px-6 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
            >
              Deliver to cohort
            </Link>
            {model.stageGateHref ? (
              <Link
                to={model.stageGateHref}
                className="inline-flex min-h-[48px] items-center gap-2 rounded-xl border border-yellow-400/40 bg-yellow-400/10 px-6 py-3 text-sm font-semibold text-yellow-100 transition hover:bg-yellow-400/20"
              >
                <Trophy size={18} />
                Stage gate ceremony
              </Link>
            ) : null}
            {UNLOCK_WEEK2 && model.week >= 2 ? (
              <Link
                to={playbookWeek2StudioHref({ day: model.day, mission: 'mission' })}
                className="inline-flex min-h-[48px] items-center gap-2 rounded-xl border border-venture-activate/40 bg-venture-activate/15 px-6 py-3 text-sm font-semibold text-venture-activate transition hover:bg-venture-activate/25"
              >
                <FlaskConical size={18} />
                Preview SPIKE Studio
              </Link>
            ) : null}
            {model.week >= 3 && model.day >= 4 ? (
              <Link
                to={playbookHref({ segment: 1, week: 3, day: 4 })}
                className="inline-flex min-h-[48px] items-center gap-2 rounded-xl border border-orange-400/40 bg-orange-400/15 px-6 py-3 text-sm font-semibold text-orange-100 transition hover:bg-orange-400/25"
              >
                <TrendingUp size={18} />
                Growth Engine Worksheet
              </Link>
            ) : null}
            {model.week >= 3 && model.day >= 3 ? (
              <Link
                to={playbookBusinessEngineCanvasPreviewHref()}
                className="inline-flex min-h-[48px] items-center gap-2 rounded-xl border border-orange-400/40 bg-orange-400/15 px-6 py-3 text-sm font-semibold text-orange-100 transition hover:bg-orange-400/25"
              >
                <ClipboardList size={18} />
                Business Engine Canvas
              </Link>
            ) : null}
            {model.week >= 4 && model.day >= 1 ? (
              <>
                <Link
                  to={playbookWeek4FecPreviewHref()}
                  className="inline-flex min-h-[48px] items-center gap-2 rounded-xl border border-sky-400/40 bg-sky-400/15 px-6 py-3 text-sm font-semibold text-sky-100 transition hover:bg-sky-400/25"
                >
                  <ClipboardList size={18} />
                  Preview FEC
                </Link>
                <Link
                  to={playbookWeek4BlueprintPreviewHref()}
                  className="inline-flex min-h-[48px] items-center gap-2 rounded-xl border border-sky-400/40 bg-sky-400/15 px-6 py-3 text-sm font-semibold text-sky-100 transition hover:bg-sky-400/25"
                >
                  <Briefcase size={18} />
                  Preview Blueprint
                </Link>
              </>
            ) : null}
            {model.week >= 5 && model.day >= 1 ? (
              <>
                <Link
                  to={playbookHref({ week: 5, day: 1 })}
                  className="inline-flex min-h-[48px] items-center gap-2 rounded-xl border border-amber-400/40 bg-amber-400/15 px-6 py-3 text-sm font-semibold text-amber-100 transition hover:bg-amber-400/25"
                >
                  <Presentation size={18} />
                  Week 5 Day 1 playbook
                </Link>
                <Link
                  to={playbookHref({ week: 5, day: 2 })}
                  className="inline-flex min-h-[48px] items-center gap-2 rounded-xl border border-amber-400/40 bg-amber-400/15 px-6 py-3 text-sm font-semibold text-amber-100 transition hover:bg-amber-400/25"
                >
                  <Trophy size={18} />
                  Week 5 Day 2 playbook
                </Link>
              </>
            ) : null}
            {role === 'faculty' ? (
              <Link
                to={ROUTES.programCoachLife}
                className="inline-flex min-h-[48px] items-center gap-2 rounded-xl border border-white/25 px-6 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
              >
                SPIKE LIFE workshop
              </Link>
            ) : null}
          </div>
          <p className="mt-4 text-xs text-slate-400">
            Estimated program time · {hero.estimatedMinutes} min
          </p>
        </div>
      </section>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          label="Active squads"
          value={String(model.metrics.activeSquads)}
          href={squadsHref}
          linkLabel="View all squads"
        />
        <MetricCard label="Participants" value={String(model.metrics.participants)} sub="in your cohort" />
        <MetricCard
          label="Coaching touchpoints"
          value={String(model.metrics.activitiesToday)}
          sub="logged today"
        />
        <MetricCard
          label="Avg. engagement"
          value={String(model.metrics.avgEngagement)}
          sub="this week"
          accent
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <div className="space-y-6">
          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
              <h2 className="text-lg font-semibold text-slate-900">Today&apos;s schedule</h2>
              <span className="rounded-full bg-spike-muted px-3 py-1 text-xs font-semibold text-spike">
                {model.weekLabel}
              </span>
            </div>
            <ol className="space-y-4">
              {model.schedule.items.map((item) => (
                <li key={`${item.time}-${item.title}`} className="flex gap-4">
                  <span className="w-20 shrink-0 text-sm font-semibold text-slate-500">{item.time}</span>
                  <div className="min-w-0 flex-1 border-l-2 border-spike/20 pl-4">
                    <p className="font-medium text-slate-900">{item.title}</p>
                    {item.description ? (
                      <p className="mt-0.5 text-sm text-slate-600">{item.description}</p>
                    ) : null}
                    <span className="mt-1 inline-block rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">
                      {item.minutes} min
                    </span>
                  </div>
                </li>
              ))}
            </ol>
            <Link
              to={model.frameworkPlaybookHref}
              className="mt-5 inline-flex items-center gap-1 text-sm font-semibold text-spike hover:underline"
            >
              View full day playbook <ArrowRight size={14} />
            </Link>
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
              <h2 className="text-lg font-semibold text-slate-900">Squad overview</h2>
              <Link to={squadsHref} className="text-sm font-semibold text-spike hover:underline">
                All squads
              </Link>
            </div>
            {model.squadRows.length === 0 ? (
              <p className="px-5 py-8 text-sm text-slate-500">No squads assigned yet.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[640px] text-left text-sm">
                  <thead>
                    <tr className="border-b border-slate-100 text-xs font-semibold uppercase tracking-wide text-slate-500">
                      <th className="px-5 py-3">Squad</th>
                      <th className="px-3 py-3">Venture</th>
                      <th className="px-3 py-3">Progress</th>
                      <th className="px-3 py-3">Squad XP</th>
                      {UNLOCK_WEEK2 && model.week >= 2 ? (
                        <th className="px-3 py-3">Panel</th>
                      ) : null}
                      <th className="px-3 py-3">Engagement</th>
                      <th className="px-3 py-3">Next</th>
                      <th className="px-3 py-3" aria-label="Open" />
                    </tr>
                  </thead>
                  <tbody>
                    {model.squadRows.map((row) => (
                      <tr key={row.name} className="border-b border-slate-50 hover:bg-slate-50/80">
                        <td className="px-5 py-4 font-semibold text-slate-900">{row.name}</td>
                        <td className="max-w-[200px] truncate px-3 py-4 text-slate-600" title={row.ventureLabel}>
                          {row.ventureLabel}
                        </td>
                        <td className="px-3 py-4">
                          <div className="flex items-center gap-2">
                            <div className="h-2 w-20 overflow-hidden rounded-full bg-slate-200">
                              <div
                                className="h-full rounded-full bg-spike"
                                style={{ width: `${row.progressPct}%` }}
                              />
                            </div>
                            <span className="text-xs font-semibold text-slate-600">{row.progressPct}%</span>
                          </div>
                        </td>
                        <td className="px-3 py-4">
                          <SquadXpInline totalXp={row.squadXp} />
                          {row.coachBonusXp > 0 ? (
                            <p className="mt-0.5 text-[10px] font-medium text-spike">+{row.coachBonusXp} coach</p>
                          ) : null}
                        </td>
                        {UNLOCK_WEEK2 && model.week >= 2 ? (
                          <td className="px-3 py-4 text-xs text-slate-600">
                            {row.panelAverage != null ? (
                              <>
                                <span className="font-bold text-amber-700">★ {row.panelAverage.toFixed(1)}</span>
                                {row.panelPendingXp ? (
                                  <span className="mt-0.5 block text-[10px] text-slate-500">
                                    ~{row.panelPendingXp} pending
                                  </span>
                                ) : null}
                                {row.mentorReviewAvg != null ? (
                                  <span className="mt-0.5 block text-[10px] text-slate-500">
                                    Mentor {row.mentorReviewAvg}/5
                                  </span>
                                ) : null}
                              </>
                            ) : (
                              <span className="text-slate-400">—</span>
                            )}
                          </td>
                        ) : null}
                        <td className="px-3 py-4">
                          <EngagementDot tone={row.engagement.tone} label={row.engagement.label} />
                        </td>
                        <td className="px-3 py-4">
                          <p className="font-medium text-slate-800">{row.nextAction}</p>
                          <p className="text-xs text-slate-500">{row.nextActionSub}</p>
                        </td>
                        <td className="px-3 py-4">
                          <Link
                            to={staffSquadHubHref(role, row.name)}
                            className="inline-flex items-center text-spike hover:text-spike-light"
                            aria-label={`Open ${row.name}`}
                          >
                            <ChevronRight size={20} />
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          {model.metrics.needsCoaching > 0 ? (
            <section className="rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4">
              <p className="text-sm font-semibold text-amber-950">
                {model.metrics.needsCoaching} participant
                {model.metrics.needsCoaching === 1 ? '' : 's'} need follow-up
              </p>
              <Link
                to={ROUTES.mentorVentureCoach}
                className="mt-2 inline-flex text-sm font-semibold text-amber-900 hover:underline"
              >
                Open People →
              </Link>
            </section>
          ) : null}
        </div>

        <aside className="space-y-4">
          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Quick actions</h2>
            <ul className="mt-3 space-y-1">
              <QuickAction to={squadsHref} icon={Users} label="View my squads" />
              <QuickAction to={model.playbookHref} icon={BookOpen} label={`Open Day ${model.day} playbook`} />
              {UNLOCK_WEEK2 && model.week >= 2 ? (
                <QuickAction
                  to={playbookWeek2StudioHref({ day: model.day, mission: 'mission' })}
                  icon={FlaskConical}
                  label="Preview SPIKE Studio"
                />
              ) : null}
              {model.week >= 3 && model.day >= 3 ? (
                <QuickAction
                  to={playbookBusinessEngineCanvasPreviewHref()}
                  icon={ClipboardList}
                  label="Business Engine Canvas (blank)"
                />
              ) : null}
              {UNLOCK_WEEK2 && model.week >= 2 ? (
                <QuickAction
                  to={role === 'mentor' ? ROUTES.mentorPitchPanel : ROUTES.programCoachPitchPanel}
                  icon={Trophy}
                  label="Demo Day coach view"
                />
              ) : null}
              <QuickAction to={ROUTES.portfolio} icon={Briefcase} label="Portfolio review" />
              <QuickAction
                to={ROUTES.mentorVentureCoach}
                icon={MessageSquarePlus}
                label="Add coaching note"
              />
              <QuickAction to={ROUTES.facilitatorsReference} icon={ClipboardList} label="Facilitator guides" />
            </ul>
          </section>

          {model.upcomingDays.length > 0 ? (
            <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <h2 className="flex items-center gap-2 text-sm font-semibold text-slate-900">
                <CalendarDays size={16} className="text-spike" /> Upcoming
              </h2>
              <ul className="mt-3 space-y-3">
                {model.upcomingDays.map((item) => (
                  <li key={item.day}>
                    <Link to={item.href} className="block rounded-lg px-2 py-1.5 hover:bg-slate-50">
                      <p className="text-xs font-semibold text-slate-500">{item.label}</p>
                      <p className="text-sm font-medium text-slate-800">{item.title}</p>
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}

          <section className="rounded-2xl border border-spike/15 bg-gradient-to-br from-spike-muted/40 to-white p-5">
            <h2 className="flex items-center gap-2 text-sm font-semibold text-spike">
              <Lightbulb size={16} /> Coach tip
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-slate-700">{model.coachTip}</p>
          </section>

          <Link
            to={homeHref}
            className="block text-center text-xs text-slate-400 hover:text-slate-600"
          >
            Program tools &amp; admin panels ↓
          </Link>
        </aside>
      </div>
    </div>
  );
}

/** @param {{ label: string, value: string, sub?: string, href?: string, linkLabel?: string, accent?: boolean }} props */
function MetricCard({ label, value, sub, href, linkLabel, accent }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</p>
      <p className={`mt-1 text-3xl font-bold ${accent ? 'text-spike' : 'text-slate-900'}`}>{value}</p>
      {sub ? <p className="mt-0.5 text-xs text-slate-500">{sub}</p> : null}
      {href && linkLabel ? (
        <Link to={href} className="mt-2 inline-flex text-xs font-semibold text-spike hover:underline">
          {linkLabel} →
        </Link>
      ) : null}
    </div>
  );
}

/** @param {{ to: string, icon: import('lucide-react').LucideIcon, label: string }} props */
function QuickAction({ to, icon, label }) {
  return (
    <li>
      <Link
        to={to}
        className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
      >
        {createElement(icon, { size: 18, className: 'shrink-0 text-spike' })}
        {label}
      </Link>
    </li>
  );
}

/** @param {{ tone: string, label: string }} props */
function EngagementDot({ tone, label }) {
  const color =
    tone === 'high' ? 'bg-emerald-500' : tone === 'medium' ? 'bg-amber-400' : 'bg-rose-400';
  return (
    <span className="inline-flex items-center gap-2 text-xs font-medium text-slate-700">
      <span className={`h-2.5 w-2.5 rounded-full ${color}`} aria-hidden />
      {label}
    </span>
  );
}
