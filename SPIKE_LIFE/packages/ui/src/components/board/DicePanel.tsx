import { motion, useReducedMotion } from 'framer-motion'
import { Dice } from '../Dice.js'
import { motionTokens as t } from '../../motion/tokens.js'
import type { DicePanelProps } from '../../types/component-props.js'

export type { DicePanelProps }

export function DicePanel({
  canRoll,
  rolling,
  lastDiceRoll,
  onRoll,
  className = '',
  rollLabel = 'Roll dice',
  rollingLabel = 'Rolling…',
  hint = 'Roll → land → learn → plan → reflect',
}: DicePanelProps) {
  const reduceMotion = useReducedMotion()

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: t.normal }}
      className={`flex flex-col items-center gap-3 ${className}`}
      aria-label="Dice panel"
    >
      <Dice value={lastDiceRoll} rolling={rolling} size="md" />
      <motion.button
        type="button"
        disabled={!canRoll || rolling}
        onClick={onRoll}
        whileHover={!canRoll || rolling || reduceMotion ? undefined : { scale: 1.02, y: -1 }}
        whileTap={!canRoll || rolling || reduceMotion ? undefined : { scale: 0.98 }}
        transition={{ duration: t.fast }}
        className="w-full rounded-2xl bg-[#8B0000] px-5 py-3 text-sm font-bold uppercase tracking-wide text-white shadow-lg transition hover:bg-[#a50000] focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-300 disabled:cursor-not-allowed disabled:opacity-40"
      >
        {rolling ? rollingLabel : rollLabel}
      </motion.button>
      {hint && <p className="text-center text-xs leading-snug text-slate-400">{hint}</p>}
    </motion.div>
  )
}
