const STEPS = [
  { id: 'roll', label: 'Roll', icon: '🎲' },
  { id: 'move', label: 'Move', icon: '→' },
  { id: 'situation', label: 'Situation', icon: '!' },
  { id: 'analysis', label: 'Analysis', icon: '📊' },
  { id: 'decision', label: 'Decision', icon: '✓' },
  { id: 'reflection', label: 'Reflect', icon: '💭' },
]

function resolveActiveStep({ phase, rolling, expandedPanel, showEncounterModal }) {
  if (rolling) return 'move'
  if (expandedPanel === 'reflect') return 'reflection'
  if (expandedPanel === 'decision') return 'decision'
  if (expandedPanel === 'fna') return 'analysis'
  if (phase === 'decision_phase' || showEncounterModal) return 'situation'
  if (phase === 'ready_to_roll') return 'roll'
  if (phase === 'turn_complete') return 'reflection'
  return 'roll'
}

export default function TurnFlowStepper({
  phase = 'ready_to_roll',
  rolling = false,
  expandedPanel = null,
  showEncounterModal = false,
  className = '',
}) {
  const active = resolveActiveStep({ phase, rolling, expandedPanel, showEncounterModal })
  const activeIndex = STEPS.findIndex((s) => s.id === active)

  return (
    <nav
      className={`game-card px-4 py-4 ${className}`}
      aria-label="Turn flow"
    >
      <p className="text-label uppercase text-slate-500">Your turn</p>
      <ol className="mt-3 space-y-1">
        {STEPS.map((step, index) => {
          const isActive = step.id === active
          const isDone = index < activeIndex
          return (
            <li
              key={step.id}
              className={`flex items-center gap-3 rounded-xl px-3 py-2.5 transition ${
                isActive
                  ? 'bg-spike-brand-muted ring-1 ring-spike-brand/25'
                  : isDone
                    ? 'opacity-70'
                    : 'opacity-45'
              }`}
            >
              <span
                className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-sm ${
                  isActive
                    ? 'bg-spike-brand text-white shadow-sm'
                    : isDone
                      ? 'bg-emerald-100 text-emerald-700'
                      : 'bg-slate-100 text-slate-500'
                }`}
                aria-hidden
              >
                {isDone && !isActive ? '✓' : step.icon}
              </span>
              <span
                className={`text-body font-semibold ${
                  isActive ? 'text-slate-900' : 'text-slate-600'
                }`}
              >
                {step.label}
              </span>
            </li>
          )
        })}
      </ol>
    </nav>
  )
}
