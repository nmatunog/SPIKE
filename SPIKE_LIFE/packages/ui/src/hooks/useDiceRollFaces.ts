import { useEffect, useState } from 'react'

const FACES = [1, 2, 3, 4, 5, 6]

/** Cycles dice faces while rolling — supports learning cue without long motion. */
export function useDiceRollFaces(rolling: boolean, settledValue: number | null): number | null {
  const [face, setFace] = useState<number | null>(settledValue)

  useEffect(() => {
    if (!rolling) {
      setFace(settledValue)
      return
    }

    let frame = 0
    const interval = window.setInterval(() => {
      frame += 1
      setFace(FACES[frame % FACES.length] ?? 1)
    }, 72)

    return () => window.clearInterval(interval)
  }, [rolling, settledValue])

  return rolling ? face : settledValue
}
