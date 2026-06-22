import { useEffect, useState } from 'react';
import { whenInternSignInUploadDone } from '../lib/internSessionSync.js';
import { maybeRecoverInternWorkFromSupabase } from '../lib/internCloudRecovery.js';
import { maybeResetWeek2Day1Workshop } from '../lib/customerDiscovery/week2Day1Reset.js';
import { isMockUserId } from '../lib/mockAuth.js';

/**
 * Merge cloud + local intern work after sign-in (non-destructive).
 * @param {string | undefined | null} participantId
 */
export function useInternWorkHydration(participantId) {
  const [ready, setReady] = useState(false);
  const [version, setVersion] = useState(0);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!participantId || isMockUserId(participantId)) {
      setReady(true);
      setError(null);
      return;
    }

    let cancelled = false;
    setReady(false);
    setError(null);

    (async () => {
      try {
        await whenInternSignInUploadDone(participantId);
        await maybeResetWeek2Day1Workshop(participantId);
        await maybeRecoverInternWorkFromSupabase(participantId);
        if (!cancelled) {
          setReady(true);
          setVersion((v) => v + 1);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Failed to load your saved work');
          setReady(true);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [participantId]);

  return { ready, version, error };
}
