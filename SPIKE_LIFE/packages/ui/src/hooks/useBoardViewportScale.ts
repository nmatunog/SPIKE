import { useEffect, useRef, useState } from 'react'

/** Scale board to fit container while preserving aspect ratio (SVG/CSS transform, no rasterization). */
export function useBoardViewportScale(aspectRatio = 4 / 3) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [scale, setScale] = useState(1)

  useEffect(() => {
    const el = containerRef.current
    if (!el) return

    function measure() {
      const node = containerRef.current
      if (!node) return
      const { width, height } = node.getBoundingClientRect()
      if (width <= 0 || height <= 0) return

      const naturalWidth = width
      const naturalHeight = width / aspectRatio
      const scaleByHeight = height / naturalHeight
      const scaleByWidth = 1
      setScale(Math.min(1, scaleByHeight, scaleByWidth))
    }

    measure()
    const ro = new ResizeObserver(measure)
    ro.observe(el)
    return () => ro.disconnect()
  }, [aspectRatio])

  return { containerRef, scale }
}
