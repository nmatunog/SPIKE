import { Link } from 'react-router-dom';
import { Users, FileSignature, Award } from 'lucide-react';
import { PageContainer } from '../../components/layout/PageContainer.jsx';
import { SquadXpDashboard } from '../../components/staff/SquadXpDashboard.jsx';
import { useCohortProgramDay } from '../../hooks/useCohortProgramDay.js';
import {
  getOfficialCohort,
  getParticipantBadges,
  getParticipantSquad,
  getSquadCharter,
  getThemeItem,
  listAllSquads,
  RESEARCH_MARKETS,
} from '../../lib/cohortFormationService.js';
import { WednesdayInsightsPanel } from '../../components/customerDiscovery/WednesdayInsightsPanel.jsx';
import { UNLOCK_WEEK2 } from '../../lib/programUnlocks.js';
import { ROUTES } from '../../routes/paths.js';

/**
 * @param {{ participantId: string, participantName: string }} props
 */
export function SquadDashboardPage({ participantId, participantName }) {
  const { programDay } = useCohortProgramDay();
  const squad = getParticipantSquad(participantId);
  const cohort = getOfficialCohort();
  const charter = squad ? getSquadCharter(squad.id) : null;
  const badges = getParticipantBadges(participantId);
  const item = squad ? getThemeItem(String(squad.themeItemId)) : null;
  const memberIds = (squad?.members ?? []).map((m) => m.participantId);
  const allSquads = listAllSquads().map((s) => ({
    name: s.name,
    members: (s.members ?? []).map((m) => ({ id: m.participantId, name: m.participantId.slice(0, 8) })),
  }));
  const market = squad
    ? RESEARCH_MARKETS.find((m) => m.id === squad.researchMarket)?.label
    : null;

  if (!squad) {
    return (
      <PageContainer>
        <section className="spike-card mx-auto max-w-xl text-center">
          <Users className="mx-auto mb-3 text-spike" size={36} />
          <h2 className="text-xl font-bold text-slate-900">Join a squad first</h2>
          <p className="mt-2 text-sm text-slate-600">
            Complete Build Challenge 0 to name your founding cohort and set up your squad.
          </p>
          <Link to={ROUTES.cohortIdentity} className="mt-4 inline-flex spike-btn-primary">
            Continue onboarding
          </Link>
        </section>
      </PageContainer>
    );
  }

  const signed = charter?.signatures?.some((s) => s.participantId === participantId);
  const member = squad.members?.find((m) => m.participantId === participantId);

  return (
    <PageContainer wide>
      <div className="space-y-6">
        <header className="rounded-2xl border border-spike/15 bg-gradient-to-br from-white to-spike-muted/40 p-6 shadow-card">
          <p className="spike-label text-spike">
            {cohort ? `SPIKE Cohort ${cohort.name}` : 'Your venture team'}
          </p>
          <h1 className="mt-1 text-2xl font-bold text-slate-900">{squad.name}</h1>
          <p className="mt-1 text-sm text-slate-600">
            {item ? `${item.icon} ${item.name} · ${item.description}` : null}
            {market ? ` · Research: ${market}` : null}
          </p>
          <p className="mt-2 text-sm text-slate-500">Your role: {member?.role ?? 'Member'}</p>
        </header>

        <SquadXpDashboard
          squadName={squad.name}
          memberIds={memberIds}
          participantId={participantId}
          week={programDay.week}
          allSquads={allSquads}
        />

        {UNLOCK_WEEK2 && programDay.week >= 2 && programDay.day >= 3 ? (
          <WednesdayInsightsPanel participantId={participantId} />
        ) : null}

        <div className="grid gap-4 sm:grid-cols-2">
          <StatCard
            label="Charter status"
            value={charter?.status === 'approved' ? 'Approved' : signed ? 'Signed' : 'Pending'}
          />
          <StatCard label="Team size" value={String(squad.members?.length ?? 0)} />
        </div>

        <section className="spike-card">
          <h3 className="mb-3 text-sm font-semibold text-slate-900">Squad members</h3>
          <ul className="grid gap-2 sm:grid-cols-2">
            {(squad.members ?? []).map((m) => (
              <li key={m.participantId} className="rounded-xl bg-slate-50 px-3 py-2 text-sm">
                <span className="font-medium text-slate-900">
                  {m.participantId === participantId ? participantName : m.participantId.slice(0, 8)}
                </span>
                <span className="text-slate-500"> · {m.role}</span>
              </li>
            ))}
          </ul>
        </section>

        <section className="spike-card">
          <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-900">
            <FileSignature size={16} className="text-spike" /> Charter
          </h3>
          <p className="text-sm text-slate-600">
            {signed
              ? 'You have signed the squad charter.'
              : 'Sign the collaborative squad charter with your team.'}
          </p>
          <Link to={ROUTES.squadCharter} className="mt-3 inline-flex spike-btn-primary">
            Open charter builder
          </Link>
        </section>

        {badges.length > 0 ? (
          <section className="spike-card">
            <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-900">
              <Award size={16} className="text-amber-600" /> Achievements
            </h3>
            <div className="flex flex-wrap gap-2">
              {badges.map((b) => (
                <span
                  key={b.key}
                  className="rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-900"
                >
                  {b.emoji} {b.label}
                </span>
              ))}
            </div>
          </section>
        ) : null}
      </div>
    </PageContainer>
  );
}

/** @param {{ label: string, value: string }} props */
function StatCard({ label, value }) {
  return (
    <div className="spike-card text-center">
      <p className="spike-label">{label}</p>
      <p className="mt-1 text-2xl font-bold text-slate-900">{value}</p>
    </div>
  );
}
