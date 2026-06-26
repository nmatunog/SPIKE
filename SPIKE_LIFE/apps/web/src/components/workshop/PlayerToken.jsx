const STATUS_RING = {
  joined: 'ring-slate-200',
  planning: 'ring-amber-400 animate-pulse',
  decided: 'ring-blue-400',
  reflected: 'ring-violet-400',
  done: 'ring-emerald-500',
}

export default function PlayerToken({
  player,
  selected = false,
  onSelect,
  compact = false,
}) {
  const initials = player.displayName
    .split(' ')
    .map((w) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()

  const size = compact ? 'h-9 w-9 text-xs' : 'h-11 w-11 text-sm'

  return (
    <button
      type="button"
      title={`${player.displayName} — ${player.statusLabel}${
        player.lifeScoreOverall != null ? ` · Score ${player.lifeScoreOverall}` : ''
      }`}
      onClick={() => onSelect?.(player.playerId)}
      className={`group relative flex flex-col items-center gap-1 rounded-lg p-1 transition ${
        onSelect ? 'cursor-pointer hover:bg-slate-50' : 'cursor-default'
      } ${selected ? 'bg-red-50 ring-2 ring-[#8B0000] ring-offset-1' : ''}`}
    >
      <span
        className={`flex ${size} items-center justify-center rounded-full font-bold text-white shadow-sm ring-2 ${STATUS_RING[player.status] ?? 'ring-slate-200'}`}
        style={{ backgroundColor: player.tokenColor }}
      >
        {initials}
      </span>
      {!compact && (
        <span className="max-w-[4.5rem] truncate text-[10px] font-medium text-slate-700">
          {player.displayName.split(' ')[0]}
        </span>
      )}
      {player.status === 'done' && (
        <span
          className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-emerald-500 text-[10px] text-white"
          aria-label="Done"
        >
          ✓
        </span>
      )}
    </button>
  )
}
