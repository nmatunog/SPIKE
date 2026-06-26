import { useEffect, useRef, useState } from 'react'
import { interpolateAlongSpaces } from '../layout/engine.js'
import type { BoardTokenViewModel, PositionedSpace } from '../types/view-models.js'

export interface MovementAnimatorResult {
  animatedPositions: Map<string, { x: number; y: number }>
  isAnimating: boolean
}

export interface MovementAnimatorInput {
  spaces: PositionedSpace[]
  tokens: BoardTokenViewModel[]
  rolling: boolean
  lastDiceRoll: number | null
  phase: string
}

export function useMovementAnimator({
  spaces,
  tokens,
  rolling,
  lastDiceRoll,
  phase,
}: MovementAnimatorInput): MovementAnimatorResult {
  const prevPositionRef = useRef(0)
  const [animProgress, setAnimProgress] = useState(1)
  const [animFrom, setAnimFrom] = useState(0)
  const [animTo, setAnimTo] = useState(0)

  const currentToken = tokens.find((t) => t.isCurrent) ?? tokens[0]

  useEffect(() => {
    if (!currentToken || rolling) return

    const newPos = currentToken.position
    const shouldAnimate = lastDiceRoll != null && phase !== 'ready_to_roll'

    if (shouldAnimate && newPos !== prevPositionRef.current) {
      setAnimFrom(prevPositionRef.current)
      setAnimTo(newPos)
      setAnimProgress(0)

      const start = performance.now()
      const duration = 680

      function frame(now: number) {
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
    } else if (!shouldAnimate) {
      prevPositionRef.current = newPos
      setAnimProgress(1)
    }
  }, [currentToken, lastDiceRoll, phase, rolling, tokens])

  const isAnimating = animProgress < 1
  const animatedPositions = new Map<string, { x: number; y: number }>()

  for (const token of tokens) {
    const space = spaces.find((s) => s.boardIndex === token.position)
    if (!space) continue

    if (token.isCurrent && isAnimating) {
      animatedPositions.set(
        token.playerId,
        interpolateAlongSpaces(spaces, animFrom, animTo, animProgress),
      )
    } else {
      animatedPositions.set(token.playerId, { x: space.x * 100, y: space.y * 100 })
    }
  }

  return { animatedPositions, isAnimating }
}
