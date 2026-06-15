import { useEffect, useState } from 'react';
import { hydrateParticipantForStaffView, hydrateCohortForStaffView } from '../lib/participantDataHydration.js';

/**
 * Hydrate one participant's Day 1 + blueprint data from Supabase for staff review.
 * @param {string | undefined | null} participantId
 * @param {{ enabled?: boolean }} [opts]
 */
export function useParticipantHydration(participantId, opts = {}) {
  const enabled = opts.enabled !== false;
  const [ready, setReady] = useState(false);
  const [version, setVersion] = useState(0);

  useEffect(() => {
    if (!enabled || !participantId) {
      setReady(false);
      return;
    }
    let cancelled = false;
    setReady(false);
    (async () => {
      await hydrateParticipantForStaffView(participantId, { force: true });
      if (!cancelled) {
        setReady(true);
        setVersion((v) => v + 1);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [participantId, enabled]);

  return { ready, version };
}

/**
 * Hydrate an entire cohort for mentor / program-coach dashboards.
 * @param {string[]} participantIds
 * @param {{ enabled?: boolean, interns?: Array<{ id: string, squad?: string }> }} [opts]
 */
export function useCohortHydration(participantIds, opts = {}) {
  const enabled = opts.enabled !== false;
  const [ready, setReady] = useState(false);
  const [version, setVersion] = useState(0);
  const key = participantIds.join(',');
  const internKey = (opts.interns ?? [])
    .map((i) => `${i.id}:${i.squad ?? ''}`)
    .join('|');

  useEffect(() => {
    if (!enabled || !participantIds.length) {
      setReady(false);
      return;
    }
    let cancelled = false;
    setReady(false);
    (async () => {
      await hydrateCohortForStaffView(participantIds, { force: true, interns: opts.interns });
      if (!cancelled) {
        setReady(true);
        setVersion((v) => v + 1);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [key, internKey, enabled]);

  return { ready, version };
}
