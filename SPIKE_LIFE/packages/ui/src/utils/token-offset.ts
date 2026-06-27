/** Radial offset (percent) so 2–6 tokens on the same space remain visible. */
export function tokenOffset(
  index: number,
  count: number,
): { dx: number; dy: number } {
  if (count <= 1) return { dx: 0, dy: 0 }

  const angle = (index / count) * Math.PI * 2 - Math.PI / 2
  const radius = count <= 2 ? 2.8 : count <= 4 ? 3.4 : 4
  return {
    dx: Math.cos(angle) * radius,
    dy: Math.sin(angle) * radius,
  }
}
