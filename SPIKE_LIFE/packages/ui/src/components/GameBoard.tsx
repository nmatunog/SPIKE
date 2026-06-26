import { useMemo } from 'react'
import { motion } from 'framer-motion'
import { BoardPath } from './BoardPath.js'
import { BoardSpace } from './BoardSpace.js'
import { PlayerToken } from './PlayerToken.js'
import { DiceRollAnimation } from './Dice.js'
import { useMovementAnimator } from '../hooks/useMovementAnimator.js'
import type { BoardViewModel, PositionedSpace } from '../types/view-models.js'

export interface GameBoardProps {
  board: BoardViewModel | null
  rolling?: boolean
  highlightSpaceIndex?: number | null
  onSpaceSelect?: (space: PositionedSpace) => void
  className?: string
}

export function GameBoard({
  board,
  rolling = false,
  highlightSpaceIndex = null,
  onSpaceSelect,
  className = '',
}: GameBoardProps) {
  const { animatedPositions, isAnimating } = useMovementAnimator({
    spaces: board?.spaces ?? [],
    tokens: board?.tokens ?? [],
    rolling,
    lastDiceRoll: board?.lastDiceRoll ?? null,
    phase: board?.phase ?? 'ready_to_roll',
  })

  const tokensByPosition = useMemo(() => {
    const map = new Map<number, BoardViewModel['tokens']>()
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
        className={`flex h-full w-full items-center justify-center rounded-3xl border border-slate-700 bg-slate-900/50 ${className}`}
      >
        <p className="text-base text-slate-400">Loading board…</p>
      </div>
    )
  }

  const currentToken = board.tokens.find((t) => t.isCurrent)

  return (
    <motion.div
      layout
      className={`relative mx-auto h-full w-full max-w-full ${className}`}
      style={{ width: 'min(68vw, 100%)', maxHeight: '100%' }}
    >
      <div className="relative aspect-[4/3] h-full max-h-full w-full">
        <div
          className="absolute inset-0 overflow-hidden rounded-[1.75rem] border-2 border-slate-600/80 shadow-2xl"
          style={{
            background:
              'radial-gradient(ellipse at 50% 30%, rgba(6,78,59,0.35) 0%, transparent 55%), linear-gradient(180deg, #1e293b 0%, #0f172a 55%, #020617 100%)',
            boxShadow: 'inset 0 2px 32px rgba(0,0,0,0.4), 0 12px 48px rgba(0,0,0,0.35)',
          }}
        >
          <BoardPath path={board.trackPath} />

          <p className="pointer-events-none absolute left-1/2 top-[48%] -translate-x-1/2 -translate-y-1/2 text-center">
            <span className="block text-xs font-semibold uppercase tracking-widest text-slate-500">
              Year
            </span>
            <span className="text-3xl font-bold text-white/95">{board.boardYear}</span>
          </p>

          {board.spaces.map((space) => {
            const tokensHere = tokensByPosition.get(space.boardIndex) ?? []
            const isLanded = board.landedSpaceIndex === space.boardIndex && !isAnimating
            const isHighlighted = highlightSpaceIndex === space.boardIndex
            const hideOnSpace =
              isAnimating && tokensHere.some((t) => t.isCurrent && t.playerId === currentToken?.playerId)

            return (
              <div key={space.id}>
                <BoardSpace
                  space={space}
                  isLanded={isLanded}
                  isHighlighted={isHighlighted}
                  size="lg"
                  onSelect={onSpaceSelect}
                />
                {!hideOnSpace &&
                  tokensHere.map((token) => {
                    const pos = animatedPositions.get(token.playerId) ?? {
                      x: space.x * 100,
                      y: space.y * 100,
                    }
                    return (
                      <PlayerToken
                        key={token.playerId}
                        token={token}
                        x={pos.x}
                        y={pos.y}
                        rolling={rolling}
                        size={token.isCurrent ? 36 : 30}
                      />
                    )
                  })}
              </div>
            )
          })}

          {currentToken && isAnimating && (
            <PlayerToken
              token={currentToken}
              x={animatedPositions.get(currentToken.playerId)?.x ?? 50}
              y={animatedPositions.get(currentToken.playerId)?.y ?? 50}
              rolling={rolling}
              size={38}
            />
          )}

          <DiceRollAnimation visible={rolling} value={board.lastDiceRoll} />
        </div>
      </div>
    </motion.div>
  )
}
