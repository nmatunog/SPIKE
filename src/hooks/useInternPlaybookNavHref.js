import { useMemo } from 'react';
import { useCohortProgramDay } from './useCohortProgramDay.js';
import { useAuth } from '../AuthContext.jsx';
import { listPendingPlaybookReflections } from '../lib/pendingPlaybookReflectionService.js';
import { playbookHref, playbookReflectionHref } from '../routes/paths.js';

/**
 * Playbook nav target for interns — today's cohort calendar week/day.
 * Adds reflection=1 when today's closing reflection is still due.
 */
export function useInternPlaybookNavHref() {
  const { user } = useAuth();
  const { programDay, ready } = useCohortProgramDay();
  const participantId = user?.role === 'INTERN' ? user.id : '';

  return useMemo(() => {
    if (!ready) return playbookHref({ segment: 1, week: 2, day: 1 });

    const base = { segment: 1, week: programDay.week, day: programDay.day };
    if (!participantId) return playbookHref(base);

    const pendingToday = listPendingPlaybookReflections(participantId, programDay).find(
      (row) => row.week === programDay.week && row.day === programDay.day,
    );
    return pendingToday ? playbookReflectionHref(base) : playbookHref(base);
  }, [ready, programDay, participantId]);
}
