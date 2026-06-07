import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  BarChart3,
  ClipboardList,
  FileText,
  FlaskConical,
  LayoutGrid,
  Map,
  RefreshCw,
  Sparkles,
  UserCircle,
  Users,
} from 'lucide-react';
import { PageContainer, PageTitle } from '../components/layout/PageContainer.jsx';
import { TabBar } from '../components/ui/TabBar.jsx';
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

const TABS = [
  { id: 'overview', label: 'Overview', icon: LayoutGrid },
  { id: 'insights', label: 'Insights', icon: Sparkles },
  { id: 'activity', label: 'Activity', icon: ClipboardList },
];

function MetricPill({ label, value }) {
  return (
    <div className="rounded-xl border border-slate-200/80 bg-white px-3 py-2.5 shadow-card">
      <p className="spike-label">{label}</p>
      <p className="text-lg font-semibold text-spike">{value}</p>
    </div>
  );
}

function SectionCard({ title, icon: Icon, children, action }) {
  return (
    <section className="spike-card">
      <div className="mb-3 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          {Icon ? <Icon size={18} className="text-spike" aria-hidden /> : null}
          <h3 className="text-sm font-semibold text-slate-900">{title}</h3>
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}

/**
 * @param {{ user?: { id: string, internProgress?: { squad?: string | null } | null } }} props
 */
export function ResearchPage({ user }) {
  const participantId = user?.id;
  const squadName = user?.internProgress?.squad ?? undefined;
  const [tab, setTab] = useState('overview');

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
      setMessage('Deliverables synced to Market Intelligence in your Blueprint.');
      await loadDashboard();
    } finally {
      setSyncing(false);
    }
  }

  const overviewTab = (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <MetricPill label="Your surveys" value={String(personalSurveys)} />
        <MetricPill label="Squad responses" value={String(analytics?.responseCount ?? 0)} />
        <MetricPill label="Deliverables" value={String(deliverableCount)} />
        <MetricPill label="Segment" value={squadContext?.marketSegmentLabel?.split(' ')[0] ?? '—'} />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <SectionCard title="Your squad" icon={Users}>
          {loading ? (
            <p className="text-sm text-slate-500">Loading squad…</p>
          ) : squadContext ? (
            <div className="space-y-2 text-sm text-slate-700">
              <p className="font-semibold text-slate-900">{squadContext.squad.name}</p>
              <p>Market: {squadContext.marketSegmentLabel}</p>
              <p className="text-xs text-slate-500">Cohort {squadContext.squad.cohortId}</p>
              {!squadName ? (
                <p className="text-xs text-amber-700">Using default squad assignment.</p>
              ) : null}
            </div>
          ) : (
            <p className="text-sm text-slate-500">No squad assigned yet.</p>
          )}
        </SectionCard>

        <SectionCard title="Market segments" icon={Map}>
          <div className="flex flex-wrap gap-2">
            {MARKET_SEGMENTS.map((seg) => (
              <span
                key={seg.id}
                className={`rounded-full px-3 py-1 text-xs font-semibold ${
                  squadContext?.squad?.marketSegment === seg.id
                    ? 'bg-spike text-white'
                    : 'bg-spike-muted text-spike'
                }`}
              >
                {seg.label}
              </span>
            ))}
          </div>
        </SectionCard>
      </div>

      {participantId ? (
        <SectionCard
          title="Sync to Blueprint"
          icon={FileText}
          action={
            <button
              type="button"
              onClick={() => void loadDashboard()}
              className="spike-btn-secondary !min-h-[36px] !px-3 !py-1.5 !text-xs"
            >
              <RefreshCw size={14} /> Refresh
            </button>
          }
        >
          <p className="text-sm text-slate-600">
            Push squad analytics into Market Intelligence after you submit surveys in Playbook.
          </p>
          <div className="mt-4 flex flex-col gap-2 sm:flex-row">
            <button
              type="button"
              disabled={syncing || !analytics}
              onClick={() => void handleSyncDeliverables()}
              className="spike-btn-primary disabled:opacity-50"
            >
              {syncing ? 'Syncing…' : 'Sync deliverables'}
              <ArrowRight size={16} />
            </button>
            <Link to={BLUEPRINT_LINKS.marketIntelligence} className="spike-btn-secondary">
              Open Market Intelligence
            </Link>
          </div>
          {message ? <p className="mt-3 text-sm font-medium text-emerald-700">{message}</p> : null}
        </SectionCard>
      ) : null}
    </div>
  );

  const insightsTab = (
    <div className="space-y-4">
      <SectionCard title="Response trends" icon={BarChart3}>
        {trends.length === 0 ? (
          <p className="text-sm text-slate-500">
            Submit the Orientation Pulse survey in Playbook to populate squad trends.
          </p>
        ) : (
          <ul className="space-y-2 text-sm">
            {trends.map((t) => (
              <li key={t.questionId} className="rounded-xl border border-slate-100 bg-slate-50 px-3 py-2.5">
                <p className="font-medium text-slate-800">{t.prompt}</p>
                <p className="mt-1 font-semibold text-spike">
                  {t.value}{' '}
                  <span className="text-xs font-normal text-slate-500">{t.detail}</span>
                </p>
              </li>
            ))}
          </ul>
        )}
      </SectionCard>

      <div className="grid gap-4 lg:grid-cols-2">
        <SectionCard title="Customer personas" icon={UserCircle}>
          {personas.length === 0 ? (
            <p className="text-sm text-slate-500">Personas appear after squad survey data exists.</p>
          ) : (
            <ul className="space-y-2 text-sm">
              {personas.map((p) => (
                <li key={p.name} className="rounded-xl border border-slate-100 px-3 py-2.5">
                  <p className="font-semibold text-slate-900">{p.name}</p>
                  <p className="text-slate-600">{p.painPoints}</p>
                </li>
              ))}
            </ul>
          )}
        </SectionCard>

        <SectionCard title="Opportunity map" icon={Map}>
          {opportunities.length === 0 ? (
            <p className="text-sm text-slate-500">Rankings build as responses accumulate.</p>
          ) : (
            <ul className="space-y-2 text-sm">
              {opportunities.map((o) => (
                <li
                  key={`${o.area}-${o.signal}`}
                  className="rounded-xl border border-spike/10 bg-spike-muted/40 px-3 py-2.5"
                >
                  <p className="font-semibold text-slate-900">{o.area}</p>
                  <p className="text-slate-600">{o.signal}</p>
                </li>
              ))}
            </ul>
          )}
        </SectionCard>
      </div>
    </div>
  );

  const activityTab = (
    <div className="space-y-4">
      <SectionCard title="Research projects" icon={FlaskConical}>
        {squadContext?.projects?.length ? (
          <ul className="space-y-2 text-sm">
            {squadContext.projects.map((p) => (
              <li key={p.id} className="rounded-xl border border-slate-100 px-3 py-2.5">
                <p className="font-semibold text-slate-900">{p.title}</p>
                <p className="mt-1 text-slate-600">{p.hypothesis}</p>
                <span className="mt-2 inline-block rounded-full bg-slate-100 px-2 py-0.5 text-2xs font-semibold uppercase text-slate-600">
                  {p.status}
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-slate-500">No active projects.</p>
        )}
      </SectionCard>

      <SectionCard title="Deliverable types" icon={FileText}>
        <ul className="space-y-1.5 text-sm text-slate-700">
          {RESEARCH_DELIVERABLES.map((d) => (
            <li key={d} className="flex items-center gap-2">
              <BarChart3 size={14} className="shrink-0 text-spike" />
              {d} → Market Intelligence
            </li>
          ))}
        </ul>
      </SectionCard>

      <SectionCard title="Active survey" icon={ClipboardList}>
        {daySurvey ? (
          <div className="space-y-3 text-sm">
            <div>
              <p className="font-semibold text-slate-900">{daySurvey.survey.title}</p>
              <p className="mt-1 text-slate-600">{daySurvey.survey.description}</p>
            </div>
            <Link to={ROUTES.playbook} className="spike-btn-secondary">
              Open in Playbook <ArrowRight size={16} />
            </Link>
          </div>
        ) : (
          <p className="text-sm text-slate-500">Day 1 survey content not loaded.</p>
        )}
      </SectionCard>
    </div>
  );

  return (
    <PageContainer>
      <PageTitle subtitle="Squad analytics and market research — synced to your Blueprint.">
        Research
      </PageTitle>

      {!participantId ? (
        <div className="mt-5 spike-card text-sm text-slate-600">
          Sign in as an intern to view squad analytics and sync deliverables.
        </div>
      ) : (
        <>
          <TabBar tabs={TABS} active={tab} onChange={setTab} className="mt-5" />
          <div className="mt-5">
            {tab === 'overview' ? overviewTab : null}
            {tab === 'insights' ? insightsTab : null}
            {tab === 'activity' ? activityTab : null}
          </div>
        </>
      )}
    </PageContainer>
  );
}
