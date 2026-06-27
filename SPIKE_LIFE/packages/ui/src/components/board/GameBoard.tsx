import { useMemo } from 'react'
import { BoardPath } from '../BoardPath.js'
import { DiceRollAnimation } from '../Dice.js'
import { MovementAnimator } from '../MovementAnimator.js'
import { BoardAnimation } from './BoardAnimation.js'
import { BoardSpace } from './BoardSpace.js'
import { PlayerToken } from './PlayerToken.js'
import { useBoardViewportScale } from '../../hooks/useBoardViewportScale.js'
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
  const { containerRef, scale } = useBoardViewportScale(4 / 3)

  const tokensByPosition = useMemo(
    () => groupTokensByPosition(board?.tokens ?? []),
    [board?.tokens],
  )

  if (!board) {
    return (
      <div
        className={`flex h-full w-full items-center justify-center rounded-3xl border border-slate-700 bg-slate-900/50 ${className}`}
        role="status"
      >
        <p className="text-base text-slate-400">{loadingLabel}</p>
      </div>
    )
  }

  const currentToken = board.tokens.find((t) => t.isCurrent)

  return (
    <div
      ref={containerRef}
      className={`relative flex h-full w-full items-center justify-center ${className}`}
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
          <div
            className="w-full"
            style={{
              transform: `scale(${scale})`,
              transformOrigin: 'center center',
              maxWidth: '100%',
            }}
          >
            <BoardAnimation
              rolling={rolling}
              isAnimating={isAnimating}
              highlightSpaceIndex={highlightSpaceIndex}
              landedSpaceIndex={board.landedSpaceIndex}
            >
              <div className="relative aspect-[4/3] w-full">
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
                    const isLanded =
                      board.landedSpaceIndex === space.boardIndex && !isAnimating
                    const isHighlighted = highlightSpaceIndex === space.boardIndex
                    const hideOnSpace =
                      isAnimating &&
                      tokensHere.some(
                        (t) => t.isCurrent && t.playerId === currentToken?.playerId,
                      )

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
            </BoardAnimation>
          </div>
        )}
      </MovementAnimator>
    </div>
  )
}
