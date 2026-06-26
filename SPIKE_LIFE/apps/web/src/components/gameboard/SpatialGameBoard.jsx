import { useMemo } from 'react'

import { SPACE_TYPE_COLORS } from './board-legend.js'

const SPACE_TYPE_COLORS_MAP = SPACE_TYPE_COLORS

export default function SpatialGameBoard({ board, rolling = false, dark = false }) {
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
      <div
        className={`flex aspect-square max-h-[min(52vh,28rem)] w-full items-center justify-center rounded-2xl border ${
          dark ? 'border-slate-600 bg-slate-800/50' : 'border-slate-200 bg-slate-100'
        }`}
      >
        <p className={`text-sm ${dark ? 'text-slate-400' : 'text-slate-500'}`}>Loading board…</p>
      </div>
    )
  }

  return (
    <div className="relative mx-auto aspect-square w-full max-h-[min(52vh,28rem)] max-w-[min(52vh,28rem)]">
      <div
        className={`absolute inset-0 rounded-[2rem] border-2 shadow-inner ${
          dark
            ? 'border-slate-600 bg-gradient-to-br from-slate-700/80 via-slate-800 to-slate-900'
            : 'border-slate-200 bg-gradient-to-br from-slate-100 via-white to-red-50/40'
        }`}
        style={{
          boxShadow: dark
            ? 'inset 0 2px 24px rgba(0,0,0,0.3), 0 8px 32px rgba(0,0,0,0.2)'
            : 'inset 0 2px 24px rgba(15,23,42,0.06), 0 8px 32px rgba(15,23,42,0.08)',
        }}
      >
        <div
          className={`absolute inset-[12%] rounded-full border border-dashed ${
            dark ? 'border-slate-500/50' : 'border-slate-300/80'
          }`}
        />
        <p className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-center">
          <span
            className={`block text-xs font-semibold uppercase tracking-wide ${
              dark ? 'text-slate-500' : 'text-slate-400'
            }`}
          >
            Year
          </span>
          <span className={`text-2xl font-bold ${dark ? 'text-slate-200' : 'text-slate-700'}`}>
            {board.boardYear}
          </span>
        </p>
      </div>

      {board.spaces.map((space) => {
        const tokensHere = tokenByPosition.get(space.index) ?? []
        const isLanded = board.landedSpaceIndex === space.index
        const color = SPACE_TYPE_COLORS_MAP[space.type] ?? '#64748b'

        return (
          <div
            key={space.index}
            className={`absolute flex h-11 w-11 -translate-x-1/2 -translate-y-1/2 flex-col items-center justify-center rounded-xl border text-center transition md:h-12 md:w-12 ${
              isLanded
                ? 'z-20 scale-110 border-[#8B0000] bg-red-50 shadow-lg ring-2 ring-[#8B0000]/40'
                : dark
                  ? 'border-slate-600 bg-slate-700/90 shadow-md'
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
            <span
              className={`line-clamp-2 px-0.5 text-[9px] font-semibold leading-tight ${
                dark && !isLanded ? 'text-slate-200' : 'text-slate-700'
              }`}
            >
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
