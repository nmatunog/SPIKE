/**
 * Mentor Operating Framework — Week 1 dashboard derivations and participant profiles.
 */
import { computeCanvasCompletionPct } from './canvasService.js';
import { isBuilderCompleted } from './day1BuilderService.js';
import { listCoachingNotesForParticipant } from './coachingService.js';
import { deriveBlueprintCompletionPct, deriveMentorRiskFlags, groupInternsBySquad } from './facultyMentorFrameworkService.js';
import { deriveWeekDay } from './sprint01Metrics.js';
import { generateVenturePortfolio } from '../services/portfolioGenerator.js';
import { getCoachSummaryForMentor } from './ventureCoachService.js';
import { getWeeklyAssessment } from './weeklyAssessmentService.js';
import { VENTURE_DIRECTION_CARDS } from './ventureCoachConstants.js';

export { groupInternsBySquad, deriveMentorRiskFlags, deriveBlueprintCompletionPct };

/** @param {string} participantId */
export function getParticipantWeek1Outputs(participantId) {
  const coach = getCoachSummaryForMentor(participantId);
  const portfolio = generateVenturePortfolio(participantId, { participantName: '' });
  const canvasPct = computeCanvasCompletionPct(participantId);

  return {
    ambition: Boolean(coach?.ambition?.trim()),
    impact: Boolean((coach?.impact ?? coach?.purpose)?.trim()),
    values: Boolean(coach?.topThreeValues?.length),
    tagline: Boolean(coach?.tagline?.trim()),
    futureSelf: Boolean(coach?.futureSelf?.trim()),
    careerDirection: Boolean(coach?.ventureDirection && coach.ventureDirection !== 'undecided'),
    squadMembership: Boolean(portfolio.cover.squad && portfolio.cover.squad !== 'Squad forming'),
    squadCharter: isBuilderCompleted(participantId, 'squad-charter'),
    dreamBoard: portfolio.dreamBoard.completed,
    feCanvas: canvasPct >= 30,
    portfolio: portfolio.cover.portfolioCompletion >= 15,
  };
}

/** @param {ReturnType<typeof getParticipantWeek1Outputs>} outputs */
export function week1OutputCompletionPct(outputs) {
  const keys = [
    'ambition',
    'impact',
    'values',
    'futureSelf',
    'careerDirection',
    'squadMembership',
    'squadCharter',
    'feCanvas',
    'portfolio',
  ];
  const done = keys.filter((key) => outputs[key]).length;
  return Math.round((done / keys.length) * 100);
}

/**
 * @param {Array<{ id: string, name: string, hours?: number, squad?: string, licensed?: boolean }>} interns
 * @param {number} [week]
 */
export function deriveCoachingQueue(interns, week = 1) {
  const now = Date.now();
  /** @type {Record<string, Array<{ id: string, name: string, reason: string }>>} */
  const buckets = {
    needs_review: [],
    needs_follow_up: [],
    at_risk: [],
    incomplete_outputs: [],
  };

  for (const intern of interns) {
    const notes = listCoachingNotesForParticipant(intern.id);
    const weekNotes = notes.filter((n) => (n.week ?? 1) === week);
    const followUpDue = notes.find(
      (n) =>
        n.followUpRequired &&
        !n.completed &&
        n.followUpDate &&
        new Date(n.followUpDate).getTime() <= now,
    );
    const flagged = notes.some((n) => n.concernFlagged && !n.completed);
    const assessment = getWeeklyAssessment(intern.id, week);
    const outputs = getParticipantWeek1Outputs(intern.id);
    const outputPct = week1OutputCompletionPct(outputs);
    const licensingRisk = !intern.licensed && (intern.hours ?? 0) >= 85 && (intern.hours ?? 0) < 115;

    if (weekNotes.length === 0) {
      buckets.needs_review.push({ id: intern.id, name: intern.name, reason: 'No coaching conversation logged this week' });
    }
    if (followUpDue) {
      buckets.needs_follow_up.push({
        id: intern.id,
        name: intern.name,
        reason: `Follow-up due ${followUpDue.followUpDate}`,
      });
    }
    if (flagged || licensingRisk || (assessment && averageScores(assessment.scores) < 2.5)) {
      buckets.at_risk.push({
        id: intern.id,
        name: intern.name,
        reason: flagged ? 'Concern flagged' : licensingRisk ? 'Licensing window' : 'Low assessment scores',
      });
    }
    if (outputPct < 60) {
      buckets.incomplete_outputs.push({
        id: intern.id,
        name: intern.name,
        reason: `${outputPct}% Week 1 outputs complete`,
      });
    }
  }

  return buckets;
}

/** @param {Record<string, number>} scores */
function averageScores(scores) {
  const values = Object.values(scores ?? {}).filter((v) => v > 0);
  if (!values.length) return 0;
  return values.reduce((a, b) => a + b, 0) / values.length;
}

/**
 * Cohort day completion for Week 1 — % of participants meeting day milestones.
 * @param {Array<{ id: string, hours?: number }>} interns
 */
export function deriveWeek1DayProgress(interns) {
  if (!interns.length) {
    return [1, 2, 3, 4, 5].map((day) => ({ day, label: `Day ${day}`, completePct: 0 }));
  }

  const dayChecks = [
    (id) => {
      const o = getParticipantWeek1Outputs(id);
      return o.ambition && o.impact && o.values;
    },
    (id) => (interns.find((i) => i.id === id)?.hours ?? 0) >= 8,
    (id) => (interns.find((i) => i.id === id)?.hours ?? 0) >= 16,
    (id) => {
      const o = getParticipantWeek1Outputs(id);
      return o.careerDirection || o.feCanvas;
    },
    (id) => {
      const coach = getCoachSummaryForMentor(id);
      return Boolean(getWeeklyAssessment(id, 1)) || (coach?.progress?.percent ?? 0) >= 80;
    },
  ];

  return dayChecks.map((check, index) => {
    const day = index + 1;
    const complete = interns.filter((i) => check(i.id)).length;
    return {
      day,
      label: `Day ${day}`,
      completePct: Math.round((complete / interns.length) * 100),
      completeCount: complete,
      total: interns.length,
    };
  });
}

/**
 * @param {Array<{ id: string, name: string, hours?: number, squad?: string, licensed?: boolean }>} interns
 */
export function deriveAssignedParticipants(interns) {
  return interns.map((intern) => {
    const coach = getCoachSummaryForMentor(intern.id);
    const track =
      VENTURE_DIRECTION_CARDS.find((c) => c.id === coach?.ventureDirection)?.label ?? 'Exploring';
    const { currentWeek, currentDay } = deriveWeekDay(intern.hours ?? 0);

    return {
      id: intern.id,
      name: intern.name,
      squad: intern.squad ?? 'Unassigned',
      careerTrack: track,
      progressPct: deriveBlueprintCompletionPct(intern.id),
      hours: intern.hours ?? 0,
      currentWeek,
      currentDay,
      week1OutputsPct: week1OutputCompletionPct(getParticipantWeek1Outputs(intern.id)),
    };
  });
}

/**
 * @param {Array<{ name: string, members: Array<{ id: string, name: string }>, count: number }>} squads
 */
export function deriveSquadSummaries(squads) {
  return squads.map((squad) => {
    const memberIds = squad.members.map((m) => m.id);
    const avgProgress = memberIds.length
      ? Math.round(
          memberIds.reduce((sum, id) => sum + deriveBlueprintCompletionPct(id), 0) / memberIds.length,
        )
      : 0;
    const allComplete = memberIds.every((id) => week1OutputCompletionPct(getParticipantWeek1Outputs(id)) >= 80);

    return {
      name: squad.name,
      members: squad.count,
      completionPct: avgProgress,
      status: allComplete ? 'On track' : avgProgress >= 50 ? 'In progress' : 'Needs attention',
    };
  });
}

/**
 * Build Week 1 coaching summary from notes + assessment.
 * @param {string} participantId
 * @param {string} participantName
 * @param {{ squad?: string }} [meta]
 */
export function buildWeek1CoachingSummary(participantId, participantName, meta = {}) {
  const coach = getCoachSummaryForMentor(participantId);
  const assessment = getWeeklyAssessment(participantId, 1);
  const notes = listCoachingNotesForParticipant(participantId).slice(0, 10);
  const track =
    VENTURE_DIRECTION_CARDS.find((c) => c.id === coach?.ventureDirection)?.label ?? 'Exploring';

  const strengthsFromNotes = notes
    .map((n) => n.strengths?.trim())
    .filter(Boolean)
    .slice(0, 3);
  const growthFromNotes = notes
    .map((n) => n.growthAreas?.trim())
    .filter(Boolean)
    .slice(0, 3);
  const actionsFromNotes = notes
    .flatMap((n) => n.actionItems ?? [])
    .filter(Boolean)
    .slice(0, 3);

  const recommendationLabel =
    assessment?.recommendation === 'monitor_closely'
      ? 'Monitor Closely'
      : assessment?.recommendation === 'needs_coaching'
        ? 'Needs Additional Coaching'
        : assessment?.recommendation === 'future_leader'
          ? 'Potential Future Leader'
          : 'Continue Normally';

  return {
    participantName,
    squad: meta.squad ?? '—',
    careerDirection: track,
    strengths: strengthsFromNotes.length ? strengthsFromNotes : ['Engaged in identity work', 'Shows curiosity', 'Participates in squad'],
    growthAreas: growthFromNotes.length ? growthFromNotes : ['Deepen industry connection', 'Sharpen customer empathy', 'Commit to venture path'],
    recommendedActions: actionsFromNotes.length
      ? actionsFromNotes
      : ['Complete remaining Venture Coach sections', 'Schedule follow-up coaching', 'Publish Week 1 portfolio draft'],
    mentorRecommendation: recommendationLabel,
    assessmentScores: assessment?.scores ?? {},
    generatedAt: new Date().toISOString(),
  };
}
