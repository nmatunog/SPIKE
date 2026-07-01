import { useCallback, useEffect, useState } from 'react'
import DreamBoardSetup from './gameboard/DreamBoardSetup.jsx'
import LifeSummaryScreen from './gameboard/LifeSummaryScreen.jsx'
import OnboardingRulesCard from './gameboard/OnboardingRulesCard.jsx'
import GameScreenV3 from './v3/GameScreenV3.jsx'
import {
  ensureSessionStarted,
  getDashboard,
  getLifeSummary,
  setDreamBoard,
} from '../lib/spike-life-client.js'

export default function LifeWorkspace({ onBack, onOpenWorkshop }) {
  const [loading, setLoading] = useState(true)
  const [dashboard, setDashboard] = useState(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(null)
  const [lifeSummary, setLifeSummary] = useState(null)
  const [showRules, setShowRules] = useState(
    () => !localStorage.getItem('spike-life-rules-seen'),
  )

  const refresh = useCallback(async () => {
    await ensureSessionStarted()
    const dash = await getDashboard()
    setDashboard(dash)
    setLoading(false)
    return dash
  }, [])

  useEffect(() => {
    refresh().catch((err) => {
      setError(err.message)
      setLoading(false)
    })
  }, [refresh])

  useEffect(() => {
    if (dashboard?.workshopComplete) {
      getLifeSummary()
        .then(setLifeSummary)
        .catch(() => {})
    }
  }, [dashboard?.workshopComplete])

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

  if (loading) {
    return (
      <div className="flex h-dvh items-center justify-center bg-white">
        <p className="text-slate-500">Loading SPIKE LIFE…</p>
      </div>
    )
  }

  const backButton = onBack ? (
    <button
      type="button"
      onClick={onBack}
      className="fixed left-4 top-4 z-50 text-sm text-slate-500 hover:text-slate-800"
    >
      ← Back
    </button>
  ) : null

  if (showRules) {
    return (
      <div className="relative flex h-dvh items-center justify-center bg-gradient-to-b from-white to-indigo-50/30 p-4">
        {backButton}
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
      <>
        {backButton}
        <DreamBoardSetup
        dreamBoard={dashboard.dreamBoard}
        dashboard={dashboard}
        onSubmit={handleDreamBoardSubmit}
        busy={busy}
        error={error}
      />
      </>
    )
  }

  if (lifeSummary?.complete) {
    return (
      <>
        {backButton}
        <LifeSummaryScreen
        summary={lifeSummary}
        onPlayAgain={() => window.location.reload()}
      />
      </>
    )
  }

  return (
    <>
      {backButton}
      <GameScreenV3 onOpenWorkshop={onOpenWorkshop} />
    </>
  )
}
