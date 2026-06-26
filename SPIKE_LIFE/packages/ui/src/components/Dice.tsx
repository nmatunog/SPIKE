import { motion, AnimatePresence } from 'framer-motion'

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

export function Dice({ value, rolling = false, size = 'md' }: DiceProps) {
  return (
    <motion.div
      animate={rolling ? { rotate: [0, 12, -12, 8, 0], scale: [1, 1.06, 1] } : { rotate: 0, scale: 1 }}
      transition={{ duration: 0.28, ease: 'easeOut' }}
      className={`flex items-center justify-center rounded-2xl border-2 border-slate-600 bg-gradient-to-br from-slate-700 to-slate-900 font-bold text-white shadow-lg ${SIZES[size]}`}
      aria-label={rolling ? 'Rolling dice' : `Dice showing ${value ?? 'empty'}`}
      role="img"
    >
      <AnimatePresence mode="wait">
        <motion.span
          key={rolling ? 'rolling' : String(value)}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.18 }}
        >
          {rolling ? '…' : (value ?? '—')}
        </motion.span>
      </AnimatePresence>
    </motion.div>
  )
}

export interface DiceRollAnimationProps {
  visible: boolean
  value: number | null
}

export function DiceRollAnimation({ visible, value }: DiceRollAnimationProps) {
  if (!visible) return null

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.85 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      transition={{ duration: 0.22 }}
      className="pointer-events-none absolute left-1/2 top-[18%] z-40 -translate-x-1/2"
    >
      <Dice value={value} rolling size="lg" />
    </motion.div>
  )
}
