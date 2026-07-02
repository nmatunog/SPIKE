import { useCallback, useEffect, useRef, useState } from 'react';
import { FEW_AUTOSAVE_MS } from '../lib/financialEngineWorksheet/types.js';
import {
  loadFinancialEngineWorksheet,
  saveFinancialEngineWorksheet,
  computeFinancialEngineProgress,
} from '../lib/financialEngineWorksheet/storage.js';
import { populateFinancialEngineFromGrowth } from '../lib/financialEngineWorksheet/populateFromGrowth.js';
import { recalculateFinancialEngine } from '../lib/financialEngineWorksheet/calculations.js';
import { syncFinancialEngineToFec } from '../lib/financialEngineWorksheet/fecSync.js';

/**
 * @param {string} participantId
 * @param {{ readOnly?: boolean, onSaved?: () => void }} [opts]
 */
export function useFinancialEngineWorksheet(participantId, opts = {}) {
  const { readOnly = false, onSaved } = opts;
  const [state, setState] = useState(() => loadFinancialEngineWorksheet(participantId));
  const [saveStatus, setSaveStatus] = useState('idle');
  const [importHint, setImportHint] = useState('');
  const stateRef = useRef(state);
  const dirtyRef = useRef(false);

  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  useEffect(() => {
    setState(loadFinancialEngineWorksheet(participantId));
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

  const refreshFromGrowth = useCallback(() => {
    persist((prev) => {
      const next = populateFinancialEngineFromGrowth(participantId, prev);
      if (!next.revenueModel.year1Revenue) {
        setImportHint('Complete Growth Engine targets first (Year 1 revenue + funnel).');
        return prev;
      }
      setImportHint('');
      return next;
    });
  }, [participantId, persist]);

  const recalcFinancials = useCallback(() => {
    persist((prev) => recalculateFinancialEngine(prev));
    setImportHint('');
  }, [persist]);

  const setRevenueField = useCallback(
    (key, value) => {
      persist((prev) => ({
        ...prev,
        revenueModel: { ...prev.revenueModel, [key]: value },
      }));
    },
    [persist],
  );

  const setEconomicsField = useCallback(
    (key, value) => {
      persist((prev) => ({
        ...prev,
        economics: { ...prev.economics, [key]: value },
      }));
    },
    [persist],
  );

  const setScalingField = useCallback(
    (key, value) => {
      persist((prev) => ({
        ...prev,
        scaling: { ...prev.scaling, [key]: value },
      }));
    },
    [persist],
  );

  const setSustainabilityField = useCallback(
    (key, value) => {
      persist((prev) => ({
        ...prev,
        sustainability: { ...prev.sustainability, [key]: value },
      }));
    },
    [persist],
  );

  useEffect(() => {
    if (readOnly || !participantId) return undefined;
    const timer = window.setInterval(() => {
      if (!dirtyRef.current) return;
      const saved = saveFinancialEngineWorksheet(participantId, stateRef.current);
      syncFinancialEngineToFec(participantId, saved);
      dirtyRef.current = false;
      setSaveStatus('saved');
      window.setTimeout(() => setSaveStatus('idle'), 2000);
      onSaved?.();
    }, FEW_AUTOSAVE_MS);

    const flush = () => {
      if (!dirtyRef.current) return;
      const saved = saveFinancialEngineWorksheet(participantId, stateRef.current);
      syncFinancialEngineToFec(participantId, saved);
      dirtyRef.current = false;
    };
    window.addEventListener('pagehide', flush);
    return () => {
      window.clearInterval(timer);
      window.removeEventListener('pagehide', flush);
      flush();
    };
  }, [participantId, readOnly, onSaved]);

  const progressPct = computeFinancialEngineProgress(state);

  return {
    state,
    persist,
    refreshFromGrowth,
    recalcFinancials,
    setRevenueField,
    setEconomicsField,
    setScalingField,
    setSustainabilityField,
    importHint,
    progressPct,
    saveStatus,
  };
}
