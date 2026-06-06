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
import { ROUTES } from '../../../routes/paths.js';
import {
  getBusinessPlanChapters,
  getCareerTracks,
  getPortfolioSections,
  getTrackRequirementsForTrack,
  getVentureBoardCriteriaForBoard,
  getVentureBoardsForSegment,
  getWeekIntegrationByWeekId,
} from '../../../lib/playbookSeeds.js';

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
export function BlueprintOverviewPanel({ state, onLogTraction }) {
  const integration = getWeekIntegrationByWeekId(`week-segment-1-${Math.min(state.week, 5)}`);

  return (
    <div className="space-y-4">
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
          </div>
        </SectionCard>
      </div>
    </div>
  );
}

export function VisionPurposePanel() {
  const sections = getPortfolioSections().filter((s) => s.id === 'portfolio-identity-purpose');
  const section = sections[0];

  const components = [
    { key: 'mission_statement', label: 'Mission Statement Builder', pct: 0 },
    { key: 'vision_statement', label: 'Vision Statement Builder', pct: 0 },
    { key: 'future_self_narrative', label: 'Future Self Narrative (500+ words)', pct: 0 },
    { key: 'dream_board', label: 'Dream Board', pct: 0 },
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
              <div className="h-2 w-0 rounded-full bg-[#8B0000]" style={{ width: `${item.pct}%` }} />
            </div>
            <p className="text-xs font-bold text-gray-500">{item.pct}% · weight 25%</p>
            <PlaceholderNotice>
              Awaiting first worksheet submission from Playbook integration.
            </PlaceholderNotice>
          </SectionCard>
        ))}
      </div>
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
  'Prospects',
  'Contacts',
  'Appointments',
  'FNAs',
  'Proposals',
  'Applications',
  'Issued Cases',
];

export function ClientGrowthPanel({ state }) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <MetricCard label="FNA readiness" value={`${state.spike_readiness_dimensions.production}%`} sub="mock from hours" />
        <MetricCard label="Conversion" value="—" sub="awaiting FNA engine" accent="blue" />
        <MetricCard label="Issued cases" value="0" sub="client_growth table" accent="green" />
        <MetricCard label="Referrals" value="0" sub="client_growth table" accent="amber" />
      </div>
      <SectionCard title="Production funnel">
        <div className="flex flex-col items-stretch gap-1 sm:flex-row sm:flex-wrap sm:items-center">
          {CLIENT_FUNNEL.map((stage, idx) => (
            <div key={stage} className="flex items-center gap-1">
              <span className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-xs font-bold text-gray-800">
                {stage}
              </span>
              {idx < CLIENT_FUNNEL.length - 1 ? (
                <ArrowRight size={14} className="hidden text-gray-400 sm:block" />
              ) : null}
            </div>
          ))}
        </div>
        <PlaceholderNotice className="mt-4">
          FNA Engine (PRD Module 8) will populate this funnel. Traction hours: {state.hours}.
        </PlaceholderNotice>
      </SectionCard>
    </div>
  );
}

const RECRUIT_FUNNEL = ['Leads', 'Interviews', 'Candidates', 'Licensed', 'Active Advisors'];

export function RecruitmentPanel() {
  return (
    <SectionCard title="Recruitment funnel (Agency Builder)">
      <div className="mb-4 flex flex-wrap items-center gap-2">
        {RECRUIT_FUNNEL.map((stage, idx) => (
          <div key={stage} className="flex items-center gap-1">
            <span className="rounded-lg border border-gray-200 px-3 py-2 text-xs font-bold">{stage}</span>
            {idx < RECRUIT_FUNNEL.length - 1 ? <ArrowRight size={14} className="text-gray-400" /> : null}
          </div>
        ))}
      </div>
      <PlaceholderNotice>
        recruitment_funnel table not wired. KPIs: conversion, licensing, activation, retention.
      </PlaceholderNotice>
    </SectionCard>
  );
}

export function LeadershipPanel() {
  return (
    <SectionCard title="Team dashboard">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <MetricCard label="Advisors" value="0" />
        <MetricCard label="Team cases" value="0" accent="blue" />
        <MetricCard label="Recruitment activity" value="0" accent="amber" />
        <MetricCard label="Leadership readiness" value="—" accent="green" />
      </div>
      <PlaceholderNotice className="mt-4">
        leadership_pipeline table not wired.
      </PlaceholderNotice>
    </SectionCard>
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
      <SectionCard title="Promotion readiness (mock)">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          <MetricCard label="Production" value={`${state.spike_readiness_dimensions.production}%`} />
          <MetricCard label="Recruitment" value={`${state.spike_readiness_dimensions.recruitment}%`} accent="blue" />
          <MetricCard label="Leadership" value={`${state.spike_readiness_dimensions.leadership}%`} accent="green" />
        </div>
        <p className="mt-3 text-sm font-bold text-gray-800">
          Overall readiness: {state.spike_readiness_score}%
        </p>
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

export function SpecialistBlueprintPanel() {
  const fields = [
    'Niche market',
    'Authority plan',
    'Content plan',
    'Partnership plan',
    'Practice growth plan',
  ];

  return (
    <div className="space-y-4">
      <SectionCard title="Specialist dashboard">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {['Clients', 'Referrals', 'Content', 'Speaking', 'Partnerships', 'Practice growth'].map(
            (label) => (
              <MetricCard key={label} label={label} value="0" />
            ),
          )}
        </div>
      </SectionCard>
      <SectionCard title="specialist_blueprint fields">
        <ul className="space-y-2 text-sm text-gray-700">
          {fields.map((f) => (
            <li key={f} className="flex items-center gap-2">
              <Briefcase size={14} className="text-[#8B0000]" />
              {f}
            </li>
          ))}
        </ul>
        <PlaceholderNotice className="mt-3">
          specialist_blueprint persistence coming in a future sprint.
        </PlaceholderNotice>
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
