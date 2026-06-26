export default function LifeScoreRing({
  score,
  max = 100,
  size = 48,
  strokeWidth = 4,
  label,
  compact = false,
}) {
  const pct = max > 0 ? Math.min(100, Math.max(0, (score / max) * 100)) : 0
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (pct / 100) * circumference
  const displayScore = Math.round(score * 10)

  return (
    <div className={`flex items-center gap-2 ${compact ? '' : 'flex-col'}`}>
      <svg width={size} height={size} className="-rotate-90" aria-hidden>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          className="text-slate-700"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className="text-[#8B0000] transition-all duration-500"
        />
      </svg>
      <div className={compact ? 'min-w-0' : 'text-center'}>
        {label && (
          <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
            {label}
          </p>
        )}
        <p className={`font-bold text-white ${compact ? 'text-sm' : 'text-lg'}`}>
          {displayScore}
          <span className="text-slate-400 font-normal">/1000</span>
        </p>
        {!compact && score > 0 && (
          <p className="text-[10px] text-emerald-400">Building momentum</p>
        )}
        {!compact && score === 0 && (
          <p className="text-[10px] text-slate-400">Getting started!</p>
        )}
      </div>
    </div>
  )
}
