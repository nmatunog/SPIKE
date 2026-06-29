const NAV_ITEMS = [
  { id: 'life', label: 'Dashboard', icon: '⏱' },
  { id: 'plan', label: 'Goals', icon: '🏆' },
  { id: 'journey', label: 'Timeline', icon: '☰' },
  { id: 'fna', label: 'Advisor', icon: '👤' },
  { id: 'reflect', label: 'Replay', icon: '↻' },
  { id: 'settings', label: 'Settings', icon: '⚙' },
]

export default function PremiumNavRail({ activePanel, onSelect, onHowToPlay }) {
  return (
    <nav
      className="life-nav-rail flex h-full w-14 shrink-0 flex-col items-center py-4 md:w-16"
      aria-label="Game navigation"
    >
      <div className="flex flex-1 flex-col items-center gap-1">
        {NAV_ITEMS.map((item) => {
          const active = activePanel === item.id
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onSelect?.(item.id)}
              className={`focus-game-dark group flex w-full flex-col items-center gap-0.5 rounded-lg px-1 py-2 transition ${
                active ? 'bg-white/15 text-white' : 'text-slate-400 hover:bg-white/10 hover:text-white'
              }`}
              title={item.label}
            >
              <span className="text-lg" aria-hidden>
                {item.icon}
              </span>
              <span className="text-[8px] font-bold uppercase tracking-wide">{item.label}</span>
            </button>
          )
        })}
      </div>

      {onHowToPlay && (
        <button
          type="button"
          onClick={onHowToPlay}
          className="focus-game-dark mt-auto text-[8px] font-bold uppercase tracking-wide text-slate-500 hover:text-white"
        >
          How to play
        </button>
      )}
    </nav>
  )
}
