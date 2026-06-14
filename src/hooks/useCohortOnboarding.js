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
      const detail =
        err && typeof err === 'object' && 'message' in err
          ? String(err.message)
          : 'Could not load onboarding.';
      setState((s) => ({
        ...s,
        loading: false,
        error: `${detail} If this persists, run migrations 20260615 + 20260616 in Supabase SQL Editor, then Settings → API → Reload schema.`,
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

  useEffect(() => {
    if (!participantId || state.step !== 'waiting' || !isSupabaseConfigured) return undefined;
    const timer = setInterval(() => {
      refresh();
    }, 25_000);
    return () => clearInterval(timer);
  }, [participantId, state.step, refresh]);

  return { ...state, refresh };
}
