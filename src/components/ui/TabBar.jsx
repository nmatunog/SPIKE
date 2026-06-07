/**
 * @param {{
 *   tabs: Array<{ id: string, label: string, icon?: import('lucide-react').LucideIcon }>,
 *   active: string,
 *   onChange: (id: string) => void,
 *   className?: string,
 * }} props
 */
export function TabBar({ tabs, active, onChange, className = '' }) {
  return (
    <div
      role="tablist"
      className={`flex gap-2 overflow-x-auto pb-1 scrollbar-thin ${className}`.trim()}
    >
      {tabs.map(({ id, label, icon: Icon }) => {
        const isActive = active === id;
        return (
          <button
            key={id}
            type="button"
            role="tab"
            aria-selected={isActive}
            onClick={() => onChange(id)}
            className={`inline-flex min-h-[44px] shrink-0 items-center gap-2 rounded-xl px-3.5 py-2 text-sm font-semibold transition lg:px-4 lg:py-2.5 lg:text-base 2xl:px-5 2xl:py-3 2xl:text-lg ${
              isActive ? 'spike-nav-pill-active' : 'spike-nav-pill-inactive bg-slate-100'
            }`}
          >
            {Icon ? <Icon size={16} aria-hidden /> : null}
            {label}
          </button>
        );
      })}
    </div>
  );
}
