const STEPS = [
  { id: 'roll', label: 'Roll' },
  { id: 'situation', label: 'Situation' },
  { id: 'decide', label: 'Decide' },
  { id: 'results', label: 'Results' },
  { id: 'next', label: 'Next cycle' },
]

export default function CycleStepperV3({ phase }) {
  const activeIndex = {
    idle: 0,
    domain: 0,
    situation: 1,
    consequences: 3,
    dream: 4,
  }[phase] ?? 0

  return (
    <footer className="flex shrink-0 items-center justify-center gap-2 border-t border-slate-200/80 bg-white/80 px-4 py-2 backdrop-blur-sm">
      {STEPS.map((step, index) => {
        const done = index < activeIndex
        const active = index === activeIndex
        return (
          <div key={step.id} className="flex items-center gap-2">
            <div
              className={`gsv3-stepper-dot ${
                active ? 'gsv3-stepper-dot--active' : done ? 'gsv3-stepper-dot--done' : 'gsv3-stepper-dot--pending'
              }`}
            >
              {done ? '✓' : index + 1}
            </div>
            <span
              className={`hidden text-[10px] font-bold uppercase tracking-wide sm:inline ${
                active ? 'text-indigo-700' : 'text-slate-400'
              }`}
            >
              {step.label}
            </span>
            {index < STEPS.length - 1 && (
              <span className="hidden h-px w-6 bg-slate-200 sm:inline" aria-hidden />
            )}
          </div>
        )
      })}
    </footer>
  )
}
