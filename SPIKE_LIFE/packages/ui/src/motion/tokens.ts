/** Shared motion tokens — fast by default, dramatic only when noted. */
export const motionTokens = {
  /** Standard UI transitions */
  fast: 0.15,
  normal: 0.22,
  slow: 0.28,

  /** Intentionally dramatic (movement, encounter reveal) */
  dramatic: 0.55,

  ease: {
    out: [0.22, 1, 0.36, 1] as const,
    snap: [0.34, 1.2, 0.64, 1] as const,
    soft: [0.4, 0, 0.2, 1] as const,
  },

  spring: {
    snappy: { type: 'spring' as const, stiffness: 520, damping: 32, mass: 0.7 },
    smooth: { type: 'spring' as const, stiffness: 380, damping: 28, mass: 0.85 },
    gentle: { type: 'spring' as const, stiffness: 280, damping: 26, mass: 1 },
  },
} as const
