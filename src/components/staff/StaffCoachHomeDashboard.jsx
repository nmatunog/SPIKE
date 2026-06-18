import { createElement } from 'react';
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
  Users,
} from 'lucide-react';
import { deriveStaffCoachHome } from '../../lib/staffCoachHomeService.js';
import {
  ROUTES,
  staffSquadHubHref,
  staffSquadsListHref,
} from '../../routes/paths.js';

/**
 * @param {{
 *   role: 'faculty' | 'mentor',
 *   staffName?: string,
 *   interns: Array<{ id: string, name: string, squad?: string, hours?: number, internProgress?: object }>,
 *   homeHref: string,
 * }} props
 */
export function StaffCoachHomeDashboard({ role, staffName = 'Coach', interns, homeHref }) {
  const model = deriveStaffCoachHome(interns, { role, staffName });
  const roleLabel = role === 'faculty' ? 'Program Coach' : 'Mentor';
  const squadsHref = staffSquadsListHref(role);

  return (
    <div className="space-y-8">
      <header>
        <p className="text-sm font-medium text-slate-500">{roleLabel}</p>
        <h1 className="mt-1 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
          Welcome back, {model.staffName}
        </h1>
        <p className="mt-2 max-w-2xl text-base text-slate-600">
          {role === 'faculty'
            ? "You're leading the next generation of financial entrepreneurs."
            : 'Coach your squads through identity, venture design, and portfolio readiness.'}
        </p>
      </header>

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
              <h2 className="text-lg font-semibold text-slate-900">Today at a glance</h2>
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
