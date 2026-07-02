import { WeeklyCard } from './WeeklyCard.jsx';
import { raSpikePlaybookStepHref } from '../../../routes/paths.js';
import { getStepStatus, isRaSpikeStepUnlocked } from '../../../lib/raSpikeWeekProgress.js';

/**
 * @param {{
 *   week: number,
 *   steps: Array<{ id: string, label: string, summary?: string }>,
 *   progress?: Record<string, string>,
 * }} props
 */
export function WeeklyCardStack({ week, steps, progress = {} }) {
  return (
    <ol className="space-y-3">
      {steps.map((step, index) => {
        const status = getStepStatus(progress, /** @type {import('../../../lib/raSpikeWeekProgress.js').RaSpikeStepId} */ (step.id));
        const locked = !isRaSpikeStepUnlocked(progress, /** @type {import('../../../lib/raSpikeWeekProgress.js').RaSpikeStepId} */ (step.id));
        return (
          <WeeklyCard
            key={step.id}
            index={index}
            stepId={step.id}
            label={step.label}
            summary={step.summary}
            status={status}
            locked={locked}
            href={locked ? undefined : raSpikePlaybookStepHref(step.id, week)}
          />
        );
      })}
    </ol>
  );
}
