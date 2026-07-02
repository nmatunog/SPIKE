import { getRaSpikeAssignment } from './ra-spike-assignments.js';
import { getRaSpikeContext } from './ra-spike-context.js';
import { resolveRaSpikeCalendarWeek } from './ra-spike-session.js';
import { getRaSpikeAssignmentStatus } from '../raSpikeWeekProgress.js';
import { ROUTES } from '../../routes/paths.js';

/**
 * @param {object | null | undefined} internProgress
 * @param {string | null | undefined} cohortStartDate
 * @param {string} [participantId]
 */
export function deriveRaSpikeHomeModel(internProgress, cohortStartDate, participantId = '') {
  const baseCtx = getRaSpikeContext(internProgress);
  const displayWeek = resolveRaSpikeCalendarWeek(
    cohortStartDate,
    internProgress?.ra_spike_current_week ?? 1,
  );
  const ctx = {
    ...baseCtx,
    week: displayWeek,
  };
  const assignment = getRaSpikeAssignment(displayWeek);
  const assignmentStatus = participantId
    ? getRaSpikeAssignmentStatus(participantId, displayWeek)
    : 'not_started';

  const isStageGateWeek = Boolean(ctx.stageGate);
  const continueLabel = isStageGateWeek
    ? `Prepare for ${ctx.stageGate?.label ?? 'stage gate'}`
    : assignmentStatus === 'complete'
      ? 'Review this week\'s playbook'
      : 'Continue in Playbook';

  return {
    ctx,
    assignment,
    assignmentStatus,
    continueHref: ROUTES.raSpikePlaybook,
    continueLabel,
    primaryAction: {
      href: ROUTES.raSpikePlaybook,
      label: continueLabel,
    },
  };
}
