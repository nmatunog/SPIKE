/**
 * Build Studio — intern home mission derivation (Venture Blueprint overview).
 */
import { ROUTES, BLUEPRINT_LINKS } from '../routes/paths.js';
import { computeCanvasCompletionPct } from './canvasService.js';
import { hasSubmittedCohortIdentity } from './cohortFormationService.js';
import { getDay1MissionProgress, isBuilderCompleted } from './day1BuilderService.js';
import { isCoachSectionComplete } from './ventureCoachStorage.js';
import { listBlueprintTimelineEvents } from './blueprintTimeline.js';
import { generateVenturePortfolio } from '../services/portfolioGenerator.js';
import { week1CompletionPct, getWeek1DayProgress } from './week1JourneyService.js';
import { isDay1MissionActive, isWeek1PlaybookDaysActive } from './day1BuilderService.js';
import { UNLOCK_WEEK1_DAY2_PLUS } from './programUnlocks.js';
import { playbookHref } from '../routes/paths.js';
import { getNextBlueprintAction } from './blueprintRecommendations.js';
import { WEEK1_DAY_META } from './mentorWeek1Constants.js';

/** Day 1 journey steps — participant-facing order. */
export const DAY1_JOURNEY_STEPS = [
  {
    id: 'orientation',
    label: 'Founding Cohort',
    shortLabel: 'Cohort',
    href: ROUTES.cohortIdentity,
    estMin: 5,
  },
  {
    id: 'ambition',
    label: 'Ambition',
    shortLabel: 'Ambition',
    builderId: 'ambition-builder',
    coachSection: 'ambition',
    href: `${ROUTES.ventureBlueprint}/coach/ambition`,
    estMin: 12,
  },
  {
    id: 'impact',
    label: 'Impact',
    shortLabel: 'Impact',
    builderId: 'impact-builder',
    coachSection: 'impact',
    href: `${ROUTES.ventureBlueprint}/coach/impact`,
    estMin: 10,
  },
  {
    id: 'values',
    label: 'Values',
    shortLabel: 'Values',
    builderId: 'values-builder',
    coachSection: 'values',
    href: `${ROUTES.ventureBlueprint}/coach/values`,
    estMin: 10,
  },
  {
    id: 'dream-board',
    label: 'Dream Board',
    shortLabel: 'Dream Board',
    builderId: 'dream-board',
    href: `${ROUTES.ventureBlueprint}/day-1-builders`,
    estMin: 15,
  },
  {
    id: 'canvas',
    label: 'FE Canvas',
    shortLabel: 'FE Canvas',
    href: BLUEPRINT_LINKS.businessPlan,
    estMin: 18,
    canvasThreshold: 30,
  },
  {
    id: 'squad',
    label: 'Squad',
    shortLabel: 'Squad',
    builderIds: ['squad-formation', 'squad-charter'],
    href: ROUTES.squad,
    estMin: 12,
  },
];

/** @param {string} [name] */
export function firstNameFromUser(name) {
  const trimmed = String(name ?? '').trim();
  if (!trimmed) return 'Builder';
  return trimmed.split(/\s+/)[0];
}

/** @param {string} participantId @param {typeof DAY1_JOURNEY_STEPS[number]} step */
function isJourneyStepComplete(participantId, step) {
  if (step.id === 'orientation') return hasSubmittedCohortIdentity(participantId);
  if (step.canvasThreshold) return computeCanvasCompletionPct(participantId) >= step.canvasThreshold;
  if (step.builderIds) {
    return step.builderIds.every((id) => isBuilderCompleted(participantId, id));
  }
  if (step.builderId && isBuilderCompleted(participantId, step.builderId)) return true;
  if (step.coachSection && isCoachSectionComplete(participantId, step.coachSection)) return true;
  return false;
}

/** @param {string} participantId */
export function deriveDay1Journey(participantId) {
  return DAY1_JOURNEY_STEPS.map((step, index) => ({
    ...step,
    index: index + 1,
    complete: isJourneyStepComplete(participantId, step),
  }));
}

/**
 * @param {string} participantId
 * @param {{ week: number, day: number, segment: number, blueprint_completion?: number }} state
 */
function deriveWeek1PlaybookMission(participantId, state) {
  const day = Math.min(5, Math.max(2, state.day ?? 2));
  const meta = WEEK1_DAY_META.find((d) => d.day === day) ?? WEEK1_DAY_META[1];
  const dayProgress = getWeek1DayProgress(participantId);
  const today = dayProgress.find((d) => d.day === day);
  const completedBefore = dayProgress.filter((d) => d.day < day && d.complete).length;

  return {
    title: meta.playbookTitle ?? meta.theme,
    stepLabel: `Week ${state.week}`,
    href: playbookHref({ week: state.week, day }),
    estimatedMinutes: 240,
    coachReady: false,
    progressPercent: today?.complete
      ? 100
      : Math.min(95, Math.round(((completedBefore + 0.25) / 5) * 100)),
    journey: [],
    allComplete: Boolean(today?.complete),
    day1: false,
    playbookDay: true,
    continueLabel: `Continue Day ${day}`,
  };
}

/**
 * @param {string} participantId
 * @param {{ week: number, segment: number, day?: number, blueprint_completion?: number }} [state]
 */
export function deriveTodayMission(participantId, state) {
  if (
    state
    && UNLOCK_WEEK1_DAY2_PLUS
    && state.segment === 1
    && state.week <= 1
  ) {
    const day = Math.max(2, state.day ?? 2);
    return deriveWeek1PlaybookMission(participantId, { ...state, day });
  }
  if (state && isWeek1PlaybookDaysActive(state.week, state.segment, state.day ?? 1)) {
    return deriveWeek1PlaybookMission(participantId, state);
  }
  if (state && !isDay1MissionActive(state.week, state.segment, state.day ?? 1)) {
    const next = getNextBlueprintAction(state, participantId);
    return {
      title: next.title,
      stepLabel: `Week ${state.week}`,
      href: next.href,
      estimatedMinutes: 15,
      coachReady: String(next.href).includes('/coach'),
      progressPercent: Math.min(100, Math.max(0, Math.round(state.blueprint_completion ?? 0))),
      journey: [],
      allComplete: false,
      day1: false,
      continueLabel: next.title,
    };
  }

  const journey = deriveDay1Journey(participantId);
  const next = journey.find((step) => !step.complete) ?? journey[journey.length - 1];
  const progress = getDay1MissionProgress(participantId);
  const coachReady = Boolean(next.coachSection && !next.complete);

  let title = next.label;
  if (next.id === 'ambition') title = 'Build Your Ambition';
  else if (next.id === 'impact') title = 'Define Your Impact';
  else if (next.id === 'values') title = 'Choose Your Values';
  else if (next.id === 'dream-board') title = 'Create Your Dream Board';
  else if (next.id === 'canvas') title = 'Start Your FE Canvas';
  else if (next.id === 'squad') title = 'Join Your Squad';
  else if (next.id === 'orientation') title = 'Name Your Founding Cohort';

  const continueHref =
    next.id === 'dream-board' && !isBuilderCompleted(participantId, 'dream-board')
      ? `${ROUTES.ventureBlueprint}/day-1-builders`
      : next.href;

  return {
    title,
    stepLabel: `Day 1 · ${next.shortLabel}`,
    href: continueHref,
    estimatedMinutes: next.estMin,
    coachReady,
    progressPercent: progress.percent,
    journey,
    allComplete: journey.every((s) => s.complete),
    day1: true,
    continueLabel: 'Continue Day 1',
  };
}

/** @param {string} participantId */
export function deriveRecentWin(participantId) {
  const events = listBlueprintTimelineEvents(participantId, 5);
  const portfolio = generateVenturePortfolio(participantId, { participantName: '' });
  const week1Pct = week1CompletionPct(participantId);

  if (events[0]?.title) {
    return {
      message: events[0].title,
      sub: 'Added to your Venture Portfolio',
    };
  }

  if (week1Pct >= 20) {
    return {
      message: 'Your Venture Portfolio is taking shape',
      sub: `${week1Pct}% of Week 1 outputs complete`,
    };
  }

  if (portfolio.cover.portfolioCompletion > 0) {
    return {
      message: 'Your Venture Portfolio just gained a new page',
      sub: `${portfolio.cover.portfolioCompletion}% portfolio complete`,
    };
  }

  return null;
}

/** @param {string} participantId */
export function derivePortfolioPages(participantId) {
  const pct = week1CompletionPct(participantId);
  const totalSlots = 12;
  const filled = Math.round((pct / 100) * totalSlots);
  return { filled, total: totalSlots, percent: pct };
}
