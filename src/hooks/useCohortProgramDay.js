import { useEffect, useMemo, useState } from 'react';
import {
  effectiveCohortStartDate,
  resolveStaffProgramDay,
} from '../lib/programCalendar.js';
import { fetchActiveCohort } from '../lib/supabase/cohortOnboarding.js';

/**
 * Resolve live cohort Week/Day for staff home from cohort start date (calendar).
 */
export function useCohortProgramDay() {
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
    () => resolveStaffProgramDay(cohortStartDate),
    [cohortStartDate],
  );

  const effectiveStartDate = useMemo(
    () => effectiveCohortStartDate(cohortStartDate),
    [cohortStartDate],
  );

  return { programDay, ready, cohortStartDate, effectiveStartDate };
}
