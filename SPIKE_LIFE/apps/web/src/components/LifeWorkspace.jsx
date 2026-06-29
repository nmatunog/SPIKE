import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  BoardHUD,
  BoardLegend,
  BoardOverlay,
  EncounterModal,
  FinancialHUD,
  GameBoard,
  SPACE_CATEGORY_LEGEND,
} from '@spike-life/ui'
import ActionDock from './gameboard/ActionDock.jsx'
import BoardWelcome from './gameboard/BoardWelcome.jsx'
import DomainGridBoard from './gameboard/DomainGridBoard.jsx'
import AdvisorInsightPrompt from './gameboard/AdvisorInsightPrompt.jsx'
import YearRevealSequence from './gameboard/YearRevealSequence.jsx'
import FinancialWorldsPanel from './gameboard/FinancialWorldsPanel.jsx'
import LearningBeat from './gameboard/LearningBeat.jsx'
import SituationSideCard from './gameboard/SituationSideCard.jsx'
import TurnFlowStepper from './gameboard/TurnFlowStepper.jsx'
import { impactTagsForSpaceType } from './gameboard/encounter-impact.js'
import { useGameKeyboard } from '../hooks/useGameKeyboard.js'
import DreamBoardSetup from './gameboard/DreamBoardSetup.jsx'
import ThirteenthMonthModal from './gameboard/ThirteenthMonthModal.jsx'
import AnnualCheckpointCard from './gameboard/AnnualCheckpointCard.jsx'
import LifeSummaryScreen from './gameboard/LifeSummaryScreen.jsx'
import OnboardingRulesCard from './gameboard/OnboardingRulesCard.jsx'
import TurnBoardPopout from './gameboard/TurnBoardPopout.jsx'
import LifeDecisionStage from './gameboard/LifeDecisionStage.jsx'
import ConsequenceReveal from './gameboard/ConsequenceReveal.jsx'
import { computeFinancialHealth } from '@spike-life/domain'
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
import {
  toBoardViewModel,
  toFinancialHUD,
  toTurnHUD,
} from '../lib/board-view-adapter.js'
import { useBoardUIStore } from '../store/board-ui-store.js'
import { GAME_ROOM_MAX_PLAYERS } from '../lib/spike-life-workshop-client.js'

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
  const [showTurnPopout, setShowTurnPopout] = useState(false)
  const [showLifeDecision, setShowLifeDecision] = useState(false)
  const [consequenceReveal, setConsequenceReveal] = useState(null)

  const {
    expandedPanel,
    showEncounterModal,
    highlightSpaceIndex,
    setExpandedPanel,
    setShowEncounterModal,
    setHighlightSpaceIndex,
    resetPanels,
  } = useBoardUIStore()

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

  const boardView = useMemo(() => toBoardViewModel(board), [board])
  const turnHUD = useMemo(() => toTurnHUD(dashboard, board), [dashboard, board])
  const financialHUD = useMemo(
    () => toFinancialHUD(dashboard, growView, planView),
    [dashboard, growView, planView],
  )

  async function ensureLens(lens) {
    if (lens === 'grow' && !growView) {
      const view = await getLensView('grow')
      setGrowView(view)
      return view
    }
    if (lens === 'protect' && !protectView) {
      const view = await getLensView('protect')
      setProtectView(view)
      return view
    }
    return null
  }

  async function handleExpandPanel(panel) {
    setExpandedPanel(panel)
    if (panel === 'grow') await ensureLens('grow')
    if (panel === 'protect') await ensureLens('protect')
    if (panel === 'journey' || panel === 'reflect') {
      setJourneyView(await getLensView('journey'))
    }
    if (panel === 'fna' || panel === 'decision') {
      setPlanView(await getLensView('plan'))
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
      setExpandedPanel('reflect')
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
    setShowEncounterModal(false)
    setShowAdvisorPrompt(false)
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
    } else {
      setShowTurnPopout(true)
    }
  }, [pendingAdvisorInsight])

  const rolling = yearRevealActive

  async function handleDecide(strategy) {
    setBusy(true)
    setError(null)
    setShowEncounterModal(false)
    setShowLifeDecision(false)
    try {
      await submitDecision(strategy)
      const plan = await getLensView('plan')
      setPlanView(plan)
      await refresh()
      setJourneyView(await getLensView('journey'))
      if (plan?.lens === 'plan' && plan.data.consequenceReveal) {
        setConsequenceReveal(plan.data.consequenceReveal)
      } else {
        setExpandedPanel('reflect')
      }
    } catch (err) {
      setError(err.message)
      setShowLifeDecision(true)
    } finally {
      setBusy(false)
    }
  }

  function handleConsequenceContinue() {
    setConsequenceReveal(null)
    setExpandedPanel('reflect')
  }

  async function handleReflection(answers) {
    setBusy(true)
    setError(null)
    try {
      await submitReflection(answers)
      await endBoardTurn()
      resetPanels()
      await refresh()
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  const inDecisionPhase = board?.phase === 'decision_phase'
  const canDecide = inDecisionPhase && dashboard?.canDecide
  const canReflect = inDecisionPhase && dashboard?.canReflect
  const canRoll = board?.canRoll && !rolling
  const showBoardWelcome =
    !loading && canRoll && !board?.activeEncounter && !rolling && board?.roundNumber <= 1
  const recommendations = planView?.lens === 'plan' ? planView.data.recommendations : []
  const landedSpace = board?.spaces.find((s) => s.index === board.landedSpaceIndex)
  const priorityLabels = recommendations.slice(0, 3).map((r) => r.title)
  const impactTags = landedSpace ? impactTagsForSpaceType(landedSpace.type) : []

  useGameKeyboard({
    canRoll,
    rolling,
    onRoll: handleRollDice,
    onDismiss: () => setShowEncounterModal(false),
    onClosePanel: () => setExpandedPanel(null),
  })

  const domainProps = {
    selectedDomainLabel: board?.selectedDomainLabel ?? null,
  }

  const gridStatusLabel = (() => {
    if (yearRevealActive) return 'Let\'s see what life brings you this year…'
    if (showEncounterModal || inDecisionPhase) {
      return dashboard?.cycleLabel
        ? `${dashboard.cycleLabel} — situation ready`
        : board?.selectedDomainLabel
          ? `${board.selectedDomainLabel} — situation ready`
          : 'Situation ready'
    }
    if (canRoll) {
      return dashboard?.cycleLabel
        ? `${dashboard.cycleLabel} — tap Next Year`
        : board?.roundNumber > 1
          ? `Year ${board.roundNumber} — tap Next Year`
          : 'Tap Next Year to begin'
    }
    return 'Life domains'
  })()

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

  return (
    <div className="game-shell">
      <a href="#game-board" className="skip-link">
        Skip to game
      </a>

      <BoardHUD
        hud={turnHUD}
        onRoll={handleRollDice}
        rolling={rolling}
        rollLabel="Next year"
        rollingLabel="Let's see what life brings you this year…"
      />

      {onOpenWorkshop && (
        <div className="shrink-0 border-b border-slate-200/70 bg-white/70 px-4 py-2 backdrop-blur-sm">
          <div className="mx-auto flex max-w-[120rem] justify-end">
            <button
              type="button"
              onClick={onOpenWorkshop}
              className="focus-game rounded-lg px-3 py-2 text-caption font-semibold text-spike-brand hover:underline"
            >
              Workshop ({GAME_ROOM_MAX_PLAYERS} players) →
            </button>
          </div>
        </div>
      )}

      <div className="shrink-0 border-b border-slate-200/60 bg-white/60 px-4 py-3 backdrop-blur-sm xl:hidden">
        <FinancialWorldsPanel compact />
      </div>

      <div className="shrink-0 border-b border-slate-200/60 bg-white/60 px-4 py-3 backdrop-blur-sm xl:hidden">
        <TurnFlowStepper
          layout="horizontal"
          phase={board?.phase ?? 'ready_to_roll'}
          rolling={rolling}
          expandedPanel={expandedPanel}
          showEncounterModal={showEncounterModal}
        />
      </div>

      <div className="mx-auto grid min-h-0 w-full max-w-[120rem] flex-1 grid-cols-1 grid-rows-[minmax(0,1fr)_auto] gap-0 overflow-hidden xl:grid-cols-[12.5rem_minmax(0,1fr)_20rem] xl:grid-rows-1 xl:gap-5 xl:px-6 xl:py-5">
        <aside className="hidden min-h-0 flex-col gap-4 overflow-hidden xl:flex">
          <FinancialWorldsPanel />
          <LearningBeat
            phase={board?.phase ?? 'ready_to_roll'}
            rolling={rolling}
            expandedPanel={expandedPanel}
            showEncounterModal={showEncounterModal}
            roundNumber={board?.roundNumber ?? 1}
            hasEncounter={Boolean(board?.activeEncounter)}
            {...domainProps}
          />
          <TurnFlowStepper
            phase={board?.phase ?? 'ready_to_roll'}
            rolling={rolling}
            expandedPanel={expandedPanel}
            showEncounterModal={showEncounterModal}
          />
          <BoardLegend compact items={SPACE_CATEGORY_LEGEND} title="Board" className="mt-auto" />
        </aside>

        <main
          id="game-board"
          className="relative flex min-h-0 min-w-0 flex-col px-3 py-3 sm:px-4 xl:px-0 xl:py-0"
          tabIndex={-1}
        >
          {board?.gameComplete && (
            <p
              className="absolute left-4 right-4 top-3 z-10 rounded-2xl bg-emerald-500 px-5 py-3 text-center text-body font-semibold text-white shadow-lg"
              role="status"
            >
              Journey complete — all {board.maxRounds} years played.
            </p>
          )}

          <div className="relative flex min-h-0 flex-1 items-center justify-center rounded-3xl bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 p-4 sm:p-6 xl:rounded-4xl xl:p-8">
            {loading ? (
              <p className="text-body-lg text-slate-400" role="status">
                Loading…
              </p>
            ) : board?.lifeDomains?.length ? (
              <div className="flex w-full max-w-lg flex-col items-center">
                {yearRevealActive ? (
                  <YearRevealSequence
                    active={yearRevealActive}
                    pending={yearRevealPending}
                    domains={board.lifeDomains}
                    animationCycle={board.domainAnimationCycle}
                    reveal={yearRevealData}
                    onComplete={handleYearRevealComplete}
                  />
                ) : (
                  <>
                    <p className="mb-4 text-center text-label uppercase tracking-wider text-amber-300/90">
                      {gridStatusLabel}
                    </p>
                    <DomainGridBoard
                      domains={board.lifeDomains}
                      selectedDomainId={board?.selectedDomainId}
                      animationCycle={board.domainAnimationCycle}
                      mode="idle"
                      className="w-full"
                    />
                    <BoardWelcome
                      visible={showBoardWelcome}
                      characterName={dashboard?.characterName}
                      archetypeLabel={dashboard?.archetypeLabel}
                      archetypeTagline={dashboard?.archetypeTagline}
                      age={dashboard?.age}
                      canRoll={canRoll}
                      onRoll={handleRollDice}
                    />
                  </>
                )}
              </div>
            ) : (
              <GameBoard
                board={boardView}
                rolling={rolling}
                highlightSpaceIndex={highlightSpaceIndex}
                onSpaceSelect={(space) => setHighlightSpaceIndex(space.boardIndex)}
                className="min-h-0 w-full flex-1"
              />
            )}
          </div>

          <AdvisorInsightPrompt
            visible={showAdvisorPrompt && inDecisionPhase && !yearRevealActive}
            onViewAdvice={() => {
              setShowAdvisorPrompt(false)
              handleExpandPanel('fna')
            }}
            onDecideMyself={() => {
              setShowAdvisorPrompt(false)
              setShowLifeDecision(true)
            }}
          />

          <BoardOverlay
            visible={showEncounterModal && inDecisionPhase && !rolling}
            onDismiss={() => setShowEncounterModal(false)}
          >
            <EncounterModal
              encounter={board?.activeEncounter ?? null}
              spaceCategory={landedSpace?.category}
              impactTags={impactTags}
              priorityLabels={priorityLabels}
              onViewAnalysis={() => {
                setShowEncounterModal(false)
                handleExpandPanel('fna')
              }}
              onMakeDecision={() => {
                setShowEncounterModal(false)
                handleExpandPanel('decision')
              }}
              onDismiss={() => setShowEncounterModal(false)}
            />
          </BoardOverlay>

          <div aria-live="assertive" aria-atomic="true" className="sr-only">
            {error}
          </div>
          {error && (
            <p
              className="absolute bottom-3 left-3 right-3 rounded-2xl bg-red-600 px-5 py-3 text-center text-body font-medium text-white shadow-lg sm:left-auto sm:right-4 sm:max-w-md"
              role="alert"
            >
              {error}
            </p>
          )}
        </main>

        <aside className="flex min-h-0 shrink-0 flex-col gap-4 overflow-y-auto border-t border-slate-200/70 bg-white/85 px-4 py-4 backdrop-blur-md xl:max-h-none xl:shrink xl:overflow-hidden xl:border-0 xl:bg-transparent xl:px-0 xl:py-0 xl:backdrop-blur-none">
          <div className="xl:hidden">
            <LearningBeat
              phase={board?.phase ?? 'ready_to_roll'}
              rolling={rolling}
              expandedPanel={expandedPanel}
              showEncounterModal={showEncounterModal}
              roundNumber={board?.roundNumber ?? 1}
              hasEncounter={Boolean(board?.activeEncounter)}
              {...domainProps}
            />
          </div>

          <SituationSideCard encounter={board?.activeEncounter} forceOpen />

          <ActionDock
            board={board}
            expandedPanel={expandedPanel}
            onExpandPanel={handleExpandPanel}
            onRoll={handleRollDice}
            rolling={rolling}
            canDecide={canDecide}
            canReflect={canReflect}
            inDecisionPhase={inDecisionPhase}
            planView={planView}
            journeyView={journeyView}
            growView={growView}
            protectView={protectView}
            onDecide={handleDecide}
            onTimerExpire={handleTimerExpire}
            onSubmitReflection={handleReflection}
            busy={busy}
            error={error}
            onViewJourney={async () => {
              setJourneyView(await getLensView('journey'))
            }}
          />
        </aside>
      </div>

      <TurnBoardPopout
        visible={showTurnPopout && inDecisionPhase}
        domains={board?.lifeDomains ?? []}
        selectedDomainId={board?.selectedDomainId}
        domainLabel={board?.selectedDomainLabel ?? yearRevealData?.domainLabel}
        encounter={board?.activeEncounter ?? yearRevealData?.encounter}
        categoryDie={board?.lastCategoryDieRoll}
        situationDie={board?.lastSituationDieRoll}
        stats={dashboard ? {
          age: dashboard.age,
          cashFlow: dashboard.monthlySurplus?.formatted,
          cash: dashboard.netWorth?.formatted,
          netWorth: dashboard.netWorth?.formatted,
          lifeScore: dashboard.lifeScore?.overall,
          year: dashboard.simulationYear,
          financialHealth: computeFinancialHealth(
            planView?.lens === 'plan' && planView.data.fna
              ? {
                  cashFlowScore: planView.data.fna.cashFlowScore,
                  protectionScore: planView.data.fna.protectionScore,
                  debtScore: planView.data.fna.debtScore,
                  goalScore: planView.data.fna.goalScore,
                  retirementScore: planView.data.fna.retirementScore,
                }
              : null,
          ),
        } : null}
        onContinue={() => {
          setShowTurnPopout(false)
          setShowLifeDecision(true)
        }}
      />

      {showLifeDecision && inDecisionPhase && !showTurnPopout && (
        <LifeDecisionStage
          situation={planView?.lens === 'plan' ? planView.data.situation : null}
          options={planView?.lens === 'plan' ? planView.data.decisionOptions : []}
          canDecide={canDecide}
          deciding={busy}
          error={error}
          decisionTimerSeconds={planView?.lens === 'plan' ? planView.data.decisionTimerSeconds : 0}
          cycleDeadlineAt={planView?.lens === 'plan' ? planView.data.cycleDeadlineAt : null}
          onDecide={handleDecide}
          onTimerExpire={handleTimerExpire}
          onDismiss={() => setShowLifeDecision(false)}
        />
      )}

      <ConsequenceReveal
        reveal={consequenceReveal}
        onContinue={handleConsequenceContinue}
      />

      <FinancialHUD
        data={financialHUD}
        onOpenGrow={async () => {
          await ensureLens('grow')
          handleExpandPanel('grow')
        }}
        onOpenProtect={async () => {
          await ensureLens('protect')
          handleExpandPanel('protect')
        }}
      />

      {dashboard?.pendingCalendarEvent === 'thirteenth_month' && (
        <ThirteenthMonthModal
          allocations={dashboard.thirteenthMonthAllocations}
          onSelect={handleThirteenthMonth}
          onDismiss={handleDismissCalendar}
          busy={busy}
        />
      )}

      {dashboard?.pendingCalendarEvent === 'annual_checkpoint' && dashboard.lastAnnualCheckpoint && (
        <div className="fixed inset-x-0 bottom-24 z-40 flex justify-center px-4 sm:bottom-8">
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
