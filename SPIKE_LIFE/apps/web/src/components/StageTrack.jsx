const STAGE_ICONS = {
  launch: '🚀',
  build: '🏠',
  grow: '📈',
  lead: '👔',
  legacy: '🌳',
}

export function StageNode({ stage, isLast, children = null }) {
  const icon = STAGE_ICONS[stage.lifeStage] ?? '●'
  const isCurrent = stage.status === 'current'
  const isPast = stage.status === 'past'

  return (
    <div className="flex flex-1 items-start min-w-[4.5rem]">
      <div className="flex flex-col items-center flex-1 min-w-0">
        <div
          className={`relative flex h-14 w-14 items-center justify-center rounded-full border-2 text-xl transition-all ${
            isCurrent
              ? 'border-[#8B0000] bg-red-50 shadow-md ring-4 ring-red-100'
              : isPast
                ? 'border-emerald-500 bg-emerald-50'
                : 'border-slate-200 bg-white text-slate-400'
          }`}
        >
          <span aria-hidden>{icon}</span>
        </div>
        <p
          className={`mt-2 text-center text-xs font-semibold uppercase tracking-wide ${
            isCurrent ? 'text-[#8B0000]' : isPast ? 'text-emerald-700' : 'text-slate-400'
          }`}
        >
          {stage.label}
        </p>
        <p className="text-[10px] text-slate-400">Turn {stage.turnNumber}</p>
        {isCurrent && children && (
          <div className="mt-3 w-full">{children}</div>
        )}
      </div>
      {!isLast && (
        <div
          className={`mx-1 mt-7 h-0.5 flex-1 ${
            isPast ? 'bg-emerald-400' : 'bg-slate-200'
          }`}
          aria-hidden
        />
      )}
    </div>
  )
}

export function StageTrack({ boardStages, renderOnCurrentStage = null }) {
  return (
    <div className="flex items-start overflow-x-auto pb-2">
      {boardStages.map((stage, index) => (
        <StageNode
          key={stage.lifeStage}
          stage={stage}
          isLast={index === boardStages.length - 1}
        >
          {renderOnCurrentStage?.(stage)}
        </StageNode>
      ))}
    </div>
  )
}
