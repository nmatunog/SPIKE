import { motion, AnimatePresence, useReducedMotion } from 'framer-motion'
import { useDiceRollFaces } from '../hooks/useDiceRollFaces.js'
import { motionTokens as t } from '../motion/tokens.js'

export interface DiceProps {
  value: number | null
  rolling?: boolean
  size?: 'sm' | 'md' | 'lg'
}

const SIZES = {
  sm: 'h-10 w-10 text-base',
  md: 'h-14 w-14 text-xl',
  lg: 'h-16 w-16 text-2xl',
}

const PIP_LAYOUT: Record<number, string> = {
  1: '●',
  2: '●●',
  3: '●●●',
  4: '●●\n●●',
  5: '●●●\n●●',
  6: '●●●\n●●●',
}

function DiceFace({ value }: { value: number | null }) {
  if (value == null) return <span className="text-slate-400">—</span>
  const pips = PIP_LAYOUT[value] ?? String(value)
  if (pips.includes('\n')) {
    return (
      <span className="grid grid-cols-2 gap-0.5 text-[0.45em] leading-none">
        {Array.from({ length: value }, (_, i) => (
          <span key={i} className="flex h-1.5 w-1.5 items-center justify-center rounded-full bg-white" />
        ))}
      </span>
    )
  }
  return <span>{value}</span>
}

export function Dice({ value, rolling = false, size = 'md' }: DiceProps) {
  const reduceMotion = useReducedMotion()
  const displayValue = useDiceRollFaces(rolling, value)

  return (
    <motion.div
      animate={
        rolling && !reduceMotion
          ? {
              rotate: [0, 14, -12, 10, -6, 0],
              scale: [1, 1.08, 1.04, 1.06, 1],
              y: [0, -3, 0, -2, 0],
            }
          : { rotate: 0, scale: 1, y: 0 }
      }
      transition={
        rolling
          ? { duration: t.slow, ease: t.ease.snap, times: [0, 0.2, 0.45, 0.7, 1] }
          : t.spring.snappy
      }
      whileHover={!rolling ? { scale: 1.04, transition: { duration: t.fast } } : undefined}
      className={`relative flex items-center justify-center rounded-2xl border-2 border-slate-500/80 bg-gradient-to-br from-slate-600 via-slate-800 to-slate-950 font-bold text-white shadow-lg shadow-slate-950/40 ${SIZES[size]}`}
      aria-label={rolling ? 'Rolling dice' : `Dice showing ${value ?? 'empty'}`}
      role="img"
    >
      {rolling && !reduceMotion && (
        <motion.span
          className="pointer-events-none absolute inset-0 rounded-2xl ring-2 ring-amber-300/60"
          animate={{ opacity: [0.3, 0.8, 0.3], scale: [1, 1.06, 1] }}
          transition={{ duration: t.slow, repeat: Infinity, ease: 'easeInOut' }}
          aria-hidden
        />
      )}
      <AnimatePresence mode="wait">
        <motion.span
          key={rolling ? `roll-${displayValue}` : String(value)}
          initial={{ opacity: 0, scale: 0.6, rotateX: rolling ? -40 : 0 }}
          animate={{ opacity: 1, scale: 1, rotateX: 0 }}
          exit={{ opacity: 0, scale: 0.75, rotateX: 40 }}
          transition={{ duration: t.fast, ease: t.ease.out }}
          className="relative z-10 flex items-center justify-center"
        >
          {rolling && !reduceMotion ? (
            <span className="tabular-nums">{displayValue ?? '…'}</span>
          ) : (
            <DiceFace value={value} />
          )}
        </motion.span>
      </AnimatePresence>
    </motion.div>
  )
}

export interface DiceRollAnimationProps {
  visible: boolean
  value: number | null
  rolling?: boolean
}

export function DiceRollAnimation({ visible, value, rolling = true }: DiceRollAnimationProps) {
  if (!visible) return null

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.7, y: 8 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.85, y: -4 }}
      transition={{ duration: t.normal, ease: t.ease.out }}
      className="pointer-events-none absolute left-1/2 top-[16%] z-40 -translate-x-1/2"
    >
      <motion.div
        animate={{ y: [0, -6, 0] }}
        transition={{ duration: t.slow, repeat: Infinity, ease: 'easeInOut' }}
      >
        <Dice value={value} rolling={rolling} size="lg" />
      </motion.div>
    </motion.div>
  )
}
