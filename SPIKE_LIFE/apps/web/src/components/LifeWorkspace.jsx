import { useCallback, useEffect, useMemo, useState } from 'react'
import { computeFinancialHealth } from '@spike-life/domain'
import BoardWelcome from './gameboard/BoardWelcome.jsx'
import YearRevealSequence from './gameboard/YearRevealSequence.jsx'
import AdvisorInsightPrompt from './gameboard/AdvisorInsightPrompt.jsx'
import DreamBoardSetup from './gameboard/DreamBoardSetup.jsx'
import ThirteenthMonthModal from './gameboard/ThirteenthMonthModal.jsx'
import AnnualCheckpointCard from './gameboard/AnnualCheckpointCard.jsx'
import LifeSummaryScreen from './gameboard/LifeSummaryScreen.jsx'
import OnboardingRulesCard from './gameboard/OnboardingRulesCard.jsx'
import ConsequenceReveal from './gameboard/ConsequenceReveal.jsx'
import PremiumHeaderStats from './gameboard/premium/PremiumHeaderStats.jsx'
import PremiumNavRail from './gameboard/premium/PremiumNavRail.jsx'
import PremiumCycleRail from './gameboard/premium/PremiumCycleRail.jsx'
import PremiumDomainRibbon from './gameboard/premium/PremiumDomainRibbon.jsx'
import PremiumDiceBar from './gameboard/premium/PremiumDiceBar.jsx'
import PremiumSituationStage from './gameboard/premium/PremiumSituationStage.jsx'
import PremiumLensDrawer from './gameboard/premium/PremiumLensDrawer.jsx'
import { impactTagsForSpaceType } from './gameboard/encounter-impact.js'
import { useGameKeyboard } from '../hooks/useGameKeyboard.js'
import {
  ensureSessionStarted,
  endBoardTurn,
  getDashboard,
  getLensView,
  getSpatialBoard,
  getLifeSummary,
  rollDice,
  submitDecision,
  submitReflection,
  setDreamBoard,
  resolveThirteenthMonth,
  dismissCalendarEvent,
  applyAutoAdvisor,
} from '../lib/spike-life-client.js'
import { useBoardUIStore } from '../store/board-ui-store.js'
import { GAME_ROOM_MAX_PLAYERS } from '../lib/spike-life-workshop-client.js'

const NAV_PANEL_MAP = {
  life: 'life',
  plan: 'plan',
  journey: 'journey',
  fna: 'fna',
  reflect: 'reflect',
  settings: 'settings',
}

export default function LifeWorkspace({ onOpenWorkshop }) {
  const [dashboard, setDashboard] = useState(null)
  const [board, setBoard] = useState(null)
  const [planView, setPlanView] = useState(null)
  const [journeyView, setJourneyView] = useState(null)
  const [growView, setGrowView] = useState(null)
  const [protectView, setProtectView] = useState(null)
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [yearRevealActive, setYearRevealActive] = useState(false)
  const [yearRevealPending, setYearRevealPending] = useState(false)
  const [yearRevealData, setYearRevealData] = useState(null)
  const [showAdvisorPrompt, setShowAdvisorPrompt] = useState(false)
  const [pendingAdvisorInsight, setPendingAdvisorInsight] = useState(false)
  const [error, setError] = useState(null)
  const [lifeSummary, setLifeSummary] = useState(null)
  const [showRules, setShowRules] = useState(
    () => !localStorage.getItem('spike-life-rules-seen'),
  )
  const [consequenceReveal, setConsequenceReveal] = useState(null)
  const [selectedChoiceIndex, setSelectedChoiceIndex] = useState(0)
  const [navPanel, setNavPanel] = useState(null)

  const { expandedPanel, setExpandedPanel, resetPanels } = useBoardUIStore()

  const refresh = useCallback(async () => {
    await ensureSessionStarted()
    const [dash, spatial, plan, journey, grow] = await Promise.all([
      getDashboard(),
      getSpatialBoard(),
      getLensView('plan'),
      getLensView('journey'),
      getLensView('grow'),
    ])
    setDashboard(dash)
    setBoard(spatial)
    setPlanView(plan)
    setJourneyView(journey)
    setGrowView(grow)
    setLoading(false)
    return { dash, spatial, plan, journey, grow }
  }, [])

  useEffect(() => {
    refresh().catch((err) => {
      setError(err.message)
      setLoading(false)
    })
  }, [refresh])

  async function handleNavSelect(panelId) {
    const mapped = NAV_PANEL_MAP[panelId] ?? panelId
    if (mapped === 'settings') return
    const next = navPanel === mapped ? null : mapped
    setNavPanel(next)
    if (next === 'journey' || next === 'reflect') {
      setJourneyView(await getLensView('journey'))
    }
    if (next === 'plan' || next === 'fna') {
      setPlanView(await getLensView('plan'))
    }
    if (next === 'life') {
      await refresh()
    }
  }

  async function handleDreamBoardSubmit(choices) {
    setBusy(true)
    setError(null)
    try {
      await setDreamBoard(choices)
      await refresh()
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  async function handleTimerExpire() {
    if (!dashboard?.canDecide || busy) return
    setBusy(true)
    try {
      await applyAutoAdvisor()
      setNavPanel('reflect')
      await refresh()
      setJourneyView(await getLensView('journey'))
      setPlanView(await getLensView('plan'))
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
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

  async function handleDismissCalendar() {
    setBusy(true)
    try {
      await dismissCalendarEvent()
      await refresh()
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  useEffect(() => {
    if (dashboard?.workshopComplete) {
      getLifeSummary().then(setLifeSummary).catch(() => {})
    }
  }, [dashboard?.workshopComplete])

  async function handleRollDice() {
    setYearRevealActive(true)
    setYearRevealPending(true)
    setYearRevealData(null)
    setBusy(true)
    setError(null)
    setExpandedPanel(null)
    setNavPanel(null)
    setShowAdvisorPrompt(false)
    setSelectedChoiceIndex(0)
    try {
      const findingMinMs = 900
      const started = Date.now()
      await rollDice()
      const { spatial } = await refresh()
      const waitMs = Math.max(0, findingMinMs - (Date.now() - started))
      if (waitMs > 0) {
        await new Promise((resolve) => {
          setTimeout(resolve, waitMs)
        })
      }
      setYearRevealData({
        domainId: spatial?.selectedDomainId ?? null,
        domainLabel: spatial?.selectedDomainLabel ?? 'Life',
        encounter: spatial?.activeEncounter ?? null,
        situationShuffle: spatial?.situationShuffle ?? [],
      })
      setPendingAdvisorInsight(spatial?.advisorInsightOffered ?? false)
      setYearRevealPending(false)
    } catch (err) {
      setError(err.message)
      setYearRevealActive(false)
      setYearRevealPending(false)
      setYearRevealData(null)
      setBusy(false)
    }
  }

  const handleYearRevealComplete = useCallback(() => {
    setYearRevealActive(false)
    setYearRevealPending(false)
    setYearRevealData(null)
    setBusy(false)
    if (pendingAdvisorInsight) {
      setShowAdvisorPrompt(true)
      setPendingAdvisorInsight(false)
    }
  }, [pendingAdvisorInsight])

  const rolling = yearRevealActive

  async function handleDecide(strategy) {
    setBusy(true)
    setError(null)
    try {
      await submitDecision(strategy)
      const plan = await getLensView('plan')
      setPlanView(plan)
      await refresh()
      setJourneyView(await getLensView('journey'))
      if (plan?.lens === 'plan' && plan.data.consequenceReveal) {
        setConsequenceReveal(plan.data.consequenceReveal)
      } else {
        setNavPanel('reflect')
      }
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  function handleConfirmChoice() {
    const options = planView?.lens === 'plan' ? planView.data.decisionOptions : []
    const opt = options[selectedChoiceIndex]
    if (opt) handleDecide(opt.strategy)
  }

  function handleConsequenceContinue() {
    setConsequenceReveal(null)
    setNavPanel('reflect')
  }

  async function handleReflection(answers) {
    setBusy(true)
    setError(null)
    try {
      await submitReflection(answers)
      await endBoardTurn()
      resetPanels()
      setNavPanel(null)
      setSelectedChoiceIndex(0)
      await refresh()
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  const inDecisionPhase = board?.phase === 'decision_phase'
  const canDecide = inDecisionPhase && dashboard?.canDecide
  const canRoll = board?.canRoll && !rolling
  const showBoardWelcome =
    !loading && canRoll && !board?.activeEncounter && !rolling && board?.roundNumber <= 1

  const planData = planView?.lens === 'plan' ? planView.data : null
  const decisionOptions = planData?.decisionOptions ?? []
  const situation = planData?.situation ?? null

  const landedSpace = board?.spaces?.find((s) => s.index === board.landedSpaceIndex)
  const impactTags = useMemo(() => {
    const tags = impactTagsForSpaceType(landedSpace?.type ?? board?.selectedDomainId)
    return tags.slice(0, 3).map((t) => ({ label: t, value: 'Varies' }))
  }, [landedSpace?.type, board?.selectedDomainId])

  const financialHealth = useMemo(
    () =>
      computeFinancialHealth(
        planData?.fna
          ? {
              cashFlowScore: planData.fna.cashFlowScore,
              protectionScore: planData.fna.protectionScore,
              debtScore: planData.fna.debtScore,
              goalScore: planData.fna.goalScore,
              retirementScore: planData.fna.retirementScore,
            }
          : null,
      ),
    [planData?.fna],
  )

  const liquidCash =
    growView?.lens === 'grow' ? growView.data.assets.cash.formatted : dashboard?.netWorth?.formatted

  const statusLine = useMemo(() => {
    if (yearRevealActive) return "Let's see what life brings you this year…"
    if (inDecisionPhase && situation) {
      return `${board?.selectedDomainLabel ?? 'Life'} · ${situation.title}`
    }
    if (canRoll) {
      return dashboard?.cycleLabel
        ? `${dashboard.cycleLabel} — roll to begin`
        : 'Roll the dice to trigger a real Philippine life event!'
    }
    return 'Life domains'
  }, [yearRevealActive, inDecisionPhase, situation, canRoll, dashboard?.cycleLabel, board?.selectedDomainLabel])

  const timerLabel = useMemo(() => {
    if (!canDecide || !planData?.decisionTimerSeconds) return null
    if (!planData.cycleDeadlineAt) return `${planData.decisionTimerSeconds}s`
    const secs = Math.max(
      0,
      Math.ceil((new Date(planData.cycleDeadlineAt).getTime() - Date.now()) / 1000),
    )
    return `${secs}s`
  }, [canDecide, planData?.decisionTimerSeconds, planData?.cycleDeadlineAt])

  useGameKeyboard({
    canRoll,
    rolling,
    onRoll: handleRollDice,
    onDismiss: () => setNavPanel(null),
    onClosePanel: () => setNavPanel(null),
  })

  const scanHighlightId = yearRevealActive
    ? (yearRevealData?.domainId ?? board?.selectedDomainId)
    : null

  if (loading) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-slate-50">
        <p className="text-slate-500">Loading SPIKE LIFE…</p>
      </div>
    )
  }

  if (showRules) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-gradient-to-b from-slate-50 to-rose-50/30 p-4">
        <OnboardingRulesCard
          onDismiss={() => {
            localStorage.setItem('spike-life-rules-seen', '1')
            setShowRules(false)
          }}
        />
      </div>
    )
  }

  if (dashboard && !dashboard.dreamBoardComplete && dashboard.dreamBoard) {
    return (
      <div className="min-h-dvh bg-gradient-to-b from-slate-50 to-sky-50/40">
        <DreamBoardSetup
          dreamBoard={dashboard.dreamBoard}
          onSubmit={handleDreamBoardSubmit}
          busy={busy}
        />
        {error && <p className="mt-4 text-center text-sm text-red-600">{error}</p>}
      </div>
    )
  }

  if (lifeSummary?.complete) {
    return (
      <LifeSummaryScreen
        summary={lifeSummary}
        onPlayAgain={() => window.location.reload()}
      />
    )
  }

  const showSituation = inDecisionPhase && (situation || decisionOptions.length > 0)

  return (
    <div className="game-shell">
      <a href="#game-board" className="skip-link">
        Skip to game
      </a>

      <PremiumHeaderStats
        characterName={dashboard?.characterName}
        age={dashboard?.age}
        turnNumber={board?.roundNumber ?? dashboard?.turnNumber}
        maxTurns={board?.maxRounds ?? dashboard?.maxTurns}
        lifeScore={dashboard?.lifeScore?.overall}
        netWorth={dashboard?.netWorth?.formatted}
        monthlyCashFlow={dashboard?.monthlySurplus?.formatted}
        liquidCash={liquidCash}
        financialHealth={financialHealth}
        onOpenSummary={() => handleNavSelect('life')}
      />

      {onOpenWorkshop && (
        <div className="mx-4 flex justify-end py-1">
          <button
            type="button"
            onClick={onOpenWorkshop}
            className="focus-game text-caption font-semibold text-indigo-600 hover:underline"
          >
            Workshop ({GAME_ROOM_MAX_PLAYERS} players) →
          </button>
        </div>
      )}

      <PremiumDomainRibbon
        domains={board?.lifeDomains ?? []}
        selectedDomainId={board?.selectedDomainId}
        scanning={yearRevealActive}
        scanHighlightId={scanHighlightId}
      />

      <PremiumDiceBar
        canRoll={canRoll}
        rolling={rolling}
        onRoll={handleRollDice}
        categoryDie={board?.lastCategoryDieRoll}
        situationDie={board?.lastSituationDieRoll}
        timerLabel={timerLabel}
        statusLine={statusLine}
      />

      <div className="mx-2 mb-2 flex min-h-0 flex-1 gap-2 overflow-hidden md:mx-4 md:gap-3">
        <PremiumNavRail
          activePanel={navPanel}
          onSelect={handleNavSelect}
          onHowToPlay={() => setShowRules(true)}
        />

        <main
          id="game-board"
          className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden"
          tabIndex={-1}
        >
          {navPanel && (
            <PremiumLensDrawer
              panel={navPanel}
              onClose={() => setNavPanel(null)}
              planView={planView}
              journeyView={journeyView}
              growView={growView}
              protectView={protectView}
              dashboard={dashboard}
              onDecide={handleDecide}
              onTimerExpire={handleTimerExpire}
              onSubmitReflection={handleReflection}
              busy={busy}
            />
          )}

          <div className="relative flex min-h-0 flex-1 flex-col overflow-y-auto rounded-2xl">
            {board?.gameComplete && (
              <p
                className="mb-3 rounded-2xl bg-emerald-500 px-5 py-3 text-center text-sm font-semibold text-white shadow-lg"
                role="status"
              >
                Journey complete — all {board.maxRounds} years played.
              </p>
            )}

            {yearRevealActive && board?.lifeDomains?.length ? (
              <div className="flex flex-1 items-center justify-center p-4">
                <YearRevealSequence
                  active={yearRevealActive}
                  pending={yearRevealPending}
                  domains={board.lifeDomains}
                  animationCycle={board.domainAnimationCycle}
                  reveal={yearRevealData}
                  onComplete={handleYearRevealComplete}
                />
              </div>
            ) : showSituation ? (
              <PremiumSituationStage
                situation={situation}
                options={decisionOptions}
                selectedIndex={selectedChoiceIndex}
                onSelect={setSelectedChoiceIndex}
                onConfirm={handleConfirmChoice}
                canDecide={canDecide}
                deciding={busy}
                error={error}
                domainLabel={board?.selectedDomainLabel}
                impactTags={impactTags}
              />
            ) : (
              <div className="flex flex-1 flex-col items-center justify-center p-6">
                <BoardWelcome
                  visible={showBoardWelcome}
                  characterName={dashboard?.characterName}
                  archetypeLabel={dashboard?.archetypeLabel}
                  archetypeTagline={dashboard?.archetypeTagline}
                  age={dashboard?.age}
                  canRoll={canRoll}
                  onRoll={handleRollDice}
                />
                {!showBoardWelcome && (
                  <p className="text-center text-sm text-slate-500">
                    {canRoll
                      ? 'Tap Roll life dice to begin your next planning year.'
                      : 'Waiting for the next phase…'}
                  </p>
                )}
              </div>
            )}

            <AdvisorInsightPrompt
              visible={showAdvisorPrompt && inDecisionPhase && !yearRevealActive}
              onViewAdvice={() => {
                setShowAdvisorPrompt(false)
                handleNavSelect('fna')
              }}
              onDecideMyself={() => setShowAdvisorPrompt(false)}
            />

            {error && !showSituation && (
              <p
                className="mt-3 rounded-2xl bg-red-50 px-4 py-3 text-center text-sm text-red-700"
                role="alert"
              >
                {error}
              </p>
            )}
          </div>
        </main>

        <div className="hidden shrink-0 md:block">
          <PremiumCycleRail
            turnNumber={board?.roundNumber ?? dashboard?.turnNumber ?? 1}
            maxTurns={board?.maxRounds ?? dashboard?.maxTurns ?? 20}
            phase={board?.phase ?? 'ready_to_roll'}
            rolling={rolling}
            expandedPanel={navPanel ?? expandedPanel}
            inDecisionPhase={inDecisionPhase}
            canDecide={canDecide}
            decisionTimerSeconds={planData?.decisionTimerSeconds ?? 0}
            cycleDeadlineAt={planData?.cycleDeadlineAt}
            onTimerExpire={handleTimerExpire}
          />
        </div>
      </div>

      <ConsequenceReveal reveal={consequenceReveal} onContinue={handleConsequenceContinue} />

      {dashboard?.pendingCalendarEvent === 'thirteenth_month' && (
        <ThirteenthMonthModal
          allocations={dashboard.thirteenthMonthAllocations}
          onSelect={handleThirteenthMonth}
          onDismiss={handleDismissCalendar}
          busy={busy}
        />
      )}

      {dashboard?.pendingCalendarEvent === 'annual_checkpoint' &&
        dashboard.lastAnnualCheckpoint && (
          <div className="fixed inset-x-0 bottom-8 z-40 flex justify-center px-4">
            <div className="w-full max-w-md">
              <AnnualCheckpointCard
                checkpoint={dashboard.lastAnnualCheckpoint}
                onContinue={handleDismissCalendar}
              />
            </div>
          </div>
        )}
    </div>
  )
}
