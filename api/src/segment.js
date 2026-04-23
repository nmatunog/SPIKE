export function segmentFromHours(hours) {
  if (hours > 400) return 3;
  if (hours > 200) return 2;
  return 1;
}
