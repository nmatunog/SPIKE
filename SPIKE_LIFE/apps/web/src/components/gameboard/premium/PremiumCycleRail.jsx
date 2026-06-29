import DecisionTimerRing from '../DecisionTimerRing.jsx'

const STEPS = [
  { id: 'roll', label: 'Roll' },
  { id: 'situation', label: 'Situation' },
  { id: 'decide', label: 'Decide' },
  { id: 'results', label: 'Results' },
  { id: 'summary', label: 'Summary' },
]

function resolveStep({ phase, rolling, expandedPanel, inDecisionPhase, canDecide }) {
  if (expandedPanel === 'reflect') return 'summary'
  if (expandedPanel === 'decision' || canDecide) return 'decide'
  if (inDecisionPhase && !rolling) return 'situation'
  if (rolling) return 'roll'
  if (phase === 'turn_complete') return 'summary'
  return 'roll'
}

export default function PremiumCycleRail({
  turnNumber = 1,
  maxTurns = 20,
  phase,
  rolling,
  expandedPanel,
  inDecisionPhase,
  canDecide,
  decisionTimerSeconds,
  cycleDeadlineAt,
  onTimerExpire,
}) {
  const active = resolveStep({ phase, rolling, expandedPanel, inDecisionPhase, canDecide })
  const activeIndex = STEPS.findIndex((s) => s.id === active)

  return (
    <aside className="life-glass-panel flex h-full w-[11rem] shrink-0 flex-col rounded-2xl p-4 md:w-48">
      <p className="text-center text-[10px] font-bold uppercase tracking-widest text-slate-500">
        Cycle
      </p>
      <p className="text-center text-2xl font-black text-indigo-900">
        {String(turnNumber).padStart(2, '0')}{' '}
        <span className="text-sm font-normal text-slate-400">/ {maxTurns}</span>
      </p>

      <ol className="relative mt-6 flex-1 space-y-1">
        {STEPS.map((step, index) => {
          const isActive = step.id === active
          const isDone = index < activeIndex
          const isLocked = index > activeIndex

          return (
            <li key={step.id} className="relative flex items-center gap-3 py-2">
              {index < STEPS.length - 1 && (
                <span
                  className={`absolute left-[0.85rem] top-10 h-[calc(100%)] w-0.5 ${
                    isDone ? 'bg-emerald-300' : 'bg-slate-200'
                  }`}
                  aria-hidden
                />
              )}
              <span
                className={`relative z-10 flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                  isActive
                    ? 'bg-indigo-600 text-white shadow-md ring-4 ring-indigo-100'
                    : isDone
                      ? 'bg-emerald-500 text-white'
                      : 'bg-slate-100 text-slate-400'
                }`}
                aria-hidden
              >
                {isDone && !isActive ? '✓' : isActive ? '★' : isLocked ? '○' : '·'}
              </span>
              <span
                className={`text-xs font-semibold ${
                  isActive ? 'text-indigo-900' : isDone ? 'text-emerald-700' : 'text-slate-400'
                }`}
              >
                {step.label}
              </span>
            </li>
          )
        })}
      </ol>

      {canDecide && decisionTimerSeconds > 0 && (
        <div className="mt-4 border-t border-slate-100 pt-4">
          <PremiumTimerRing
            deadlineAt={cycleDeadlineAt}
            totalSeconds={decisionTimerSeconds}
            onExpire={onTimerExpire}
            active={canDecide}
          />
        </div>
      )}
    </aside>
  )
}

function PremiumTimerRing({ deadlineAt, totalSeconds, onExpire, active }) {
  return (
    <div className="flex flex-col items-center gap-2">
      <DecisionTimerRing
        deadlineAt={deadlineAt}
        totalSeconds={totalSeconds}
        onExpire={onExpire}
        active={active}
        variant="light"
      />
      <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">To decide</p>
    </div>
  )
}
