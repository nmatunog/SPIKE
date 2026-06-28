export default function BoardWelcome({ visible, characterName, onRoll, canRoll }) {
  if (!visible) return null

  return (
    <div
      className="pointer-events-none absolute inset-x-0 bottom-6 z-20 flex justify-center px-4 sm:bottom-8"
      aria-hidden={!visible}
    >
      <div className="pointer-events-auto max-w-md rounded-2xl border border-white/20 bg-slate-900/85 px-6 py-5 text-center shadow-board backdrop-blur-md">
        <p className="text-label uppercase tracking-wider text-amber-300/90">Year one begins</p>
        <h2 className="mt-2 text-display-sm font-bold text-white">
          {characterName ? `${characterName}, start your first year` : 'Start your first year'}
        </h2>
        <p className="mt-2 text-body leading-relaxed text-slate-300">
          Tap Next Year. Life domains animate, a situation appears, then you choose one decision.
        </p>
        {canRoll && onRoll && (
          <button
            type="button"
            onClick={onRoll}
            className="focus-game-dark btn-primary mt-4 w-full sm:w-auto"
            aria-keyshortcuts="R"
          >
            Next year
          </button>
        )}
      </div>
    </div>
  )
}
