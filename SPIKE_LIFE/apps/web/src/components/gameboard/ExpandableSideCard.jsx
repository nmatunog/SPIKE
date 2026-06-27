export default function ExpandableSideCard({
  id,
  title,
  subtitle,
  summary,
  preview,
  expanded,
  onToggle,
  accent = 'slate',
  forceOpen = false,
  children,
}) {
  const isOpen = forceOpen || expanded === id
  const accentBorder = accent === 'brand' ? 'border-spike-brand/35' : 'border-slate-200/90'
  const accentBg = accent === 'brand' ? 'bg-gradient-to-b from-red-50/80 to-white' : 'bg-white'

  return (
    <div
      className={`game-card overflow-hidden ${accentBorder} ${accentBg} transition-shadow ${
        isOpen ? 'shadow-card-lg ring-2 ring-spike-brand/15' : ''
      }`}
    >
      <button
        type="button"
        onClick={() => !forceOpen && onToggle(isOpen ? null : id)}
        className={`flex w-full items-start gap-3 px-4 py-3.5 text-left ${
          forceOpen ? 'cursor-default' : 'hover:bg-slate-50/80'
        }`}
        aria-expanded={isOpen}
        disabled={forceOpen}
      >
        <div className="min-w-0 flex-1">
          <p className="text-label uppercase text-slate-500">{title}</p>
          {subtitle && (
            <p className="mt-1 truncate text-display-sm text-slate-900">{subtitle}</p>
          )}
          {!isOpen && preview}
          {!isOpen && !preview && summary && (
            <p className="mt-1.5 line-clamp-2 text-body text-slate-600">{summary}</p>
          )}
        </div>
        {!forceOpen && (
          <span
            className={`mt-1 shrink-0 text-lg text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}
            aria-hidden
          >
            ▾
          </span>
        )}
      </button>
      {isOpen && children && (
        <div className="max-h-[min(36vh,16rem)] overflow-y-auto border-t border-slate-100 px-4 py-4 text-body">
          {children}
        </div>
      )}
    </div>
  )
}
