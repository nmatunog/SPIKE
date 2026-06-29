import { useState } from 'react'

const ICONS = {
  home: '🏠',
  plane: '✈️',
  briefcase: '💼',
  sunset: '🌅',
  graduation: '🎓',
}

export default function DreamBoardSetup({ dreamBoard, onSubmit, busy }) {
  const [choices, setChoices] = useState(
    () => dreamBoard?.goals.map((g) => ({ ...g })) ?? [],
  )

  function toggleGoal(goalId) {
    setChoices((prev) =>
      prev.map((g) => (g.goalId === goalId ? { ...g, enabled: !g.enabled } : g)),
    )
  }

  function handleSubmit(e) {
    e.preventDefault()
    onSubmit(
      choices.map((g) => ({
        goalId: g.goalId,
        goalName: g.goalName,
        enabled: g.enabled,
        presentValue: g.presentValue?.amount ?? g.presentValue,
        targetAge: g.targetAge,
        futureValue: g.futureValue?.amount ?? g.futureValue,
        icon: g.icon,
      })),
    )
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <div className="text-center">
        <p className="text-xs font-semibold uppercase tracking-widest text-[#8B0000]">
          Life Blueprint
        </p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-900">
          Design your financial dreams
        </h1>
        <p className="mt-3 text-slate-600">
          Set your goals before life begins. Future values adjust for inflation automatically.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="mt-8 space-y-4">
        {choices.map((goal) => (
          <button
            key={goal.goalId}
            type="button"
            onClick={() => toggleGoal(goal.goalId)}
            className={`w-full rounded-2xl border-2 p-5 text-left transition-all ${
              goal.enabled
                ? 'border-[#8B0000]/40 bg-gradient-to-br from-white to-rose-50/80 shadow-md'
                : 'border-slate-200 bg-slate-50/80 opacity-70'
            }`}
          >
            <div className="flex items-start gap-4">
              <span className="text-3xl" aria-hidden>
                {ICONS[goal.icon] ?? '🎯'}
              </span>
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-slate-900">{goal.goalName}</p>
                <p className="mt-1 text-sm text-slate-600">
                  Target age {goal.targetAge} · Future value{' '}
                  <span className="font-medium text-slate-800">
                    {goal.futureValue?.formatted ?? goal.futureValue}
                  </span>
                </p>
              </div>
              <span
                className={`rounded-full px-3 py-1 text-xs font-semibold ${
                  goal.enabled
                    ? 'bg-[#8B0000] text-white'
                    : 'bg-slate-200 text-slate-600'
                }`}
              >
                {goal.enabled ? 'Included' : 'Skip'}
              </span>
            </div>
          </button>
        ))}

        <div className="rounded-2xl border border-sky-200 bg-sky-50/80 p-5">
          <p className="text-sm font-semibold text-sky-900">Emergency fund (automatic)</p>
          <p className="mt-1 text-2xl font-bold text-sky-950">
            {dreamBoard?.emergencyFundTarget?.formatted}
          </p>
          <p className="mt-1 text-xs text-sky-700">6× monthly income — your first safety net</p>
        </div>

        <button
          type="submit"
          disabled={busy}
          className="btn-primary mt-6 w-full py-4 text-lg font-semibold"
        >
          {busy ? 'Saving…' : 'Begin my life journey'}
        </button>
      </form>
    </div>
  )
}
