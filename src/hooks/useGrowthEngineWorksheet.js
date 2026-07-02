import { useCallback, useEffect, useRef, useState } from 'react';
import { GEW_AUTOSAVE_MS } from '../lib/growthEngineWorksheet/types.js';
import {
  loadGrowthEngineWorksheet,
  saveGrowthEngineWorksheet,
  computeGrowthEngineProgress,
} from '../lib/growthEngineWorksheet/storage.js';
import { syncGrowthEngineToFec } from '../lib/growthEngineWorksheet/fecSync.js';
import { recalculateGrowthTargets } from '../lib/growthEngineWorksheet/calculations.js';

/**
 * @param {string} participantId
 * @param {{ readOnly?: boolean, onSaved?: () => void }} [opts]
 */
export function useGrowthEngineWorksheet(participantId, opts = {}) {
  const { readOnly = false, onSaved } = opts;
  const [state, setState] = useState(() => loadGrowthEngineWorksheet(participantId));
  const [saveStatus, setSaveStatus] = useState('idle');
  const [recalcHint, setRecalcHint] = useState('');
  const stateRef = useRef(state);
  const dirtyRef = useRef(false);

  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  useEffect(() => {
    setState(loadGrowthEngineWorksheet(participantId));
  }, [participantId]);

  const persist = useCallback(
    (updater) => {
      if (readOnly) return;
      setState((prev) => {
        const next = typeof updater === 'function' ? updater(prev) : { ...prev, ...updater };
        dirtyRef.current = true;
        return next;
      });
    },
    [readOnly],
  );

  const recalcTargets = useCallback(() => {
    persist((prev) => {
      const goal = Number(prev.targets.yearRevenueGoal);
      const avg = Number(prev.targets.averageRevenuePerClient);
      if (!Number.isFinite(goal) || goal <= 0 || !Number.isFinite(avg) || avg <= 0) {
        setRecalcHint('Enter Year 1 revenue goal and average revenue per client first.');
        return prev;
      }
      setRecalcHint('');
      return {
        ...prev,
        targets: recalculateGrowthTargets(prev.targets),
      };
    });
  }, [persist]);

  const setWeeklyTarget = useCallback(
    (key, value) => {
      persist((prev) => ({
        ...prev,
        targets: {
          ...prev.targets,
          weeklyTargets: { ...(prev.targets.weeklyTargets ?? {}), [key]: value },
        },
      }));
    },
    [persist],
  );

  const setMonthlyTarget = useCallback(
    (key, value) => {
      persist((prev) => ({
        ...prev,
        targets: {
          ...prev.targets,
          monthlyTargets: { ...(prev.targets.monthlyTargets ?? {}), [key]: value },
        },
      }));
    },
    [persist],
  );

  useEffect(() => {
    if (readOnly || !participantId) return undefined;
    const timer = window.setInterval(() => {
      if (!dirtyRef.current) return;
      const saved = saveGrowthEngineWorksheet(participantId, stateRef.current);
      syncGrowthEngineToFec(participantId, saved);
      dirtyRef.current = false;
      setSaveStatus('saved');
      window.setTimeout(() => setSaveStatus('idle'), 2000);
      onSaved?.();
    }, GEW_AUTOSAVE_MS);

    const flush = () => {
      if (!dirtyRef.current) return;
      const saved = saveGrowthEngineWorksheet(participantId, stateRef.current);
      syncGrowthEngineToFec(participantId, saved);
      dirtyRef.current = false;
    };
    window.addEventListener('pagehide', flush);
    return () => {
      window.clearInterval(timer);
      window.removeEventListener('pagehide', flush);
      flush();
    };
  }, [participantId, readOnly, onSaved]);

  const progressPct = computeGrowthEngineProgress(state);

  return {
    state,
    persist,
    recalcTargets,
    setWeeklyTarget,
    setMonthlyTarget,
    recalcHint,
    progressPct,
    saveStatus,
  };
}
