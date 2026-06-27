import { useMemo } from 'react'
import { BoardPath } from '../BoardPath.js'
import { DiceRollAnimation } from '../Dice.js'
import { MovementAnimator } from '../MovementAnimator.js'
import { BoardAnimation } from './BoardAnimation.js'
import { BoardSpace } from './BoardSpace.js'
import { PlayerToken } from './PlayerToken.js'
import { groupTokensByPosition } from '../../utils/presentation.js'
import { tokenOffset } from '../../utils/token-offset.js'
import type { GameBoardProps } from '../../types/component-props.js'

export type { GameBoardProps }

export function GameBoard({
  board,
  rolling = false,
  highlightSpaceIndex = null,
  onSpaceSelect,
  className = '',
  loadingLabel = 'Loading board…',
}: GameBoardProps) {
  const tokensByPosition = useMemo(
    () => groupTokensByPosition(board?.tokens ?? []),
    [board?.tokens],
  )

  if (!board) {
    return (
      <div
        className={`flex h-full w-full items-center justify-center ${className}`}
        role="status"
      >
        <p className="text-body-lg text-slate-400">{loadingLabel}</p>
      </div>
    )
  }

  const currentToken = board.tokens.find((t) => t.isCurrent)

  return (
    <div
      className={`flex h-full w-full items-center justify-center ${className}`}
      aria-label="Game board"
    >
      <MovementAnimator
        spaces={board.spaces}
        tokens={board.tokens}
        rolling={rolling}
        lastDiceRoll={board.lastDiceRoll}
        phase={board.phase}
      >
        {({ animatedPositions, isAnimating }) => (
          <BoardAnimation
            rolling={rolling}
            isAnimating={isAnimating}
            highlightSpaceIndex={highlightSpaceIndex}
            landedSpaceIndex={board.landedSpaceIndex}
            className="aspect-[4/3] h-full max-h-full w-auto max-w-full"
          >
            <div
              className="relative h-full w-full overflow-hidden rounded-[1.25rem] border border-slate-500/40 shadow-board"
              style={{
                background:
                  'radial-gradient(ellipse 80% 50% at 50% 20%, rgba(16,185,129,0.22) 0%, transparent 55%), linear-gradient(165deg, #1e293b 0%, #0f172a 50%, #020617 100%)',
              }}
            >
              <BoardPath path={board.trackPath} />

              <p className="pointer-events-none absolute left-1/2 top-[47%] -translate-x-1/2 -translate-y-1/2 text-center">
                <span className="block text-xs font-bold uppercase tracking-[0.2em] text-slate-400">
                  Year
                </span>
                <span className="text-4xl font-bold tracking-tight text-white">{board.boardYear}</span>
              </p>

              {board.spaces.map((space) => {
                const tokensHere = tokensByPosition.get(space.boardIndex) ?? []
                const isLanded = board.landedSpaceIndex === space.boardIndex && !isAnimating
                const isHighlighted = highlightSpaceIndex === space.boardIndex
                const hideOnSpace =
                  isAnimating &&
                  tokensHere.some((t) => t.isCurrent && t.playerId === currentToken?.playerId)

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
                      tokensHere.map((token, tokenIndex) => {
                        const base = animatedPositions.get(token.playerId) ?? {
                          x: space.x * 100,
                          y: space.y * 100,
                        }
                        const offset = tokenOffset(tokenIndex, tokensHere.length)
                        return (
                          <PlayerToken
                            key={token.playerId}
                            token={token}
                            x={base.x + offset.dx}
                            y={base.y + offset.dy}
                            rolling={rolling}
                            size={token.isCurrent ? 40 : 34}
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
                  size={42}
                />
              )}

              <DiceRollAnimation visible={rolling} value={board.lastDiceRoll} />
            </div>
          </BoardAnimation>
        )}
      </MovementAnimator>
    </div>
  )
}
