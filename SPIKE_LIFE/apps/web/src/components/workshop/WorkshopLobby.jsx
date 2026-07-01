import { useState } from 'react'
import {
  createGame,
  joinGame,
  GAME_ROOM_MAX_PLAYERS,
  GAME_ROOM_MIN_PLAYERS,
} from '../../lib/spike-life-workshop-client.js'

const SESSION_MODES = [
  { id: 'campaign', label: 'Campaign (20 planning cycles)' },
  { id: 'workshop_compressed', label: 'Workshop (5 life stages)' },
]

const TIMER_PRESETS = [
  { id: 'off', label: 'Off' },
  { id: '5', label: '5 seconds' },
  { id: '10', label: '10 seconds' },
  { id: '15', label: '15 seconds' },
  { id: '20', label: '20 seconds' },
]

export default function WorkshopLobby({ onBack, onEnter }) {
  const [hostName, setHostName] = useState('')
  const [gameCode, setGameCode] = useState('')
  const [playerName, setPlayerName] = useState('')
  const [sessionMode, setSessionMode] = useState('campaign')
  const [decisionTimerPreset, setDecisionTimerPreset] = useState('10')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(null)

  async function handleCreateGame(e) {
    e.preventDefault()
    setBusy(true)
    setError(null)
    try {
      const created = await createGame(hostName, {
        sessionMode,
        decisionTimerPreset,
      })
      onEnter({
        playerId: created.playerId,
        displayName: created.displayName,
        roomId: created.roomId,
        gameCode: created.gameCode,
        sessionMode: created.sessionMode,
        decisionTimerPreset: created.decisionTimerPreset,
        archetypeId: created.archetypeId,
        archetypeLabel: created.archetypeLabel,
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
        ← Back
      </button>

      <p className="text-xs font-semibold uppercase tracking-wide text-[#8B0000]">
        SPIKE LIFE™ Multiplayer
      </p>
      <h1 className="mt-2 text-2xl font-semibold text-slate-900">
        Create or join a room
      </h1>
      <p className="mt-2 text-slate-600">
        Any player can host. Share your room code so {GAME_ROOM_MIN_PLAYERS}–{GAME_ROOM_MAX_PLAYERS}{' '}
        players can join — each gets a <strong>random life persona</strong>.
      </p>

      <div className="mt-4 rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
        <p className="font-medium text-slate-900">Before you play</p>
        <ul className="mt-2 list-inside list-disc space-y-1 text-slate-600">
          <li>Everyone completes their Life Blueprint (dreams & goals)</li>
          <li>Any player can start when all are ready</li>
          <li>Winner = highest Life Score™ (balanced life, not richest)</li>
        </ul>
      </div>

      {error && (
        <p className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
      )}

      <form onSubmit={handleCreateGame} className="mt-8 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-sm font-semibold text-slate-900">Create a room</h2>
        <p className="mt-1 text-xs text-slate-500">You join as player 1 and share the code</p>
        <label className="mt-4 block">
          <span className="text-sm font-medium text-slate-800">Your name</span>
          <input
            type="text"
            value={hostName}
            onChange={(e) => setHostName(e.target.value)}
            placeholder="e.g. Alex Santos"
            className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
            maxLength={40}
            required
          />
        </label>
        <label className="mt-4 block">
          <span className="text-sm font-medium text-slate-800">Session mode</span>
          <select
            value={sessionMode}
            onChange={(e) => setSessionMode(e.target.value)}
            className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
          >
            {SESSION_MODES.map((mode) => (
              <option key={mode.id} value={mode.id}>
                {mode.label}
              </option>
            ))}
          </select>
        </label>
        <label className="mt-4 block">
          <span className="text-sm font-medium text-slate-800">Decision timer</span>
          <select
            value={decisionTimerPreset}
            onChange={(e) => setDecisionTimerPreset(e.target.value)}
            className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
          >
            {TIMER_PRESETS.map((preset) => (
              <option key={preset.id} value={preset.id}>
                {preset.label}
              </option>
            ))}
          </select>
        </label>
        <button
          type="submit"
          disabled={busy}
          className="mt-4 w-full rounded-xl bg-[#8B0000] px-4 py-3 text-sm font-medium text-white hover:bg-[#6d0000] disabled:opacity-50"
        >
          {busy ? 'Creating…' : 'Create room'}
        </button>
      </form>

      <div className="relative my-8 text-center text-xs text-slate-400">
        <span className="relative z-10 bg-slate-50 px-2">or join with a code</span>
        <div className="absolute inset-x-0 top-1/2 border-t border-slate-200" aria-hidden />
      </div>

      <form onSubmit={handleJoinGame} className="space-y-3 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-sm font-semibold text-slate-900">Join a room</h2>
        <label className="block">
          <span className="text-sm font-medium text-slate-800">Room code</span>
          <input
            type="text"
            value={gameCode}
            onChange={(e) => setGameCode(e.target.value.toUpperCase())}
            placeholder="e.g. LIFE-A3F2"
            className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 font-mono text-sm uppercase tracking-wider"
            maxLength={12}
            autoComplete="off"
            required
          />
        </label>
        <label className="block">
          <span className="text-sm font-medium text-slate-800">Your name</span>
          <input
            type="text"
            value={playerName}
            onChange={(e) => setPlayerName(e.target.value)}
            placeholder="e.g. Maria Cruz"
            className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
            maxLength={40}
            required
          />
        </label>
        <button
          type="submit"
          disabled={busy}
          className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-900 hover:bg-slate-100 disabled:opacity-50"
        >
          {busy ? 'Joining…' : 'Join room'}
        </button>
      </form>
    </div>
  )
}
