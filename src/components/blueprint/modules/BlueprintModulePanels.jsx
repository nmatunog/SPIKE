import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  Briefcase,
  Download,
  LineChart,
  Rocket,
  Target,
  Users,
} from 'lucide-react';
import { MetricCard } from '../../dashboard/MetricCard.jsx';
import { BLUEPRINT_LINKS, ROUTES } from '../../../routes/paths.js';
import { listPortfolioArtifacts } from '../../../lib/blueprintArtifacts.js';
import { ArtifactDraftCard } from '../ArtifactDraftCard.jsx';
import {
  getBusinessPlanChapters,
  getCareerTracks,
  getPortfolioSections,
  getTrackRequirementsForTrack,
  getVentureBoardCriteriaForBoard,
  getVentureBoardsForSegment,
  getWeekIntegrationByWeekId,
} from '../../../lib/playbookSeeds.js';
import { getVisionPurposeProgress } from '../../../lib/playbookProgress.js';
import { BlueprintTimelineFeed } from '../BlueprintTimelineFeed.jsx';
import { getClientGrowthSummary } from '../../../lib/clientGrowthService.js';
import { listFnas } from '../../../lib/fnaService.js';
import { getMarketIntelligenceSummary } from '../../../lib/marketIntelligenceService.js';
import { getSectionField, setSectionField } from '../../../lib/blueprintSectionStore.js';
import { RECRUITMENT_FIELDS, LEADERSHIP_FIELDS, CAREER_FIELDS } from '../../../lib/blueprintSectionConstants.js';
import { listLeadershipJournal } from '../../../lib/leadershipJournalService.js';
import { getNextBlueprintAction } from '../../../lib/blueprintRecommendations.js';
import { computeSectionCompletionPct } from '../../../lib/blueprintCompletion.js';
import { FnaEngineModule } from '../../fna/FnaEngineModule.jsx';
import { AutoSaveField } from '../AutoSaveField.jsx';
import { Day1MissionControl } from '../../day1/Day1MissionControl.jsx';
import { isDay1MissionActive } from '../../../lib/day1BuilderService.js';
import { hasSubmittedCohortIdentity, getSquadPreferences } from '../../../lib/cohortFormationService.js';
import { getDay1MissionProgress } from '../../../lib/day1BuilderStorage.js';

function SectionCard({ title, children, className = '' }) {
  return (
    <div className={`spike-card ${className}`}>
      <h3 className="mb-3 text-sm font-semibold text-slate-900">{title}</h3>
      {children}
    </div>
  );
}

function PlaceholderNotice({ children, className = '' }) {
  return (
    <p
      className={`rounded-lg border border-dashed border-gray-200 bg-gray-50 p-3 text-sm text-gray-500 ${className}`}
    >
      {children}
    </p>
  );
}

/**
 * @param {{ state: object, onLogTraction?: () => void }} props
 */
export function BlueprintOverviewPanel({ state, participantId, onLogTraction }) {
  const integration = getWeekIntegrationByWeekId(`week-segment-1-${Math.min(state.week, 5)}`);
  const nextAction = participantId ? getNextBlueprintAction(state, participantId) : null;
  const sectionPct = state.blueprint_sections ?? {};

  return (
    <div className="space-y-4">
      {participantId && isDay1MissionActive(state.week, state.segment) ? (
        <Day1MissionControl participantId={participantId} />
      ) : null}

      {nextAction ? (
        <section className="rounded-2xl border border-spike/15 bg-gradient-to-br from-white to-spike-muted/50 p-5 shadow-card sm:p-6">
          <p className="spike-label text-spike">Recommended next step</p>
          <h3 className="mt-1 text-lg font-semibold text-slate-900">{nextAction.title}</h3>
          <p className="mt-2 text-sm leading-relaxed text-slate-600">{nextAction.detail}</p>
          <div className="mt-4 flex flex-col gap-2 sm:flex-row">
            <Link to={nextAction.href} className="spike-btn-primary">
              Continue <ArrowRight size={16} />
            </Link>
            <Link to={ROUTES.playbook} className="spike-btn-secondary">
              <Rocket size={16} /> Open Playbook
            </Link>
          </div>
        </section>
      ) : (
        <section className="spike-card">
          <p className="text-sm text-slate-600">
            Your business plan, portfolio, and progress — filled in as you complete Playbook,
            surveys, and coaching.
          </p>
          <Link to={ROUTES.playbook} className="spike-btn-primary mt-4">
            <Rocket size={16} /> Start in Playbook
          </Link>
        </section>
      )}

      {!state.career_track_selected && state.week < 2 ? (
        <SectionCard title="Week 1 — explore before you choose">
          <p className="text-sm leading-relaxed text-slate-700">
            Focus on vision, market research, and client growth. After Week 1 you&apos;ll choose{' '}
            <strong>Agency Builder</strong> or <strong>Specialist Consultant</strong>.
          </p>
        </SectionCard>
      ) : null}

      <SectionCard title="Section progress">
        <div className="space-y-2">
          {Object.entries(sectionPct).map(([slug, pct]) => (
            <div key={slug} className="flex items-center gap-3">
              <span className="w-28 shrink-0 truncate text-xs font-medium capitalize text-slate-700">
                {slug.replace(/-/g, ' ')}
              </span>
              <div className="h-2 min-w-0 flex-1 overflow-hidden rounded-full bg-slate-100">
                <div
                  className="h-full rounded-full bg-spike transition-all"
                  style={{ width: `${pct}%` }}
                />
              </div>
              <span className="w-10 shrink-0 text-right text-xs font-semibold text-slate-600">
                {pct}%
              </span>
            </div>
          ))}
        </div>
      </SectionCard>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <SectionCard title="This week">
          {integration ? (
            <dl className="space-y-2 text-sm text-slate-700">
              <div>
                <dt className="spike-label">Business plan</dt>
                <dd className="mt-0.5">{integration.businessPlanChapter}</dd>
              </div>
              <div>
                <dt className="spike-label">Portfolio</dt>
                <dd className="mt-0.5">{integration.portfolioSection}</dd>
              </div>
            </dl>
          ) : (
            <PlaceholderNotice>Week integration loads for Segment 1 weeks 1–5.</PlaceholderNotice>
          )}
        </SectionCard>

        <SectionCard title="Shortcuts">
          <div className="flex flex-col gap-2">
            {onLogTraction ? (
              <button type="button" onClick={onLogTraction} className="spike-btn-secondary">
                <LineChart size={16} /> Log traction hours
              </button>
            ) : null}
            <Link to={BLUEPRINT_LINKS.businessPlan} className="spike-btn-secondary">
              <Briefcase size={16} /> Financial Entrepreneurship Canvas
            </Link>
            <Link to={ROUTES.research} className="spike-btn-secondary">
              <Users size={16} /> Research squad
            </Link>
            <Link to={BLUEPRINT_LINKS.milestones} className="spike-btn-secondary">
              <Target size={16} /> Milestones
            </Link>
          </div>
        </SectionCard>
      </div>
    </div>
  );
}

/**
 * @param {{ participantId?: string }} props
 */
export function VisionPurposePanel({ participantId }) {
  const sections = getPortfolioSections().filter((s) => s.id === 'portfolio-identity-purpose');
  const section = sections[0];
  const progress = getVisionPurposeProgress(participantId);
  const day1 = participantId ? getDay1MissionProgress(participantId) : null;
  const hasCohort = participantId ? hasSubmittedCohortIdentity(participantId) : false;
  const hasSquadPrefs = participantId
    ? Boolean(getSquadPreferences(participantId)?.rankings?.length)
    : false;

  const components = [
    { key: 'vision_statement', label: 'My Ambition', pct: progress.vision_statement },
    { key: 'mission_statement', label: 'My Purpose', pct: progress.mission_statement },
    { key: 'my_values', label: 'My Values', pct: progress.my_values },
    { key: 'personal_tagline', label: 'My Tagline', pct: progress.personal_tagline ?? 0 },
    { key: 'future_self_narrative', label: 'Future Self Narrative', pct: progress.future_self_narrative },
    { key: 'future_self_summary', label: 'Future Self Summary', pct: progress.future_self_summary ?? 0 },
    { key: 'dream_board', label: 'Dream Board', pct: progress.dream_board },
    { key: 'cohort_identity', label: 'Cohort Identity', pct: hasCohort ? 100 : 0 },
    { key: 'squad_preferences', label: 'Squad Membership', pct: hasSquadPrefs ? 100 : 0 },
    { key: 'career_interest_explored', label: 'Career Interest', pct: day1?.builders.find((b) => b.id === 'future-venture')?.completed ? 100 : 0 },
    { key: 'squad_charter', label: 'Squad Charter', pct: day1?.builders.find((b) => b.id === 'squad-charter')?.completed ? 100 : 0 },
  ];

  return (
    <div className="space-y-4">
      <p className="text-sm text-gray-600">
        {section?.description ?? 'Design your ambition, purpose, and venture identity.'} Day 1 Venture
        Blueprint Builders™ auto-fill this module — no duplicate entry.
      </p>
      {day1 && day1.percent < 100 ? (
        <Link to={BLUEPRINT_LINKS.day1Builders} className="spike-btn-primary inline-flex">
          Continue Day 1 Builders ({day1.percent}%)
        </Link>
      ) : null}
      <Link to={BLUEPRINT_LINKS.ventureCoach} className="spike-btn-secondary inline-flex">
        Open AI Venture Coach™
      </Link>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {components.map((item) => {
          let fieldValue = '';
          if (participantId) {
            if (item.key === 'career_interest_explored') {
              fieldValue = getSectionField(participantId, 'career-accelerator', item.key);
            } else {
              fieldValue = getSectionField(participantId, 'vision-purpose', item.key);
            }
          }
          return (
            <SectionCard key={item.key} title={item.label}>
              <div className="mb-2 h-2 w-full rounded-full bg-gray-200">
                <div
                  className="h-2 rounded-full bg-[#8B0000] transition-all"
                  style={{ width: `${item.pct}%` }}
                />
              </div>
              <p className="text-xs font-bold text-gray-500">{item.pct}% complete</p>
              {fieldValue ? (
                <p className="mt-2 line-clamp-4 whitespace-pre-wrap text-xs text-slate-700">{fieldValue}</p>
              ) : (
                <PlaceholderNotice>
                  Complete the matching Day 1 Builder to populate this section.
                </PlaceholderNotice>
              )}
            </SectionCard>
          );
        })}
      </div>

      {participantId ? (
        <SectionCard title="Activity timeline">
          <BlueprintTimelineFeed participantId={participantId} limit={5} />
        </SectionCard>
      ) : null}

      {participantId ? (
        <SectionCard title="Portfolio drafts — Identity & Purpose">
          {listPortfolioArtifacts(participantId, 'portfolio-identity-purpose').length > 0 ? (
            <div className="space-y-3">
              {listPortfolioArtifacts(participantId, 'portfolio-identity-purpose').map((a) => (
                <ArtifactDraftCard
                  key={a.id}
                  title={a.title}
                  content={a.content}
                  status={a.status}
                  sourceType={a.sourceType}
                  updatedAt={a.updatedAt}
                />
              ))}
            </div>
          ) : (
            <PlaceholderNotice>
              Submit Playbook Day 1 worksheet to create your first portfolio draft.
            </PlaceholderNotice>
          )}
        </SectionCard>
      ) : null}
    </div>
  );
}

export function FinancialCanvasPanel() {
  const chapters = getBusinessPlanChapters();
  const engines = [
    'Client Growth Engine',
    'Talent Growth Engine',
    'Leadership Growth Engine',
    'Foundation (Resources, Partners, Cost)',
  ];

  return (
    <div className="space-y-4">
      <p className="text-sm text-gray-600">
        Business Model Canvas adapted for financial entrepreneurship. Chapters align to Segment 1
        weeks.
      </p>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <SectionCard title="Three growth engines + foundation">
          <ul className="space-y-2 text-sm text-gray-700">
            {engines.map((name) => (
              <li key={name} className="flex items-center gap-2">
                <Target size={14} className="shrink-0 text-[#8B0000]" />
                {name}
              </li>
            ))}
          </ul>
        </SectionCard>
        <SectionCard title="Business plan chapters (seed)">
          <ul className="space-y-2 text-sm">
            {chapters.map((ch) => (
              <li key={ch.id} className="flex justify-between gap-2 border-b border-gray-100 pb-2">
                <span className="font-medium text-gray-900">{ch.title}</span>
                <span className="text-xs text-gray-500">Week {ch.weekOwner}</span>
              </li>
            ))}
          </ul>
        </SectionCard>
      </div>
    </div>
  );
}

const CLIENT_FUNNEL = [
  { key: 'prospects', label: 'Prospects' },
  { key: 'contacts', label: 'Contacts' },
  { key: 'appointments', label: 'Appointments' },
  { key: 'fnas', label: 'FNAs' },
  { key: 'proposals', label: 'Proposals' },
  { key: 'applications', label: 'Applications' },
  { key: 'issuedCases', label: 'Issued Cases' },
];

/**
 * @param {{ state: object, participantId?: string }} props
 */
export function ClientGrowthPanel({ state, participantId }) {
  const [refreshKey, setRefreshKey] = useState(0);
  void refreshKey;

  const fnas = participantId ? listFnas(participantId) : [];
  const funnel = participantId ? getClientGrowthSummary(participantId, fnas) : null;
  const completedFnas = fnas.filter((f) => f.status !== 'draft').length;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <MetricCard
          label="Production score"
          value={`${state.spike_readiness_dimensions.production}%`}
          sub={completedFnas > 0 ? `${completedFnas} FNA(s) on file` : 'complete an FNA to boost'}
        />
        <MetricCard
          label="FNAs completed"
          value={String(funnel?.fnas ?? 0)}
          sub="client growth funnel"
          accent="blue"
        />
        <MetricCard
          label="Issued cases"
          value={String(funnel?.issuedCases ?? 0)}
          sub="implemented FNAs"
          accent="green"
        />
        <MetricCard
          label="Referrals"
          value={String(funnel?.referrals ?? 0)}
          sub="referral engine (Sprint 06)"
          accent="amber"
        />
      </div>
      <SectionCard title="Production funnel">
        <div className="flex flex-col items-stretch gap-1 sm:flex-row sm:flex-wrap sm:items-center">
          {CLIENT_FUNNEL.map((stage, idx) => (
            <div key={stage.key} className="flex items-center gap-1">
              <span className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-bold text-emerald-900">
                {stage.label}
                <span className="ml-1.5 text-emerald-700">{funnel?.[stage.key] ?? 0}</span>
              </span>
              {idx < CLIENT_FUNNEL.length - 1 ? (
                <ArrowRight size={14} className="hidden text-gray-400 sm:block" />
              ) : null}
            </div>
          ))}
        </div>
        {completedFnas === 0 ? (
          <PlaceholderNotice className="mt-4">
            Complete an FNA below to populate funnel stages. Traction hours: {state.hours}.
          </PlaceholderNotice>
        ) : null}
      </SectionCard>

      {participantId ? (
        <FnaEngineModule participantId={participantId} onUpdated={() => setRefreshKey((k) => k + 1)} />
      ) : (
        <PlaceholderNotice>Sign in to create FNAs.</PlaceholderNotice>
      )}
    </div>
  );
}

const RECRUIT_FUNNEL = ['Leads', 'Interviews', 'Candidates', 'Licensed', 'Active Advisors'];

/** @param {{ participantId?: string }} props */
export function MarketIntelligencePanel({ participantId }) {
  const summary = participantId ? getMarketIntelligenceSummary(participantId) : null;
  const pct = participantId ? computeSectionCompletionPct('market-intelligence', participantId) : 0;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <MetricCard label="Surveys" value={String(summary?.surveyCount ?? 0)} accent="blue" />
        <MetricCard label="Completion" value={`${pct}%`} accent="red" />
        <MetricCard label="Artifacts" value={String(summary?.artifacts?.length ?? 0)} />
        <MetricCard label="Source" value="Playbook" sub="auto-sync" accent="green" />
      </div>

      <Link
        to={ROUTES.research}
        className="inline-flex min-h-[44px] items-center gap-2 rounded-lg border border-sky-300 bg-sky-50 px-4 py-2 text-sm font-bold text-sky-800 hover:bg-sky-100"
      >
        Research Squad dashboard <ArrowRight size={16} />
      </Link>

      {participantId ? (
        <SectionCard title="Market Intelligence fields">
          <div className="grid gap-4">
            <AutoSaveField
              label="Market segment insights"
              value={getSectionField(participantId, 'market-intelligence', 'market_segment_insights')}
              onSave={(v) => setSectionField(participantId, 'market-intelligence', 'market_segment_insights', v)}
            />
            <AutoSaveField
              label="Opportunity notes"
              value={getSectionField(participantId, 'market-intelligence', 'opportunity_notes')}
              onSave={(v) => setSectionField(participantId, 'market-intelligence', 'opportunity_notes', v)}
            />
          </div>
        </SectionCard>
      ) : null}

      <SectionCard title="Research findings (from surveys)">
        {summary?.researchFindings ? (
          <pre className="whitespace-pre-wrap text-sm text-gray-700">{summary.researchFindings}</pre>
        ) : (
          <PlaceholderNotice>Complete a Playbook survey to populate Market Intelligence.</PlaceholderNotice>
        )}
      </SectionCard>

      {summary?.artifacts?.length ? (
        <SectionCard title="Portfolio drafts">
          <div className="space-y-3">
            {summary.artifacts.map((a) => (
              <ArtifactDraftCard
                key={a.id}
                title={a.title}
                content={a.content}
                status={a.status}
                sourceType={a.sourceType}
                updatedAt={a.updatedAt}
              />
            ))}
          </div>
        </SectionCard>
      ) : null}
    </div>
  );
}

/** @param {{ participantId?: string }} props */
export function RecruitmentPanel({ participantId }) {
  return (
    <div className="space-y-4">
      <SectionCard title="Recruitment funnel (Agency Builder)">
        <div className="mb-4 flex flex-wrap items-center gap-2">
          {RECRUIT_FUNNEL.map((stage, idx) => (
            <div key={stage} className="flex items-center gap-1">
              <span className="rounded-lg border border-gray-200 px-3 py-2 text-xs font-bold">{stage}</span>
              {idx < RECRUIT_FUNNEL.length - 1 ? <ArrowRight size={14} className="text-gray-400" /> : null}
            </div>
          ))}
        </div>
      </SectionCard>
      {participantId ? (
        <SectionCard title="Talent Growth Engine">
          <div className="grid gap-4">
            {RECRUITMENT_FIELDS.map((field) => (
              <AutoSaveField
                key={field.key}
                label={field.label}
                value={getSectionField(participantId, 'recruitment-growth', field.key)}
                onSave={(v) => setSectionField(participantId, 'recruitment-growth', field.key, v)}
              />
            ))}
          </div>
        </SectionCard>
      ) : (
        <PlaceholderNotice>Sign in to edit recruitment fields.</PlaceholderNotice>
      )}
    </div>
  );
}

/** @param {{ participantId?: string }} props */
export function LeadershipPanel({ participantId }) {
  const journal = participantId ? listLeadershipJournal(participantId) : [];

  return (
    <div className="space-y-4">
      <SectionCard title="Leadership Growth Engine">
        {participantId ? (
          <div className="grid gap-4">
            {LEADERSHIP_FIELDS.map((field) => (
              <AutoSaveField
                key={field.key}
                label={field.label}
                value={getSectionField(participantId, 'leadership-growth', field.key)}
                onSave={(v) => setSectionField(participantId, 'leadership-growth', field.key, v)}
              />
            ))}
          </div>
        ) : (
          <PlaceholderNotice>Sign in to edit leadership fields.</PlaceholderNotice>
        )}
      </SectionCard>

      <SectionCard title="Leadership Journal (coaching notes)">
        {journal.length > 0 ? (
          <ul className="space-y-3 text-sm text-gray-700">
            {journal.map((entry) => (
              <li key={entry.id} className="rounded-lg border border-gray-100 bg-gray-50 p-3">
                <p className="font-bold text-gray-900">{entry.topic}</p>
                <p className="mt-1 whitespace-pre-wrap">{entry.notes}</p>
                {entry.themes ? (
                  <p className="mt-2 text-xs text-gray-500">Themes: {entry.themes}</p>
                ) : null}
              </li>
            ))}
          </ul>
        ) : (
          <PlaceholderNotice>Mentor coaching notes appear here automatically.</PlaceholderNotice>
        )}
      </SectionCard>
    </div>
  );
}

export function CareerAcceleratorPanel({ state }) {
  const track = getCareerTracks().find((t) =>
    state.career_track === 'specialist_consultant'
      ? t.id === 'track-specialist-consultant'
      : t.id === 'track-agency-builder',
  );
  const ladder =
    state.career_track === 'specialist_consultant'
      ? ['Associate Advisor', 'Professional Advisor', 'Senior Consultant', 'Market Specialist', 'Practice Principal']
      : ['Advisor', 'AUM', 'UM', 'SUM', 'Agency Director'];

  return (
    <div className="space-y-4">
      <SectionCard title={`${track?.title ?? 'Career'} framework`}>
        <p className="mb-2 text-sm text-gray-600">{track?.description}</p>
        <div className="flex flex-wrap items-center gap-2">
          {ladder.map((step, idx) => (
            <div key={step} className="flex items-center gap-1">
              <span
                className={`rounded-lg px-3 py-2 text-xs font-bold ${
                  idx === 0 ? 'bg-[#8B0000] text-white' : 'bg-gray-100 text-gray-700'
                }`}
              >
                {step}
              </span>
              {idx < ladder.length - 1 ? <ArrowRight size={14} className="text-gray-400" /> : null}
            </div>
          ))}
        </div>
      </SectionCard>
      <SectionCard title="Promotion readiness">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          <MetricCard label="Production" value={`${state.spike_readiness_dimensions.production}%`} />
          <MetricCard label="Recruitment" value={`${state.spike_readiness_dimensions.recruitment}%`} accent="blue" />
          <MetricCard label="Leadership" value={`${state.spike_readiness_dimensions.leadership}%`} accent="green" />
        </div>
        <p className="mt-3 text-sm font-bold text-gray-800">
          Overall readiness: {state.spike_readiness_score}%
        </p>
        {state.participant_id ? (
          <div className="mt-4 grid gap-3">
            {CAREER_FIELDS.map((field) => (
              <AutoSaveField
                key={field.key}
                label={field.label}
                value={getSectionField(state.participant_id, 'career-accelerator', field.key)}
                onSave={(v) =>
                  setSectionField(state.participant_id, 'career-accelerator', field.key, v)
                }
              />
            ))}
          </div>
        ) : null}
      </SectionCard>
      {track ? (
        <SectionCard title="Track requirements">
          <ul className="space-y-2 text-sm text-gray-700">
            {getTrackRequirementsForTrack(track.id).map((req) => (
              <li key={req.id}>
                <span className="font-bold text-gray-900">{req.title}</span>
                <span className="text-gray-500"> — {req.description}</span>
              </li>
            ))}
          </ul>
        </SectionCard>
      ) : null}
    </div>
  );
}

const SPECIALIST_FIELDS = [
  { key: 'niche_market', label: 'Niche market' },
  { key: 'authority_plan', label: 'Authority plan' },
  { key: 'content_plan', label: 'Content plan' },
  { key: 'partnership_plan', label: 'Partnership plan' },
  { key: 'practice_growth_plan', label: 'Practice growth plan' },
];

/** @param {{ participantId?: string }} props */
export function SpecialistBlueprintPanel({ participantId }) {
  return (
    <div className="space-y-4">
      <SectionCard title="Specialist Consultant — Practice Growth">
        <p className="mb-3 text-sm text-gray-600">
          Authority building and client growth for the Specialist Consultant track.
        </p>
        {participantId ? (
          <div className="grid gap-4">
            {SPECIALIST_FIELDS.map((field) => (
              <AutoSaveField
                key={field.key}
                label={field.label}
                value={getSectionField(participantId, 'career-accelerator', `specialist_${field.key}`)}
                onSave={(v) =>
                  setSectionField(participantId, 'career-accelerator', `specialist_${field.key}`, v)
                }
              />
            ))}
          </div>
        ) : (
          <PlaceholderNotice>Sign in to edit specialist blueprint fields.</PlaceholderNotice>
        )}
      </SectionCard>
    </div>
  );
}

export function VentureBoardPanel({ state }) {
  const boards = getVentureBoardsForSegment(`segment-${state.segment}`);
  const board = boards[0];
  const criteria = board ? getVentureBoardCriteriaForBoard(board.id) : [];

  return (
    <div className="space-y-4">
      {board ? (
        <SectionCard title={board.title}>
          <p className="text-sm text-gray-600">
            Target hour {board.targetHour} · Status: {state.venture_board_status.replace(/_/g, ' ')}
          </p>
          <ul className="mt-3 space-y-2">
            {criteria.map((c) => (
              <li key={c.id} className="flex items-center justify-between text-sm">
                <span className="font-medium text-gray-900">{c.title}</span>
                <span className="text-gray-500">{c.weight}%</span>
              </li>
            ))}
          </ul>
        </SectionCard>
      ) : null}
      <SectionCard title="Workflow (read-only preview)">
        <p className="text-sm text-gray-600">
          Portfolio Ready → Mentor Review → Faculty Review → Board Scheduling → Presentation →
          Scoring → Decision
        </p>
        <PlaceholderNotice className="mt-3">
          Venture Board Workflow engine not implemented. Hour 400 and 600 boards unlock in later
          segments.
        </PlaceholderNotice>
      </SectionCard>
    </div>
  );
}

export function ExportCenterPanel() {
  return (
    <SectionCard title="Export formats">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        {['PDF', 'DOCX', 'PPTX'].map((fmt) => (
          <button
            key={fmt}
            type="button"
            disabled
            className="flex min-h-[88px] flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-gray-300 bg-gray-50 text-sm font-bold text-gray-400"
          >
            <Download size={20} />
            {fmt}
          </button>
        ))}
      </div>
      <PlaceholderNotice className="mt-4">
        Export Center assembles live Blueprint data when rendering pipeline ships.
      </PlaceholderNotice>
    </SectionCard>
  );
}
