/**
 * SPIKE Venture Portfolio™ — compilation engine (Sprint 06C).
 * Aggregates Blueprint, Coach, Day 1 builders, canvas, and research into one showcase model.
 */
import { computeBlueprintCompletion } from '../lib/blueprintCompletion.js';
import { listPortfolioArtifacts } from '../lib/blueprintArtifacts.js';
import { getSectionFields } from '../lib/blueprintSectionStore.js';
import { computeCanvasCompletionPct } from '../lib/canvasService.js';
import { getCanvasSummary } from '../lib/canvasSummaryService.js';
import { getParticipantSquad } from '../lib/cohortFormationService.js';
import { getBuilderData, isBuilderCompleted } from '../lib/day1BuilderService.js';
import { readBuilderEntry } from '../lib/day1BuilderStorage.js';
import { buildExecutiveCanvasModel } from '../lib/executiveCanvasModel.js';
import { buildParticipantState, formatCareerTrackLabel } from '../lib/participantState.js';
import { getMilestonesForSegment } from '../lib/playbookSeeds.js';
import { countSubmittedSurveys } from '../lib/surveyService.js';
import {
  COACH_VALUE_CARDS,
  VENTURE_DIRECTION_CARDS,
} from '../lib/ventureCoachConstants.js';
import { getCoachProgress, getCoachSummaryForMentor } from '../lib/ventureCoachService.js';
import { getPortfolioSettings } from '../lib/portfolioStorage.js';
import {
  getWeek1DayProgress,
  getWeek1RequiredOutputs,
  isWeek1PresentationReady,
  week1CompletionPct,
} from '../lib/week1JourneyService.js';

export const PORTFOLIO_NAV_SECTIONS = [
  { id: 'overview', label: 'Overview' },
  { id: 'identity', label: 'Venture Identity' },
  { id: 'dream-board', label: 'Dream Board' },
  { id: 'career', label: 'Career Direction' },
  { id: 'canvas', label: 'Financial Canvas' },
  { id: 'research', label: 'Research Journey' },
  { id: 'deliverables', label: 'Upload Deliverables' },
  { id: 'milestones', label: 'Milestones' },
  { id: 'presentations', label: 'Presentations' },
  { id: 'certifications', label: 'Certifications' },
  { id: 'export', label: 'Portfolio Export' },
];

export const AGENCY_CAREER_ROADMAP = [
  'Advisor',
  'Associate Unit Manager',
  'Unit Manager',
  'Senior Unit Manager',
  'Agency Director',
];

export const SPECIALIST_CAREER_ROADMAP = [
  'Advisor',
  'Specialist',
  'Senior Specialist',
  'Niche Authority',
  'Industry Thought Leader',
];

const PORTFOLIO_SPIKE_BADGES = [
  { id: 'founding_cohort', label: 'Founding Cohort Member', test: (ctx) => (ctx.segment ?? 0) >= 1 },
  { id: 'canvas_builder', label: 'Canvas Builder', test: (ctx) => (ctx.canvasPct ?? 0) >= 70 },
  {
    id: 'market_explorer',
    label: 'Market Explorer',
    test: (ctx) => (ctx.researchMetrics?.surveysCompleted ?? 0) >= 1,
  },
  { id: 'venture_planner', label: 'Venture Planner', test: (ctx) => (ctx.blueprintCompletion ?? 0) >= 50 },
  { id: 'dream_builder', label: 'Dream Board Creator', test: (ctx) => Boolean(ctx.dreamBoardCompleted) },
  {
    id: 'identity_defined',
    label: 'Identity Defined',
    test: (ctx) => (ctx.coachProgress?.percent ?? 0) >= 100,
  },
  { id: 'partnership_ready', label: 'Partnership Ready', test: (ctx) => (ctx.hours ?? 0) >= 400 },
];

const COMPLETION_WEIGHTS = {
  identity: 20,
  dreamBoard: 15,
  career: 10,
  canvas: 20,
  research: 15,
  milestones: 10,
  presentations: 5,
  certifications: 5,
};

/** @param {string[]} ids */
function valueLabels(ids) {
  return ids.map((id) => COACH_VALUE_CARDS.find((card) => card.id === id)?.label).filter(Boolean);
}

/** @param {string} participantId @param {string} caption @param {{ hours: number, canvasPct: number, dreamBoardCompleted: boolean, blueprintCompletion: number }} ctx */
function inferDreamEvolution(caption, ctx) {
  const text = String(caption ?? '').toLowerCase();
  let progress = 'Dream captured';
  let achievement = '';

  if (ctx.canvasPct >= 60 && /business|venture|agency|financial/i.test(text)) {
    progress = 'Financial Canvas in progress';
  }
  if (ctx.blueprintCompletion >= 40) {
    progress = 'Blueprint building momentum';
  }
  if (ctx.hours >= 200 && /business|venture|board|agency/i.test(text)) {
    progress = 'Venture Board milestone reached';
    achievement = 'Hour 200 Venture Board Passed';
  }
  if (ctx.hours >= 400) {
    achievement = achievement || 'Hour 400 Validation milestone';
  }
  if (ctx.hours >= 600) {
    achievement = 'Hour 600 Partnership milestone';
  }

  return { dream: caption, progress, achievement };
}

/** @param {Record<string, number>} scores */
function weightedPortfolioCompletion(scores) {
  let total = 0;
  for (const [key, weight] of Object.entries(COMPLETION_WEIGHTS)) {
    total += ((scores[key] ?? 0) / 100) * weight;
  }
  return Math.round(total);
}

/**
 * @param {string} participantId
 * @param {{
 *   participantName?: string,
 *   internProgress?: import('../AuthContext.jsx').object | null,
 * }} [meta]
 */
export function generateVenturePortfolio(participantId, meta = {}) {
  const coach = getCoachSummaryForMentor(participantId);
  const coachProgress = coach?.progress ?? getCoachProgress(participantId);
  const visionFields = getSectionFields(participantId, 'vision-purpose');
  const internProgress = meta.internProgress ?? null;
  const state = buildParticipantState(participantId, internProgress);
  const blueprint = computeBlueprintCompletion(participantId);
  const canvasPct = computeCanvasCompletionPct(participantId);
  const summary = getCanvasSummary(participantId);
  const canvasModel = buildExecutiveCanvasModel({
    participantId,
    participantName: meta.participantName ?? 'Participant',
    state,
    summary,
  });

  const dreamBoardEntry = readBuilderEntry(participantId, 'dream-board');
  const dreamBoardData = getBuilderData(participantId, 'dream-board');
  const squadCharterData = getBuilderData(participantId, 'squad-charter');
  const squad = getParticipantSquad(participantId);
  const settings = getPortfolioSettings(participantId);

  const dreamAssets = /** @type {Array<{ id: string, category: string, caption: string, imageUrl?: string, addedAt?: string }>} */ (
    (dreamBoardData?.assets ?? []).map((asset) => ({
      ...asset,
      addedAt: dreamBoardEntry?.updatedAt ?? dreamBoardEntry?.completedAt ?? null,
    }))
  );

  const trackId = coach?.ventureDirection ?? state.career_track ?? '';
  const ventureDirection =
    VENTURE_DIRECTION_CARDS.find((card) => card.id === trackId)?.label
    ?? formatCareerTrackLabel(state);

  const researchArtifacts = listPortfolioArtifacts(participantId, 'portfolio-market-intelligence');
  const identityArtifacts = listPortfolioArtifacts(participantId, 'portfolio-identity-purpose');
  const surveysCompleted = countSubmittedSurveys(participantId);

  const researchMetrics = {
    surveysCompleted,
    interviewsConducted: researchArtifacts.filter((a) => /interview/i.test(a.title)).length,
    insightsGenerated: researchArtifacts.filter((a) => /insight|report|opportunity/i.test(a.title)).length,
    personasCreated: researchArtifacts.filter((a) => /persona/i.test(a.title)).length,
  };

  const segmentMilestones = getMilestonesForSegment(`segment-${state.segment}`);
  const milestoneTimeline = buildMilestoneTimeline(segmentMilestones, state.hours, {
    identityReady: coachProgress.percent >= 100,
    dreamBoardCompleted: isBuilderCompleted(participantId, 'dream-board'),
    canvasPct,
    researchCount: researchArtifacts.length,
  });

  const ctx = {
    segment: state.segment,
    hours: state.hours,
    canvasPct,
    dreamBoardCompleted: isBuilderCompleted(participantId, 'dream-board'),
    blueprintCompletion: blueprint.composite,
    coachProgress,
    researchMetrics,
  };

  const spikeBadges = PORTFOLIO_SPIKE_BADGES.filter((badge) => badge.test(ctx)).map((b) => b.label);
  const allBadges = [...new Set([...(coachProgress.badges ?? []), ...spikeBadges])];

  const sectionScores = {
    identity: coachProgress.percent,
    dreamBoard: isBuilderCompleted(participantId, 'dream-board')
      ? 100
      : Math.min(100, dreamAssets.filter((a) => a.caption?.trim()).length * 33),
    career: trackId && trackId !== 'undecided' ? 100 : state.career_track_selected ? 80 : 20,
    canvas: canvasPct,
    research: Math.min(100, researchArtifacts.length * 25 + surveysCompleted * 15),
    milestones: Math.min(100, Math.round((state.hours / 200) * 100)),
    presentations: state.hours >= 200 ? 60 : state.hours >= 120 ? 35 : 10,
    certifications: Math.min(100, allBadges.length * 20),
  };

  const portfolioCompletion = weightedPortfolioCompletion(sectionScores);
  const roadmap =
    state.career_track === 'specialist_consultant' ? SPECIALIST_CAREER_ROADMAP : AGENCY_CAREER_ROADMAP;
  const currentIndex = Math.min(
    roadmap.length - 1,
    Math.max(0, Math.floor(state.hours / 120)),
  );
  const targetIndex = Math.min(roadmap.length - 1, currentIndex + 2);

  return {
    participantId,
    settings,
    cover: {
      participantName: meta.participantName ?? 'Participant',
      photoUrl: settings.photoUrl ?? '',
      cohort: internProgress?.university
        ? `${internProgress.university} · Segment ${state.segment}`
        : `SPIKE Cohort · Segment ${state.segment}`,
      squad: squad?.name ?? internProgress?.squad ?? 'Squad forming',
      careerTrack: ventureDirection,
      tagline: coach?.tagline || visionFields.personal_tagline || '',
      blueprintCompletion: blueprint.composite,
      portfolioCompletion,
    },
    identity: {
      ambition: coach?.ambition || visionFields.vision_statement || '',
      impact: coach?.impact || visionFields.mission_statement || '',
      valuesProfile: coach?.valuesProfile || visionFields.my_values || '',
      topThreeValues: valueLabels(coach?.topThreeValues ?? []),
      futureSelf: coach?.futureSelf || visionFields.future_self_narrative || '',
      futureSelfSummary: coach?.futureSelfSummary || visionFields.future_self_summary || '',
      tagline: coach?.tagline || visionFields.personal_tagline || '',
    },
    dreamBoard: {
      completed: isBuilderCompleted(participantId, 'dream-board'),
      assets: dreamAssets,
      summary: visionFields.dream_board || '',
      evolution: dreamAssets
        .filter((a) => a.caption?.trim())
        .map((a) => inferDreamEvolution(a.caption, ctx)),
    },
    career: {
      trackId,
      trackLabel: ventureDirection,
      roadmap,
      currentPosition: roadmap[currentIndex],
      targetPosition: roadmap[targetIndex],
      projectedTimeline: state.hours < 200 ? '3–5 years' : state.hours < 400 ? '2–4 years' : '1–3 years',
    },
    canvas: {
      completionPct: canvasPct,
      strategyStatement: canvasModel.strategyStatement || summary.strategy_statement || '',
      priorities: [summary.priority_1, summary.priority_2, summary.priority_3].filter(Boolean),
      yearGoals: [summary.year1_goal, summary.year2_goal, summary.year3_goal].filter(Boolean),
      engines: canvasModel.engines ?? [],
      readinessScore: canvasModel.readiness?.composite ?? 0,
    },
    research: {
      metrics: researchMetrics,
      marketLabel: squad?.researchMarket ?? visionFields.research_market ?? '',
      artifacts: researchArtifacts,
    },
    milestones: {
      hours: state.hours,
      items: milestoneTimeline,
    },
    presentations: {
      ventureBoardStatus: state.venture_board_status,
      boards: [
        { id: 'hour-200', title: 'Hour 200 Venture Board', hourGate: 200, status: boardStatus(state.hours, 200) },
        { id: 'hour-400', title: 'Hour 400 Validation Board', hourGate: 400, status: boardStatus(state.hours, 400) },
        { id: 'hour-600', title: 'Hour 600 Partnership Board', hourGate: 600, status: boardStatus(state.hours, 600) },
      ],
    },
    certifications: {
      coachBadges: coachProgress.badges ?? [],
      spikeBadges,
      allBadges,
    },
    squadCharter: squadCharterData
      ? {
          completed: isBuilderCompleted(participantId, 'squad-charter'),
          squadName: String(squadCharterData.squadName ?? ''),
          mission: String(squadCharterData.mission ?? ''),
          teamMotto: String(squadCharterData.teamMotto ?? ''),
          signatureName: String(squadCharterData.signatureName ?? ''),
        }
      : null,
    identityArtifacts,
    coachProgress,
    sectionScores,
    portfolioCompletion,
    ready: coachProgress.percent >= 100,
    week1Journey: {
      completionPct: week1CompletionPct(participantId),
      presentationReady: isWeek1PresentationReady(participantId),
      days: getWeek1DayProgress(participantId),
      requiredOutputs: getWeek1RequiredOutputs(participantId),
    },
  };
}

/** @param {number} hours @param {number} gate */
function boardStatus(hours, gate) {
  if (hours >= gate + 20) return 'completed';
  if (hours >= gate - 20) return 'in_progress';
  return 'upcoming';
}

/**
 * @param {Array<{ id: string, title: string, targetHour: number, description?: string }>} milestones
 * @param {number} hours
 * @param {{ identityReady: boolean, dreamBoardCompleted: boolean, canvasPct: number, researchCount: number }} flags
 */
function buildMilestoneTimeline(milestones, hours, flags) {
  const programMarkers = [
    { key: 'day-1', label: 'Day 1', hour: 0, done: flags.identityReady || flags.dreamBoardCompleted },
    { key: 'day-5', label: 'Day 5', hour: 8, done: flags.dreamBoardCompleted },
    { key: 'week-2', label: 'Week 2', hour: 24, done: flags.researchCount > 0 },
    { key: 'week-4', label: 'Week 4', hour: 48, done: flags.canvasPct >= 30 },
  ];

  const hourGates = milestones.map((m) => ({
    key: m.id,
    label: m.title,
    hour: m.targetHour,
    description: m.description,
    done: hours >= m.targetHour,
  }));

  return [...programMarkers, ...hourGates];
}

/** Back-compat alias */
export function buildVenturePortfolio(participantId, meta = {}) {
  return generateVenturePortfolio(participantId, meta);
}

export function isVenturePortfolioReady(participantId) {
  return getCoachProgress(participantId).percent >= 100;
}
