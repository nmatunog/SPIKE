import LifeLens from '../../lenses/LifeLens.jsx'
import PlanLens from '../../lenses/PlanLens.jsx'
import JourneyLens from '../../lenses/JourneyLens.jsx'
import GrowLens from '../../lenses/GrowLens.jsx'
import ProtectLens from '../../lenses/ProtectLens.jsx'

export default function PremiumLensDrawer({
  panel,
  onClose,
  planView,
  journeyView,
  growView,
  protectView,
  dashboard,
  onDecide,
  onTimerExpire,
  onSubmitReflection,
  busy,
}) {
  if (!panel || panel === 'settings') return null

  const title = {
    life: 'Dashboard',
    plan: 'Goals & Plan',
    journey: 'Timeline',
    fna: 'Financial Advisor',
    reflect: 'Reflection',
    grow: 'Grow',
    protect: 'Protect',
    decision: 'Decisions',
  }[panel] ?? 'Panel'

  return (
    <div className="life-glass-panel mb-4 rounded-2xl border border-indigo-200 p-4 shadow-lg">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-bold uppercase tracking-wider text-indigo-900">{title}</h3>
        <button
          type="button"
          onClick={onClose}
          className="rounded-lg px-2 py-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
          aria-label="Close panel"
        >
          ✕
        </button>
      </div>

      <div className="max-h-[40vh] overflow-y-auto">
        {panel === 'life' && dashboard && <LifeLens dashboard={dashboard} />}
        {panel === 'plan' && planView?.lens === 'plan' && (
          <PlanLens
            data={planView.data}
            sections={['goals', 'recommendations']}
            animated
          />
        )}
        {panel === 'journey' && journeyView?.lens === 'journey' && (
          <JourneyLens data={journeyView.data} sections={['timeline']} />
        )}
        {panel === 'fna' && planView?.lens === 'plan' && (
          <PlanLens data={planView.data} sections={['fna', 'recommendations']} animated />
        )}
        {panel === 'reflect' && journeyView?.lens === 'journey' && (
          <JourneyLens
            data={journeyView.data}
            sections={['reflection']}
            onSubmitReflection={onSubmitReflection}
            submitting={busy}
          />
        )}
        {panel === 'grow' && growView?.lens === 'grow' && <GrowLens data={growView.data} />}
        {panel === 'protect' && protectView?.lens === 'protect' && (
          <ProtectLens data={protectView.data} />
        )}
      </div>
    </div>
  )
}
