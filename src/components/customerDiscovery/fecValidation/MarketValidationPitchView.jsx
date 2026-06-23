import { useMemo } from 'react';
import { Check, Circle, Presentation } from 'lucide-react';
import {
  getFecValidationLabState,
  getFridayReadiness,
  submitMarketValidationPitch,
} from '../../../lib/customerDiscovery/week2FecValidationService.js';
import { PITCH_SLIDE_KEYS } from '../../../lib/customerDiscovery/week2FecValidationConstants.js';

/**
 * Friday — Market Validation Pitch presentation mode.
 * @param {{ participantId: string, onSaved?: () => void }} props
 */
export function MarketValidationPitchView({ participantId, onSaved }) {
  const lab = useMemo(() => getFecValidationLabState(participantId), [participantId]);
  const readiness = useMemo(() => getFridayReadiness(participantId), [participantId]);
  const slides = lab.fec.pitchSlides ?? {};
  const submitted = readiness.pitchSubmitted;

  function handleSubmit() {
    submitMarketValidationPitch(participantId);
    onSaved?.();
  }

  return (
    <div className="space-y-8">
      <header className="rounded-2xl border border-venture-activate/30 bg-venture-activate/5 p-6">
        <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.2em] text-venture-activate">
          <Presentation size={14} aria-hidden />
          Friday · Validate
        </p>
        <h1 className="mt-2 text-3xl font-black text-slate-900">Market Validation Pitch</h1>
        <p className="mt-1 text-lg font-medium text-slate-700">What The Market Taught Us</p>
        <p className="mt-2 text-sm text-slate-600">5 minutes per squad · Present evidence — not ideas</p>
      </header>

      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <ReadinessCard label="Pitch readiness" done={readiness.pitchReady} />
        <ReadinessCard label="FEC readiness" done={readiness.fecReady} />
        <ReadinessCard label="Portfolio" done={readiness.portfolioDone} />
        <ReadinessCard label="Professional readiness" done={readiness.readinessDone} />
      </section>

      <div className="space-y-4">
        {PITCH_SLIDE_KEYS.map((slide, idx) => (
          <article
            key={slide.key}
            className="rounded-2xl border-2 border-slate-900 bg-white p-6 shadow-md md:p-8"
          >
            <p className="text-xs font-bold uppercase tracking-widest text-slate-400">Slide {idx + 1}</p>
            <h2 className="mt-2 text-2xl font-bold text-slate-900 md:text-3xl">{slide.label}</h2>
            <p className="mt-4 text-base leading-relaxed text-slate-700 md:text-lg whitespace-pre-wrap">
              {slides[slide.key] || '—'}
            </p>
          </article>
        ))}
      </div>

      {!submitted ? (
        <button type="button" onClick={handleSubmit} className="spike-btn-primary min-h-[48px] text-base">
          Submit pitch for Stage Gate
        </button>
      ) : (
        <p className="flex items-center gap-2 text-sm font-semibold text-emerald-700">
          <Check size={18} aria-hidden />
          Pitch submitted — ready for coach stage gate evaluation.
        </p>
      )}
    </div>
  );
}

/** @param {{ label: string, done: boolean }} props */
function ReadinessCard({ label, done }) {
  const Icon = done ? Check : Circle;
  return (
    <div className={`rounded-xl border p-4 ${done ? 'border-emerald-200 bg-emerald-50' : 'border-slate-200 bg-white'}`}>
      <Icon size={18} className={done ? 'text-emerald-600' : 'text-slate-300'} aria-hidden />
      <p className="mt-2 text-sm font-semibold text-slate-900">{label}</p>
      <p className="text-xs text-slate-500">{done ? 'Complete' : 'In progress'}</p>
    </div>
  );
}
