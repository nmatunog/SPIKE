import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  BarChart3,
  ClipboardList,
  FileText,
  FlaskConical,
  Map,
  RefreshCw,
  Users,
  UserCircle,
} from 'lucide-react';
import { PageContainer, PageTitle } from '../components/layout/PageContainer.jsx';
import { getSegment1Week1Day1Bundle } from '../lib/contentLoader.js';
import { MARKET_SEGMENTS, RESEARCH_DELIVERABLES } from '../lib/researchSeeds.js';
import { getSquadContextForUser } from '../lib/researchSquadService.js';
import {
  getSquadAnalytics,
  extractTrends,
  buildPersonasFromAnalytics,
  buildOpportunityMap,
} from '../lib/researchAnalyticsService.js';
import { generateResearchDeliverables } from '../lib/researchDeliverableService.js';
import { countSubmittedSurveys } from '../lib/surveyService.js';
import { listPortfolioArtifacts } from '../lib/blueprintArtifacts.js';
import { ROUTES, BLUEPRINT_LINKS } from '../routes/paths.js';

function SectionCard({ title, icon: Icon, children, action }) {
  return (
    <section className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm sm:p-5">
      <div className="mb-3 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          {Icon ? <Icon size={18} className="text-[#8B0000]" /> : null}
          <h3 className="font-bold text-gray-900">{title}</h3>
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}

function MetricPill({ label, value }) {
  return (
    <div className="rounded-lg border border-gray-100 bg-gray-50 px-3 py-2">
      <p className="text-[10px] font-bold uppercase tracking-wide text-gray-500">{label}</p>
      <p className="text-lg font-black text-[#8B0000]">{value}</p>
    </div>
  );
}

/**
 * @param {{ user?: { id: string, internProgress?: { squad?: string | null } | null } }} props
 */
export function ResearchPage({ user }) {
  const participantId = user?.id;
  const squadName = user?.internProgress?.squad ?? undefined;

  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [squadContext, setSquadContext] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [message, setMessage] = useState('');

  let daySurvey = null;
  try {
    const bundle = getSegment1Week1Day1Bundle();
    daySurvey = bundle.survey;
  } catch {
    daySurvey = null;
  }

  const surveyId = daySurvey?.survey?.id ?? 'survey-day-1-orientation';
  const surveyTitle = daySurvey?.survey?.title ?? 'Orientation Pulse Survey';

  const loadDashboard = useCallback(async () => {
    if (!participantId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    const ctx = await getSquadContextForUser(participantId, squadName);
    setSquadContext(ctx);

    if (ctx?.squad?.id) {
      const stats = await getSquadAnalytics(ctx.squad.id, surveyId);
      setAnalytics(stats);
    } else {
      setAnalytics(null);
    }
    setLoading(false);
  }, [participantId, squadName, surveyId]);

  useEffect(() => {
    void loadDashboard();
  }, [loadDashboard]);

  const trends = analytics ? extractTrends(analytics) : [];
  const personas = analytics
    ? buildPersonasFromAnalytics(analytics, squadContext?.marketSegmentLabel ?? 'Cohort')
    : [];
  const opportunities = analytics ? buildOpportunityMap(analytics) : [];
  const personalSurveys = participantId ? countSubmittedSurveys(participantId) : 0;
  const deliverableCount = participantId
    ? listPortfolioArtifacts(participantId, 'portfolio-market-intelligence').length
    : 0;

  async function handleSyncDeliverables() {
    if (!participantId || !squadContext?.squad?.id) return;
    setSyncing(true);
    setMessage('');
    try {
      await generateResearchDeliverables(
        participantId,
        squadContext.squad.id,
        surveyId,
        surveyTitle,
        squadContext.marketSegmentLabel,
      );
      setMessage('Deliverables synced to Portfolio and Market Intelligence in My Venture Blueprint.');
      await loadDashboard();
    } finally {
      setSyncing(false);
    }
  }

  return (
    <PageContainer className="max-w-6xl">
      <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
        <div>
          <PageTitle>Research Squad Intelligence</PageTitle>
          <p className="mt-1 text-sm text-gray-600 sm:text-base">
            Cohort survey analytics, personas, and opportunity maps — auto-routed to Market
            Intelligence in your Venture Blueprint.
          </p>
        </div>
        {participantId ? (
          <button
            type="button"
            onClick={() => void loadDashboard()}
            className="inline-flex min-h-[44px] items-center gap-2 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-bold text-gray-700 hover:bg-gray-50"
          >
            <RefreshCw size={16} />
            Refresh
          </button>
        ) : null}
      </div>

      {!participantId ? (
        <SectionCard title="Sign in required" icon={Users}>
          <p className="text-sm text-gray-600">
            Sign in as an intern to view squad analytics and sync deliverables.
          </p>
        </SectionCard>
      ) : null}

      <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <MetricPill label="Your surveys" value={String(personalSurveys)} />
        <MetricPill label="Squad responses" value={String(analytics?.responseCount ?? 0)} />
        <MetricPill label="Deliverables" value={String(deliverableCount)} />
        <MetricPill
          label="Segment"
          value={squadContext?.marketSegmentLabel?.split(' ')[0] ?? '—'}
        />
      </div>

      <div className="mb-4 grid gap-4 lg:grid-cols-2">
        <SectionCard title="Research squad" icon={Users}>
          {loading ? (
            <p className="text-sm text-gray-500">Loading squad…</p>
          ) : squadContext ? (
            <div className="space-y-2 text-sm">
              <p className="font-bold text-gray-900">{squadContext.squad.name}</p>
              <p className="text-gray-600">
                Market: {squadContext.marketSegmentLabel}
              </p>
              <p className="text-xs text-gray-500">Cohort {squadContext.squad.cohortId}</p>
              {squadName ? (
                <p className="text-xs text-gray-500">Assigned squad: {squadName}</p>
              ) : (
                <p className="text-xs text-amber-700">
                  No squad on profile — using default squad assignment.
                </p>
              )}
            </div>
          ) : (
            <p className="text-sm text-gray-500">No squad assigned yet.</p>
          )}
        </SectionCard>

        <SectionCard title="Market segments" icon={Map}>
          <div className="flex flex-wrap gap-2">
            {MARKET_SEGMENTS.map((seg) => (
              <span
                key={seg.id}
                className={`rounded-full px-3 py-1 text-xs font-bold ${
                  squadContext?.squad?.marketSegment === seg.id
                    ? 'bg-[#8B0000] text-white'
                    : 'bg-red-50 text-[#8B0000]'
                }`}
              >
                {seg.label}
              </span>
            ))}
          </div>
        </SectionCard>
      </div>

      <div className="mb-4 grid gap-4 lg:grid-cols-2">
        <SectionCard title="Research projects" icon={FlaskConical}>
          {squadContext?.projects?.length ? (
            <ul className="space-y-3 text-sm">
              {squadContext.projects.map((p) => (
                <li key={p.id} className="rounded-lg border border-gray-100 p-3">
                  <p className="font-bold text-gray-900">{p.title}</p>
                  <p className="mt-1 text-gray-600">{p.hypothesis}</p>
                  <span className="mt-2 inline-block rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-bold uppercase text-gray-600">
                    {p.status}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-gray-500">No active projects.</p>
          )}
        </SectionCard>

        <SectionCard title="Deliverables" icon={FileText}>
          <ul className="space-y-2 text-sm text-gray-700">
            {RESEARCH_DELIVERABLES.map((d) => (
              <li key={d} className="flex items-center gap-2">
                <BarChart3 size={14} className="shrink-0 text-[#8B0000]" />
                {d} → <span className="font-semibold">Market Intelligence</span>
              </li>
            ))}
          </ul>
          {participantId ? (
            <button
              type="button"
              disabled={syncing || !analytics}
              onClick={() => void handleSyncDeliverables()}
              className="mt-4 inline-flex min-h-[44px] items-center gap-2 rounded-lg bg-[#8B0000] px-4 py-2 text-sm font-bold text-white hover:bg-[#6B0000] disabled:opacity-50"
            >
              {syncing ? 'Syncing…' : 'Sync deliverables to Blueprint'}
              <ArrowRight size={16} />
            </button>
          ) : null}
          {message ? <p className="mt-2 text-sm font-medium text-green-700">{message}</p> : null}
          <Link
            to={BLUEPRINT_LINKS.marketIntelligence}
            className="mt-3 inline-flex text-sm font-bold text-[#8B0000] hover:underline"
          >
            Open Market Intelligence module →
          </Link>
        </SectionCard>
      </div>

      <div className="mb-4 grid gap-4 lg:grid-cols-2">
        <SectionCard title="Response trends" icon={BarChart3}>
          {trends.length === 0 ? (
            <p className="text-sm text-gray-500">
              Submit the Orientation Pulse survey in Playbook to populate squad trends.
            </p>
          ) : (
            <ul className="space-y-3 text-sm">
              {trends.map((t) => (
                <li key={t.questionId} className="rounded-lg border border-gray-100 bg-gray-50 p-3">
                  <p className="font-medium text-gray-800">{t.prompt}</p>
                  <p className="mt-1 font-bold text-[#8B0000]">
                    {t.value} <span className="text-xs font-normal text-gray-500">{t.detail}</span>
                  </p>
                </li>
              ))}
            </ul>
          )}
        </SectionCard>

        <SectionCard title="Customer personas" icon={UserCircle}>
          {personas.length === 0 ? (
            <p className="text-sm text-gray-500">Personas generate after squad survey data exists.</p>
          ) : (
            <ul className="space-y-3 text-sm">
              {personas.map((p) => (
                <li key={p.name} className="rounded-lg border border-gray-100 p-3">
                  <p className="font-bold text-gray-900">{p.name}</p>
                  <p className="mt-1 text-gray-600">Segment: {p.segment}</p>
                  <p className="text-gray-600">Career lean: {p.careerLean}</p>
                  <p className="text-gray-600">Focus: {p.topFocus}</p>
                  <p className="mt-2 text-gray-700">{p.painPoints}</p>
                </li>
              ))}
            </ul>
          )}
        </SectionCard>
      </div>

      <SectionCard title="Opportunity map" icon={Map}>
        {opportunities.length === 0 ? (
          <p className="text-sm text-gray-500">
            Rankings and focus-area responses build the opportunity map.
          </p>
        ) : (
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {opportunities.map((o) => (
              <div
                key={`${o.area}-${o.signal}`}
                className="rounded-lg border border-red-100 bg-red-50/50 p-3 text-sm"
              >
                <p className="font-bold text-gray-900">{o.area}</p>
                <p className="text-gray-600">{o.signal}</p>
                <p className="mt-1 text-xs font-bold text-[#8B0000]">Strength {o.strength}</p>
              </div>
            ))}
          </div>
        )}
      </SectionCard>

      <div className="mt-4">
        <SectionCard title="Active survey" icon={ClipboardList}>
          {daySurvey ? (
            <div className="space-y-3 text-sm">
              <div>
                <p className="font-bold text-gray-900">{daySurvey.survey.title}</p>
                <p className="mt-1 text-gray-600">{daySurvey.survey.description}</p>
                <p className="mt-2 text-xs font-bold uppercase text-green-700">
                  Status: {daySurvey.survey.status} · Responses feed squad analytics
                </p>
              </div>
              <Link
                to={ROUTES.playbook}
                className="inline-flex min-h-[44px] items-center gap-2 rounded-lg border border-sky-300 bg-sky-50 px-4 py-2 font-bold text-sky-800 hover:bg-sky-100"
              >
                Open in Playbook <ArrowRight size={16} />
              </Link>
            </div>
          ) : (
            <p className="text-sm text-gray-500">Day 1 survey content not loaded.</p>
          )}
        </SectionCard>
      </div>
    </PageContainer>
  );
}
