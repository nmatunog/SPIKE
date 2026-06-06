/** Mirrors api/src/segment.js — keep in sync when segment rules change. */
export function segmentFromHours(hours) {
  if (hours > 400) return 3;
  if (hours > 200) return 2;
  return 1;
}
