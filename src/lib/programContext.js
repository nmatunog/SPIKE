/**
 * Canonical week/day context and next-action links across Build · Playbook · Portfolio.
 */
import { buildParticipantState } from './participantState.js';
import { deriveTodayMission } from './buildStudioService.js';
import { resolveInternPlaybookDay, resolveInternProgramWeek } from './programUnlocks.js';
import { deriveProgramDayFromStartDate, effectiveCohortStartDate } from './programCalendar.js';
import { COACH_SECTIONS } from './ventureCoachConstants.js';
import { isCoachSectionComplete } from './ventureCoachStorage.js';
import { ROUTES, playbookHref } from '../routes/paths.js';

/**
 * @param {object | null | undefined} internProgress
 * @param {string} [participantId]
 */
export function getProgramContext(internProgress, participantId = '') {
  const segment = internProgress?.segment ?? 1;
  const calendarDay = deriveProgramDayFromStartDate(effectiveCohortStartDate(null)) ?? {
    week: 1,
    day: 1,
  };
  const week = Math.max(resolveInternProgramWeek(internProgress), calendarDay.week);
  const day = calendarDay.week >= week ? calendarDay.day : resolveInternPlaybookDay(internProgress);
  const state = participantId
    ? buildParticipantState(participantId, internProgress)
    : { week, segment, day, blueprint_completion: internProgress?.blueprint_completion ?? 0 };

  const mission = participantId
    ? deriveTodayMission(participantId, {
        week: state.week ?? week,
        segment: state.segment ?? segment,
        day: state.day ?? day,
        blueprint_completion: state.blueprint_completion,
      })
    : {
        title: 'Continue your program',
        href: ROUTES.ventureBlueprint,
        continueLabel: 'Continue',
        stepLabel: `Week ${week} · Day ${day}`,
      };

  return {
    segment: state.segment ?? segment,
    week: state.week ?? week,
    day: state.day ?? day,
    taskLabel: mission.title,
    stepLabel: mission.stepLabel ?? `Week ${week} · Day ${day}`,
    continueHref: mission.href,
    continueLabel: mission.continueLabel ?? 'Continue',
    playbookHref: playbookHref({ segment: state.segment ?? segment, week: state.week ?? week, day: state.day ?? day }),
  };
}

/** @param {string} participantId */
export function getNextCoachSectionRoute(participantId) {
  const next = COACH_SECTIONS.find((section) => !isCoachSectionComplete(participantId, section.id));
  if (!next) return null;
  return `${ROUTES.ventureBlueprint}/coach/${next.route}`;
}

/** @param {string} participantId */
export function getNextCoachSectionLabel(participantId) {
  const next = COACH_SECTIONS.find((section) => !isCoachSectionComplete(participantId, section.id));
  return next?.label ?? null;
}

/** Week 1 interns use journey-first Build UI (no full LMS module tree). */
export function isWeek1BuildSimplifiedMode(internProgress) {
  const segment = internProgress?.segment ?? 1;
  const week = resolveInternProgramWeek(internProgress);
  return segment === 1 && week <= 1;
}
