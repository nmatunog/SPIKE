/**
 * Executive Canvas data model — aggregates canvas, metrics, and summary fields.
 */
import { CANVAS_ENGINES } from './blueprintSectionConstants.js';
import { getCanvasField, computeCanvasCompletionPct } from './canvasService.js';
import { getSectionField } from './blueprintSectionStore.js';
import { getClientGrowthSummary } from './clientGrowthService.js';
import { listFnas } from './fnaService.js';
import { listLeadershipJournal } from './leadershipJournalService.js';
import { computeVentureReadinessScore } from './ventureReadinessScore.js';
import {
  formatCareerTrackLabel,
  formatVentureBoardStatus,
} from './participantState.js';

const EXECUTIVE_MAX_CHARS = 300;

/** @typedef {{
 *   strategy_statement: string,
 *   strategy_is_auto: boolean,
 *   priority_1: string,
 *   priority_2: string,
 *   priority_3: string,
 *   year1_goal: string,
 *   year2_goal: string,
 *   year3_goal: string,
 *   updated_at: string | null,
 * }} CanvasSummaryRecord */

export const ACS_CAREER_LADDER = [
  { key: 'advisor', label: 'Advisor' },
  { key: 'associate_unit_manager', label: 'Associate Unit Manager' },
  { key: 'unit_manager', label: 'Unit Manager' },
  { key: 'senior_unit_manager', label: 'Senior Unit Manager' },
  { key: 'agency_director', label: 'Agency Director' },
];

/** @param {string} value @param {number} [max] */
export function summarizeExecutiveField(value, max = EXECUTIVE_MAX_CHARS) {
  const trimmed = String(value ?? '').trim().replace(/\s+/g, ' ');
  if (!trimmed) return '—';
  if (trimmed.length <= max) return trimmed;
  return `${trimmed.slice(0, max - 1).trim()}…`;
}

/** @param {string} participantId @param {string} careerTrack */
export function generateStrategyStatement(participantId, careerTrack) {
  const segments = summarizeExecutiveField(
    getCanvasField(participantId, 'client_growth', 'customer_segments'),
    120,
  );
  const valueProp = summarizeExecutiveField(
    getCanvasField(participantId, 'client_growth', 'value_proposition'),
    120,
  );
  const talent = summarizeExecutiveField(
    getCanvasField(participantId, 'talent_growth', 'talent_segments'),
    80,
  );
  const culture = summarizeExecutiveField(
    getCanvasField(participantId, 'leadership_growth', 'culture_statement'),
    80,
  );

  const focus =
    careerTrack === 'specialist_consultant'
      ? 'a specialist financial practice'
      : 'a financial services business';

  const serve =
    segments !== '—' ? ` serving ${segments.toLowerCase()}` : ' focused on my target market';
  const value =
    valueProp !== '—'
      ? ` by ${valueProp.charAt(0).toLowerCase()}${valueProp.slice(1)}`
      : ' through comprehensive financial planning';
  const talentLine =
    talent !== '—'
      ? ` while developing ${talent.toLowerCase()} who can expand organizational impact`
      : ' while developing future advisors and leaders who can expand organizational impact';
  const cultureLine =
    culture !== '—' ? ` Grounded in ${culture.toLowerCase()}.` : '';

  return `I will build ${focus}${serve}${value}${talentLine}.${cultureLine}`.replace(
    /\.\./g,
    '.',
  );
}

/** @param {number} hours @param {number} segment */
function deriveRecruitmentMetrics(hours, segment) {
  return {
    leads: Math.max(0, Math.round(hours / 8)),
    interviews: Math.max(0, Math.round(hours / 20)),
    candidates: Math.max(0, Math.round(hours / 35)),
    licensed: segment >= 2 ? Math.max(0, Math.round((hours - 160) / 45)) : 0,
    activeAdvisors: segment >= 3 ? Math.max(0, Math.round((hours - 400) / 70)) : 0,
  };
}

/**
 * @param {string} participantId
 * @param {number} hours
 * @param {number} segment
 */
function deriveLeadershipMetrics(participantId, hours, segment) {
  const journal = listLeadershipJournal(participantId);
  return {
    emergingLeaders: journal.length,
    teamMembers: segment >= 2 ? Math.max(0, Math.round(hours / 90)) : 0,
    teamProduction: segment >= 2 ? Math.max(0, Math.round(hours / 4)) : 0,
  };
}

/** @param {string} positionKey */
function normalizeCareerPositionKey(positionKey) {
  const raw = String(positionKey ?? 'advisor').toLowerCase().replace(/\s+/g, '_');
  const aliases = {
    aum: 'associate_unit_manager',
    associate_advisor: 'advisor',
    intern: 'advisor',
  };
  return aliases[raw] ?? raw;
}

/**
 * @param {{
 *   participantId: string,
 *   participantName: string,
 *   state: ReturnType<import('./participantState.js').buildParticipantState>,
 *   summary: CanvasSummaryRecord,
 * }} input
 */
export function buildExecutiveCanvasModel({ participantId, participantName, state, summary }) {
  const fnas = listFnas(participantId);
  const clientMetrics = getClientGrowthSummary(participantId, fnas);
  const recruitmentMetrics = deriveRecruitmentMetrics(state.hours, state.segment);
  const leadershipMetrics = deriveLeadershipMetrics(participantId, state.hours, state.segment);
  const canvasCompletion = computeCanvasCompletionPct(participantId);
  const readiness = computeVentureReadinessScore(state.blueprint_sections);

  const engines = Object.entries(CANVAS_ENGINES).map(([engineKey, engine]) => ({
    key: engineKey,
    label: engine.label,
    fields: engine.fields.map((field) => ({
      key: field.key,
      label: field.label,
      value: summarizeExecutiveField(getCanvasField(participantId, engineKey, field.key)),
    })),
  }));

  const careerFields = getSectionFields(participantId);
  const currentPositionKey = normalizeCareerPositionKey(
    careerFields.current_position || state.career_position,
  );
  const targetPositionKey = normalizeCareerPositionKey(
    careerFields.next_milestone || 'unit_manager',
  );

  const careerReadiness = Math.round(
    (readiness.dimensions.career_progress
      + readiness.dimensions.leadership_growth
      + readiness.dimensions.recruitment_growth)
    / 3,
  );

  return {
    header: {
      participantName: participantName || 'Participant',
      careerTrackLabel: formatCareerTrackLabel(state),
      dateUpdated: summary.updated_at
        ? new Date(summary.updated_at).toLocaleDateString(undefined, {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
          })
        : new Date().toLocaleDateString(undefined, {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
          }),
      blueprintCompletion: state.blueprint_completion,
      canvasCompletion,
      segment: state.segment,
      careerPosition: formatCareerPositionLabel(currentPositionKey),
      ventureBoardStatus: formatVentureBoardStatus(state.venture_board_status),
    },
    engines,
    strategyStatement: summary.strategy_statement || generateStrategyStatement(
      participantId,
      state.career_track,
    ),
    priorities: [summary.priority_1, summary.priority_2, summary.priority_3],
    yearAmbition: [
      { year: 'Year 1', goal: summary.year1_goal || '—' },
      { year: 'Year 2', goal: summary.year2_goal || '—' },
      { year: 'Year 3', goal: summary.year3_goal || '—' },
    ],
    ambitionPurpose: {
      ambition: summarizeExecutiveField(
        getSectionField(participantId, 'vision-purpose', 'vision_statement'),
      ),
      purpose: summarizeExecutiveField(
        getSectionField(participantId, 'vision-purpose', 'mission_statement'),
      ),
      values: summarizeExecutiveField(
        getSectionField(participantId, 'vision-purpose', 'my_values'),
      ),
      tagline: summarizeExecutiveField(
        getSectionField(participantId, 'vision-purpose', 'personal_tagline'),
        80,
      ),
      futureSelf: summarizeExecutiveField(
        getSectionField(participantId, 'vision-purpose', 'future_self_narrative'),
      ),
      futureSelfSummary: summarizeExecutiveField(
        getSectionField(participantId, 'vision-purpose', 'future_self_summary'),
        120,
      ),
    },
    acsRoadmap:
      state.career_track === 'agency_builder'
        ? {
            ladder: ACS_CAREER_LADDER,
            currentKey: currentPositionKey,
            targetKey: targetPositionKey,
            readinessScore: careerReadiness,
          }
        : null,
    metrics: {
      client: [
        { label: 'Prospects', value: clientMetrics.prospects },
        { label: 'Appointments', value: clientMetrics.appointments },
        { label: 'FNAs', value: clientMetrics.fnas },
        { label: 'Proposals', value: clientMetrics.proposals },
        { label: 'Issued Cases', value: clientMetrics.issuedCases },
      ],
      recruitment: [
        { label: 'Leads', value: recruitmentMetrics.leads },
        { label: 'Interviews', value: recruitmentMetrics.interviews },
        { label: 'Candidates', value: recruitmentMetrics.candidates },
        { label: 'Licensed', value: recruitmentMetrics.licensed },
        { label: 'Active Advisors', value: recruitmentMetrics.activeAdvisors },
      ],
      leadership: [
        { label: 'Emerging Leaders', value: leadershipMetrics.emergingLeaders },
        { label: 'Team Members', value: leadershipMetrics.teamMembers },
        { label: 'Team Production', value: leadershipMetrics.teamProduction },
      ],
    },
    readiness,
  };
}

/** @param {string} participantId */
function getSectionFields(participantId) {
  return {
    current_position: getSectionField(participantId, 'career-accelerator', 'current_position'),
    next_milestone: getSectionField(participantId, 'career-accelerator', 'next_milestone'),
  };
}

/** @param {string} key */
function formatCareerPositionLabel(key) {
  const match = ACS_CAREER_LADDER.find((step) => step.key === key);
  if (match) return match.label;
  return key.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}
