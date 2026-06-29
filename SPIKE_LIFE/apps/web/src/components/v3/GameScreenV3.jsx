import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import StatusBarV3 from './StatusBarV3.jsx'
import DomainCarousel from './DomainCarousel.jsx'
import SituationStageV3 from './SituationStageV3.jsx'
import DecisionActionCards from './DecisionActionCards.jsx'
import CycleStepperV3 from './CycleStepperV3.jsx'
import ConsequenceAnimation from '../v2/ConsequenceAnimation.jsx'
import DreamProgressPulse from '../v2/DreamProgressPulse.jsx'
import GameScreenDrawers from '../v2/GameScreenDrawers.jsx'
import ThirteenthMonthModal from '../gameboard/ThirteenthMonthModal.jsx'
import AnnualCheckpointCard from '../gameboard/AnnualCheckpointCard.jsx'
import {
  applyAutoAdvisor,
  dismissCalendarEvent,
  endBoardTurn,
  finalizeCycle,
  getDashboard,
  getLensView,
  getSpatialBoard,
  resolveThirteenthMonth,
  rollDice,
  submitDecision,
} from '../../lib/spike-life-client.js'
import './game-screen-v3.css'

const PHASE = {
  IDLE: 'idle',
  DOMAIN: 'domain',
  SITUATION: 'situation',
  CONSEQUENCES: 'consequences',
  DREAM: 'dream',
}

const SCAN_STEPS = 24

function scanDelay(step) {
  const t = step / SCAN_STEPS
  return Math.round(45 + t * t * 220)
}

function averageDreamProgress(goals = []) {
  if (!goals.length) return 0
  const sum = goals.reduce((acc, g) => acc + (g.progressPercent ?? 0), 0)
  return Math.round(sum / goals.length)
}

export default function GameScreenV3({ onOpenWorkshop }) {
  const [phase, setPhase] = useState(PHASE.IDLE)
  const [dashboard, setDashboard] = useState(null)
  const [board, setBoard] = useState(null)
  const [planView, setPlanView] = useState(null)
  const [growView, setGrowView] = useState(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(null)
  const [selectedChoiceIndex, setSelectedChoiceIndex] = useState(0)
  const [consequenceReveal, setConsequenceReveal] = useState(null)
  const [drawer, setDrawer] = useState(null)
  const [scanHighlightId, setScanHighlightId] = useState(null)
  const [autoDecide, setAutoDecide] = useState(false)
  const scanTimerRef = useRef(null)

  const refresh = useCallback(async () => {
    const [dash, spatial, plan, grow] = await Promise.all([
      getDashboard(),
      getSpatialBoard(),
      getLensView('plan'),
      getLensView('grow'),
    ])
    setDashboard(dash)
    setBoard(spatial)
    setPlanView(plan)
    setGrowView(grow)
    return { dash, spatial, plan, grow }
  }, [])

  useEffect(() => {
    refresh()
      .then(({ spatial }) => {
        if (spatial?.phase === 'decision_phase') {
          setPhase(PHASE.SITUATION)
          setScanHighlightId(spatial.selectedDomainId ?? null)
        }
      })
      .catch((err) => setError(err.message))
  }, [refresh])

  const planData = planView?.lens === 'plan' ? planView.data : null
  const situation = planData?.situation ?? null
  const decisionOptions = planData?.decisionOptions ?? []
  const recommendations = planData?.recommendations ?? []
  const goals = planData?.goals ?? []
  const dreamProgressPercent = averageDreamProgress(goals)
  const inDecisionPhase = board?.phase === 'decision_phase'
  const canDecide = inDecisionPhase && dashboard?.canDecide && phase === PHASE.SITUATION
  const canStartCycle = board?.canRoll && phase === PHASE.IDLE && !busy
  const rolling = phase === PHASE.DOMAIN
  const showSituation = phase === PHASE.SITUATION && inDecisionPhase

  const domainIds = useMemo(
    () => (board?.lifeDomains ?? []).map((d) => d.id),
    [board?.lifeDomains],
  )

  const runDomainScan = useCallback(
    (targetId) => {
      if (!domainIds.length || !targetId) {
        setScanHighlightId(targetId)
        setPhase(PHASE.SITUATION)
        return
      }
      let step = 0
      clearTimeout(scanTimerRef.current)

      const tick = () => {
        const id = domainIds[step % domainIds.length]
        setScanHighlightId(id)
        step += 1
        if (step >= SCAN_STEPS) {
          setScanHighlightId(targetId)
          setTimeout(() => setPhase(PHASE.SITUATION), 520)
          return
        }
        scanTimerRef.current = setTimeout(tick, scanDelay(step))
      }

      tick()
    },
    [domainIds],
  )

  useEffect(() => () => clearTimeout(scanTimerRef.current), [])

  async function handleStartCycle() {
    if (!canStartCycle) return
    setBusy(true)
    setError(null)
    setSelectedChoiceIndex(0)
    setConsequenceReveal(null)
    setPhase(PHASE.DOMAIN)
    try {
      await rollDice()
      const { spatial } = await refresh()
      runDomainScan(spatial?.selectedDomainId ?? null)
    } catch (err) {
      setError(err.message)
      setPhase(PHASE.IDLE)
    } finally {
      setBusy(false)
    }
  }

  async function handleTimerExpire() {
    if (!canDecide || busy || !autoDecide) return
    setBusy(true)
    setError(null)
    try {
      await applyAutoAdvisor()
      const plan = await getLensView('plan')
      setPlanView(plan)
      await refresh()
      if (plan?.lens === 'plan' && plan.data.consequenceReveal) {
        setConsequenceReveal(plan.data.consequenceReveal)
        setPhase(PHASE.CONSEQUENCES)
      } else {
        await completeCycleAndAdvance()
      }
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  async function handleConfirmDecision(choiceIndex = selectedChoiceIndex) {
    const opt = decisionOptions[choiceIndex]
    if (!opt) return
    setSelectedChoiceIndex(choiceIndex)
    setBusy(true)
    setError(null)
    try {
      await submitDecision(opt.strategy)
      const plan = await getLensView('plan')
      setPlanView(plan)
      await refresh()
      if (plan?.lens === 'plan' && plan.data.consequenceReveal) {
        setConsequenceReveal(plan.data.consequenceReveal)
        setPhase(PHASE.CONSEQUENCES)
      } else {
        await completeCycleAndAdvance()
      }
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  async function completeCycleAndAdvance() {
    await finalizeCycle()
    await endBoardTurn()
    await refresh()
    setPhase(PHASE.DREAM)
  }

  async function handleConsequenceComplete() {
    setConsequenceReveal(null)
    await completeCycleAndAdvance()
  }

  async function handleDreamComplete() {
    setPhase(PHASE.IDLE)
    setScanHighlightId(null)
    await refresh()
  }

  const shellClass = rolling
    ? 'gsv3-shell--rolling'
    : showSituation
      ? 'gsv3-shell--play'
      : ''

  return (
    <div className={`gsv3-shell ${shellClass}`}>
      <StatusBarV3
        dashboard={dashboard}
        dreamProgressPercent={dreamProgressPercent}
        onOpenDrawer={setDrawer}
      />

      {rolling && <div className="gsv3-stage-dim" />}

      <div
        className={`gsv3-zone-board ${rolling ? 'gsv3-board-zone--rolling' : ''} ${
          showSituation ? 'gsv3-zone-board--muted' : ''
        }`}
      >
        <DomainCarousel
          domains={board?.lifeDomains ?? []}
          rolling={rolling}
          scanHighlightId={scanHighlightId}
          selectedDomainId={board?.selectedDomainId}
          winnerLocked={showSituation}
        />
        {onOpenWorkshop && (
          <button
            type="button"
            onClick={onOpenWorkshop}
            className="absolute right-2 top-0 z-10 text-[8px] font-semibold uppercase tracking-wider text-indigo-600 hover:text-indigo-900"
          >
            Workshop →
          </button>
        )}
      </div>

      <div className="gsv3-zone-situation">
        <AnimatePresence mode="wait">
          {showSituation && (
            <motion.div
              key="situation"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="h-full"
            >
              <SituationStageV3
                situation={situation}
                domainId={board?.selectedDomainId}
                domainLabel={board?.selectedDomainLabel}
                cycleLabel={dashboard?.cycleLabel}
                recommendations={recommendations}
                decisionTimerSeconds={planData?.decisionTimerSeconds ?? 0}
                cycleDeadlineAt={planData?.cycleDeadlineAt}
                timerActive={canDecide}
                onTimerExpire={handleTimerExpire}
              />
            </motion.div>
          )}

          {phase === PHASE.IDLE && !showSituation && (
            <motion.div
              key="idle"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="h-full"
            >
              <div className="gsv3-idle-panel">
                <p className="text-sm text-slate-600">
                  One planning cycle. One domain. One decision.
                </p>
                <button
                  type="button"
                  disabled={!canStartCycle}
                  onClick={handleStartCycle}
                  className="rounded-2xl bg-indigo-600 px-10 py-3.5 text-sm font-extrabold uppercase tracking-widest text-white shadow-lg shadow-indigo-300/40 disabled:opacity-40"
                >
                  {busy ? 'Rolling…' : 'Begin planning cycle'}
                </button>
              </div>
            </motion.div>
          )}

          {rolling && (
            <motion.div key="rolling" className="h-full">
              <div className="gsv3-idle-panel border-indigo-200 bg-indigo-50/40">
                <p className="text-sm font-semibold text-indigo-800">Life is choosing your next chapter…</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {phase === PHASE.CONSEQUENCES && (
          <div className="absolute inset-0 z-50 flex items-center justify-center px-4">
            <ConsequenceAnimation reveal={consequenceReveal} onComplete={handleConsequenceComplete} />
          </div>
        )}

        {phase === PHASE.DREAM && goals.length > 0 && (
          <div className="absolute inset-0 z-50 flex items-center justify-center px-4">
            <DreamProgressPulse goals={goals} onComplete={handleDreamComplete} />
          </div>
        )}

        {phase === PHASE.DREAM && goals.length === 0 && (
          <DreamProgressSkip onComplete={handleDreamComplete} />
        )}
      </div>

      <div className="gsv3-zone-choices">
        {showSituation ? (
          <DecisionActionCards
            options={decisionOptions}
            selectedIndex={selectedChoiceIndex}
            onSelect={setSelectedChoiceIndex}
            onConfirm={handleConfirmDecision}
            canDecide={canDecide}
            deciding={busy}
            error={error}
          />
        ) : (
          <div className="flex h-full items-center justify-center">
            <p className="text-[10px] uppercase tracking-[0.25em] text-slate-400">
              {phase === PHASE.IDLE ? 'Awaiting roll' : 'Responses appear after situation'}
            </p>
          </div>
        )}
      </div>

      <CycleStepperV3
        phase={phase}
        autoDecide={autoDecide}
        onAutoDecideChange={setAutoDecide}
      />

      <GameScreenDrawers
        drawer={drawer}
        onClose={() => setDrawer(null)}
        dashboard={dashboard}
        planView={planView}
        growView={growView}
      />

      {dashboard?.pendingCalendarEvent === 'thirteenth_month' && (
        <ThirteenthMonthModal
          allocations={dashboard.thirteenthMonthAllocations}
          onSelect={async (id) => {
            setBusy(true)
            try {
              await resolveThirteenthMonth(id)
              await refresh()
            } finally {
              setBusy(false)
            }
          }}
          onDismiss={async () => {
            setBusy(true)
            try {
              await dismissCalendarEvent()
              await refresh()
            } finally {
              setBusy(false)
            }
          }}
          busy={busy}
        />
      )}

      {dashboard?.pendingCalendarEvent === 'annual_checkpoint' &&
        dashboard.lastAnnualCheckpoint && (
          <div className="fixed inset-x-0 bottom-[7vh] z-50 flex justify-center px-4">
            <div className="w-full max-w-md">
              <AnnualCheckpointCard
                checkpoint={dashboard.lastAnnualCheckpoint}
                onContinue={async () => {
                  await dismissCalendarEvent()
                  await refresh()
                }}
              />
            </div>
          </div>
        )}
    </div>
  )
}

function DreamProgressSkip({ onComplete }) {
  useEffect(() => {
    const id = setTimeout(onComplete, 400)
    return () => clearTimeout(id)
  }, [onComplete])
  return null
}
