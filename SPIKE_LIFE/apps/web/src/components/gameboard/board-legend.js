/** Space-type legend — shared by board rendering and sidebar cards. */
export const SPACE_TYPE_LEGEND = [
  { type: 'career', label: 'Career', color: '#e11d48' },
  { type: 'finance', label: 'Finance', color: '#2563eb' },
  { type: 'life_event', label: 'Life Event', color: '#9333ea' },
  { type: 'opportunity', label: 'Opportunity', color: '#059669' },
  { type: 'risk', label: 'Risk', color: '#ea580c' },
  { type: 'rest', label: 'Rest', color: '#64748b' },
  { type: 'milestone', label: 'Milestone', color: '#4f46e5' },
]

/** Bright tile fills for the gameboard (mockup-style). */
export const SPACE_TYPE_TILE = {
  career: { fill: '#f43f5e', stroke: '#e11d48', text: '#ffffff', glow: 'rgba(244,63,94,0.55)' },
  finance: { fill: '#3b82f6', stroke: '#2563eb', text: '#ffffff', glow: 'rgba(59,130,246,0.55)' },
  opportunity: { fill: '#10b981', stroke: '#059669', text: '#ffffff', glow: 'rgba(16,185,129,0.55)' },
  risk: { fill: '#f97316', stroke: '#ea580c', text: '#ffffff', glow: 'rgba(249,115,22,0.55)' },
  family: { fill: '#ec4899', stroke: '#db2777', text: '#ffffff', glow: 'rgba(236,72,153,0.5)' },
  health: { fill: '#14b8a6', stroke: '#0d9488', text: '#ffffff', glow: 'rgba(20,184,166,0.5)' },
  business: { fill: '#8b5cf6', stroke: '#7c3aed', text: '#ffffff', glow: 'rgba(139,92,246,0.55)' },
  investment: { fill: '#eab308', stroke: '#ca8a04', text: '#1e293b', glow: 'rgba(234,179,8,0.5)' },
  education: { fill: '#6366f1', stroke: '#4f46e5', text: '#ffffff', glow: 'rgba(99,102,241,0.5)' },
  life_event: { fill: '#a855f7', stroke: '#9333ea', text: '#ffffff', glow: 'rgba(168,85,247,0.55)' },
  milestone: { fill: '#818cf8', stroke: '#6366f1', text: '#ffffff', glow: 'rgba(129,140,248,0.5)' },
  rest: { fill: '#94a3b8', stroke: '#64748b', text: '#ffffff', glow: 'rgba(148,163,184,0.45)' },
  bonus: { fill: '#22c55e', stroke: '#16a34a', text: '#ffffff', glow: 'rgba(34,197,94,0.5)' },
  community: { fill: '#06b6d4', stroke: '#0891b2', text: '#ffffff', glow: 'rgba(6,182,212,0.5)' },
}

export const SPACE_TYPE_COLORS = Object.fromEntries(
  Object.entries(SPACE_TYPE_TILE).map(([type, tile]) => [type, tile.fill]),
)

export function tileStyleForType(type) {
  return SPACE_TYPE_TILE[type] ?? {
    fill: '#94a3b8',
    stroke: '#64748b',
    text: '#ffffff',
    glow: 'rgba(148,163,184,0.4)',
  }
}
