/**
 * Week 2 mission track — day-aware, phase-unlock journey.
 */
import { ROUTES } from '../../routes/paths.js';
import { loadWeek2Discovery, saveWeek2Discovery } from './week2DiscoveryStorage.js';
import {
  getWeek2PhaseForDay,
  getWeek2TasksForDay,
  allWeek2MissionTasks,
  WEEK2_JOURNEY_PHASES,
} from './week2JourneyConstants.js';
import { MIN_ENCODED_INTERVIEWS } from './week2Constants.js';

const BASE = `${ROUTES.ventureBlueprint}/customer-discovery`;

/** @param {import('./week2DiscoveryTypes.js').Week2DiscoveryState} state */
function encodedCount(state) {
  return (state.interviews ?? []).filter((i) => i.encoded).length;
}

/** @param {string} participantId @param {string} taskId */
function isTaskComplete(participantId, taskId) {
  const state = loadWeek2Discovery(participantId);
  switch (taskId) {
    case 'mission':
      return Boolean(state.missionAcknowledged);
    case 'assumptions':
      return Boolean(state.assumptionsCompletedAt);
    case 'guide':
      return Boolean(state.guideCompletedAt);
    case 'research-plan':
      return Boolean(state.researchPlanSubmittedAt);
    case 'squad-align':
      return Boolean(state.squadAlignedAt);
    case 'interview-1':
    case 'interview-2':
    case 'interview-3':
    case 'interview-4':
    case 'interview-5': {
      const idx = Number(taskId.replace('interview-', '')) - 1;
      const iv = (state.interviews ?? [])[idx];
      return Boolean(iv?.encoded);
    }
    case 'exchange':
      return Boolean(state.exchangeReflectionAt);
    case 'readiness':
      return Boolean(state.professionalReadinessAt);
    case 'readiness-reflect':
      return Boolean(state.readinessReflectionAt);
    case 'synthesis':
      return Boolean(state.synthesisReviewedAt);
    case 'intelligence-board':
      return Boolean(state.intelligenceBoardAt);
    case 'pitch-start':
      return Boolean(state.pitchStartedAt);
    case 'validation-pitch':
      return Boolean(state.pitchSubmittedAt);
    default:
      return false;
  }
}

/** @param {string} participantId @param {number} day */
function isDayPhaseComplete(participantId, day) {
  const tasks = getWeek2TasksForDay(day);
  const required = tasks.filter((t) => !t.optional);
  if (!required.length) return true;
  return required.every((t) => isTaskComplete(participantId, t.id));
}

/** @param {string} participantId @param {number} day */
export function isWeek2DayUnlocked(participantId, day) {
  if (day <= 1) return true;
  for (let d = 1; d < day; d += 1) {
    if (!isDayPhaseComplete(participantId, d)) return false;
  }
  return true;
}

/**
 * @param {string} participantId
 * @param {number} [calendarDay] Cohort calendar day 1–5 for week 2
 */
export function resolveWeek2PlaybookDay(participantId, calendarDay = 1) {
  const day = Math.max(1, Math.min(5, calendarDay));
  if (isWeek2DayUnlocked(participantId, day)) return day;
  for (let d = day; d >= 1; d -= 1) {
    if (isWeek2DayUnlocked(participantId, d)) return d;
  }
  return 1;
}

/**
 * @param {string} [taskSlug]
 * @param {{ segment?: number, week?: number, day?: number }} [opts]
 */
export function playbookWeek2MissionHref(taskSlug = 'mission', opts = {}) {
  const params = new URLSearchParams({
    segment: String(opts.segment ?? 1),
    week: String(opts.week ?? 2),
    day: String(opts.day ?? 1),
    mission: taskSlug,
  });
  return `${ROUTES.playbook}?${params.toString()}`;
}

/** @param {string} taskSlug @param {'blueprint' | 'playbook'} context @param {number} [day] */
export function week2MissionHref(taskSlug, context = 'blueprint', day = 1) {
  if (context === 'playbook') return playbookWeek2MissionHref(taskSlug, { day });
  return customerDiscoveryHref(taskSlug);
}

/**
 * @param {string} participantId
 * @param {'blueprint' | 'playbook'} [context]
 * @param {number} [day]
 */
export function deriveWeek2MissionTrack(participantId, context = 'blueprint', day = 1) {
  const d = Math.max(1, Math.min(5, day));
  const dayUnlocked = isWeek2DayUnlocked(participantId, d);
  return getWeek2TasksForDay(d).map((task, index) => ({
    ...task,
    index: index + 1,
    href: week2MissionHref(task.slug, context, d),
    complete: isTaskComplete(participantId, task.id),
    locked: !dayUnlocked,
  }));
}

/** @param {string} participantId @param {number} [day] */
export function getActiveWeek2Task(participantId, day = 1) {
  const track = deriveWeek2MissionTrack(participantId, 'playbook', day);
  const unlocked = track.filter((t) => !t.locked);
  return unlocked.find((t) => !t.complete) ?? unlocked[unlocked.length - 1] ?? track[0];
}

/**
 * @param {string} participantId
 * @param {number} [calendarDay]
 */
export function deriveWeek2JourneyProgress(participantId, calendarDay = 5) {
  const maxDay = Math.max(1, Math.min(5, calendarDay));
  return WEEK2_JOURNEY_PHASES.map((phase) => {
    const tasks = getWeek2TasksForDay(phase.day);
    const required = tasks.filter((t) => !t.optional);
    const done = required.filter((t) => isTaskComplete(participantId, t.id)).length;
    const complete = isDayPhaseComplete(participantId, phase.day);
    const unlocked = phase.day <= maxDay && isWeek2DayUnlocked(participantId, phase.day);
    const active = unlocked && !complete && phase.day === resolveWeek2PlaybookDay(participantId, maxDay);
    return {
      ...phase,
      complete,
      unlocked,
      active,
      progressPct: required.length ? Math.round((done / required.length) * 100) : 0,
      href: playbookWeek2MissionHref(getActiveWeek2Task(participantId, phase.day).slug, { day: phase.day }),
    };
  });
}

/** @param {string} participantId @param {number} [day] */
export function week2MissionProgressPct(participantId, day = 1) {
  const track = deriveWeek2MissionTrack(participantId, 'playbook', day);
  const eligible = track.filter((t) => !t.locked && !t.optional);
  if (!eligible.length) return 0;
  const done = eligible.filter((t) => t.complete).length;
  return Math.round((done / eligible.length) * 100);
}

/** @param {string} participantId */
export function week2OverallProgressPct(participantId) {
  const tasks = allWeek2MissionTasks().filter((t) => !t.optional);
  const done = tasks.filter((t) => isTaskComplete(participantId, t.id)).length;
  return Math.round((done / tasks.length) * 100);
}

/** @param {string} participantId @param {string} taskId */
export function markWeek2TaskComplete(participantId, taskId) {
  const now = new Date().toISOString();
  if (taskId === 'mission') return saveWeek2Discovery(participantId, { missionAcknowledged: true });
  if (taskId === 'guide') return saveWeek2Discovery(participantId, { guideCompletedAt: now });
  return loadWeek2Discovery(participantId);
}

/** @param {string} participantId */
export function week2DiscoverModeReady(participantId) {
  return isDayPhaseComplete(participantId, 1);
}

/** @param {string} participantId */
export function week2MinimumInterviewsMet(participantId) {
  return encodedCount(loadWeek2Discovery(participantId)) >= MIN_ENCODED_INTERVIEWS;
}

/** @param {string} participantId @param {string} [taskSlug] */
export function customerDiscoveryHref(taskSlug) {
  if (!taskSlug) return BASE;
  return `${BASE}/${taskSlug}`;
}

/** @param {number} day */
export function week2PhaseLabel(day) {
  return getWeek2PhaseForDay(day).label;
}
