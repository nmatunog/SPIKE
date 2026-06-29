import { Lightbulb, Sparkles } from 'lucide-react'
import DecisionTimerRing from '../gameboard/DecisionTimerRing.jsx'
import DomainHeroSvg from '../../illustrations/DomainHeroSvg.jsx'
import { resolveDomainIdentity } from '../../illustrations/domain-identity.js'

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
          <p className="text-[9px] font-bold uppercase tracking-wide text-slate-400">{label}</p>
          <p className="text-[11px] font-medium leading-snug text-slate-700">{text}</p>
        </div>
      </div>
    </div>
  )
}

export default function SituationStageV3({
  situation,
  domainId,
  domainLabel,
  recommendations = [],
  decisionTimerSeconds,
  cycleDeadlineAt,
  timerActive,
  onTimerExpire,
}) {
  const identity = resolveDomainIdentity(domainId, domainLabel)
  const title = situation?.title ?? 'Life presents a moment…'
  const opportunity = recommendations[0]?.label ?? situation?.learningObjective
  const consideration = recommendations[1]?.label
    ?? (situation?.narrative?.includes('—')
      ? situation.narrative.split('—').slice(1).join('—').trim()
      : null)

  return (
    <article className="gsv3-situation-stage">
      <div className="gsv3-situation-stage__inner">
        <div className="gsv3-situation-stage__copy">
          <span
            className="inline-flex w-fit rounded-full px-2.5 py-0.5 text-[9px] font-extrabold uppercase tracking-[0.18em] text-white"
            style={{ background: identity.color }}
          >
            {(situation?.domainLabel ?? domainLabel ?? 'Life').toUpperCase()} situation
          </span>

          <h1 className="mt-2 text-xl font-black leading-tight text-slate-900 md:text-2xl">
            {title}
          </h1>

          {situation?.narrative && (
            <p className="mt-1.5 line-clamp-2 text-xs leading-relaxed text-slate-600 md:text-sm">
              {situation.narrative}
            </p>
          )}

          <div className="mt-2 grid flex-1 grid-cols-1 gap-2 sm:grid-cols-2">
            <DetailBox
              label="Opportunity"
              text={opportunity}
              icon={Lightbulb}
              accent={identity.color}
            />
            <DetailBox
              label="Consideration"
              text={consideration}
              icon={Sparkles}
              accent="#8B5CF6"
            />
          </div>
        </div>

        <div className="gsv3-situation-stage__illus">
          <DomainHeroSvg
            domainId={domainId}
            className="max-h-full w-full max-w-[280px] object-contain"
          />
        </div>

        {timerActive && decisionTimerSeconds > 0 && (
          <div className="gsv3-situation-stage__timer">
            <p className="mb-1 text-center text-[8px] font-bold uppercase tracking-widest text-slate-400">
              Time to decide
            </p>
            <DecisionTimerRing
              deadlineAt={cycleDeadlineAt}
              totalSeconds={decisionTimerSeconds}
              active={timerActive}
              onExpire={onTimerExpire}
              variant="light"
            />
          </div>
        )}
      </div>
    </article>
  )
}
