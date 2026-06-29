const DICE_FACES = ['⚀', '⚁', '⚂', '⚃', '⚄', '⚅']

function dieFace(value) {
  if (value == null || value < 1 || value > 6) return '·'
  return DICE_FACES[value - 1]
}

export default function PremiumDiceBar({
  canRoll,
  rolling,
  onRoll,
  categoryDie,
  situationDie,
  timerLabel,
  statusLine,
}) {
  return (
    <section className="life-glass-panel mx-2 flex flex-col items-center gap-3 rounded-2xl p-4 md:mx-4">
      <div className="flex flex-wrap items-center justify-center gap-6 md:gap-10">
        <div className="text-center">
          <span className="mb-1 block text-xs font-bold uppercase tracking-widest text-slate-500">
            Dice 1: Category
          </span>
          <button
            type="button"
            onClick={onRoll}
            disabled={!canRoll || rolling}
            className="focus-game rounded-lg bg-gradient-to-r from-indigo-600 to-blue-700 px-6 py-2.5 text-sm font-bold text-white shadow-md transition hover:from-indigo-700 hover:to-blue-800 disabled:opacity-50"
          >
            {rolling ? 'Shuffling…' : 'Roll life dice'}
          </button>
        </div>

        <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-100 p-2.5 shadow-sm">
          <Die value={categoryDie} />
          <span className="text-slate-400">⇄</span>
          <Die value={situationDie} />
        </div>

        <div className="text-center">
          <span className="mb-1 block text-xs font-bold uppercase tracking-widest text-slate-500">
            Dice 2: Situation
          </span>
          {timerLabel && (
            <div className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-xs font-mono font-bold text-slate-700 shadow-sm">
              Timer: <span className="text-rose-600">{timerLabel}</span>
            </div>
          )}
        </div>
      </div>

      {statusLine && (
        <div className="w-full rounded-xl border border-indigo-100 bg-gradient-to-r from-indigo-50 via-slate-100 to-indigo-50 py-2 text-center shadow-sm">
          <span className="text-[11px] font-bold uppercase tracking-widest text-slate-500">
            Cycle status:{' '}
          </span>
          <span className="text-sm font-black uppercase tracking-wider text-indigo-700">
            {statusLine}
          </span>
        </div>
      )}
    </section>
  )
}

function Die({ value }) {
  return (
    <div className="flex h-12 w-12 items-center justify-center rounded-lg border border-slate-200 bg-white text-2xl font-extrabold text-slate-800 shadow-sm">
      {dieFace(value)}
    </div>
  )
}
