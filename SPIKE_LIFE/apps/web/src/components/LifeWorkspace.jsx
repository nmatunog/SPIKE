import { useCallback, useEffect, useState } from 'react'
import DreamBoardSetup from './gameboard/DreamBoardSetup.jsx'
import LifeSummaryScreen from './gameboard/LifeSummaryScreen.jsx'
import OnboardingRulesCard from './gameboard/OnboardingRulesCard.jsx'
import GameScreenV2 from './v2/GameScreenV2.jsx'
import {
  ensureSessionStarted,
  getDashboard,
  getLifeSummary,
  setDreamBoard,
} from '../lib/spike-life-client.js'

export default function LifeWorkspace({ onOpenWorkshop }) {
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
      <div className="flex min-h-dvh items-center justify-center bg-slate-50">
        <p className="text-slate-500">Loading SPIKE LIFE…</p>
      </div>
    )
  }

  if (showRules) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-gradient-to-b from-slate-950 to-indigo-950/40 p-4">
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

  return <GameScreenV2 onOpenWorkshop={onOpenWorkshop} />
}
