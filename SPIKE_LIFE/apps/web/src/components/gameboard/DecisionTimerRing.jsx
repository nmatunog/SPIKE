import { useEffect, useState } from 'react'

export default function DecisionTimerRing({
  deadlineAt,
  totalSeconds,
  onExpire,
  active,
}) {
  const [remaining, setRemaining] = useState(totalSeconds)

  useEffect(() => {
    if (!active || !deadlineAt || totalSeconds <= 0) return undefined

    const tick = () => {
      const ms = new Date(deadlineAt).getTime() - Date.now()
      const secs = Math.max(0, Math.ceil(ms / 1000))
      setRemaining(secs)
      if (secs <= 0) onExpire?.()
    }

    tick()
    const id = setInterval(tick, 250)
    return () => clearInterval(id)
  }, [deadlineAt, totalSeconds, active, onExpire])

  if (!active || totalSeconds <= 0) return null

  const pct = Math.round((remaining / totalSeconds) * 100)
  const urgent = remaining <= 5

  return (
    <div
      className={`flex items-center gap-3 rounded-2xl border px-4 py-3 ${
        urgent
          ? 'border-amber-400/60 bg-amber-950/40'
          : 'border-sky-400/30 bg-slate-900/60'
      }`}
      role="timer"
      aria-live="polite"
      aria-label={`${remaining} seconds to decide`}
    >
      <div
        className="relative flex h-12 w-12 items-center justify-center rounded-full"
        style={{
          background: `conic-gradient(${urgent ? '#fbbf24' : '#38bdf8'} ${pct}%, #1e293b ${pct}%)`,
        }}
      >
        <span className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-950 text-sm font-bold text-white">
          {remaining}
        </span>
      </div>
      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-300">
          Decision window
        </p>
        <p className={`text-sm ${urgent ? 'text-amber-200' : 'text-slate-200'}`}>
          {urgent ? 'Choose now — or your advisor decides' : 'One meaningful choice this cycle'}
        </p>
      </div>
    </div>
  )
}
