/**
 * Week 1 participant journey — deliverable validation and portfolio readiness.
 */
import { computeCanvasCompletionPct } from './canvasService.js';
import { isBuilderCompleted } from './day1BuilderService.js';
import { WEEK1_DAY_META, WEEK1_MENTOR_OUTCOMES } from './mentorWeek1Constants.js';
import { countSubmittedSurveys } from './surveyService.js';
import { getCoachSummaryForMentor, getCoachProgress } from './ventureCoachService.js';
import { ensureFormationStore } from './cohortFormationStorage.js';
import { hasAssignedSquad } from './participantSquadCache.js';

/** @typedef {{ id: string, label: string, done: boolean, href?: string }} Week1Deliverable */

/** @param {string} participantId */
export function getWeek1DeliverableStatus(participantId) {
  const coach = getCoachSummaryForMentor(participantId);
  const progress = coach?.progress ?? getCoachProgress(participantId);
  const coachPercent = progress.percent ?? 0;
  const canvasPct = computeCanvasCompletionPct(participantId);
  const surveys = countSubmittedSurveys(participantId);
  const dreamBoardCompleted = isBuilderCompleted(participantId, 'dream-board');

  const outputs = {
    ambition: Boolean(coach?.ambition?.trim()),
    impact: Boolean((coach?.impact ?? coach?.purpose)?.trim()),
    values: Boolean(coach?.topThreeValues?.length),
    tagline: Boolean(coach?.tagline?.trim()),
    futureSelf: Boolean(coach?.futureSelf?.trim()),
    careerDirection: Boolean(coach?.ventureDirection && coach.ventureDirection !== 'undecided'),
    squadMembership: hasSquadMembership(participantId),
    squadCharter: isBuilderCompleted(participantId, 'squad-charter'),
    dreamBoard: dreamBoardCompleted,
    feCanvas: canvasPct >= 30,
    portfolio: coachPercent >= 15 || dreamBoardCompleted,
  };

  return { outputs, coachPercent, canvasPct, surveys };
}

/** @param {string} participantId @param {number} day */
export function isWeek1DayComplete(participantId, day) {
  const { outputs, coachPercent, surveys } = getWeek1DeliverableStatus(participantId);

  switch (day) {
    case 1:
      return outputs.ambition && outputs.impact && outputs.values && outputs.squadMembership;
    case 2:
      return surveys > 0 || coachPercent >= 40;
    case 3:
      return surveys > 0 || outputs.dreamBoard;
    case 4:
      return outputs.feCanvas || outputs.careerDirection;
    case 5:
      return coachPercent >= 80 && outputs.portfolio;
    default:
      return false;
  }
}

/** @param {string} participantId */
export function getWeek1DayProgress(participantId) {
  return WEEK1_DAY_META.map((meta) => ({
    ...meta,
    complete: isWeek1DayComplete(participantId, meta.day),
  }));
}

/** @param {string} participantId */
export function getWeek1RequiredOutputs(participantId) {
  const { outputs } = getWeek1DeliverableStatus(participantId);

  /** @type {Week1Deliverable[]} */
  return WEEK1_MENTOR_OUTCOMES.map((label) => {
    const key = labelToOutputKey(label);
    return {
      id: key,
      label,
      done: Boolean(outputs[key]),
      href: outputHref(key),
    };
  });
}

/** @param {string} participantId */
function hasSquadMembership(participantId) {
  if (hasAssignedSquad(participantId)) return true;
  for (const squad of ensureFormationStore().squads) {
    const inSquad = (squad.members ?? []).some((m) => m.participantId === participantId);
    if (inSquad && squad.name) return true;
  }
  return false;
}

/** @param {string} label */
function labelToOutputKey(label) {
  const map = {
    Ambition: 'ambition',
    Impact: 'impact',
    Values: 'values',
    'Future Self Narrative': 'futureSelf',
    'Career Direction': 'careerDirection',
    'Squad Membership': 'squadMembership',
    'Squad Charter': 'squadCharter',
    'FE Canvas v1': 'feCanvas',
    'Portfolio v1': 'portfolio',
  };
  return map[label] ?? label.toLowerCase().replace(/\s+/g, '_');
}

/** @param {string} key */
function outputHref(key) {
  const routes = {
    ambition: '/venture-blueprint/coach/ambition',
    impact: '/venture-blueprint/coach/impact',
    values: '/venture-blueprint/coach/values',
    futureSelf: '/venture-blueprint/coach/future-self',
    careerDirection: '/venture-blueprint/coach/venture-direction',
    squadMembership: '/squad',
    squadCharter: '/squad-charter',
    dreamBoard: '/venture-blueprint/day-1-builders',
    feCanvas: '/venture-blueprint/canvas',
    portfolio: '/my-venture-portfolio',
  };
  return routes[key];
}

/** @param {string} participantId */
export function week1CompletionPct(participantId) {
  const required = getWeek1RequiredOutputs(participantId);
  const done = required.filter((item) => item.done).length;
  return Math.round((done / required.length) * 100);
}

/** @param {string} participantId */
export function isWeek1PresentationReady(participantId) {
  const { outputs, coachPercent } = getWeek1DeliverableStatus(participantId);
  const critical = [
    outputs.ambition,
    outputs.impact,
    outputs.values,
    outputs.futureSelf,
    outputs.careerDirection,
    outputs.dreamBoard,
    outputs.feCanvas,
    outputs.portfolio,
    coachPercent >= 60,
  ];
  return critical.filter(Boolean).length >= 7;
}
