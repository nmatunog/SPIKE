/**
 * My Venture HQ — venture-centric intern home (identity, stage, today, milestones, FEC preview).
 */
import { ROUTES, BLUEPRINT_LINKS, internFecCanvasHref } from '../routes/paths.js';
import { deriveTodayMission } from './buildStudioService.js';
import { computeCanvasCompletionPct } from './canvasService.js';
import { getCanvasSummary } from './canvasSummaryService.js';
import { buildFecLayoutParticipantContent } from './fecCanvasLayoutContent.js';
import { loadVentureDesignRecord } from './ventureDesignStudioService.js';
import { loadVentureStudioState } from './ventureStudioStorage.js';
import { listPortfolioDeliverablesLocal } from './portfolioDeliverableService.js';
import { getCoachProgress } from './ventureCoachService.js';
import { WEEK1_DAY_META } from './mentorWeek1Constants.js';
import { isCoachSectionComplete } from './ventureCoachStorage.js';

/** @typedef {{ id: string, label: string, complete: boolean, href: string }} VentureMilestone */

/** @param {string} value */
function hasText(value) {
  return Boolean(String(value ?? '').trim());
}

/** @param {string} participantId @param {string} [squadNameFallback] */
export function deriveVentureIdentity(participantId, squadNameFallback = '') {
  const design = loadVentureDesignRecord(participantId);
  const studio = loadVentureStudioState(participantId);
  const name =
    design.individual?.step4?.name?.trim()
    || studio.squadName?.trim()
    || squadNameFallback?.trim()
    || '';
  const tagline = design.individual?.step4?.tagline?.trim() || '';
  return {
    ventureName: name || 'Your Venture',
    tagline: tagline || 'Name your venture and add a tagline in Venture Design Studio.',
    hasNamedVenture: Boolean(name),
  };
}

/** @param {string} participantId */
export function deriveVentureMilestones(participantId) {
  const design = loadVentureDesignRecord(participantId);
  const studio = loadVentureStudioState(participantId);
  const draft = design.individual;
  const canvasPct = computeCanvasCompletionPct(participantId);
  const summary = getCanvasSummary(participantId);
  const deliverables = listPortfolioDeliverablesLocal(participantId);
  const hasPitch = deliverables.some((d) => d.category === 'presentation');

  const customerIdentified =
    hasText(draft?.step1?.customer)
    || hasText(studio.targetSegment)
    || hasText(studio.step1?.stage);
  const problemValidated =
    hasText(draft?.step1?.problem)
    || studio.step3?.some((row) => hasText(row.problem));
  const opportunityChosen =
    hasText(draft?.step1?.opportunity)
    || hasText(studio.step5?.valueCreation)
    || hasText(studio.step5?.unmetNeed);
  const uvpComplete =
    (hasText(draft?.step3?.synthesisA)
      && hasText(draft?.step3?.synthesisB)
      && hasText(draft?.step3?.synthesisC))
    || hasText(summary.unified_venture_proposition);
  const businessModelComplete = canvasPct >= 40;
  const financialPlanComplete =
    hasText(summary.success_revenue)
    || hasText(summary.success_annual_profit)
    || canvasPct >= 60;

  /** @type {VentureMilestone[]} */
  const milestones = [
    {
      id: 'customer',
      label: 'Customer Identified',
      complete: customerIdentified,
      href: BLUEPRINT_LINKS.businessPlan,
    },
    {
      id: 'problem',
      label: 'Problem Validated',
      complete: problemValidated,
      href: BLUEPRINT_LINKS.businessPlan,
    },
    {
      id: 'opportunity',
      label: 'Opportunity Chosen',
      complete: opportunityChosen,
      href: BLUEPRINT_LINKS.businessPlan,
    },
    {
      id: 'uvp',
      label: 'Unique Venture Proposition',
      complete: uvpComplete,
      href: BLUEPRINT_LINKS.businessPlan,
    },
    {
      id: 'business-model',
      label: 'Business Model',
      complete: businessModelComplete,
      href: BLUEPRINT_LINKS.businessPlan,
    },
    {
      id: 'financial-plan',
      label: 'Financial Plan',
      complete: financialPlanComplete,
      href: BLUEPRINT_LINKS.canvasSummary,
    },
    {
      id: 'pitch',
      label: 'Pitch Deck',
      complete: hasPitch,
      href: ROUTES.myVenturePortfolio,
    },
  ];

  const completeCount = milestones.filter((m) => m.complete).length;
  return { milestones, completeCount, totalCount: milestones.length };
}

/**
 * @param {{ week: number, day: number, segment?: number }} state
 * @param {string} participantId
 */
export function deriveVentureStage(state, participantId) {
  const week = state.week ?? 1;
  const day = state.day ?? 1;
  const design = loadVentureDesignRecord(participantId);
  const coach = getCoachProgress(participantId);
  const { completeCount, totalCount } = deriveVentureMilestones(participantId);
  const progressPercent = totalCount
    ? Math.round((completeCount / totalCount) * 100)
    : 0;

  let stageName = 'Ambition & Purpose';
  if (week >= 4) {
    stageName = 'Platform Integration';
  } else if (design.isStarted && !design.isComplete) {
    stageName = 'Venture Design';
  } else if (day >= 2) {
    const meta = WEEK1_DAY_META.find((d) => d.day === day) ?? WEEK1_DAY_META[0];
    stageName = meta.theme === 'Identity' ? 'Ambition & Purpose' : meta.theme;
  } else if (coach.percent >= 50 && isCoachSectionComplete(participantId, 'values')) {
    stageName = 'Identity & Vision';
  }

  return {
    week,
    day,
    stageLabel: `Week ${week} · ${stageName}`,
    progressPercent,
  };
}

/**
 * @param {string} participantId
 * @param {{ week: number, segment: number, day?: number, blueprint_completion?: number }} state
 */
export function deriveVentureTodayMission(participantId, state) {
  const week = state.week ?? 1;
  const day = state.day ?? 1;

  if (week >= 4 && state.segment === 1) {
    const mission = deriveTodayMission(participantId, state);
    return {
      title: mission.title,
      href: mission.href,
      estimatedMinutes: mission.estimatedMinutes,
      continueLabel: mission.continueLabel ?? 'Continue',
      stepHint: mission.stepLabel,
    };
  }

  if (week === 3 && state.segment === 1) {
    const mission = deriveTodayMission(participantId, state);
    return {
      title: mission.title,
      href: mission.href,
      estimatedMinutes: mission.estimatedMinutes,
      continueLabel: mission.continueLabel ?? 'Continue',
      stepHint: mission.stepLabel,
    };
  }

  const design = loadVentureDesignRecord(participantId);

  if ((day >= 4 || design.isStarted) && !design.isComplete && week < 3) {
    const step = Math.min(5, Math.max(1, design.currentStep || 1));
    const ventureDesignHref = BLUEPRINT_LINKS.businessPlan;
    return {
      title: 'Continue Venture Design Studio',
      href: ventureDesignHref,
      estimatedMinutes: 45,
      continueLabel: 'Continue',
      stepHint: `Step ${step} of 5`,
    };
  }

  const mission = deriveTodayMission(participantId, state);
  let title = mission.title;
  if (mission.day1 && mission.href.includes('/coach/')) {
    title = `Continue ${mission.title}`;
  } else if (mission.playbookDay) {
    title = mission.title;
  }

  return {
    title,
    href: mission.href,
    estimatedMinutes: mission.estimatedMinutes,
    continueLabel: mission.continueLabel ?? 'Continue',
    stepHint: mission.stepLabel,
  };
}

/** @param {string} participantId */
export function buildFecPreviewContent(participantId) {
  const layout = buildFecLayoutParticipantContent(participantId);

  return {
    mode: layout.mode,
    centerContent: layout.centerContent,
    uvpDetailContent: layout.uvpDetailContent,
    boxContents: layout.boxContents,
    complexContents: layout.complexContents ?? {},
    validationFocus: layout.validationFocus,
    engineBoxesActive: layout.engineBoxesActive,
    boxScores: layout.boxScores,
    headerMeta: layout.headerMeta,
    canvasHref: internFecCanvasHref(),
  };
}

/**
 * @param {string} participantId
 * @param {{ week: number, day: number, segment?: number, blueprint_completion?: number }} state
 * @param {string} [squadNameFallback]
 */
export function deriveMyVentureHq(participantId, state, squadNameFallback = '') {
  const identity = deriveVentureIdentity(participantId, squadNameFallback);
  const stage = deriveVentureStage(state, participantId);
  const today = deriveVentureTodayMission(participantId, {
    week: state.week ?? 1,
    segment: state.segment ?? 1,
    day: state.day ?? 1,
    blueprint_completion: state.blueprint_completion,
  });
  const milestones = deriveVentureMilestones(participantId);
  const fecPreview = buildFecPreviewContent(participantId);

  return { identity, stage, today, milestones, fecPreview };
}
