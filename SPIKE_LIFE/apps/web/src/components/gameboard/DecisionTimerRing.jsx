import { useEffect, useState } from 'react'

export default function DecisionTimerRing({
  deadlineAt,
  totalSeconds,
  onExpire,
  active,
  variant = 'dark',
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
  const isLight = variant === 'light'

  return (
    <div
      className={
        isLight
          ? 'flex flex-col items-center gap-1'
          : `flex flex-row items-center gap-3 rounded-2xl border px-4 py-3 ${
              urgent
                ? 'border-amber-400/60 bg-amber-950/40'
                : 'border-sky-400/30 bg-slate-900/60'
            }`
      }
      role="timer"
      aria-live="polite"
      aria-label={`${remaining} seconds to decide`}
    >
      <div
        className="relative flex h-14 w-14 items-center justify-center rounded-full"
        style={{
          background: `conic-gradient(${urgent ? '#f59e0b' : '#4f46e5'} ${pct}%, ${isLight ? '#e2e8f0' : '#1e293b'} ${pct}%)`,
        }}
      >
        <span
          className={`flex h-11 w-11 items-center justify-center rounded-full text-sm font-bold ${
            isLight ? 'bg-white text-indigo-900' : 'bg-slate-950 text-white'
          }`}
        >
          {remaining}s
        </span>
      </div>
      {!isLight && (
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-300">
            Decision window
          </p>
          <p className={`text-sm ${urgent ? 'text-amber-200' : 'text-slate-200'}`}>
            {urgent ? 'Choose now — or your advisor decides' : 'One meaningful choice this cycle'}
          </p>
        </div>
      )}
    </div>
  )
}
