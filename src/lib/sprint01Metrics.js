/** Sprint 01 metrics — real hours/segment/licensing + mock fields until Phase 3 schema. */

export function deriveWeekDay(hours) {
  const h = Math.max(0, hours ?? 0);
  const currentWeek = Math.min(Math.floor(h / 40) + 1, 15);
  const currentDay = Math.min(Math.floor((h % 40) / 8) + 1, 5);
  return { currentWeek, currentDay };
}

export function deriveInternDashboardMetrics(progress) {
  const hours = progress?.hours ?? 0;
  const segment = progress?.segment ?? 1;
  const { currentWeek, currentDay } = deriveWeekDay(hours);
  const portfolioPct = Math.min(Math.round((hours / 600) * 22), 22);

  return {
    segment,
    currentWeek,
    currentDay,
    hoursCompleted: hours,
    licensed: progress?.licensed ?? false,
    portfolioPct,
    pendingDeliverables: segment === 1 ? 3 : segment === 2 ? 2 : 1,
    mentorFeedback: hours < 110 ? 'Focus on licensing prep and FNA practice.' : 'Strong traction — prepare market validation pitch.',
    careerTrack: 'Financial Entrepreneur',
    surveyCompletion: hours >= 60 ? 100 : Math.round((hours / 60) * 100),
    fnaCompletion: hours >= 110 ? 100 : Math.round((hours / 110) * 100),
    segmentStatus:
      segment === 1 ? 'Proof of Concept' : segment === 2 ? 'Market Validation' : 'Partnership Track',
  };
}

export function deriveReportRowMetrics(intern) {
  const m = deriveInternDashboardMetrics({ segment: intern.segment, hours: intern.hours, licensed: intern.licensed });
  return {
    portfolioPct: m.portfolioPct,
    licensingStatus: intern.licensed ? 'Licensed' : 'Pending',
    careerTrack: m.careerTrack,
    surveyCompletion: m.surveyCompletion,
    fnaCompletion: m.fnaCompletion,
    segmentStatus: m.segmentStatus,
  };
}

export function deriveMentorDashboardMetrics(interns, internSummary) {
  const avgPortfolio = internSummary.n
    ? Math.round(interns.reduce((a, i) => a + deriveInternDashboardMetrics(i).portfolioPct, 0) / internSummary.n)
    : 0;
  const atRisk = interns.filter((i) => !i.licensed && i.hours >= 85 && i.hours < 115).length;

  return {
    assignedParticipants: internSummary.n,
    coachingNotesOpen: Math.min(internSummary.n, 5),
    portfolioProgressAvg: avgPortfolio,
    atRiskParticipants: atRisk,
  };
}

export function deriveFacultyDashboardMetrics(internSummary) {
  const completion = internSummary.n ? Math.round((internSummary.avgHours / 600) * 100) : 0;
  return {
    cohortProgress: Math.min(completion + 12, 100),
    attendance: 94,
    submissionsPending: Math.max(internSummary.s1, 2),
    assessmentPassRate: 87,
  };
}

export function deriveAdminDashboardMetrics(interns, internSummary) {
  const boardReady = interns.filter((i) => i.segment === 3 && i.hours >= 480).length;
  return {
    activeParticipants: internSummary.n,
    activeCohorts: 2,
    segmentDistribution: internSummary,
    ventureBoardReadiness: boardReady,
  };
}

export function portfolioSectionProgress(hours, sectionIndex) {
  const base = Math.min(Math.round((hours / 600) * 100), 100);
  const offset = sectionIndex * 3;
  return Math.max(0, Math.min(base - offset, 100));
}
