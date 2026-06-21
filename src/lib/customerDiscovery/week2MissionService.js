/**
 * Week 2 mission track derivation — Duolingo-style task queue.
 */
import { ROUTES } from '../../routes/paths.js';
import { loadWeek2Discovery, saveWeek2Discovery } from './week2DiscoveryStorage.js';
import { WEEK2_MISSION_TASKS, MAX_INTERVIEW_QUESTIONS } from './week2Constants.js';

const BASE = `${ROUTES.ventureBlueprint}/customer-discovery`;

/** @param {string} participantId */
function isTaskComplete(participantId, taskId) {
  const state = loadWeek2Discovery(participantId);
  switch (taskId) {
    case 'mission':
      return Boolean(state.missionAcknowledged);
    case 'guide': {
      const filled = (state.questions ?? []).filter((q) => String(q.text ?? '').trim().length > 8);
      return filled.length >= MAX_INTERVIEW_QUESTIONS || Boolean(state.guideCompletedAt);
    }
    case 'thinking':
      return (state.thinkingShifts ?? []).some((s) => String(s.response ?? '').trim().length > 10);
    default:
      return false;
  }
}

/**
 * Playbook URL for Week 2 mission track (intern mission-first entry).
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

/** @param {string} [taskSlug] @param {'blueprint' | 'playbook'} [context] */
export function week2MissionHref(taskSlug, context = 'blueprint') {
  if (context === 'playbook') return playbookWeek2MissionHref(taskSlug);
  return customerDiscoveryHref(taskSlug);
}

/** @param {string} participantId @param {'blueprint' | 'playbook'} [context] */
export function deriveWeek2MissionTrack(participantId, context = 'blueprint') {
  return WEEK2_MISSION_TASKS.map((task, index) => ({
    ...task,
    index: index + 1,
    href: week2MissionHref(task.slug, context),
    complete: isTaskComplete(participantId, task.id),
  }));
}

/** @param {string} participantId */
export function getActiveWeek2Task(participantId) {
  const track = deriveWeek2MissionTrack(participantId);
  return track.find((t) => !t.complete) ?? track[track.length - 1];
}

/** @param {string} participantId @param {string} taskId */
export function markWeek2TaskComplete(participantId, taskId) {
  if (taskId === 'mission') {
    return saveWeek2Discovery(participantId, { missionAcknowledged: true });
  }
  if (taskId === 'guide') {
    return saveWeek2Discovery(participantId, { guideCompletedAt: new Date().toISOString() });
  }
  return loadWeek2Discovery(participantId);
}

/** @param {string} participantId */
export function week2MissionProgressPct(participantId) {
  const track = deriveWeek2MissionTrack(participantId);
  const done = track.filter((t) => t.complete).length;
  return Math.round((done / track.length) * 100);
}

/** @param {string} participantId @param {string} [taskSlug] */
export function customerDiscoveryHref(taskSlug) {
  if (!taskSlug) return BASE;
  return `${BASE}/${taskSlug}`;
}
