import { createElement, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Briefcase, ChevronDown, ChevronUp, LayoutGrid, MessageSquare, Sparkles, User } from 'lucide-react';
import { PageContainer } from '../layout/PageContainer.jsx';
import { deriveSquadHubDetail } from '../../lib/staffCoachHomeService.js';
import { SquadXpInline, SquadXpSummaryCard } from './SquadXpDashboard.jsx';
import { SquadWeek2MissionProgressPanel } from './SquadWeek2MissionProgressPanel.jsx';
import { getSquadWeeklyXp } from '../../lib/staff/squadXpService.js';
import {
  mentorParticipantReviewHref,
  staffSquadsListHref,
  ROUTES,
} from '../../routes/paths.js';
import { groupInternsBySquad } from '../../lib/facultyMentorFrameworkService.js';
import { useCohortProgramDay } from '../../hooks/useCohortProgramDay.js';
import { useCohortHydration } from '../../hooks/useParticipantHydration.js';

/**
 * @param {{
 *   role: 'faculty' | 'mentor',
 *   squadName: string,
 *   interns: Array<{ id: string, name: string, squad?: string, hours?: number }>,
 *   homeHref: string,
 * }} props
 */
export function StaffSquadHubPage({ role, squadName, interns, homeHref }) {
  const detail = deriveSquadHubDetail(interns, squadName);
  const squadsHref = staffSquadsListHref(role);
  const memberIds = detail.memberRows.map((m) => m.id);
  const { programDay } = useCohortProgramDay();
  const { ready: cohortReady, version: cohortVersion } = useCohortHydration(memberIds, {
    enabled: memberIds.length > 0,
    interns: detail.memberRows,
  });

  return (
    <PageContainer>
      <Link
        to={squadsHref}
        className="mb-4 inline-flex items-center gap-2 text-sm text-slate-500 hover:text-spike"
      >
        <ArrowLeft size={16} /> All squads
      </Link>

      <header className="mb-6">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-500">Squad</p>
        <h1 className="mt-1 text-3xl font-bold text-slate-900">{detail.squadName}</h1>
        <p className="mt-2 text-lg text-slate-600">{detail.ventureLabel}</p>
        <div className="mt-4 flex flex-wrap items-center gap-4">
          <div className="h-2 w-48 overflow-hidden rounded-full bg-slate-200">
            <div
              className="h-full rounded-full bg-spike"
              style={{ width: `${detail.avgProgress}%` }}
            />
          </div>
          <span className="text-sm font-semibold text-slate-600">{detail.avgProgress}% Week 1 ready</span>
        </div>
      </header>

      <SquadXpSummaryCard
        squadName={detail.squadName}
        memberIds={memberIds}
        week={detail.week}
        skipHydration={cohortReady}
        hydrationVersion={cohortVersion}
      />

      {programDay.week >= 2 ? (
        <div className="mb-6">
          <SquadWeek2MissionProgressPanel
            squadName={detail.squadName}
            memberIds={memberIds}
            members={detail.memberRows}
            cohortReady={cohortReady}
          />
        </div>
      ) : null}

      <div className="mb-6 flex flex-wrap gap-2">
        <Link
          to={`${ROUTES.portfolio}?squad=${encodeURIComponent(squadName)}`}
          className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-800 hover:bg-slate-50"
        >
          <Briefcase size={16} className="text-spike" /> Portfolio review
        </Link>
        <Link
          to={ROUTES.playbookFecProjection}
          className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-800 hover:bg-slate-50"
        >
          <LayoutGrid size={16} className="text-spike" /> FEC projection
        </Link>
      </div>

      <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 px-5 py-4">
          <h2 className="text-lg font-semibold text-slate-900">Interns in this squad</h2>
          <p className="text-sm text-slate-500">Open a card to view venture board, FEC, portfolio, and leave feedback.</p>
        </div>
        <ul className="divide-y divide-slate-100">
          {detail.memberRows.map((member) => (
            <li key={member.id} className="px-5 py-4">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <p className="font-semibold text-slate-900">{member.name}</p>
                  <p className="text-sm text-slate-600">{member.ventureName}</p>
                  {member.lastNotePreview ? (
                    <p className="mt-1 text-xs text-slate-500">
                      Last note: {member.lastNotePreview}…
                    </p>
                  ) : null}
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-full bg-spike-muted px-2.5 py-1 text-xs font-bold text-spike">
                    {member.progressPct}%
                  </span>
                  {member.fecStarted ? (
                    <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-800">
                      FEC started
                    </span>
                  ) : null}
                </div>
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                <TabLink
                  to={mentorParticipantReviewHref(member.id, 'overview')}
                  icon={User}
                  label="Overview"
                />
                <TabLink
                  to={mentorParticipantReviewHref(member.id, 'venture')}
                  icon={Sparkles}
                  label="Venture board"
                />
                <TabLink
                  to={mentorParticipantReviewHref(member.id, 'fec')}
                  icon={LayoutGrid}
                  label="FEC"
                />
                <TabLink
                  to={mentorParticipantReviewHref(member.id, 'portfolio')}
                  icon={Briefcase}
                  label="Portfolio"
                />
                <TabLink
                  to={mentorParticipantReviewHref(member.id, 'feedback')}
                  icon={MessageSquare}
                  label="Rate & comment"
                  primary
                />
              </div>
            </li>
          ))}
        </ul>
        {detail.memberRows.length === 0 ? (
          <p className="px-5 py-8 text-sm text-slate-500">No members in this squad.</p>
        ) : null}
      </section>

      <p className="mt-6 text-center">
        <Link to={homeHref} className="text-sm text-slate-500 hover:text-spike">
          ← Back to home
        </Link>
      </p>
    </PageContainer>
  );
}

/**
 * Squad list when no slug in URL.
 * @param {{ role: 'faculty' | 'mentor', interns: Array<object>, homeHref: string }} props
 */
export function StaffSquadsListPage({ role, interns, homeHref }) {
  const squads = groupInternsBySquad(interns);
  const { programDay } = useCohortProgramDay();
  const [expandedSquad, setExpandedSquad] = useState('');
  const cohortIds = useMemo(() => interns.map((i) => i.id), [interns]);
  const { ready: cohortReady, version: cohortVersion } = useCohortHydration(cohortIds, {
    enabled: Boolean(expandedSquad) && cohortIds.length > 0,
    interns,
  });
  void cohortVersion;

  return (
    <PageContainer>
      <header className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">My squads</h1>
        <p className="mt-1 text-sm text-slate-600">
          Venture boards, FECs, portfolios, and Week 2 mission progress — organized by squad.
          {programDay.week >= 2 ? ' Click a squad to expand today’s tasks.' : ''}
        </p>
      </header>
      <ul className="grid gap-4 sm:grid-cols-2">
        {squads.map((squad) => {
          const memberIds = (squad.members ?? []).map((m) => m.id);
          const xp = getSquadWeeklyXp(squad.name, memberIds, programDay.week);
          const expanded = expandedSquad === squad.name;
          const hubHref = `${staffSquadsListHref(role)}/${encodeURIComponent(squad.name)}`;

          return (
          <li key={squad.name} className="rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="flex items-start justify-between gap-3 p-5">
              <button
                type="button"
                onClick={() => setExpandedSquad(expanded ? '' : squad.name)}
                className="min-w-0 flex-1 text-left"
              >
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-semibold text-slate-900">{squad.name}</h2>
                  {programDay.week >= 2 ? (
                    expanded ? (
                      <ChevronUp size={18} className="text-slate-400" aria-hidden />
                    ) : (
                      <ChevronDown size={18} className="text-slate-400" aria-hidden />
                    )
                  ) : null}
                </div>
                <p className="mt-1 text-sm text-slate-600">{squad.count} members</p>
              </button>
              <SquadXpInline totalXp={xp.totalXp} />
            </div>

            {expanded && programDay.week >= 2 ? (
              <div className="border-t border-slate-100 px-2 pb-2">
                <SquadWeek2MissionProgressPanel
                  squadName={squad.name}
                  memberIds={memberIds}
                  members={squad.members ?? []}
                  cohortReady={cohortReady}
                  compact
                  embedded
                />
              </div>
            ) : null}

            <div className="border-t border-slate-100 px-5 py-3">
              <Link
                to={hubHref}
                className="inline-flex items-center gap-1.5 text-sm font-semibold text-spike hover:underline"
              >
                Open squad hub
                <ArrowRight size={14} aria-hidden />
              </Link>
            </div>
          </li>
          );
        })}
      </ul>
      {squads.length === 0 ? (
        <p className="rounded-xl border border-dashed border-slate-200 p-8 text-center text-sm text-slate-500">
          Squads will appear after cohort formation.
        </p>
      ) : null}
      <p className="mt-6 text-center">
        <Link to={homeHref} className="text-sm text-slate-500 hover:text-spike">
          ← Back to home
        </Link>
      </p>
    </PageContainer>
  );
}

/** @param {{ to: string, icon: import('lucide-react').LucideIcon, label: string, primary?: boolean }} props */
function TabLink({ to, icon, label, primary }) {
  return (
    <Link
      to={to}
      className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold transition ${
        primary
          ? 'bg-spike text-white hover:bg-spike-light'
          : 'border border-slate-200 text-slate-700 hover:bg-slate-50'
      }`}
    >
      {createElement(icon, { size: 14 })}
      {label}
    </Link>
  );
}
