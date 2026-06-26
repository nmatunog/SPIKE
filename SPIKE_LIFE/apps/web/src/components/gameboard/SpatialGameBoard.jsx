import { useEffect, useMemo, useRef, useState } from 'react'
import { tileStyleForType } from './board-legend.js'
import { buildSerpentineTrackPath, interpolateTrackPosition } from './board-path.js'

export default function SpatialGameBoard({ board, rolling = false, dark = false }) {
  const prevPositionRef = useRef(0)
  const [animProgress, setAnimProgress] = useState(1)
  const [animFrom, setAnimFrom] = useState(0)
  const [animTo, setAnimTo] = useState(0)

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

  const currentToken = board?.tokens.find((t) => t.isCurrent) ?? board?.tokens[0]

  useEffect(() => {
    if (!board || !currentToken) return

    const newPos = currentToken.position
    const rolled = board.lastDiceRoll != null && board.phase !== 'ready_to_roll'

    if (rolled && newPos !== prevPositionRef.current) {
      setAnimFrom(prevPositionRef.current)
      setAnimTo(newPos)
      setAnimProgress(0)

      const start = performance.now()
      const duration = 700

      function frame(now) {
        const t = Math.min(1, (now - start) / duration)
        const eased = 1 - (1 - t) ** 3
        setAnimProgress(eased)
        if (t < 1) {
          requestAnimationFrame(frame)
        } else {
          prevPositionRef.current = newPos
        }
      }

      requestAnimationFrame(frame)
    } else if (!rolled) {
      prevPositionRef.current = newPos
      setAnimProgress(1)
    }
  }, [board, currentToken])

  const trackPath = useMemo(
    () => (board ? buildSerpentineTrackPath(board.spaces) : ''),
    [board],
  )

  const animatedTokenPos = useMemo(() => {
    if (!board || animProgress >= 1 || !currentToken) {
      const pos = currentToken?.position ?? 0
      const space = board?.spaces.find((s) => s.index === pos)
      return space ? { x: space.x * 100, y: space.y * 100 } : { x: 50, y: 50 }
    }
    return interpolateTrackPosition(board.spaces, animFrom, animTo, animProgress)
  }, [board, animProgress, animFrom, animTo, currentToken])

  const isAnimating = animProgress < 1

  if (!board) {
    return (
      <div
        className={`flex aspect-[4/3] max-h-[min(52vh,28rem)] w-full items-center justify-center rounded-2xl border ${
          dark ? 'border-slate-600 bg-slate-800/50' : 'border-slate-200 bg-slate-100'
        }`}
      >
        <p className={`text-sm ${dark ? 'text-slate-400' : 'text-slate-500'}`}>Loading board…</p>
      </div>
    )
  }

  return (
    <div className="relative mx-auto aspect-[4/3] w-full max-h-[min(52vh,28rem)] max-w-[min(70vh,36rem)]">
      <div
        className={`absolute inset-0 overflow-hidden rounded-[1.5rem] border-2 shadow-inner ${
          dark
            ? 'border-slate-600 bg-gradient-to-b from-emerald-950/40 via-slate-800 to-slate-950'
            : 'border-slate-200 bg-gradient-to-b from-slate-100 via-white to-red-50/40'
        }`}
        style={{
          boxShadow: dark
            ? 'inset 0 2px 24px rgba(0,0,0,0.35), 0 8px 32px rgba(0,0,0,0.25)'
            : 'inset 0 2px 24px rgba(15,23,42,0.06), 0 8px 32px rgba(15,23,42,0.08)',
        }}
      >
        <div className="pointer-events-none absolute inset-x-0 top-0 h-1/4 bg-gradient-to-b from-emerald-800/20 to-transparent" />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-1/5 bg-gradient-to-t from-slate-950/50 to-transparent" />

        <svg
          className="pointer-events-none absolute inset-0 h-full w-full"
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
          aria-hidden
        >
          <path
            d={trackPath}
            fill="none"
            stroke="rgba(255,255,255,0.12)"
            strokeWidth="3"
            strokeLinecap="round"
          />
          <path
            d={trackPath}
            fill="none"
            stroke="rgba(251,191,36,0.35)"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeDasharray="3 3"
          />
        </svg>

        <p className="absolute left-1/2 top-[46%] -translate-x-1/2 -translate-y-1/2 text-center">
          <span className="block text-[10px] font-semibold uppercase tracking-wide text-slate-500">
            Year
          </span>
          <span className="text-xl font-bold text-white/90">{board.boardYear}</span>
        </p>
      </div>

      {board.spaces.map((space) => {
        const tokensHere = tokenByPosition.get(space.index) ?? []
        const isLanded = board.landedSpaceIndex === space.index && !isAnimating
        const tile = tileStyleForType(space.type)
        const hideTokenOnSpace = isAnimating && tokensHere.some((t) => t.isCurrent)

        return (
          <div
            key={space.index}
            className={`absolute flex h-10 w-10 -translate-x-1/2 -translate-y-1/2 flex-col items-center justify-center rounded-xl border-2 text-center transition-all duration-300 md:h-11 md:w-11 ${
              isLanded ? 'z-20 scale-110 ring-2 ring-white' : 'z-10'
            }`}
            style={{
              left: `${space.x * 100}%`,
              top: `${space.y * 100}%`,
              backgroundColor: tile.fill,
              borderColor: isLanded ? '#ffffff' : tile.stroke,
              color: tile.text,
              boxShadow: isLanded
                ? `0 0 20px ${tile.glow}, 0 4px 12px rgba(0,0,0,0.35)`
                : `0 2px 8px rgba(0,0,0,0.25), 0 0 12px ${tile.glow}`,
            }}
            title={`${space.label} · ${space.encounterTitle}`}
          >
            <span
              className="line-clamp-2 px-0.5 text-[8px] font-bold leading-tight drop-shadow-sm md:text-[9px]"
              style={{ color: tile.text }}
            >
              {space.label}
            </span>
            {!hideTokenOnSpace && tokensHere.map((token) => (
              <span
                key={token.playerId}
                className={`absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full border-2 border-white text-[8px] font-bold text-white shadow-lg md:h-6 md:w-6 ${
                  token.isCurrent ? 'ring-2 ring-yellow-300' : ''
                } ${rolling && token.isCurrent && !isAnimating ? 'animate-pulse' : ''}`}
                style={{ backgroundColor: '#8B0000' }}
              >
                {token.displayName.charAt(0)}
              </span>
            ))}
          </div>
        )
      })}

      {currentToken && (isAnimating || rolling) && (
        <div
          className="pointer-events-none absolute z-30 flex h-8 w-8 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border-2 border-white text-xs font-bold text-white shadow-lg ring-2 ring-yellow-300 md:h-9 md:w-9"
          style={{
            left: `${animatedTokenPos.x}%`,
            top: `${animatedTokenPos.y}%`,
            backgroundColor: '#8B0000',
            transition: isAnimating ? 'none' : 'left 0.3s, top 0.3s',
          }}
        >
          {currentToken.displayName.charAt(0)}
        </div>
      )}
    </div>
  )
}
