const RELOAD_KEY = 'spike_chunk_reload';
const RELOAD_MAX = 2;
const RELOAD_WINDOW_MS = 60_000;

/** @returns {{ count: number, at: number }} */
function readReloadState() {
  try {
    const raw = sessionStorage.getItem(RELOAD_KEY);
    if (!raw) return { count: 0, at: 0 };
    const parsed = JSON.parse(raw);
    return {
      count: Number(parsed?.count) || 0,
      at: Number(parsed?.at) || 0,
    };
  } catch {
    return { count: 0, at: 0 };
  }
}

/** @param {{ count: number, at: number }} state */
function writeReloadState(state) {
  sessionStorage.setItem(RELOAD_KEY, JSON.stringify(state));
}

/**
 * After a deploy, browsers may still have an old entry bundle that references deleted chunks.
 * Reload with a cache-busting query param (limited retries per session).
 * @param {string} [reason]
 */
export function reloadIfStaleChunk(reason) {
  if (typeof window === 'undefined') return;

  const now = Date.now();
  let state = readReloadState();
  if (now - state.at > RELOAD_WINDOW_MS) {
    state = { count: 0, at: now };
  }
  if (state.count >= RELOAD_MAX) {
    console.error('[chunkReload] stale chunk reload limit reached', reason);
    return;
  }

  state.count += 1;
  state.at = now;
  writeReloadState(state);

  const url = new URL(window.location.href);
  url.searchParams.set('_cb', String(now));
  window.location.replace(url.toString());
}
