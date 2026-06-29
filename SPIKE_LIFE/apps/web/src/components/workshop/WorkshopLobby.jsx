import { useState } from 'react'
import {
  createGame,
  joinGame,
  GAME_ROOM_MAX_PLAYERS,
  GAME_ROOM_MIN_PLAYERS,
} from '../../lib/spike-life-workshop-client.js'

export default function WorkshopLobby({ onBack, onEnter }) {
  const [facilitatorName, setFacilitatorName] = useState('')
  const [gameCode, setGameCode] = useState('')
  const [playerName, setPlayerName] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(null)

  async function handleCreateGame(e) {
    e.preventDefault()
    setBusy(true)
    setError(null)
    try {
      const created = await createGame(facilitatorName || 'Facilitator')
      onEnter({
        role: 'facilitator',
        playerId: created.facilitatorId,
        displayName: created.facilitatorName,
        roomId: created.roomId,
        gameCode: created.gameCode,
      })
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  async function handleJoinGame(e) {
    e.preventDefault()
    setBusy(true)
    setError(null)
    try {
      const joined = await joinGame(gameCode, playerName)
      onEnter({
        role: 'player',
        playerId: joined.playerId,
        displayName: joined.displayName,
        roomId: joined.roomId,
        gameCode: joined.gameCode,
        archetypeId: joined.archetypeId,
        archetypeLabel: joined.archetypeLabel,
        archetypeTagline: joined.archetypeTagline,
        characterName: joined.characterName,
        age: joined.age,
      })
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
        Multiplayer financial planning
      </h1>
      <p className="mt-2 text-slate-600">
        Facilitators create a game and share a code. {GAME_ROOM_MIN_PLAYERS}–{GAME_ROOM_MAX_PLAYERS}{' '}
        players register their name — each receives a <strong>random life persona</strong> (no picking
        all fresh grads).
      </p>

      {error && (
        <p className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
      )}

      <form onSubmit={handleCreateGame} className="mt-8 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-sm font-semibold text-slate-900">Create a game</h2>
        <p className="mt-1 text-xs text-slate-500">For facilitators and coaches</p>
        <label className="mt-4 block">
          <span className="text-sm font-medium text-slate-800">Your name (optional)</span>
          <input
            type="text"
            value={facilitatorName}
            onChange={(e) => setFacilitatorName(e.target.value)}
            placeholder="e.g. Coach Maria"
            className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
            maxLength={40}
          />
        </label>
        <button
          type="submit"
          disabled={busy}
          className="mt-4 w-full rounded-xl bg-[#8B0000] px-4 py-3 text-sm font-medium text-white hover:bg-[#6d0000] disabled:opacity-50"
        >
          {busy ? 'Creating…' : 'Create game'}
        </button>
      </form>

      <div className="relative my-8 text-center text-xs text-slate-400">
        <span className="relative z-10 bg-slate-50 px-2">or register and join</span>
        <div className="absolute inset-x-0 top-1/2 border-t border-slate-200" aria-hidden />
      </div>

      <form onSubmit={handleJoinGame} className="space-y-3 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-sm font-semibold text-slate-900">Join a game</h2>
        <p className="text-xs text-slate-500">Enter the code from your facilitator</p>
        <label className="block">
          <span className="text-sm font-medium text-slate-800">Game code</span>
          <input
            type="text"
            value={gameCode}
            onChange={(e) => setGameCode(e.target.value.toUpperCase())}
            placeholder="e.g. LIFE-A3F2"
            className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 font-mono text-sm uppercase tracking-wider"
            maxLength={12}
            autoComplete="off"
          />
        </label>
        <label className="block">
          <span className="text-sm font-medium text-slate-800">Your name</span>
          <input
            type="text"
            value={playerName}
            onChange={(e) => setPlayerName(e.target.value)}
            placeholder="e.g. Alex Santos"
            className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
            maxLength={40}
          />
        </label>
        <button
          type="submit"
          disabled={busy}
          className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-900 hover:bg-slate-100 disabled:opacity-50"
        >
          {busy ? 'Joining…' : 'Register & join'}
        </button>
      </form>
    </div>
  )
}
