/**
 * Faculty Operating Framework — Week 1 dashboard derivations.
 */
import { countAssessmentsForParticipants } from './weeklyAssessmentService.js';
import { countCoachingNotesForParticipants } from './coachingService.js';
import { deriveWeek1DayProgress } from './mentorFrameworkService.js';
import { isWeek1DayComplete, week1CompletionPct } from './week1JourneyService.js';
import { WEEK1_FACULTY_DAY_META } from './facultyWeek1Constants.js';

export { deriveWeek1DayProgress };

/**
 * @param {Array<{ id: string, name: string, squad?: string }>} interns
 */
export function deriveFacultyParticipantSubmissions(interns) {
  return interns.map((intern) => {
    const dayStatus = WEEK1_FACULTY_DAY_META.map((meta) => ({
      day: meta.day,
      complete: isWeek1DayComplete(intern.id, meta.day),
    }));

    return {
      id: intern.id,
      name: intern.name,
      squad: intern.squad ?? 'Unassigned',
      week1Pct: week1CompletionPct(intern.id),
      dayStatus,
      daysComplete: dayStatus.filter((d) => d.complete).length,
    };
  });
}

/**
 * @param {Array<{ id: string }>} interns
 */
export function deriveFacultyAssessmentCoverage(interns) {
  const ids = interns.map((i) => i.id);
  const withCoaching = countCoachingNotesForParticipants(ids);
  const withAssessment = countAssessmentsForParticipants(ids, 1);
  const n = interns.length || 1;

  return {
    coachingPct: Math.round((withCoaching / n) * 100),
    assessmentPct: Math.round((withAssessment / n) * 100),
    coachingCount: withCoaching,
    assessmentCount: withAssessment,
    total: interns.length,
  };
}

/**
 * Cohort submission summary — avg % complete per day.
 * @param {Array<{ id: string }>} interns
 */
export function deriveFacultySubmissionSummary(interns) {
  if (!interns.length) {
    return WEEK1_FACULTY_DAY_META.map((meta) => ({
      day: meta.day,
      theme: meta.theme,
      completePct: 0,
      completeCount: 0,
      total: 0,
    }));
  }

  return WEEK1_FACULTY_DAY_META.map((meta) => {
    const complete = interns.filter((i) => isWeek1DayComplete(i.id, meta.day)).length;
    return {
      day: meta.day,
      theme: meta.theme,
      completePct: Math.round((complete / interns.length) * 100),
      completeCount: complete,
      total: interns.length,
    };
  });
}
