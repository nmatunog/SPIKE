import { getRaSpikeAssignment } from './ra-spike-assignments.js';
import { getRaSpikeContext } from './ra-spike-context.js';
import { getRaSpikeAssignmentStatus } from '../raSpikeWeekProgress.js';
import { isRaSpikeWeekContentReady } from '../raSpikeContentLoader.js';
import { ROUTES } from '../../routes/paths.js';

/**
 * Home dashboard model — participant unlock week only; assignment only when content is authored.
 *
 * @param {object | null | undefined} internProgress
 * @param {string | null | undefined} _cohortStartDate unused (kept for call-site compat)
 * @param {string} [participantId]
 */
export function deriveRaSpikeHomeModel(internProgress, _cohortStartDate, participantId = '') {
  const ctx = getRaSpikeContext(internProgress);
  const week = ctx.week;
  const contentReady = isRaSpikeWeekContentReady(week);
  const assignment = contentReady ? getRaSpikeAssignment(week) : null;
  const assignmentStatus = assignment && participantId
    ? getRaSpikeAssignmentStatus(participantId, week)
    : 'not_started';

  const continueLabel = !contentReady
    ? 'Open Playbook'
    : assignmentStatus === 'complete'
      ? 'Review this week\'s playbook'
      : 'Continue in Playbook';

  return {
    ctx,
    contentReady,
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
