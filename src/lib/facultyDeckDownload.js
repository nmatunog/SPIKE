import { apiUrl } from '../apiClient.js';
import { supabase } from '../supabaseClient.js';

/** @param {string | null | undefined} url */
export function isCoachDeckDownloadUrl(url) {
  if (!url || typeof url !== 'string') return false;
  if (url.startsWith('/api/coach/faculty-deck/')) return true;
  return /^\/content\/(?:segment-1|ra-spike)\/week-\d+\/day-\d+\/faculty-deck-\d+\.(?:pptx|pdf|ppt)$/i.test(url);
}

/** @param {string} url */
export function resolveCoachDeckDownloadUrl(url) {
  if (url.startsWith('/api/coach/faculty-deck/')) return apiUrl(url);
  const legacy = url.match(/^\/content\/((?:segment-1|ra-spike)\/week-\d+\/day-\d+\/faculty-deck-\d+\.(?:pptx|pdf|ppt))$/i);
  if (legacy) return apiUrl(`/api/coach/faculty-deck/${legacy[1]}`);
  return apiUrl(url);
}

/** @param {string} url */
function filenameFromCoachDeckUrl(url) {
  const parts = url.split('/').filter(Boolean);
  return parts[parts.length - 1] || 'faculty-deck';
}

/**
 * @param {string} url
 * @param {string} [filename]
 */
export async function downloadCoachDeckFile(url, filename) {
  const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
  if (sessionError) throw sessionError;
  const token = sessionData.session?.access_token;
  if (!token) throw new Error('Sign in as program coach or staff to download this deck.');

  const target = resolveCoachDeckDownloadUrl(url);
  const res = await fetch(target, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) {
    let message = 'Unable to download coach deck.';
    try {
      const data = await res.json();
      if (typeof data?.message === 'string') message = data.message;
    } catch {
      // ignore
    }
    throw new Error(message);
  }

  const blob = await res.blob();
  const objectUrl = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = objectUrl;
  anchor.download = filename || filenameFromCoachDeckUrl(url);
  anchor.rel = 'noopener';
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(objectUrl);
}
