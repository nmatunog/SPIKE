import { useEffect, useMemo, useState } from 'react';
import { resolveCohortProgramDay } from '../lib/programCalendar.js';
import { fetchActiveCohort } from '../lib/supabase/cohortOnboarding.js';

/**
 * Resolve live cohort Week/Day from intern progress + cohort start date.
 * @param {Array<object>} interns
 */
export function useCohortProgramDay(interns) {
  const [cohortStartDate, setCohortStartDate] = useState(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetchActiveCohort()
      .then((cohort) => {
        if (!cancelled) {
          setCohortStartDate(cohort?.start_date ?? null);
          setReady(true);
        }
      })
      .catch(() => {
        if (!cancelled) setReady(true);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const programDay = useMemo(
    () => resolveCohortProgramDay(interns, cohortStartDate),
    [interns, cohortStartDate],
  );

  return { programDay, ready, cohortStartDate };
}
