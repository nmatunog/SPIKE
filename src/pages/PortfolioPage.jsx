import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Briefcase, ChevronRight, Users } from 'lucide-react';
import { PageContainer, PageTitle } from '../components/layout/PageContainer.jsx';
import { FacultyCohortSyncPanel } from '../components/faculty/FacultyCohortSyncPanel.jsx';
import { getPortfolioSections } from '../lib/playbookSeeds.js';
import { StaffParticipantDreamBoardSection } from '../components/portfolio/StaffParticipantDreamBoardSection.jsx';
import { listParticipantClosingReflections } from '../lib/dayClosingReflection.js';
import { BLUEPRINT_LINKS, ROUTES, mentorParticipantReviewHref } from '../routes/paths.js';
import { useCohortHydration, useParticipantHydration } from '../hooks/useParticipantHydration.js';
import { generateVenturePortfolio } from '../services/portfolioGenerator.js';
import { getCoachSummaryForMentor } from '../lib/ventureCoachService.js';
import { getDay1MissionProgress } from '../lib/day1BuilderService.js';

/** @param {string} sectionId @param {ReturnType<typeof generateVenturePortfolio>} portfolio */
function sectionCompletionPct(sectionId, portfolio) {
  switch (sectionId) {
    case 'portfolio-identity-purpose':
      return portfolio.cover.portfolioCompletion > 0
        ? Math.round(
            (portfolio.identity.ambition ? 25 : 0)
            + (portfolio.identity.impact ? 25 : 0)
            + (portfolio.identity.topThreeValues.length ? 25 : 0)
            + (portfolio.identity.tagline ? 25 : 0),
          )
        : 0;
    case 'portfolio-market-intelligence':
      return Math.min(
        100,
        portfolio.research.metrics.surveysCompleted * 20
          + portfolio.research.metrics.insightsGenerated * 15
          + portfolio.research.metrics.personasCreated * 20,
      );
    case 'portfolio-financial-blueprint':
      return portfolio.canvas.completionPct ?? 0;
    case 'portfolio-professional-development':
      return portfolio.certifications.allBadges.length
        ? Math.min(100, portfolio.certifications.allBadges.length * 25)
        : 0;
    case 'portfolio-advisor-startup':
      return portfolio.cover.blueprintCompletion >= 30 ? portfolio.cover.blueprintCompletion : 0;
    case 'portfolio-three-year-blueprint': {
      const done = portfolio.milestones.items.filter((m) => m.done).length;
      const total = portfolio.milestones.items.length;
      return total ? Math.round((done / total) * 100) : 0;
    }
    default:
      return 0;
  }
}

/** @param {string} sectionId @param {ReturnType<typeof generateVenturePortfolio>} portfolio */
function sectionPreviewLines(sectionId, portfolio) {
  switch (sectionId) {
    case 'portfolio-identity-purpose':
      return [
        portfolio.identity.ambition && `Ambition: ${portfolio.identity.ambition}`,
        portfolio.identity.impact && `Impact: ${portfolio.identity.impact}`,
        portfolio.identity.topThreeValues.length
          && `Values: ${portfolio.identity.topThreeValues.join(' · ')}`,
        portfolio.identity.tagline && `Tagline: ${portfolio.identity.tagline}`,
      ].filter(Boolean);
    case 'portfolio-market-intelligence':
      return [
        portfolio.research.metrics.surveysCompleted
          ? `${portfolio.research.metrics.surveysCompleted} survey(s) submitted`
          : null,
        portfolio.research.metrics.insightsGenerated
          ? `${portfolio.research.metrics.insightsGenerated} insight artifact(s)`
          : null,
        portfolio.research.metrics.personasCreated
          ? `${portfolio.research.metrics.personasCreated} persona(s)`
          : null,
      ].filter(Boolean);
    case 'portfolio-financial-blueprint':
      return portfolio.canvas.completionPct
        ? [`Financial Canvas ${portfolio.canvas.completionPct}% complete`]
        : [];
    case 'portfolio-professional-development':
      return portfolio.certifications.allBadges.slice(0, 3).map((item) => String(item));
    case 'portfolio-advisor-startup':
      return portfolio.cover.blueprintCompletion
        ? [`Venture Blueprint ${portfolio.cover.blueprintCompletion}% complete`]
        : [];
    case 'portfolio-three-year-blueprint': {
      const next = portfolio.milestones.items.find((m) => !m.done);
      return next ? [`Next milestone: ${next.label}`] : [];
    }
    default:
      return [];
  }
}

/**
 * Staff portfolio view — cohort roster + per-participant compiled portfolio.
 * @param {{
 *   hours?: number,
 *   interns?: Array<{ id: string, name: string, squad?: string }>,
 * }} props
 */
export function PortfolioPage({ hours = 0, interns = [] }) {
  const sections = getPortfolioSections();
  const [participantId, setParticipantId] = useState('');
  const cohortIds = useMemo(() => interns.map((i) => i.id), [interns]);
  const { ready: cohortReady, version: cohortVersion } = useCohortHydration(cohortIds, {
    enabled: interns.length > 0,
    interns,
  });
  const { ready: participantReady, version: participantVersion } = useParticipantHydration(
    participantId || null,
    { enabled: Boolean(participantId) },
  );
  void cohortVersion;
  void participantVersion;

  const selectedIntern = interns.find((i) => i.id === participantId);
  const portfolio = participantId && participantReady
    ? generateVenturePortfolio(participantId, {
        participantName: selectedIntern?.name ?? 'Participant',
      })
    : null;

  return (
    <PageContainer>
      <div className="mb-6 sm:mb-8">
        <PageTitle>Venture Portfolio</PageTitle>
        <p className="mt-1 text-sm text-gray-600 sm:text-base">
          Review compiled participant portfolios. Identity work comes from{' '}
          <Link to={ROUTES.ventureBlueprint} className="font-bold text-[#8B0000] hover:underline">
            Venture Blueprint
          </Link>
          ; each Playbook day ends with a <strong>closing reflection</strong> in the matching section below.
        </p>
      </div>

      {interns.length > 0 ? (
        <div className="mb-6">
          <FacultyCohortSyncPanel interns={interns} />
        </div>
      ) : null}

      {interns.length > 0 ? (
        <div className="mb-6 spike-card space-y-4">
          <label className="block">
            <span className="mb-2 flex items-center gap-2 text-sm font-semibold text-slate-900">
              <Users size={16} className="text-spike" />
              Select participant
            </span>
            <select
              value={participantId}
              onChange={(e) => setParticipantId(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm"
            >
              <option value="">Choose a participant…</option>
              {interns.map((intern) => {
                const summary = cohortReady ? getCoachSummaryForMentor(intern.id) : null;
                const day1 = cohortReady ? getDay1MissionProgress(intern.id) : null;
                const pct = day1?.percent ?? summary?.progress?.percent ?? 0;
                return (
                  <option key={intern.id} value={intern.id}>
                    {intern.name}
                    {intern.squad ? ` · ${intern.squad}` : ''}
                    {cohortReady ? ` · ${pct}%` : ''}
                  </option>
                );
              })}
            </select>
          </label>

          {!cohortReady ? (
            <p className="text-sm text-slate-500">Loading cohort work from the server…</p>
          ) : null}

          {!participantId ? (
            <div className="overflow-x-auto rounded-xl border border-slate-100">
              <table className="w-full min-w-[520px] text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-200 text-2xs uppercase tracking-wide text-slate-500">
                    <th className="px-3 py-2">Participant</th>
                    <th className="px-3 py-2">Day 1</th>
                    <th className="px-3 py-2">Coach</th>
                    <th className="px-3 py-2">Dream board</th>
                    <th className="px-3 py-2" />
                  </tr>
                </thead>
                <tbody>
                  {interns.map((intern) => {
                    const summary = getCoachSummaryForMentor(intern.id);
                    const day1 = getDay1MissionProgress(intern.id);
                    const dreamCards =
                      generateVenturePortfolio(intern.id, { participantName: intern.name }).dreamBoard.assets
                        .length;
                    return (
                      <tr key={intern.id} className="border-b border-slate-100">
                        <td className="px-3 py-3 font-medium text-slate-900">{intern.name}</td>
                        <td className="px-3 py-3">{day1.percent}%</td>
                        <td className="px-3 py-3">{summary?.progress?.percent ?? 0}%</td>
                        <td className="px-3 py-3">
                          {dreamCards ? `${dreamCards} card${dreamCards === 1 ? '' : 's'}` : '—'}
                        </td>
                        <td className="px-3 py-3 text-right">
                          <Link
                            to={mentorParticipantReviewHref(intern.id)}
                            className="inline-flex items-center gap-1 text-xs font-semibold text-spike hover:underline"
                          >
                            Review &amp; assess <ChevronRight size={14} />
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : null}
        </div>
      ) : (
        <p className="mb-6 rounded-xl border border-dashed border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
          No participants loaded for this account. Use{' '}
          <Link to={ROUTES.mentorVentureCoach} className="font-semibold text-spike hover:underline">
            Participants
          </Link>{' '}
          to review and rate individual coaching cards.
        </p>
      )}

      {participantId && !participantReady ? (
        <p className="mb-4 text-sm text-slate-500">Loading {selectedIntern?.name ?? 'participant'} portfolio…</p>
      ) : null}

      {participantId && participantReady && portfolio ? (
        <StaffParticipantDreamBoardSection
          participantId={participantId}
          participantName={selectedIntern?.name ?? 'Participant'}
          className="mb-6"
        />
      ) : null}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {sections.map((section) => {
          const closingReflections =
            participantId && participantReady
              ? listParticipantClosingReflections(participantId, section.id)
              : [];
          const completion = portfolio ? sectionCompletionPct(section.id, portfolio) : 0;
          const previews = portfolio ? sectionPreviewLines(section.id, portfolio) : [];

          return (
            <div
              key={section.id}
              className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm sm:p-5"
            >
              <div className="mb-3 flex items-start gap-2">
                <Briefcase size={18} className="mt-0.5 shrink-0 text-[#8B0000]" />
                <div className="min-w-0 flex-1">
                  <h3 className="font-bold text-gray-900">{section.title}</h3>
                  <p className="mt-1 text-xs text-gray-500">{section.description}</p>
                </div>
                {participantId && participantReady ? (
                  <span className="shrink-0 rounded-full bg-spike-muted px-2.5 py-1 text-xs font-bold text-spike">
                    {completion}%
                  </span>
                ) : null}
              </div>

              {participantId && participantReady ? (
                <p className="mb-2 text-xs font-bold text-gray-500">
                  {closingReflections.length
                    ? `${closingReflections.length} day closing reflection${closingReflections.length === 1 ? '' : 's'}`
                    : 'No day closing reflections in this section yet'}
                </p>
              ) : (
                <p className="mb-2 text-xs font-bold text-gray-500">Select a participant above</p>
              )}

              {previews.length > 0 ? (
                <ul className="mb-3 space-y-2 text-sm text-slate-700">
                  {previews.map((line) => (
                    <li key={line} className="rounded-lg bg-slate-50 px-3 py-2 line-clamp-3">
                      {line}
                    </li>
                  ))}
                </ul>
              ) : null}

              {closingReflections.length > 0 ? (
                <div className="space-y-2">
                  {closingReflections.map((reflection) => (
                    <article
                      key={reflection.id}
                      className="rounded-lg border border-amber-200/80 bg-amber-50/50 px-3 py-3"
                    >
                      <p className="text-sm font-semibold text-slate-900">{reflection.title}</p>
                      {reflection.summary ? (
                        <p className="mt-1 line-clamp-4 text-sm text-slate-700">{reflection.summary}</p>
                      ) : (
                        <p className="mt-1 text-sm text-slate-500">Submitted</p>
                      )}
                    </article>
                  ))}
                </div>
              ) : previews.length === 0 ? (
                <p className="rounded-lg border border-dashed border-gray-200 bg-gray-50 p-3 text-sm text-gray-500">
                  {participantId
                    ? participantReady
                      ? 'Blueprint work may appear above after sync. Closing reflections are submitted at the end of each Playbook day.'
                      : 'Loading participant data…'
                    : 'Pick a participant to see identity work and day closing reflections.'}
                </p>
              ) : null}
            </div>
          );
        })}
      </div>

      {participantId && participantReady && portfolio ? (
        <div className="mt-6 flex flex-wrap gap-3">
          <Link
            to={mentorParticipantReviewHref(participantId)}
            className="spike-btn-primary text-sm"
          >
            Open coaching card — rate &amp; assess
          </Link>
          <span className="self-center text-sm text-slate-500">
            Portfolio {portfolio.cover.portfolioCompletion}% · Blueprint {portfolio.cover.blueprintCompletion}%
          </span>
        </div>
      ) : null}

      <p className="mt-6 text-center text-sm text-gray-500">
        Cohort avg traction: {hours}h ·{' '}
        <Link to={BLUEPRINT_LINKS.businessPlan} className="font-bold text-[#8B0000]">
          Business Plan module
        </Link>
      </p>
    </PageContainer>
  );
}
