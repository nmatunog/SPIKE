const RELOAD_KEY = 'spike_chunk_reload_once';

/** @param {unknown} error */
export function isChunkLoadError(error) {
  const message = error instanceof Error ? error.message : String(error ?? '');
  return (
    /Failed to fetch dynamically imported module/i.test(message)
    || /Importing a module script failed/i.test(message)
    || /MIME type.*text\/html/i.test(message)
    || /error loading dynamically imported module/i.test(message)
    || /Expected a JavaScript-or-Wasm module script/i.test(message)
  );
}

/** Stale hashed chunk still cached after deploy (e.g. old PlaybookShell calling slide.body.split). */
export function isStaleModuleRuntimeError(error) {
  const message = error instanceof Error ? error.message : String(error ?? '');
  const stack = error instanceof Error ? String(error.stack ?? '') : '';
  if (!/reading 'split'|reading "split"/i.test(message)) return false;
  return /PlaybookShell|SlideViewer|PresentationViewer/i.test(stack);
}

/** @param {unknown} error */
export function isRecoverableDeployError(error) {
  return isChunkLoadError(error) || isStaleModuleRuntimeError(error);
}

/**
 * One automatic hard reload when a hashed chunk 404s (stale index.html after deploy).
 * @param {unknown} error
 * @returns {boolean} true if a reload was triggered
 */
export function tryRecoverFromChunkLoadError(error) {
  if (!isRecoverableDeployError(error)) return false;
  try {
    if (sessionStorage.getItem(RELOAD_KEY) === '1') return false;
    sessionStorage.setItem(RELOAD_KEY, '1');
  } catch {
    return false;
  }
  window.location.reload();
  return true;
}

/** Call after a successful app boot so future deploys can auto-reload once. */
export function clearChunkReloadFlag() {
  try {
    sessionStorage.removeItem(RELOAD_KEY);
  } catch {
    /* private mode */
  }
}

/** Listen for module script MIME failures (modulepreload / static imports). */
export function installChunkLoadRecovery() {
  if (typeof window === 'undefined') return;

  window.addEventListener('error', (event) => {
    const target = event.target;
    if (target instanceof HTMLScriptElement && target.src) {
      tryRecoverFromChunkLoadError(
        new Error(event.message || `Script load failed: ${target.src}`),
      );
    }
  }, true);

  window.addEventListener('unhandledrejection', (event) => {
    if (tryRecoverFromChunkLoadError(event.reason)) {
      event.preventDefault();
    }
  });

  window.addEventListener('error', (event) => {
    if (tryRecoverFromChunkLoadError(event.error ?? new Error(event.message))) {
      event.preventDefault();
    }
  });
}

/**
 * @template T
 * @param {() => Promise<{ default: T }>} factory
 */
export function lazyWithChunkRecovery(factory) {
  return () =>
    factory().catch((error) => {
      if (tryRecoverFromChunkLoadError(error)) {
        return new Promise(() => {});
      }
      throw error;
    });
}
