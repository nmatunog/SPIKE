import { useCallback, useEffect, useState } from 'react';
import { isSupabaseConfigured } from '../supabaseClient.js';
import {
  loadOnboardingContext,
  setOnboardingCompleteCache,
} from '../lib/cohortOnboardingService.js';
import { db } from '../lib/cohortOnboardingService.js';

/**
 * @param {string} [participantId]
 */
export function useCohortOnboarding(participantId) {
  const [state, setState] = useState({
    loading: true,
    error: '',
    cohort: null,
    progress: null,
    suggestion: null,
    vote: null,
    squad: null,
    finalists: [],
    tally: [],
    step: 'welcome',
  });

  const refresh = useCallback(async () => {
    if (!participantId || !isSupabaseConfigured) {
      setState((s) => ({
        ...s,
        loading: false,
        error: isSupabaseConfigured ? '' : 'Supabase is required for onboarding.',
      }));
      return;
    }
    try {
      const ctx = await loadOnboardingContext(participantId);
      if (ctx.progress?.onboarding_complete) {
        setOnboardingCompleteCache(participantId, true);
      }
      setState({ ...ctx, loading: false, error: '' });
    } catch (err) {
      setState((s) => ({
        ...s,
        loading: false,
        error: err instanceof Error ? err.message : 'Could not load onboarding.',
      }));
    }
  }, [participantId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  useEffect(() => {
    if (!participantId || !state.cohort?.id || !isSupabaseConfigured) return undefined;
    const channel = db.subscribeToCohortOnboarding(state.cohort.id, () => {
      refresh();
    });
    return () => db.unsubscribeChannel(channel);
  }, [participantId, state.cohort?.id, refresh]);

  return { ...state, refresh };
}
