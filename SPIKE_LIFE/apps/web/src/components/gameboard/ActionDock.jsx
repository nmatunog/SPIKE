import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import PlanLens from '../lenses/PlanLens.jsx'
import JourneyLens from '../lenses/JourneyLens.jsx'
import GrowLens from '../lenses/GrowLens.jsx'
import ProtectLens from '../lenses/ProtectLens.jsx'

function PanelOverlay({ panelKey, title, onClose, children }) {
  const reduceMotion = useReducedMotion()

  return (
    <motion.div
      key={panelKey}
      initial={reduceMotion ? false : { opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={reduceMotion ? undefined : { opacity: 0 }}
      className="fixed inset-0 z-50 flex items-end bg-spike-ink/40 backdrop-blur-sm sm:items-center sm:justify-center sm:p-6 xl:hidden"
      role="dialog"
      aria-modal="true"
      aria-label={title}
      onClick={onClose}
    >
      <motion.div
        initial={reduceMotion ? false : { y: 40, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={reduceMotion ? undefined : { y: 24, opacity: 0 }}
        transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
        className="max-h-[85vh] w-full overflow-hidden rounded-t-3xl border border-slate-200/80 bg-white shadow-card-lg sm:max-w-lg sm:rounded-3xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
          <h2 className="text-title font-semibold text-spike-ink">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            className="focus-game btn-ghost min-h-touch min-w-touch rounded-xl px-3 py-2 text-caption"
            aria-label="Close panel"
          >
            Close
          </button>
        </div>
        <div className="max-h-[calc(85vh-4rem)] overflow-y-auto p-5">{children}</div>
      </motion.div>
    </motion.div>
  )
}

function DesktopPanel({ panelKey, className, children }) {
  const reduceMotion = useReducedMotion()
  return (
    <motion.div
      key={panelKey}
      initial={reduceMotion ? false : { opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={reduceMotion ? undefined : { opacity: 0, y: 8 }}
      transition={{ duration: 0.22 }}
      className={`hidden max-h-[min(42vh,22rem)] overflow-y-auto rounded-2xl border bg-white p-5 shadow-card-lg xl:block ${className}`}
    >
      {children}
    </motion.div>
  )
}

import { PANEL_COPY } from '../../content/learning-beats.js'

export default function ActionDock({
  board,
  expandedPanel,
  onExpandPanel,
  onRoll,
  rolling,
  canDecide,
  canReflect,
  inDecisionPhase,
  planView,
  journeyView,
  growView,
  protectView,
  onDecide,
  onSubmitReflection,
  busy,
  error,
  onViewJourney,
}) {
  const reduceMotion = useReducedMotion()
  const canRoll = board?.canRoll && !rolling

  function openPanel(panel) {
    onExpandPanel(expandedPanel === panel ? null : panel)
  }

  function closePanel() {
    onExpandPanel(null)
  }

  const panelContent = {
    fna:
      planView?.lens === 'plan' ? (
        <PlanLens data={planView.data} sections={['fna', 'recommendations', 'goals']} animated />
      ) : null,
    decision:
      planView?.lens === 'plan' ? (
        <PlanLens
          data={planView.data}
          sections={['decisions']}
          onDecide={canDecide ? onDecide : undefined}
          deciding={busy}
          error={error}
          animated
        />
      ) : null,
    reflect:
      journeyView?.lens === 'journey' ? (
        <JourneyLens
          data={journeyView.data}
          sections={['reflection']}
          onSubmitReflection={canReflect ? onSubmitReflection : undefined}
          submitting={busy}
          error={error}
        />
      ) : null,
    journey:
      journeyView?.lens === 'journey' ? (
        <JourneyLens data={journeyView.data} sections={['timeline', 'completed']} />
      ) : null,
    grow: growView?.lens === 'grow' ? <GrowLens data={growView.data} /> : null,
    protect: protectView?.lens === 'protect' ? <ProtectLens data={protectView.data} /> : null,
  }

  const panelBorder = {
    fna: 'border-slate-200',
    decision: 'border-spike-brand/30',
    reflect: 'border-spike-brand/30',
    journey: 'border-slate-200',
    grow: 'border-slate-200',
    protect: 'border-slate-200',
  }

  return (
    <div className="flex flex-col gap-4">
      <AnimatePresence mode="wait">
        {expandedPanel && panelContent[expandedPanel] && (
          <>
            <DesktopPanel
              panelKey={expandedPanel}
              className={panelBorder[expandedPanel] ?? 'border-slate-200'}
            >
              {panelContent[expandedPanel]}
            </DesktopPanel>
            <PanelOverlay
              panelKey={expandedPanel}
              title={PANEL_COPY[expandedPanel]?.title ?? 'Panel'}
              onClose={closePanel}
            >
              {panelContent[expandedPanel]}
            </PanelOverlay>
          </>
        )}
      </AnimatePresence>

      <section className="game-card-elevated p-4 xl:p-5" aria-label="Game actions">
        <p className="mb-1 text-label uppercase text-slate-500">Your next move</p>
        <p className="mb-3 text-caption text-slate-500">Follow the advisor workflow step by step.</p>
        <div className="flex flex-col gap-2.5">
          {canRoll && (
            <motion.button
              type="button"
              disabled={!canRoll}
              onClick={onRoll}
              whileHover={reduceMotion ? undefined : { scale: 1.01 }}
              whileTap={reduceMotion ? undefined : { scale: 0.99 }}
              className="btn-primary focus-game w-full xl:hidden"
              aria-keyshortcuts="R"
            >
              {rolling ? 'Finding event…' : 'Next year'}
            </motion.button>
          )}

          {inDecisionPhase && (
            <>
              <ActionButton
                active={expandedPanel === 'fna'}
                variant="secondary"
                onClick={() => openPanel('fna')}
              >
                Open FNA analysis
              </ActionButton>
              <ActionButton
                active={expandedPanel === 'decision'}
                variant="primary"
                disabled={!canDecide && expandedPanel !== 'decision'}
                onClick={() => openPanel('decision')}
              >
                Choose your strategy
              </ActionButton>
              {(canReflect || expandedPanel === 'reflect') && (
                <ActionButton
                  active={expandedPanel === 'reflect'}
                  variant="secondary"
                  onClick={() => openPanel('reflect')}
                >
                  Reflect on choice
                </ActionButton>
              )}
            </>
          )}

          <ActionButton
            active={expandedPanel === 'journey'}
            variant="ghost"
            onClick={() => {
              onViewJourney?.()
              openPanel('journey')
            }}
          >
            Journey timeline
          </ActionButton>
        </div>
      </section>
    </div>
  )
}

function ActionButton({ active, variant, disabled, onClick, children }) {
  const reduceMotion = useReducedMotion()
  const className =
    variant === 'primary'
      ? active
        ? 'bg-spike-brand-hover text-white shadow-md'
        : 'btn-primary'
      : variant === 'secondary'
        ? active
          ? 'border-2 border-spike-brand bg-spike-brand-muted text-spike-brand'
          : 'btn-secondary'
        : active
          ? 'bg-slate-100 text-spike-ink ring-1 ring-slate-300'
          : 'btn-ghost text-slate-600'

  return (
    <motion.button
      type="button"
      disabled={disabled}
      onClick={onClick}
      whileHover={disabled || reduceMotion ? undefined : { scale: 1.01 }}
      whileTap={disabled || reduceMotion ? undefined : { scale: 0.99 }}
      className={`focus-game w-full touch-manipulation ${className}`}
    >
      {children}
    </motion.button>
  )
}
