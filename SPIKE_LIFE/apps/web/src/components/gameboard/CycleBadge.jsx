export default function CycleBadge({ cycleLabel, turnNumber, maxTurns, className = '' }) {
  return (
    <div
      className={`inline-flex flex-col rounded-xl border border-white/15 bg-slate-900/70 px-4 py-2 backdrop-blur-sm ${className}`}
    >
      <span className="text-[10px] font-semibold uppercase tracking-widest text-sky-300/90">
        Planning cycle
      </span>
      <span className="text-sm font-bold text-white">{cycleLabel}</span>
      <span className="text-[10px] text-slate-400">
        Chapter {turnNumber} of {maxTurns}
      </span>
    </div>
  )
}
