import { useMemo, useState } from 'react'
import { ChevronDown, Sparkles } from 'lucide-react'
import './dream-board-setup.css'

const ICONS = {
  home: '🏠',
  plane: '✈️',
  briefcase: '🚀',
  sunset: '🌅',
  graduation: '🎓',
  shield: '🛡️',
}

const GOAL_COPY = {
  home: { title: 'House & Lot Goal', desc: 'Primary home purchase target' },
  travel: { title: 'Travel & Lifestyle', desc: 'Dream vacations & experiences' },
  business: { title: 'Business Expansion', desc: 'Seed capital for growth' },
  retirement: { title: 'Retirement Income', desc: 'Long-term financial security' },
  education: { title: 'Education Fund', desc: 'Child education & learning' },
  emergency: { title: 'Emergency Safety Net', desc: '6× monthly income buffer' },
}

const CARD_THEMES = [
  { bg: '#EFF6FF', border: '#BFDBFE', badge: '#DBEAFE', badgeText: '#1D4ED8', icon: '#2563EB' },
  { bg: '#ECFEFF', border: '#A5F3FC', badge: '#CFFAFE', badgeText: '#0E7490', icon: '#0891B2' },
  { bg: '#FFF7ED', border: '#FED7AA', badge: '#FFEDD5', badgeText: '#C2410C', icon: '#EA580C' },
  { bg: '#F5F3FF', border: '#DDD6FE', badge: '#EDE9FE', badgeText: '#6D28D9', icon: '#7C3AED' },
  { bg: '#FFF1F2', border: '#FECDD3', badge: '#FFE4E6', badgeText: '#BE123C', icon: '#E11D48' },
  { bg: '#ECFDF5', border: '#A7F3D0', badge: '#D1FAE5', badgeText: '#047857', icon: '#059669' },
]

const CAREER_OPTIONS = [
  { id: 'bpo_professional', label: 'BPO Associate (₱38,000/mo)' },
  { id: 'fresh_graduate', label: 'Fresh Graduate (₱25,000/mo)' },
  { id: 'young_professional', label: 'Young Professional (₱45,000/mo)' },
  { id: 'young_entrepreneur', label: 'Entrepreneur (Variable income)' },
]

const TIMER_OPTIONS = [
  { value: 15, label: '15 Seconds (Rapid Decisions)' },
  { value: 30, label: '30 Seconds (Balanced)' },
  { value: 60, label: '60 Seconds (Reflective)' },
]

function goalDisplay(goal, emergencyFund) {
  if (goal.goalId === 'emergency') {
    return {
      goalId: 'emergency',
      goalName: GOAL_COPY.emergency.title,
      description: GOAL_COPY.emergency.desc,
      icon: 'shield',
      amount: emergencyFund?.formatted ?? '—',
      enabled: true,
      locked: true,
    }
  }

  const copy = GOAL_COPY[goal.goalId] ?? {
    title: goal.goalName,
    desc: `Target age ${goal.targetAge}`,
  }

  return {
    goalId: goal.goalId,
    goalName: copy.title,
    description: copy.desc,
    icon: goal.icon ?? 'home',
    amount: goal.presentValue?.formatted ?? goal.futureValue?.formatted ?? '—',
    enabled: goal.enabled,
    locked: false,
  }
}

export default function DreamBoardSetup({
  dreamBoard,
  dashboard,
  onSubmit,
  busy,
  error,
}) {
  const [choices, setChoices] = useState(
    () => dreamBoard?.goals.map((g) => ({ ...g })) ?? [],
  )
  const [playerName, setPlayerName] = useState(dashboard?.characterName ?? 'Juan Dela Cruz')
  const [careerId, setCareerId] = useState(dashboard?.archetypeId ?? 'bpo_professional')
  const [startingAge, setStartingAge] = useState(String(dashboard?.age ?? 25))
  const [timerSeconds, setTimerSeconds] = useState(
    String(dashboard?.decisionTimerSeconds ?? 15),
  )

  const displayCards = useMemo(() => {
    const goalCards = choices.map((g) => goalDisplay(g, dreamBoard?.emergencyFundTarget))
    const emergencyCard = goalDisplay(
      { goalId: 'emergency' },
      dreamBoard?.emergencyFundTarget,
    )
    const cards = [...goalCards]
    if (!cards.some((c) => c.goalId === 'emergency')) {
      cards.push(emergencyCard)
    }
    return cards.slice(0, 6)
  }, [choices, dreamBoard?.emergencyFundTarget])

  function toggleGoal(goalId) {
    setChoices((prev) =>
      prev.map((g) => (g.goalId === goalId ? { ...g, enabled: !g.enabled } : g)),
    )
  }

  function handleSubmit(e) {
    e.preventDefault()
    onSubmit(
      choices.map((g) => ({
        goalId: g.goalId,
        goalName: g.goalName,
        enabled: g.enabled,
        presentValue: g.presentValue?.amount ?? g.presentValue,
        targetAge: g.targetAge,
        futureValue: g.futureValue?.amount ?? g.futureValue,
        icon: g.icon,
      })),
    )
  }

  return (
    <div className="dream-setup-shell">
      <form onSubmit={handleSubmit} className="dream-setup-card">
        <header>
          <h1 className="dream-setup-title">SPIKE LIFE™</h1>
          <p className="dream-setup-subtitle">
            Design your Dream Board &amp; configure initial life conditions below.
          </p>
        </header>

        <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">
          <label className="dream-setup-field">
            <span className="dream-setup-label">Player Name</span>
            <input
              type="text"
              className="dream-setup-input"
              value={playerName}
              onChange={(e) => setPlayerName(e.target.value)}
              placeholder="Juan Dela Cruz"
            />
          </label>
          <label className="dream-setup-field">
            <span className="dream-setup-label">Starting Career</span>
            <select
              className="dream-setup-input"
              value={careerId}
              onChange={(e) => setCareerId(e.target.value)}
            >
              {CAREER_OPTIONS.map((opt) => (
                <option key={opt.id} value={opt.id}>
                  {opt.label}
                </option>
              ))}
            </select>
          </label>
        </div>

        <section className="mt-7">
          <h2 className="dream-setup-section-title">
            <Sparkles className="h-4 w-4 text-violet-500" aria-hidden />
            Dream Board Blueprint
          </h2>

          <div className="dream-setup-grid mt-3">
            {displayCards.map((card, index) => {
              const theme = CARD_THEMES[index % CARD_THEMES.length]
              const enabled = card.locked || card.enabled

              return (
                <button
                  key={card.goalId}
                  type="button"
                  disabled={card.locked}
                  onClick={() => !card.locked && toggleGoal(card.goalId)}
                  className={`dream-goal-card ${
                    enabled ? 'dream-goal-card--enabled' : 'dream-goal-card--disabled'
                  }`}
                  style={{
                    backgroundColor: theme.bg,
                    borderColor: enabled ? theme.border : '#E2E8F0',
                  }}
                >
                  <div className="dream-goal-card__row">
                    <span
                      className="dream-goal-card__icon"
                      style={{ backgroundColor: `${theme.icon}18` }}
                      aria-hidden
                    >
                      {ICONS[card.icon] ?? '🎯'}
                    </span>
                    <div className="dream-goal-card__copy">
                      <p className="dream-goal-card__title">{card.goalName}</p>
                      <p className="dream-goal-card__desc">{card.description}</p>
                    </div>
                  </div>
                  <div
                    className="dream-goal-card__amount"
                    style={{ backgroundColor: theme.badge, color: theme.badgeText }}
                  >
                    <span>{card.amount}</span>
                    <ChevronDown className="h-3.5 w-3.5 opacity-60" aria-hidden />
                  </div>
                </button>
              )
            })}
          </div>
        </section>

        <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">
          <label className="dream-setup-field">
            <span className="dream-setup-label">Decision Timer</span>
            <select
              className="dream-setup-input"
              value={timerSeconds}
              onChange={(e) => setTimerSeconds(e.target.value)}
            >
              {TIMER_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </label>
          <label className="dream-setup-field">
            <span className="dream-setup-label">Starting Age</span>
            <input
              type="number"
              min={18}
              max={60}
              className="dream-setup-input"
              value={startingAge}
              onChange={(e) => setStartingAge(e.target.value)}
            />
          </label>
        </div>

        <div className="mt-8 flex flex-col items-center gap-3">
          {error && (
            <p className="text-center text-sm text-red-600">{error}</p>
          )}
          <button type="submit" disabled={busy} className="dream-setup-launch">
            {busy ? 'Launching…' : 'Launch Board'}
            <span aria-hidden>🚀</span>
          </button>
        </div>
      </form>
    </div>
  )
}
