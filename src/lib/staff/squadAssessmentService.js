/**
 * Squad-first assessment facade — replaces individual weekly assessment reads.
 */
import { groupInternsBySquad } from '../facultyMentorFrameworkService.js';
import { STAGE_GATE_DECISIONS } from './squadXpConstants.js';
import { getSquadMentorReview, getSquadWeeklyXp } from './squadXpService.js';
import { listSquadInternNotes } from './squadInternNotesService.js';

/** @param {Array<{ id: string, squad?: string }>} interns @param {string} squadName */
export function squadMemberIdsForIntern(interns, squadName) {
  if (!squadName || squadName === 'Unassigned') return [];
  return interns.filter((i) => (i.squad ?? 'Unassigned') === squadName).map((i) => i.id);
}

/** @param {Array<{ id: string, squad?: string }>} interns @param {number} [week] */
export function countSquadsWithReviewForInterns(interns, week = 1) {
  const squads = groupInternsBySquad(interns);
  return squads.filter((s) => Boolean(getSquadMentorReview(s.name, week))).length;
}

/** @param {Array<{ id: string, squad?: string }>} interns @param {number} [week] */
export function squadReviewCoveragePct(interns, week = 1) {
  const squads = groupInternsBySquad(interns);
  if (!squads.length) return 0;
  return Math.round((countSquadsWithReviewForInterns(interns, week) / squads.length) * 100);
}

/**
 * @param {string} participantId
 * @param {string} squadName
 * @param {string[]} memberIds
 * @param {number} [week]
 */
export function getParticipantSquadAssessmentContext(participantId, squadName, memberIds, week = 1) {
  const xp = getSquadWeeklyXp(squadName, memberIds, week);
  const review = getSquadMentorReview(squadName, week);
  const notes = listSquadInternNotes(participantId, week);
  const ratingValues = review
    ? Object.values(review.ratings ?? {}).filter((v) => v > 0)
    : [];
  const avgRating = ratingValues.length
    ? ratingValues.reduce((a, b) => a + b, 0) / ratingValues.length
    : 0;

  return {
    squadXp: xp.totalXp,
    completionPct: xp.completionPct,
    gateDecision: xp.gate?.decision ?? null,
    hasSquadReview: Boolean(review),
    avgSquadRating: avgRating,
    internNotes: notes,
    atRisk: xp.totalXp < 40 && avgRating > 0 && avgRating < 2.5,
  };
}

/** @param {string} participantId @param {string} squadName @param {string[]} memberIds @param {number} [week] */
export function averageSquadRatingForParticipant(participantId, squadName, memberIds, week = 1) {
  return getParticipantSquadAssessmentContext(participantId, squadName, memberIds, week).avgSquadRating;
}

/** @param {string | null | undefined} decision */
export function labelForStageGateDecision(decision) {
  return STAGE_GATE_DECISIONS.find((d) => d.id === decision)?.label ?? null;
}

/** @param {Array<{ id: string, squad?: string }>} interns @param {number} [week] */
export function countInternsInReviewedSquads(interns, week = 1) {
  const squads = groupInternsBySquad(interns);
  return squads
    .filter((s) => Boolean(getSquadMentorReview(s.name, week)))
    .reduce((sum, s) => sum + s.count, 0);
}
