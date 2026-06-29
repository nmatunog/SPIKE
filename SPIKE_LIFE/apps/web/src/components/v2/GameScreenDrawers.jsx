import { motion, AnimatePresence } from 'framer-motion'
import PlanLens from '../lenses/PlanLens.jsx'

export default function GameScreenDrawers({
  drawer,
  onClose,
  dashboard,
  planView,
  growView,
}) {
  const planData = planView?.lens === 'plan' ? planView.data : null
  const growData = growView?.lens === 'grow' ? growView.data : null

  return (
    <AnimatePresence>
      {drawer && (
        <>
          <motion.button
            type="button"
            aria-label="Close panel"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
          />
          <motion.aside
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 320 }}
            className="gsv2-drawer overflow-y-auto"
          >
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-bold text-white">
                {drawer === 'stats' && 'Financial snapshot'}
                {drawer === 'dreams' && 'Dream board'}
                {drawer === 'advisor' && 'Advisor'}
              </h2>
              <button
                type="button"
                onClick={onClose}
                className="rounded-lg p-2 text-slate-400 hover:bg-white/10 hover:text-white"
              >
                ✕
              </button>
            </div>

            {drawer === 'stats' && dashboard && (
              <dl className="space-y-4 text-sm text-slate-300">
                <div>
                  <dt className="text-xs uppercase text-slate-500">Net worth</dt>
                  <dd className="text-xl font-bold text-white">{dashboard.netWorth?.formatted}</dd>
                </div>
                <div>
                  <dt className="text-xs uppercase text-slate-500">Monthly surplus</dt>
                  <dd className="text-xl font-bold text-emerald-300">
                    {dashboard.monthlySurplus?.formatted}
                  </dd>
                </div>
                {growData && (
                  <div>
                    <dt className="text-xs uppercase text-slate-500">Liquid cash</dt>
                    <dd className="text-xl font-bold text-amber-200">
                      {growData.assets.cash.formatted}
                    </dd>
                  </div>
                )}
              </dl>
            )}

            {drawer === 'dreams' && planData && (
              <PlanLens data={planData} sections={['goals']} animated />
            )}

            {drawer === 'advisor' && planData && (
              <PlanLens data={planData} sections={['recommendations', 'fna']} animated />
            )}
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  )
}
