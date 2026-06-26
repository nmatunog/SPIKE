export default function ExpandableSideCard({
  id,
  title,
  subtitle,
  summary,
  preview,
  expanded,
  onToggle,
  accent = 'slate',
  children,
}) {
  const isOpen = expanded === id
  const accentBorder = accent === 'brand' ? 'border-[#8B0000]/30' : 'border-slate-200'
  const accentBg = accent === 'brand' ? 'bg-red-50/40' : 'bg-white'

  return (
    <div
      className={`overflow-hidden rounded-lg border ${accentBorder} ${accentBg} shadow-sm transition-shadow ${
        isOpen ? 'ring-1 ring-[#8B0000]/20' : ''
      }`}
    >
      <button
        type="button"
        onClick={() => onToggle(isOpen ? null : id)}
        className="flex w-full items-start gap-2 px-3 py-2.5 text-left hover:bg-slate-50/80"
        aria-expanded={isOpen}
      >
        <div className="min-w-0 flex-1">
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">{title}</p>
          {subtitle && (
            <p className="mt-0.5 truncate text-sm font-semibold text-slate-900">{subtitle}</p>
          )}
          {!isOpen && preview}
          {!isOpen && !preview && summary && (
            <p className="mt-1 line-clamp-2 text-xs leading-snug text-slate-600">{summary}</p>
          )}
        </div>
        <span
          className={`mt-0.5 shrink-0 text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          aria-hidden
        >
          ▾
        </span>
      </button>
      {isOpen && children && (
        <div className="max-h-[min(42vh,20rem)] overflow-y-auto border-t border-slate-100 px-3 py-3 text-sm">
          {children}
        </div>
      )}
    </div>
  )
}
