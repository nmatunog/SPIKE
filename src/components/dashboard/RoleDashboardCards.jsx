import { MetricCard } from './MetricCard.jsx';
import {
  deriveAdminDashboardMetrics,
  deriveFacultyDashboardMetrics,
  deriveInternDashboardMetrics,
  deriveMentorDashboardMetrics,
} from '../../lib/sprint01Metrics.js';

export function RoleDashboardCards({ role, user, interns, internSummary }) {
  if (role === 'intern') {
    const m = deriveInternDashboardMetrics(user?.internProgress, user?.id);
    return (
      <div className="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-7">
          <MetricCard label="Segment" value={`Seg ${m.segment}`} sub={m.segmentStatus} />
          <MetricCard label="Week" value={m.currentWeek} accent="blue" />
          <MetricCard label="Day" value={m.currentDay} accent="blue" />
          <MetricCard label="Hours" value={`${m.hoursCompleted}/600`} />
          <MetricCard label="Portfolio" value={`${m.portfolioPct}%`} accent="green" />
          <MetricCard label="Pending" value={m.pendingDeliverables} accent="amber" sub="deliverables" />
          <MetricCard
            label="Mentor feedback"
            value="Active"
            accent="green"
            sub={m.mentorFeedback}
            className="sm:col-span-2 lg:col-span-2 2xl:col-span-1"
          />
      </div>
    );
  }

  if (role === 'mentor') {
    const m = deriveMentorDashboardMetrics(interns, internSummary);
    return (
      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <MetricCard label="Assigned participants" value={m.assignedParticipants} />
          <MetricCard label="Coaching notes" value={m.coachingNotesOpen} accent="amber" sub="open items" />
          <MetricCard label="Portfolio progress" value={`${m.portfolioProgressAvg}%`} accent="green" sub="cohort avg" />
          <MetricCard label="At-risk" value={m.atRiskParticipants} accent="amber" sub="licensing window" />
      </div>
    );
  }

  if (role === 'faculty') {
    const m = deriveFacultyDashboardMetrics(internSummary);
    return (
      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <MetricCard label="Cohort progress" value={`${m.cohortProgress}%`} />
          <MetricCard label="Attendance" value={`${m.attendance}%`} accent="green" />
          <MetricCard label="Submissions" value={m.submissionsPending} accent="amber" sub="pending review" />
          <MetricCard label="Assessments" value={`${m.assessmentPassRate}%`} accent="blue" sub="pass rate" />
      </div>
    );
  }

  if (role === 'admin') {
    const m = deriveAdminDashboardMetrics(interns, internSummary);
    const { s1, s2, s3 } = m.segmentDistribution;
    return (
      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <MetricCard label="Active participants" value={m.activeParticipants} />
          <MetricCard label="Active cohorts" value={m.activeCohorts} accent="blue" sub="mock until Phase 3" />
          <MetricCard
            label="Segment distribution"
            value={`${s1} · ${s2} · ${s3}`}
            accent="green"
            sub="Seg 1 · 2 · 3"
          />
          <MetricCard
            label="Board readiness"
            value={m.ventureBoardReadiness}
            accent="amber"
            sub="Seg 3 near graduation"
          />
      </div>
    );
  }

  return null;
}
