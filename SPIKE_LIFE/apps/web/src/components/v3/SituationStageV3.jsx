import { Lightbulb, Sparkles } from 'lucide-react'
import DecisionTimerRing from '../gameboard/DecisionTimerRing.jsx'
import DomainHeroSvg from '../../illustrations/DomainHeroSvg.jsx'
import { resolveDomainIdentity, resolveDomainIdFromLabel } from '../../illustrations/domain-identity.js'

function DetailBox({ label, text, icon: Icon, accent }) {
  if (!text) return null
  return (
    <div className="gsv3-detail-box">
      <div className="flex items-start gap-2">
        <span
          className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-md"
          style={{ background: `${accent}18`, color: accent }}
        >
          <Icon className="h-3.5 w-3.5" aria-hidden />
        </span>
        <div className="min-w-0">
          <p className="gsv3-detail-box__label">{label}</p>
          <p className="gsv3-detail-box__text">{text}</p>
        </div>
      </div>
    </div>
  )
}

export default function SituationStageV3({
  situation,
  domainId,
  domainLabel,
  cycleLabel,
  recommendations = [],
  decisionTimerSeconds,
  cycleDeadlineAt,
  timerActive,
  onTimerExpire,
}) {
  const heroDomainId =
    situation?.domainId
    ?? resolveDomainIdFromLabel(situation?.domainLabel)
    ?? domainId
    ?? resolveDomainIdFromLabel(domainLabel)
    ?? 'career'
  const identity = resolveDomainIdentity(heroDomainId, situation?.domainLabel ?? domainLabel)
  const opportunity = recommendations[0]?.label ?? situation?.learningObjective
  const consideration = recommendations[1]?.label
    ?? (situation?.narrative?.includes('—')
      ? situation.narrative.split('—').slice(1).join('—').trim()
      : null)

  return (
    <article className="gsv3-situation-stage">
      {timerActive && decisionTimerSeconds > 0 && (
        <div className="gsv3-situation-timer">
          <p className="gsv3-situation-timer__label">Time to decide</p>
          <DecisionTimerRing
            deadlineAt={cycleDeadlineAt}
            totalSeconds={decisionTimerSeconds}
            active={timerActive}
            onExpire={onTimerExpire}
            variant="light"
          />
        </div>
      )}

      <div className="gsv3-situation-stage__inner">
        <div className="gsv3-situation-stage__copy">
          <span className="gsv3-situation-badge" style={{ background: `${identity.color}22`, color: identity.color }}>
            {(situation?.domainLabel ?? domainLabel ?? 'Life').toUpperCase()} situation
          </span>

          <h1 className="gsv3-situation-title">
            {situation?.title ?? 'Life presents a moment…'}
          </h1>

          {situation?.narrative && (
            <p className="gsv3-situation-narrative">{situation.narrative}</p>
          )}

          {cycleLabel && (
            <p className="gsv3-situation-cycle">{cycleLabel}</p>
          )}

          <p className="rounded-lg border border-indigo-100 bg-indigo-50/80 px-3 py-2 text-xs leading-relaxed text-indigo-950">
            <strong className="font-semibold">Your turn:</strong> read the situation, then choose one
            response in the panel below and tap <strong>Confirm</strong>.
          </p>

          <div className="gsv3-situation-detail-grid">
            <DetailBox label="Opportunity" text={opportunity} icon={Lightbulb} accent={identity.color} />
            <DetailBox label="Consideration" text={consideration} icon={Sparkles} accent="#8B5CF6" />
          </div>
        </div>

        <div className="gsv3-situation-stage__art">
          <DomainHeroSvg domainId={heroDomainId} className="gsv3-situation-hero" />
        </div>
      </div>
    </article>
  )
}
