import { useMemo } from 'react'

const SPACE_TYPE_COLORS = {
  career: '#8B0000',
  finance: '#1d4ed8',
  opportunity: '#047857',
  risk: '#b45309',
  family: '#be185d',
  health: '#0d9488',
  business: '#7c3aed',
  investment: '#ca8a04',
  education: '#2563eb',
  life_event: '#9333ea',
  milestone: '#4f46e5',
  rest: '#64748b',
  bonus: '#16a34a',
  community: '#0891b2',
}

export default function SpatialGameBoard({ board, rolling = false }) {
  const tokenByPosition = useMemo(() => {
    const map = new Map()
    if (!board) return map
    for (const token of board.tokens) {
      const list = map.get(token.position) ?? []
      list.push(token)
      map.set(token.position, list)
    }
    return map
  }, [board])

  if (!board) {
    return (
      <div className="flex aspect-square items-center justify-center rounded-2xl border border-slate-200 bg-slate-100">
        <p className="text-sm text-slate-500">Loading board…</p>
      </div>
    )
  }

  return (
    <div className="relative aspect-square w-full max-w-xl mx-auto">
      <div
        className="absolute inset-0 rounded-[2rem] border-2 border-slate-200 bg-gradient-to-br from-slate-100 via-white to-red-50/40 shadow-inner"
        style={{
          boxShadow: 'inset 0 2px 24px rgba(15,23,42,0.06), 0 8px 32px rgba(15,23,42,0.08)',
        }}
      >
        <div className="absolute inset-[12%] rounded-full border border-dashed border-slate-300/80" />
        <p className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-center">
          <span className="block text-xs font-semibold uppercase tracking-wide text-slate-400">
            Year
          </span>
          <span className="text-2xl font-bold text-slate-700">{board.boardYear}</span>
        </p>
      </div>

      {board.spaces.map((space) => {
        const tokensHere = tokenByPosition.get(space.index) ?? []
        const isLanded = board.landedSpaceIndex === space.index
        const color = SPACE_TYPE_COLORS[space.type] ?? '#64748b'

        return (
          <div
            key={space.index}
            className={`absolute flex h-12 w-12 -translate-x-1/2 -translate-y-1/2 flex-col items-center justify-center rounded-xl border text-center transition ${
              isLanded
                ? 'z-20 scale-110 border-[#8B0000] bg-red-50 shadow-lg ring-2 ring-[#8B0000]/30'
                : 'border-slate-200 bg-white shadow-sm'
            }`}
            style={{
              left: `${space.x * 100}%`,
              top: `${space.y * 100}%`,
            }}
            title={`${space.label} · ${space.encounterTitle}`}
          >
            <span
              className="mb-0.5 h-1.5 w-1.5 rounded-full"
              style={{ backgroundColor: color }}
              aria-hidden
            />
            <span className="line-clamp-2 px-0.5 text-[9px] font-semibold leading-tight text-slate-700">
              {space.label}
            </span>
            {tokensHere.map((token) => (
              <span
                key={token.playerId}
                className={`absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full border-2 border-white text-[8px] font-bold text-white shadow ${
                  token.isCurrent ? 'ring-2 ring-[#8B0000]' : ''
                } ${rolling ? 'animate-pulse' : ''}`}
                style={{ backgroundColor: token.color }}
              >
                {token.displayName.charAt(0)}
              </span>
            ))}
          </div>
        )
      })}
    </div>
  )
}
