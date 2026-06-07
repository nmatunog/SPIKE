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
import { listFnas, countCompletedFnas } from '../../../lib/fnaService.js';
import { countSubmittedSurveys } from '../../../lib/surveyService.js';
import { getMarketIntelligenceSummary } from '../../../lib/marketIntelligenceService.js';
import { getSectionField, setSectionField } from '../../../lib/blueprintSectionStore.js';
import { RECRUITMENT_FIELDS, LEADERSHIP_FIELDS, CAREER_FIELDS } from '../../../lib/blueprintSectionConstants.js';
import { listLeadershipJournal } from '../../../lib/leadershipJournalService.js';
import { getNextBlueprintAction } from '../../../lib/blueprintRecommendations.js';
import { computeSectionCompletionPct } from '../../../lib/blueprintCompletion.js';
import { FnaEngineModule } from '../../fna/FnaEngineModule.jsx';
import { AutoSaveField } from '../AutoSaveField.jsx';

function SectionCard({ title, children, className = '' }) {
  return (
    <div className={`rounded-xl border border-gray-200 bg-white p-4 shadow-sm sm:p-5 ${className}`}>
      <h3 className="mb-3 font-bold text-gray-900">{title}</h3>
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
  const surveyCount = participantId ? countSubmittedSurveys(participantId) : 0;
  const fnaCount = participantId ? countCompletedFnas(participantId) : 0;
  const sectionPct = state.blueprint_sections ?? {};

  return (
    <div className="space-y-4">
      <SectionCard title="My Venture Blueprint™">
        <p className="text-sm text-gray-600">
          Your business plan, career plan, portfolio, and progress tracker — auto-filled from
          Playbook, surveys, FNAs, and coaching.
        </p>
        <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <MetricCard label="Blueprint" value={`${state.blueprint_completion}%`} accent="red" />
          <MetricCard label="Surveys" value={String(surveyCount)} sub="submitted" accent="blue" />
          <MetricCard label="FNAs" value={String(fnaCount)} sub="completed" accent="green" />
          <MetricCard
            label="Career"
            value={state.career_position.replace(/_/g, ' ')}
            sub={state.career_track === 'agency_builder' ? 'Agency Builder' : 'Specialist'}
            accent="amber"
          />
        </div>
      </SectionCard>

      {nextAction ? (
        <SectionCard title="Next recommended action">
          <p className="font-bold text-gray-900">{nextAction.title}</p>
          <p className="mt-1 text-sm text-gray-600">{nextAction.detail}</p>
          <Link
            to={nextAction.href}
            className="mt-3 inline-flex min-h-[44px] items-center gap-2 rounded-lg bg-[#8B0000] px-4 py-2 text-sm font-bold text-white hover:bg-[#6B0000]"
          >
            Go <ArrowRight size={16} />
          </Link>
        </SectionCard>
      ) : null}

      <SectionCard title="Section progress">
        <div className="grid grid-cols-2 gap-2 text-xs sm:grid-cols-3">
          {Object.entries(sectionPct).map(([slug, pct]) => (
            <div key={slug} className="rounded-lg border border-gray-100 bg-gray-50 px-2 py-2">
              <p className="font-bold text-gray-800">{slug.replace(/-/g, ' ')}</p>
              <p className="text-[#8B0000]">{pct}%</p>
            </div>
          ))}
        </div>
      </SectionCard>

      <SectionCard title="30-second check-in">
        <ul className="space-y-2 text-sm text-gray-700">
          <li>
            <strong>Where am I now?</strong> Segment {state.segment}, Week {state.week}, Day{' '}
            {state.day} — {state.blueprint_completion}% Blueprint complete.
          </li>
          <li>
            <strong>Where am I going?</strong> {state.career_track === 'agency_builder'
              ? 'Agency Director path via ACS progression.'
              : 'Practice Principal via Specialist Consultant track.'}
          </li>
          <li>
            <strong>What must I do next?</strong> Continue Playbook Week {state.week} and complete
            portfolio deliverables for this week.
          </li>
          <li>
            <strong>Am I on track?</strong> SPIKE Readiness {state.spike_readiness_score} — venture
            board {state.venture_board_status.replace(/_/g, ' ')}.
          </li>
        </ul>
      </SectionCard>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <SectionCard title="This week integration">
          {integration ? (
            <dl className="space-y-2 text-sm text-gray-700">
              <div>
                <dt className="text-xs font-bold uppercase text-gray-500">Business plan chapter</dt>
                <dd>{integration.businessPlanChapter}</dd>
              </div>
              <div>
                <dt className="text-xs font-bold uppercase text-gray-500">Portfolio section</dt>
                <dd>{integration.portfolioSection}</dd>
              </div>
            </dl>
          ) : (
            <PlaceholderNotice>Week integration seeds load for Segment 1 weeks 1–5.</PlaceholderNotice>
          )}
        </SectionCard>

        <SectionCard title="Quick actions">
          <div className="flex flex-col gap-2">
            <Link
              to={ROUTES.playbook}
              className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-lg bg-[#8B0000] px-4 py-2 text-sm font-bold text-white hover:bg-[#6B0000]"
            >
              <Rocket size={16} /> Open Playbook
            </Link>
            {onLogTraction ? (
              <button
                type="button"
                onClick={onLogTraction}
                className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-bold text-gray-800 hover:bg-gray-50"
              >
                <LineChart size={16} /> Log traction hours
              </button>
            ) : null}
            <Link
              to={ROUTES.research}
              className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-bold text-gray-800 hover:bg-gray-50"
            >
              <Users size={16} /> Research Squad
            </Link>
            <Link
              to={BLUEPRINT_LINKS.milestones}
              className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-bold text-gray-800 hover:bg-gray-50"
            >
              Milestones
            </Link>
            <Link
              to={BLUEPRINT_LINKS.businessPlan}
              className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-bold text-gray-800 hover:bg-gray-50"
            >
              Business Plan
            </Link>
            <Link
              to={BLUEPRINT_LINKS.ventureBoard}
              className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-bold text-gray-800 hover:bg-gray-50"
            >
              Venture Board
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

  const components = [
    { key: 'mission_statement', label: 'Mission Statement Builder', pct: progress.mission_statement },
    { key: 'vision_statement', label: 'Vision Statement Builder', pct: progress.vision_statement },
    {
      key: 'future_self_narrative',
      label: 'Future Self Narrative (500+ words)',
      pct: progress.future_self_narrative,
    },
    { key: 'dream_board', label: 'Dream Board', pct: progress.dream_board },
  ];

  return (
    <div className="space-y-4">
      <p className="text-sm text-gray-600">
        {section?.description ?? 'Establish participant identity and direction.'} Playbook Day 1
        worksheets will auto-fill this module — no duplicate entry.
      </p>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {components.map((item) => (
          <SectionCard key={item.key} title={item.label}>
            <div className="mb-2 h-2 w-full rounded-full bg-gray-200">
              <div
                className="h-2 rounded-full bg-[#8B0000] transition-all"
                style={{ width: `${item.pct}%` }}
              />
            </div>
            <p className="text-xs font-bold text-gray-500">{item.pct}% · weight 25%</p>
            {item.pct === 0 ? (
              <PlaceholderNotice>
                Complete Playbook Day 1 Personal Why worksheet to populate this section.
              </PlaceholderNotice>
            ) : (
              <p className="text-xs text-green-700">Updated from Playbook worksheet submission.</p>
            )}
          </SectionCard>
        ))}
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
