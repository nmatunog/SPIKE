const SEEN_KEY = 'ra_spike_graduation_seen_v1';

/** @param {string} userId @param {object | null | undefined} internProgress */
export function shouldShowRaSpikeGraduation(userId, internProgress) {
  if (!userId) return false;
  const graduated = Boolean(internProgress?.graduated_at) || internProgress?.gate_2_status === 'passed';
  if (!graduated) return false;
  return !localStorage.getItem(`${SEEN_KEY}:${userId}`);
}

/** @param {string} userId */
export function markRaSpikeGraduationSeen(userId) {
  try {
    localStorage.setItem(`${SEEN_KEY}:${userId}`, '1');
  } catch {
    /* quota */
  }
}
