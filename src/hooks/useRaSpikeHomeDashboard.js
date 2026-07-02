import { useEffect, useMemo, useState } from 'react';
import { deriveRaSpikeHomeModel } from '../lib/programs/ra-spike-home.js';
import { resolveRaSpikeNextSession } from '../lib/programs/ra-spike-session.js';
import { fetchActiveCohort } from '../lib/supabase/cohortOnboarding.js';
import { fetchCohortStartDate, fetchRaSpikeSquadSummary } from '../lib/supabase/raSpikeSquad.js';
import { isMockUserId } from '../lib/mockAuth.js';
import { DEFAULT_COHORT_START_DATE } from '../lib/programCalendar.js';

/**
 * @param {{ id?: string, name?: string, internProgress?: object | null } | null | undefined} user
 */
export function useRaSpikeHomeDashboard(user) {
  const [cohortStartDate, setCohortStartDate] = useState(null);
  const [squadSummary, setSquadSummary] = useState(null);
  const [loading, setLoading] = useState(true);

  const participantId = user?.id ?? '';
  const internProgress = user?.internProgress;

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      try {
        const cohortId = internProgress?.cohort_id;
        let start = cohortId ? await fetchCohortStartDate(cohortId) : null;
        if (!start) {
          const active = await fetchActiveCohort().catch(() => null);
          start = active?.start_date?.slice?.(0, 10) ?? active?.starts_on?.slice?.(0, 10) ?? null;
        }
        const squad = participantId ? await fetchRaSpikeSquadSummary(participantId) : null;

        if (!cancelled) {
          setCohortStartDate(start);
          setSquadSummary(squad);
        }
      } catch {
        if (!cancelled) {
          setCohortStartDate(null);
          setSquadSummary(null);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [participantId, internProgress?.cohort_id]);

  const effectiveStart = cohortStartDate ?? DEFAULT_COHORT_START_DATE;

  const model = useMemo(
    () => deriveRaSpikeHomeModel(internProgress, effectiveStart, participantId),
    [internProgress, effectiveStart, participantId],
  );

  const nextSession = useMemo(
    () => resolveRaSpikeNextSession(effectiveStart, model.ctx.week),
    [effectiveStart, model.ctx.week],
  );

  const squad = useMemo(() => {
    if (squadSummary?.squadName) {
      return {
        name: squadSummary.squadName,
        memberCount: squadSummary.memberCount,
        motto: squadSummary.motto,
        forming: false,
      };
    }
    const fallbackName = internProgress?.squad?.trim();
    if (fallbackName) {
      return {
        name: fallbackName,
        memberCount: isMockUserId(participantId) ? 3 : 1,
        motto: null,
        forming: fallbackName.includes('forming'),
      };
    }
    return { name: null, memberCount: 0, motto: null, forming: true };
  }, [squadSummary, internProgress?.squad, participantId]);

  return {
    loading,
    model,
    nextSession,
    squad,
    cohortStartDate: effectiveStart,
  };
}
