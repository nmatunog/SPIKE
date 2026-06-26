/** Pure math for rounded-rectangle perimeter sampling (no DOM). */

const TAU = Math.PI * 2

export function roundedRectPerimeterLength(w: number, h: number, r: number): number {
  const clampedR = Math.min(r, w / 2, h / 2)
  return 2 * (w - 2 * clampedR) + 2 * (h - 2 * clampedR) + TAU * clampedR
}

/**
 * Walk clockwise along a rounded rectangle centered at (cx, cy).
 * Starts at the midpoint of the top edge.
 */
export function pointOnRoundedRectPerimeter(
  distance: number,
  cx: number,
  cy: number,
  w: number,
  h: number,
  r: number,
): { x: number; y: number } {
  const clampedR = Math.min(r, w / 2, h / 2)
  const total = roundedRectPerimeterLength(w, h, clampedR)
  let d = ((distance % total) + total) % total

  const halfW = w / 2
  const halfH = h / 2
  const topLen = w - 2 * clampedR
  const rightLen = h - 2 * clampedR
  const arcLen = (Math.PI / 2) * clampedR

  const left = cx - halfW
  const right = cx + halfW
  const top = cy - halfH
  const bottom = cy + halfH

  const startOffset = topLen / 2
  d = (d + startOffset) % total

  if (d <= topLen) {
    return { x: left + clampedR + d, y: top }
  }
  d -= topLen

  if (d <= arcLen) {
    const theta = -Math.PI / 2 + (d / arcLen) * (Math.PI / 2)
    return {
      x: right - clampedR + clampedR * Math.cos(theta),
      y: top + clampedR + clampedR * Math.sin(theta),
    }
  }
  d -= arcLen

  if (d <= rightLen) {
    return { x: right, y: top + clampedR + d }
  }
  d -= rightLen

  if (d <= arcLen) {
    const theta = (d / arcLen) * (Math.PI / 2)
    return {
      x: right - clampedR + clampedR * Math.cos(theta),
      y: bottom - clampedR + clampedR * Math.sin(theta),
    }
  }
  d -= arcLen

  const bottomLen = topLen
  if (d <= bottomLen) {
    return { x: right - clampedR - d, y: bottom }
  }
  d -= bottomLen

  if (d <= arcLen) {
    const theta = Math.PI / 2 + (d / arcLen) * (Math.PI / 2)
    return {
      x: left + clampedR + clampedR * Math.cos(theta),
      y: bottom - clampedR + clampedR * Math.sin(theta),
    }
  }
  d -= arcLen

  if (d <= rightLen) {
    return { x: left, y: bottom - clampedR - d }
  }
  d -= rightLen

  const theta = Math.PI + (d / arcLen) * (Math.PI / 2)
  return {
    x: left + clampedR + clampedR * Math.cos(theta),
    y: top + clampedR + clampedR * Math.sin(theta),
  }
}

/** SVG path for a rounded rectangle track (normalized 0–100 viewBox). */
export function roundedRectTrackPath(
  cx: number,
  cy: number,
  w: number,
  h: number,
  r: number,
): string {
  const clampedR = Math.min(r, w / 2, h / 2)
  const halfW = w / 2
  const halfH = h / 2
  const left = cx - halfW
  const right = cx + halfW
  const top = cy - halfH
  const bottom = cy + halfH
  const cr = clampedR

  return [
    `M ${left + cr} ${top}`,
    `H ${right - cr}`,
    `A ${cr} ${cr} 0 0 1 ${right} ${top + cr}`,
    `V ${bottom - cr}`,
    `A ${cr} ${cr} 0 0 1 ${right - cr} ${bottom}`,
    `H ${left + cr}`,
    `A ${cr} ${cr} 0 0 1 ${left} ${bottom - cr}`,
    `V ${top + cr}`,
    `A ${cr} ${cr} 0 0 1 ${left + cr} ${top}`,
    'Z',
  ].join(' ')
}
