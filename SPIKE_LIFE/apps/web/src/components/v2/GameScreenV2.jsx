import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import DomainBoard from './DomainBoard.jsx'
import CycleHudStrip from './CycleHudStrip.jsx'
import CinematicSituationCard from './CinematicSituationCard.jsx'
import DecisionChoiceRow from './DecisionChoiceRow.jsx'
import ConsequenceAnimation from './ConsequenceAnimation.jsx'
import DreamProgressPulse from './DreamProgressPulse.jsx'
import GameScreenDrawers from './GameScreenDrawers.jsx'
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
import './game-screen-v2.css'

const PHASE = {
  IDLE: 'idle',
  DOMAIN: 'domain',
  SITUATION: 'situation',
  CONSEQUENCES: 'consequences',
  DREAM: 'dream',
}

const SCAN_MS = 80
const SCAN_STEPS = 22

export default function GameScreenV2({ onOpenWorkshop }) {
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
  const goals = planData?.goals ?? []
  const inDecisionPhase = board?.phase === 'decision_phase'
  const canDecide = inDecisionPhase && dashboard?.canDecide && phase === PHASE.SITUATION
  const canStartCycle = board?.canRoll && phase === PHASE.IDLE && !busy

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
      clearInterval(scanTimerRef.current)
      scanTimerRef.current = setInterval(() => {
        const id = domainIds[step % domainIds.length]
        setScanHighlightId(id)
        step += 1
        if (step >= SCAN_STEPS) {
          clearInterval(scanTimerRef.current)
          setScanHighlightId(targetId)
          setTimeout(() => setPhase(PHASE.SITUATION), 380)
        }
      }, SCAN_MS)
    },
    [domainIds],
  )

  useEffect(() => () => clearInterval(scanTimerRef.current), [])

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
    if (!canDecide || busy) return
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

  async function handleConfirmDecision() {
    const opt = decisionOptions[selectedChoiceIndex]
    if (!opt) return
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

  async function handleThirteenthMonth(allocationId) {
    setBusy(true)
    try {
      await resolveThirteenthMonth(allocationId)
      await refresh()
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  const showSituation = phase === PHASE.SITUATION && inDecisionPhase
  const scanning = phase === PHASE.DOMAIN

  return (
    <div className="gsv2-shell">
      <CycleHudStrip
        cycleLabel={dashboard?.cycleLabel ?? `Cycle ${board?.roundNumber ?? 1}`}
        age={dashboard?.age}
        lifeScore={dashboard?.lifeScore?.overall}
        timerActive={canDecide}
        decisionTimerSeconds={planData?.decisionTimerSeconds ?? 0}
        cycleDeadlineAt={planData?.cycleDeadlineAt}
        onTimerExpire={handleTimerExpire}
        onOpenDrawer={setDrawer}
      />

      {onOpenWorkshop && (
        <div className="px-4 py-1 text-right">
          <button
            type="button"
            onClick={onOpenWorkshop}
            className="text-[10px] font-semibold uppercase tracking-wider text-indigo-300 hover:text-white"
          >
            Workshop mode →
          </button>
        </div>
      )}

      <div className="relative flex min-h-0 flex-1 flex-col">
        <div className={`shrink-0 py-2 transition ${showSituation ? 'opacity-40' : 'opacity-100'}`}>
          <DomainBoard
            domains={board?.lifeDomains ?? []}
            selectedDomainId={board?.selectedDomainId}
            scanHighlightId={scanHighlightId ?? board?.selectedDomainId}
            scanning={scanning}
            compact={showSituation}
          />
        </div>

        <div className="relative flex min-h-0 flex-1 flex-col overflow-y-auto">
          <AnimatePresence mode="wait">
            {phase === PHASE.IDLE && (
              <motion.div
                key="idle"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex flex-1 flex-col items-center justify-center gap-4 px-4 py-8"
              >
                <p className="max-w-md text-center text-sm text-slate-400">
                  Life will choose your domain. You choose how to respond — one decision per
                  planning cycle.
                </p>
                <button
                  type="button"
                  disabled={!canStartCycle}
                  onClick={handleStartCycle}
                  className="rounded-2xl bg-gradient-to-r from-indigo-500 to-violet-600 px-10 py-4 text-sm font-extrabold uppercase tracking-widest text-white shadow-lg shadow-indigo-900/40 disabled:opacity-40"
                >
                  {busy ? 'Rolling…' : 'Begin planning cycle'}
                </button>
                {board?.gameComplete && (
                  <p className="text-sm font-semibold text-emerald-400">Journey complete.</p>
                )}
              </motion.div>
            )}

            {scanning && (
              <motion.p
                key="scanning"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="py-4 text-center text-xs font-bold uppercase tracking-[0.3em] text-indigo-300"
              >
                Selecting life domain…
              </motion.p>
            )}

            {showSituation && (
              <motion.div
                key="situation"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex flex-col gap-3 pb-6"
              >
                <CinematicSituationCard
                  situation={situation}
                  domainLabel={board?.selectedDomainLabel}
                  domainId={board?.selectedDomainId}
                />
                <DecisionChoiceRow
                  options={decisionOptions}
                  selectedIndex={selectedChoiceIndex}
                  onSelect={setSelectedChoiceIndex}
                  onConfirm={handleConfirmDecision}
                  canDecide={canDecide}
                  deciding={busy}
                  error={error}
                />
              </motion.div>
            )}
          </AnimatePresence>

          {phase === PHASE.CONSEQUENCES && (
            <ConsequenceAnimation
              reveal={consequenceReveal}
              onComplete={handleConsequenceComplete}
            />
          )}

          {phase === PHASE.DREAM && goals.length > 0 && (
            <DreamProgressPulse goals={goals} onComplete={handleDreamComplete} />
          )}

          {phase === PHASE.DREAM && goals.length === 0 && (
            <DreamProgressSkip onComplete={handleDreamComplete} />
          )}
        </div>
      </div>

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
          onSelect={handleThirteenthMonth}
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
          <div className="fixed inset-x-0 bottom-6 z-50 flex justify-center px-4">
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
