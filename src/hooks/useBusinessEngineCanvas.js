import { useCallback, useEffect, useRef, useState } from 'react';
import {
  BEC_AUTOSAVE_MS,
  BEC_HISTORY_MAX,
  WEEKLY_TO_MONTHLY_KEY,
} from '../lib/businessEngineCanvas/constants.js';
import {
  loadBusinessEngineCanvas,
  saveBusinessEngineCanvas,
  computeBusinessEngineProgress,
} from '../lib/businessEngineCanvas/storage.js';
import { syncBusinessEngineToFec } from '../lib/businessEngineCanvas/fecSync.js';
import { weeklyToMonthly } from '../lib/businessEngineCanvas/funnel.js';

/**
 * @param {string} participantId
 * @param {{ readOnly?: boolean, onSaved?: () => void }} [opts]
 */
export function useBusinessEngineCanvas(participantId, opts = {}) {
  const { readOnly = false, onSaved } = opts;
  const [state, setState] = useState(() => loadBusinessEngineCanvas(participantId));
  const [past, setPast] = useState(/** @type {import('../lib/businessEngineCanvas/types.js').BusinessEngineCanvasState[]} */ ([]));
  const [future, setFuture] = useState(/** @type {import('../lib/businessEngineCanvas/types.js').BusinessEngineCanvasState[]} */ ([]));
  const [saveStatus, setSaveStatus] = useState('idle');
  const stateRef = useRef(state);
  const dirtyRef = useRef(false);
  const skipHistoryRef = useRef(false);

  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  useEffect(() => {
    setState(loadBusinessEngineCanvas(participantId));
    setPast([]);
    setFuture([]);
  }, [participantId]);

  const pushHistory = useCallback(() => {
    if (skipHistoryRef.current) return;
    setPast((p) => [...p.slice(-(BEC_HISTORY_MAX - 1)), structuredClone(stateRef.current)]);
    setFuture([]);
  }, []);

  const persist = useCallback(
    (updater, { history = true } = {}) => {
      if (readOnly) return;
      if (history) pushHistory();
      setState((prev) => {
        const next = typeof updater === 'function' ? updater(prev) : { ...prev, ...updater };
        dirtyRef.current = true;
        return next;
      });
    },
    [readOnly, pushHistory],
  );

  useEffect(() => {
    if (readOnly || !participantId) return undefined;
    const timer = window.setInterval(() => {
      if (!dirtyRef.current) return;
      const saved = saveBusinessEngineCanvas(participantId, stateRef.current);
      syncBusinessEngineToFec(participantId, saved);
      dirtyRef.current = false;
      setSaveStatus('saved');
      window.setTimeout(() => setSaveStatus('idle'), 2000);
      onSaved?.();
    }, BEC_AUTOSAVE_MS);
    const flush = () => {
      if (!dirtyRef.current) return;
      saveBusinessEngineCanvas(participantId, stateRef.current);
      dirtyRef.current = false;
    };
    window.addEventListener('pagehide', flush);
    return () => {
      window.clearInterval(timer);
      window.removeEventListener('pagehide', flush);
      flush();
    };
  }, [participantId, readOnly, onSaved]);

  const undo = useCallback(() => {
    if (!past.length) return;
    const prev = past[past.length - 1];
    setFuture((f) => [structuredClone(stateRef.current), ...f]);
    setPast((p) => p.slice(0, -1));
    skipHistoryRef.current = true;
    setState(prev);
    dirtyRef.current = true;
    skipHistoryRef.current = false;
  }, [past]);

  const redo = useCallback(() => {
    if (!future.length) return;
    const next = future[0];
    setPast((p) => [...p, structuredClone(stateRef.current)]);
    setFuture((f) => f.slice(1));
    skipHistoryRef.current = true;
    setState(next);
    dirtyRef.current = true;
    skipHistoryRef.current = false;
  }, [future]);

  useEffect(() => {
    if (readOnly) return undefined;
    const onKey = (event) => {
      const mod = event.metaKey || event.ctrlKey;
      if (!mod) return;
      if (event.key === 'z' && !event.shiftKey) {
        event.preventDefault();
        undo();
      }
      if (event.key === 'z' && event.shiftKey) {
        event.preventDefault();
        redo();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [readOnly, undo, redo]);

  const progressPct = computeBusinessEngineProgress(state);

  const setWeeklyTarget = useCallback(
    (id, value) => {
      persist((prev) => {
        const weeklyTargets = { ...prev.weeklyTargets, [id]: value };
        const monthlyManualOverride = { ...prev.monthlyManualOverride };
        const monthlyTargets = { ...prev.monthlyTargets };
        const monthlyKey = WEEKLY_TO_MONTHLY_KEY[id] ?? id;
        if (!monthlyManualOverride[monthlyKey]) {
          const n = Number(value);
          monthlyTargets[monthlyKey] = Number.isFinite(n) ? n * 4 : '';
        }
        return { ...prev, weeklyTargets, monthlyTargets };
      });
    },
    [persist],
  );

  const setMonthlyTarget = useCallback(
    (id, value, manual = true) => {
      persist((prev) => ({
        ...prev,
        monthlyTargets: { ...prev.monthlyTargets, [id]: value },
        monthlyManualOverride: { ...prev.monthlyManualOverride, [id]: manual },
      }));
    },
    [persist],
  );

  const recalcMonthlyFromWeekly = useCallback(() => {
    persist((prev) => ({
      ...prev,
      monthlyTargets: weeklyToMonthly(prev.weeklyTargets),
      monthlyManualOverride: Object.fromEntries(
        Object.keys(prev.monthlyManualOverride).map((k) => [k, false]),
      ),
    }));
  }, [persist]);

  return {
    state,
    persist,
    progressPct,
    saveStatus,
    undo,
    redo,
    canUndo: past.length > 0,
    canRedo: future.length > 0,
    setWeeklyTarget,
    setMonthlyTarget,
    recalcMonthlyFromWeekly,
  };
}
