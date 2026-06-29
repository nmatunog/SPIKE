import DecisionTimerRing from '../gameboard/DecisionTimerRing.jsx'

export default function CycleHudStrip({
  cycleLabel,
  age,
  lifeScore,
  timerActive,
  decisionTimerSeconds,
  cycleDeadlineAt,
  onTimerExpire,
  onOpenDrawer,
}) {
  return (
    <header className="flex shrink-0 items-center justify-between gap-3 border-b border-white/10 px-4 py-2.5">
      <div className="min-w-0">
        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">
          Planning cycle
        </p>
        <p className="truncate text-sm font-bold text-white">{cycleLabel ?? '—'}</p>
      </div>

      <div className="flex items-center gap-3">
        {age != null && (
          <div className="hidden text-center sm:block">
            <p className="text-[9px] uppercase text-slate-500">Age</p>
            <p className="text-sm font-bold tabular-nums text-white">{age}</p>
          </div>
        )}
        {lifeScore != null && (
          <div className="text-center">
            <p className="text-[9px] uppercase text-slate-500">Life Score</p>
            <p className="text-sm font-bold tabular-nums text-rose-300">{lifeScore}</p>
          </div>
        )}
        {timerActive && decisionTimerSeconds > 0 && (
          <DecisionTimerRing
            deadlineAt={cycleDeadlineAt}
            totalSeconds={decisionTimerSeconds}
            active={timerActive}
            onExpire={onTimerExpire}
            variant="light"
          />
        )}
      </div>

      <div className="flex gap-1">
        {['stats', 'dreams', 'advisor'].map((id) => (
          <button
            key={id}
            type="button"
            onClick={() => onOpenDrawer?.(id)}
            className="rounded-lg border border-white/10 px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400 hover:bg-white/10 hover:text-white"
          >
            {id === 'stats' ? 'Stats' : id === 'dreams' ? 'Dreams' : 'Advisor'}
          </button>
        ))}
      </div>
    </header>
  )
}
