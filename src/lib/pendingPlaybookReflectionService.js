/**
 * Detect incomplete Playbook day reflections for intern prompts.
 */
import { getDayContentBundle } from './curriculumService.js';
import { isReflectionCompleted } from './playbookProgress.js';
import {
  getPlaybookDayReflections,
  weekDayFromReflectionMeta,
} from './dayClosingReflection.js';

/**
 * @param {number} week
 * @param {number} day
 * @returns {import('./contentLoader.js').DayContentBundle | null}
 */
function safeDayBundle(week, day) {
  try {
    return getDayContentBundle('segment-1', `week-${week}`, `day-${day}`) ?? null;
  } catch {
    return null;
  }
}

/**
 * @param {string} participantId
 * @param {{ week: number, day: number }} programDay
 */
export function listPendingPlaybookReflections(participantId, programDay) {
  if (!participantId) return [];

  const programWeek = Math.max(1, programDay.week);
  const programDayNum = Math.max(1, Math.min(5, programDay.day));
  /** @type {Array<{
   *   week: number,
   *   day: number,
   *   reflection: { id: string, title?: string, prompts?: string[], dayId?: string },
   *   label: string,
   *   title: string,
   * }>} */
  const pending = [];

  for (let week = 1; week <= programWeek; week += 1) {
    const lastDay = week < programWeek ? 5 : programDayNum;
    for (let day = 1; day <= lastDay; day += 1) {
      const bundle = safeDayBundle(week, day);
      if (!bundle) continue;

      for (const reflection of getPlaybookDayReflections(bundle)) {
        if (isReflectionCompleted(participantId, reflection.id)) continue;
        const meta = weekDayFromReflectionMeta(reflection.id, reflection.dayId) ?? { week, day };
        pending.push({
          week: meta.week,
          day: meta.day,
          reflection,
          label: `Week ${meta.week} · Day ${meta.day}`,
          title: reflection.title ?? `Day ${meta.day} closing reflection`,
        });
      }
    }
  }

  return pending.sort((a, b) => a.week * 5 + a.day - (b.week * 5 + b.day));
}
