import LensNav from '../LensNav.jsx'
import LifeLens from '../lenses/LifeLens.jsx'
import PlanLens from '../lenses/PlanLens.jsx'
import ProtectLens from '../lenses/ProtectLens.jsx'
import GrowLens from '../lenses/GrowLens.jsx'
import JourneyLens from '../lenses/JourneyLens.jsx'

export default function FinancialSidePanel({
  activeLens,
  onChangeLens,
  lensView,
  loading,
  error,
  canDecide,
  canReflect,
  onDecide,
  onSubmitReflection,
  deciding,
  submitting,
}) {
  function renderContent() {
    if (loading) return <p className="text-sm text-slate-500">Loading financial view…</p>
    if (!lensView) {
      return <p className="text-sm text-red-600">{error ?? 'Unable to load lens.'}</p>
    }

    switch (lensView.lens) {
      case 'life':
        return <LifeLens dashboard={lensView.data} />
      case 'plan':
        return (
          <PlanLens
            data={lensView.data}
            onDecide={canDecide ? onDecide : undefined}
            deciding={deciding}
            error={error}
          />
        )
      case 'protect':
        return <ProtectLens data={lensView.data} />
      case 'grow':
        return <GrowLens data={lensView.data} />
      case 'journey':
        return (
          <JourneyLens
            data={lensView.data}
            onSubmitReflection={canReflect ? onSubmitReflection : undefined}
            submitting={submitting}
            error={error}
          />
        )
      default:
        return null
    }
  }

  return (
    <aside className="flex min-h-0 flex-col rounded-xl border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-100 px-4 py-3">
        <p className="text-xs font-semibold uppercase tracking-wide text-[#8B0000]">
          Financial decision engine
        </p>
        <h2 className="text-sm font-semibold text-slate-900">Situation · FNA · Decision</h2>
      </div>
      <div className="border-b border-slate-100 px-2 py-2">
        <LensNav activeLens={activeLens} onChange={onChangeLens} compact horizontal />
      </div>
      <div className="flex-1 overflow-y-auto p-4">{renderContent()}</div>
    </aside>
  )
}
