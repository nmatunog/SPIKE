import { useState } from 'react'
import { ensureRoom, joinAsPlayer, slugifyPlayerId } from '../../lib/spike-life-workshop-client.js'

export default function WorkshopLobby({ onEnter, onBack }) {
  const [name, setName] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(null)

  async function enterAsFacilitator() {
    setBusy(true)
    setError(null)
    try {
      await ensureRoom('facilitator-demo')
      onEnter({
        role: 'facilitator',
        playerId: 'facilitator-demo',
        displayName: 'Facilitator',
      })
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  async function enterAsPlayer(e) {
    e.preventDefault()
    const displayName = name.trim()
    if (!displayName) {
      setError('Enter your name to join.')
      return
    }

    setBusy(true)
    setError(null)
    try {
      const playerId = slugifyPlayerId(displayName)
      await joinAsPlayer(playerId, displayName)
      onEnter({ role: 'player', playerId, displayName })
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="mx-auto flex min-h-dvh max-w-lg flex-col justify-center px-4 py-12">
      <button
        type="button"
        onClick={onBack}
        className="mb-8 self-start text-sm text-slate-500 hover:text-slate-800"
      >
        ← Solo practice
      </button>

      <p className="text-xs font-semibold uppercase tracking-wide text-[#8B0000]">
        SPIKE LIFE™ Workshop
      </p>
      <h1 className="mt-2 text-2xl font-semibold text-slate-900">
        Join the financial planning room
      </h1>
      <p className="mt-2 text-slate-600">
        Up to 10 players share one life journey board. Everyone gets the same mission each turn;
        each player practices their own planning decisions.
      </p>

      {error && (
        <p className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
      )}

      <button
        type="button"
        disabled={busy}
        onClick={enterAsFacilitator}
        className="mt-8 w-full rounded-xl bg-[#8B0000] px-4 py-3 text-sm font-medium text-white hover:bg-[#6d0000] disabled:opacity-50"
      >
        I&apos;m the Facilitator
      </button>

      <div className="relative my-8 text-center text-xs text-slate-400">
        <span className="bg-slate-50 px-2 relative z-10">or join as intern</span>
        <div className="absolute inset-x-0 top-1/2 border-t border-slate-200" aria-hidden />
      </div>

      <form onSubmit={enterAsPlayer} className="space-y-3">
        <label className="block">
          <span className="text-sm font-medium text-slate-800">Your name</span>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Alex Santos"
            className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
            maxLength={40}
          />
        </label>
        <button
          type="submit"
          disabled={busy}
          className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-900 hover:bg-slate-50 disabled:opacity-50"
        >
          Join workshop
        </button>
      </form>
    </div>
  )
}
