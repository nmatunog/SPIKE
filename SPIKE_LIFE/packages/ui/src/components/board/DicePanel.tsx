import { Dice } from '../Dice.js'
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
  hint = 'Roll → Move → Situation → Analysis → Decision',
}: DicePanelProps) {
  return (
    <div className={`flex flex-col items-center gap-3 ${className}`} aria-label="Dice panel">
      <Dice value={lastDiceRoll} rolling={rolling} size="md" />
      <button
        type="button"
        disabled={!canRoll || rolling}
        onClick={onRoll}
        className="w-full rounded-2xl bg-[#8B0000] px-5 py-3 text-sm font-bold uppercase tracking-wide text-white shadow-lg transition hover:bg-[#a50000] focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-300 disabled:cursor-not-allowed disabled:opacity-40"
      >
        {rolling ? rollingLabel : rollLabel}
      </button>
      {hint && <p className="text-center text-xs leading-snug text-slate-400">{hint}</p>}
    </div>
  )
}
