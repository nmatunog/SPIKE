import { createElement, useEffect, useMemo, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Briefcase, ChevronDown, ChevronUp, LayoutGrid, MessageSquare, Sparkles, User } from 'lucide-react';
import { PageContainer } from '../layout/PageContainer.jsx';
import { deriveSquadHubDetail } from '../../lib/staffCoachHomeService.js';
import { PitchPanelSquadSummaryPanel } from './PitchPanelSquadSummaryPanel.jsx';
import { SquadCoachBonusPanel } from './SquadCoachBonusPanel.jsx';
import { SquadXpInline, SquadXpSummaryCard } from './SquadXpDashboard.jsx';
import { SquadWeek2MissionProgressPanel } from './SquadWeek2MissionProgressPanel.jsx';
import { getSquadWeeklyXp } from '../../lib/staff/squadXpService.js';
import { SQUAD_COACH_BONUS_EVENT } from '../../lib/staff/squadCoachBonusService.js';
import {
  mentorParticipantReviewHref,
  staffSquadsListHref,
  ROUTES,
} from '../../routes/paths.js';
import { groupInternsBySquad } from '../../lib/facultyMentorFrameworkService.js';
import { useCohortProgramDay } from '../../hooks/useCohortProgramDay.js';
import { useCohortHydration, useSquadXpHydration } from '../../hooks/useParticipantHydration.js';

/**
 * @param {{
 *   role: 'faculty' | 'mentor',
 *   squadName: string,
 *   interns: Array<{ id: string, name: string, squad?: string, hours?: number }>,
 *   homeHref: string,
 *   staffId?: string,
 *   showToast?: (message: string) => void,
 * }} props
 */
export function StaffSquadHubPage({ role, squadName, interns, homeHref, staffId = '', showToast }) {
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
        <div className="mb-6 space-y-4">
          <SquadWeek2MissionProgressPanel
            squadName={detail.squadName}
            memberIds={memberIds}
            members={detail.memberRows}
            cohortReady={cohortReady}
          />
          <PitchPanelSquadSummaryPanel
            squadName={detail.squadName}
            memberIds={memberIds}
          />
          {staffId ? (
            <SquadCoachBonusPanel
              staffId={staffId}
              squadName={detail.squadName}
              week={programDay.week}
              role={role}
              showToast={showToast}
            />
          ) : null}
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
 * @param {{
 *   role: 'faculty' | 'mentor',
 *   interns: Array<object>,
 *   homeHref: string,
 *   staffId?: string,
 *   showToast?: (message: string) => void,
 * }} props
 */
export function StaffSquadsListPage({ role, interns, homeHref, staffId = '', showToast }) {
  const squads = groupInternsBySquad(interns);
  const { programDay } = useCohortProgramDay();
  const [expandedSquad, setExpandedSquad] = useState('');
  const cohortIds = useMemo(() => interns.map((i) => i.id), [interns]);
  const { ready: xpReady, version: xpVersion } = useSquadXpHydration(cohortIds, {
    enabled: cohortIds.length > 0,
  });
  const { ready: cohortReady, version: cohortVersion } = useCohortHydration(cohortIds, {
    enabled: Boolean(expandedSquad) && cohortIds.length > 0,
    interns,
  });

  return (
    <PageContainer>
      <header className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">My squads</h1>
        <p className="mt-1 text-sm text-slate-600">
          Venture boards, FECs, portfolios, Week 2 mission progress, and pitch panel scores — organized
          by squad.
          {programDay.week >= 2 ? ' Click a squad to expand tasks and full panel summary.' : ''}
        </p>
      </header>
      <ul className="grid gap-4 sm:grid-cols-2">
        {squads.map((squad) => (
          <StaffSquadsListCard
            key={squad.name}
            squad={squad}
            role={role}
            programDay={programDay}
            expanded={expandedSquad === squad.name}
            onToggle={() => setExpandedSquad(expandedSquad === squad.name ? '' : squad.name)}
            cohortReady={cohortReady}
            xpReady={xpReady}
            xpVersion={xpVersion}
            cohortVersion={cohortVersion}
            staffId={staffId}
            showToast={showToast}
          />
        ))}
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

/**
 * @param {{
 *   squad: { name: string, members?: Array<{ id: string, name?: string }>, count: number },
 *   role: 'faculty' | 'mentor',
 *   programDay: { week: number },
 *   expanded: boolean,
 *   onToggle: () => void,
 *   cohortReady: boolean,
 *   xpReady: boolean,
 *   xpVersion: number,
 *   cohortVersion: number,
 *   staffId?: string,
 *   showToast?: (message: string) => void,
 * }} props
 */
function StaffSquadsListCard({
  squad,
  role,
  programDay,
  expanded,
  onToggle,
  cohortReady,
  xpReady,
  xpVersion,
  cohortVersion,
  staffId = '',
  showToast,
}) {
  const memberIds = useMemo(() => (squad.members ?? []).map((m) => m.id), [squad.members]);
  const [bonusVersion, setBonusVersion] = useState(0);
  useEffect(() => {
    const bump = () => setBonusVersion((v) => v + 1);
    window.addEventListener(SQUAD_COACH_BONUS_EVENT, bump);
    return () => window.removeEventListener(SQUAD_COACH_BONUS_EVENT, bump);
  }, []);
  const xp = useMemo(
    () => getSquadWeeklyXp(squad.name, memberIds, programDay.week),
    [squad.name, memberIds, programDay.week, xpVersion, cohortVersion, bonusVersion],
  );
  const hubHref = `${staffSquadsListHref(role)}/${encodeURIComponent(squad.name)}`;

  return (
    <li className="rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="flex items-start justify-between gap-3 p-5">
        <button
          type="button"
          onClick={onToggle}
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
          {programDay.week >= 2 ? (
            <div className="mt-3">
              <PitchPanelSquadSummaryPanel
                squadName={squad.name}
                memberIds={memberIds}
                compact
                fetchDetails={false}
              />
            </div>
          ) : null}
        </button>
        {!xpReady ? (
          <span className="inline-flex items-center gap-1 text-xs text-slate-400">
            <Loader2 size={14} className="animate-spin" aria-hidden />
            XP…
          </span>
        ) : (
          <SquadXpInline totalXp={xp.totalXp} />
        )}
      </div>

      {expanded && programDay.week >= 2 ? (
        <div className="space-y-3 border-t border-slate-100 px-2 pb-2 pt-2">
          <SquadWeek2MissionProgressPanel
            squadName={squad.name}
            memberIds={memberIds}
            members={squad.members ?? []}
            cohortReady={cohortReady}
            compact
            embedded
          />
          <PitchPanelSquadSummaryPanel
            squadName={squad.name}
            memberIds={memberIds}
            className="mx-1"
          />
          {staffId ? (
            <SquadCoachBonusPanel
              staffId={staffId}
              squadName={squad.name}
              week={programDay.week}
              role={role}
              showToast={showToast}
              compact
              className="mx-1"
            />
          ) : null}
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
