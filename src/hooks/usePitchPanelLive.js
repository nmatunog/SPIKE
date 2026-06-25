import { useCallback, useEffect, useState } from 'react';
import { syncPitchPanelFromCloud } from '../lib/staff/pitchPanelService.js';
import { isSupabaseConfigured } from '../supabaseClient.js';

const POLL_MS = 5000;

/** Poll cloud panel scores for live Squad XP + faculty dashboard. */
export function usePitchPanelLive(enabled = true) {
  const [version, setVersion] = useState(0);
  const [error, setError] = useState(null);
  const [ready, setReady] = useState(false);

  const refresh = useCallback(async () => {
    if (!enabled || !isSupabaseConfigured) {
      setReady(true);
      return;
    }
    try {
      await syncPitchPanelFromCloud();
      setError(null);
      setVersion((v) => v + 1);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Panel sync failed');
    } finally {
      setReady(true);
    }
  }, [enabled]);

  useEffect(() => {
    if (!enabled) return undefined;
    void refresh();
    const timer = setInterval(() => {
      void refresh();
    }, POLL_MS);
    return () => clearInterval(timer);
  }, [enabled, refresh]);

  useEffect(() => {
    if (!enabled || typeof window === 'undefined') return undefined;
    const bump = () => setVersion((v) => v + 1);
    window.addEventListener('spike-pitch-panel-live', bump);
    window.addEventListener('spike-pitch-panel-finalized', bump);
    return () => {
      window.removeEventListener('spike-pitch-panel-live', bump);
      window.removeEventListener('spike-pitch-panel-finalized', bump);
    };
  }, [enabled]);

  return { ready, version, error, refresh };
}
