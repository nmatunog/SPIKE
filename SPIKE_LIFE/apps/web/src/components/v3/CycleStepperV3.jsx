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
    situation: 2,
    consequences: 3,
    dream: 4,
  }[phase] ?? 0

  return (
    <footer className="gsv3-footer gsv3-zone-footer">
      <div className="gsv3-stepper">
        {STEPS.map((step, index) => {
          const done = index < activeIndex
          const active = index === activeIndex
          return (
            <div key={step.id} className="flex items-center gap-1">
              <div
                className={`gsv3-stepper-dot ${
                  active
                    ? 'gsv3-stepper-dot--active'
                    : done
                      ? 'gsv3-stepper-dot--done'
                      : 'gsv3-stepper-dot--pending'
                }`}
              >
                {done ? '✓' : index + 1}
              </div>
              <span
                className={`gsv3-stepper-label ${
                  active ? 'text-indigo-700' : 'text-slate-400'
                }`}
              >
                {step.label}
              </span>
              {index < STEPS.length - 1 && (
                <span className="mx-0.5 hidden h-px w-4 bg-slate-200 sm:inline" aria-hidden />
              )}
            </div>
          )
        })}
      </div>

      <p className="hidden text-[10px] font-semibold uppercase tracking-wide text-slate-400 sm:block">
        Pick one response, then confirm
      </p>
    </footer>
  )
}
