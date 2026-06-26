export default function DiceControl({ board, onRoll, rolling = false }) {
  const value = board?.lastDiceRoll
  const canRoll = board?.canRoll && !rolling

  return (
    <div className="flex flex-col items-center gap-3">
      <div
        className={`flex h-16 w-16 items-center justify-center rounded-2xl border-2 bg-white text-3xl font-bold shadow-md transition ${
          rolling ? 'animate-bounce border-[#8B0000] text-[#8B0000]' : 'border-slate-200 text-slate-800'
        }`}
        aria-live="polite"
      >
        {rolling ? '…' : value ?? '—'}
      </div>
      <button
        type="button"
        disabled={!canRoll}
        onClick={onRoll}
        className="rounded-xl bg-[#8B0000] px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#6d0000] disabled:cursor-not-allowed disabled:opacity-40"
      >
        {rolling ? 'Rolling…' : board?.canRoll ? 'Roll dice' : 'Dice locked'}
      </button>
      {board && (
        <p className="text-center text-xs text-slate-500">
          Round {board.roundNumber} of {board.maxRounds}
          {board.phase === 'decision_phase' && ' · Resolve the financial situation →'}
          {board.canEndTurn && ' · Turn complete — end turn to continue'}
        </p>
      )}
    </div>
  )
}
