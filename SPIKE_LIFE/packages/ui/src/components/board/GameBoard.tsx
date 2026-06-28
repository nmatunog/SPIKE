import { useMemo } from 'react'
import { BoardPath } from '../BoardPath.js'
import { DiceRollAnimation } from '../Dice.js'
import { MovementAnimator } from '../MovementAnimator.js'
import { BoardAnimation, type CameraFocus } from './BoardAnimation.js'
import { BoardSpace } from './BoardSpace.js'
import { PlayerToken } from './PlayerToken.js'
import { groupTokensByPosition } from '../../utils/presentation.js'
import { tokenOffset } from '../../utils/token-offset.js'
import type { GameBoardProps } from '../../types/component-props.js'
import type { PositionedSpace } from '../../types/view-models.js'

export type { GameBoardProps }

function resolveCameraFocus({
  rolling,
  isAnimating,
  highlightSpaceIndex,
  landedSpaceIndex,
  spaces,
  tokenPosition,
}: {
  rolling: boolean
  isAnimating: boolean
  highlightSpaceIndex: number | null
  landedSpaceIndex: number | null
  spaces: PositionedSpace[]
  tokenPosition: { x: number; y: number } | undefined
}): CameraFocus {
  if (rolling) return { x: 0.5, y: 0.42, scale: 1.05 }

  if (isAnimating && tokenPosition) {
    return {
      x: tokenPosition.x / 100,
      y: tokenPosition.y / 100,
      scale: 1.08,
    }
  }

  if (landedSpaceIndex != null) {
    const landed = spaces.find((s) => s.boardIndex === landedSpaceIndex)
    if (landed) return { x: landed.x, y: landed.y, scale: 1.06 }
  }

  if (highlightSpaceIndex != null) {
    const highlighted = spaces.find((s) => s.boardIndex === highlightSpaceIndex)
    if (highlighted) return { x: highlighted.x, y: highlighted.y, scale: 1.04 }
  }

  return { x: 0.5, y: 0.5, scale: 1 }
}

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
        <p className="text-body-lg text-slate-500">{loadingLabel}</p>
      </div>
    )
  }

  const currentToken = board.tokens.find((t) => t.isCurrent)

  return (
    <div
      className={`flex h-full w-full items-center justify-center ${className}`}
      role="application"
      aria-label="Game board"
    >
      <MovementAnimator
        spaces={board.spaces}
        tokens={board.tokens}
        rolling={rolling}
        lastDiceRoll={board.lastDiceRoll}
        phase={board.phase}
      >
        {({ animatedPositions, isAnimating, justLanded }) => {
          const tokenPos = currentToken
            ? animatedPositions.get(currentToken.playerId)
            : undefined

          const cameraFocus = resolveCameraFocus({
            rolling,
            isAnimating,
            highlightSpaceIndex,
            landedSpaceIndex: board.landedSpaceIndex,
            spaces: board.spaces,
            tokenPosition: tokenPos,
          })

          return (
            <BoardAnimation
              rolling={rolling}
              isAnimating={isAnimating}
              highlightSpaceIndex={highlightSpaceIndex}
              landedSpaceIndex={board.landedSpaceIndex}
              cameraFocus={cameraFocus}
              className="aspect-[4/3] h-full max-h-full w-full max-w-full xl:aspect-[5/4]"
            >
              <div
                className="relative h-full w-full overflow-hidden rounded-[1.5rem] border border-white/10 shadow-board xl:rounded-[1.75rem]"
                style={{
                  background:
                    'radial-gradient(ellipse 85% 55% at 50% 18%, rgba(16,185,129,0.28) 0%, transparent 58%), radial-gradient(ellipse 60% 40% at 50% 100%, rgba(59,130,246,0.12) 0%, transparent 50%), linear-gradient(168deg, #1e293b 0%, #0f172a 48%, #020617 100%)',
                }}
              >
                <div
                  className="pointer-events-none absolute inset-3 rounded-[1.25rem] border border-white/5 xl:inset-4"
                  aria-hidden
                />

                <BoardPath path={board.trackPath} />

                <div className="pointer-events-none absolute left-1/2 top-[46%] -translate-x-1/2 -translate-y-1/2 text-center">
                  <span className="block text-label uppercase tracking-[0.22em] text-slate-400/90">
                    Year
                  </span>
                  <span className="text-display font-bold tabular-nums tracking-tight text-white drop-shadow-lg">
                    {board.boardYear}
                  </span>
                </div>

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
                        size="xl"
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
                              landing={justLanded && token.isCurrent}
                              size={token.isCurrent ? 48 : 38}
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
                    size={52}
                  />
                )}

                <DiceRollAnimation
                  visible={rolling}
                  value={board.lastDiceRoll}
                  rolling={rolling}
                />
              </div>
            </BoardAnimation>
          )
        }}
      </MovementAnimator>
    </div>
  )
}
