import { useCallback, useEffect, useRef, useState } from 'react';

const AUTOSAVE_MS = 1800;

/**
 * Debounced autosave for playbook mission state — never blocks navigation.
 * @param {T} state
 * @param {(next: T) => T} saveFn
 * @param {{ enabled?: boolean }} [opts]
 * @template T
 */
export function usePlaybookMissionAutosave(state, saveFn, opts = {}) {
  const { enabled = true } = opts;
  const [status, setStatus] = useState('saved');
  const timerRef = useRef(/** @type {ReturnType<typeof setTimeout> | null} */ (null));
  const stateRef = useRef(state);
  const saveRef = useRef(saveFn);
  const dirtyRef = useRef(false);

  useEffect(() => {
    stateRef.current = state;
    saveRef.current = saveFn;
  });

  const flush = useCallback(() => {
    if (!enabled) return;
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    if (!dirtyRef.current) return;
    try {
      setStatus('saving');
      saveRef.current(stateRef.current);
      dirtyRef.current = false;
      setStatus('saved');
    } catch {
      setStatus('error');
    }
  }, [enabled]);

  const markDirty = useCallback(() => {
    if (!enabled) return;
    dirtyRef.current = true;
    setStatus('editing');
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(flush, AUTOSAVE_MS);
  }, [enabled, flush]);

  useEffect(() => {
    const onHide = () => flush();
    window.addEventListener('pagehide', onHide);
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'hidden') onHide();
    });
    return () => {
      window.removeEventListener('pagehide', onHide);
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [flush]);

  return { status, markDirty, flush };
}
