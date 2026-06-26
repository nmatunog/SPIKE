/** Build an SVG path string connecting board spaces in play order (serpentine S-track). */
export function buildSerpentineTrackPath(spaces) {
  if (!spaces?.length) return ''

  const pts = spaces.map((s) => ({ x: s.x * 100, y: s.y * 100 }))

  if (pts.length === 1) {
    return `M ${pts[0].x} ${pts[0].y}`
  }

  let d = `M ${pts[0].x} ${pts[0].y}`

  for (let i = 1; i < pts.length; i += 1) {
    const prev = pts[i - 1]
    const curr = pts[i]
    const midX = (prev.x + curr.x) / 2
    const midY = (prev.y + curr.y) / 2
    d += ` Q ${midX} ${midY} ${curr.x} ${curr.y}`
  }

  return d
}

export function spaceCoords(spaces, index) {
  const space = spaces.find((s) => s.index === index) ?? spaces[index]
  if (!space) return { x: 50, y: 50 }
  return { x: space.x * 100, y: space.y * 100 }
}

/**
 * Interpolate token position along the track (shortest path forward on serpentine).
 */
export function interpolateTrackPosition(spaces, fromIndex, toIndex, progress) {
  const total = spaces.length
  if (total === 0) return { x: 50, y: 50 }

  const from = ((fromIndex % total) + total) % total
  let to = ((toIndex % total) + total) % total
  let steps = to - from
  if (steps < 0) steps += total

  const t = Math.min(1, Math.max(0, progress))
  const traveled = steps * t
  const whole = Math.floor(traveled)
  const frac = traveled - whole

  const currentIdx = (from + whole) % total
  const nextIdx = (from + whole + 1) % total

  const a = spaceCoords(spaces, currentIdx)
  const b = spaceCoords(spaces, nextIdx)

  return {
    x: a.x + (b.x - a.x) * frac,
    y: a.y + (b.y - a.y) * frac,
  }
}
