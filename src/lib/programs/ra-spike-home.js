import { getRaSpikeAssignment } from './ra-spike-assignments.js';
import { getRaSpikeContext } from './ra-spike-context.js';
import { getRaSpikeAssignmentStatus } from '../raSpikeWeekProgress.js';
import { ROUTES } from '../../routes/paths.js';

/**
 * Home dashboard model — uses participant unlock week only (never calendar week).
 * Calendar dates may inform session scheduling, not which curriculum is shown.
 *
 * @param {object | null | undefined} internProgress
 * @param {string | null | undefined} _cohortStartDate unused (kept for call-site compat)
 * @param {string} [participantId]
 */
export function deriveRaSpikeHomeModel(internProgress, _cohortStartDate, participantId = '') {
  const ctx = getRaSpikeContext(internProgress);
  const week = ctx.week;
  const assignment = getRaSpikeAssignment(week);
  const assignmentStatus = participantId
    ? getRaSpikeAssignmentStatus(participantId, week)
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
