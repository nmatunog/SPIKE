const CHUNK_RELOAD_KEY = 'spike_chunk_reload_once';

/** One automatic reload when a lazy chunk 404s after a deploy (stale index.html). */
export function installChunkLoadRecovery() {
  if (typeof window === 'undefined') return;

  const shouldRecover = (message) =>
    /Failed to fetch dynamically imported module/i.test(message)
    || /Importing a module script failed/i.test(message)
    || /MIME type.+text\/html/i.test(message);

  const tryReload = (message) => {
    if (!shouldRecover(message)) return;
    if (sessionStorage.getItem(CHUNK_RELOAD_KEY)) return;
    sessionStorage.setItem(CHUNK_RELOAD_KEY, '1');
    window.location.reload();
  };

  window.addEventListener('unhandledrejection', (event) => {
    const message = String(event.reason?.message ?? event.reason ?? '');
    tryReload(message);
  });

  window.addEventListener('error', (event) => {
    const message = String(event.message ?? '');
    tryReload(message);
  });

  window.addEventListener('load', () => {
    sessionStorage.removeItem(CHUNK_RELOAD_KEY);
  });
}
