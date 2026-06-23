import { useState } from 'react';
import { getWeek2State, savePitchOutline } from '../../lib/customerDiscovery/week2DiscoveryService.js';

const PITCH_FIELDS = [
  { key: 'mission', label: 'Our Mission', slide: 1 },
  { key: 'whoInterviewed', label: 'Who We Interviewed', slide: 2 },
  { key: 'whatWeThought', label: 'What We Thought (assumptions)', slide: 3 },
  { key: 'whatWeLearned', label: 'What We Learned', slide: 4 },
  { key: 'customerVoices', label: 'Customer Voices (3 quotes)', slide: 5 },
  { key: 'biggestProblem', label: 'The Biggest Problem', slide: 6 },
  { key: 'beliefShift', label: 'We Used To Believe… Now We Believe…', slide: 7 },
  { key: 'ventureChanged', label: 'How Our Venture Changed', slide: 8 },
  { key: 'nextSteps', label: 'Next Steps', slide: 9 },
  { key: 'advisorInsight', label: 'One Insight Every Advisor Should Know', slide: 10 },
];

/**
 * @param {{ participantId: string, onSaved?: () => void, variant?: 'start' | 'pitch' }} props
 */
export function PitchBuilderTask({ participantId, onSaved, variant = 'pitch' }) {
  const initial = getWeek2State(participantId).pitchOutline ?? {};
  const [outline, setOutline] = useState(initial);
  const fields = variant === 'start' ? PITCH_FIELDS.slice(0, 4) : PITCH_FIELDS;

  function update(key, value) {
    const next = { ...outline, [key]: value };
    setOutline(next);
    savePitchOutline(participantId, { [key]: value });
    onSaved?.();
  }

  return (
    <div className="space-y-6">
      <section className="spike-surface space-y-2">
        <p className="spike-label">{variant === 'start' ? 'Pitch builder' : 'Market Validation Pitch'}</p>
        <h2 className="text-xl font-bold text-slate-900">
          {variant === 'start' ? 'Begin your Week 2 pitch' : 'Present evidence — not ideas'}
        </h2>
        <p className="text-sm text-slate-600">5 minutes per squad · Week 2 Stage Gate</p>
      </section>
      <div className="space-y-4">
        {fields.map((field) => (
          <label key={field.key} className="spike-surface block space-y-1">
            <span className="text-[10px] font-bold uppercase text-slate-400">Slide {field.slide}</span>
            <span className="block text-sm font-semibold text-slate-800">{field.label}</span>
            <textarea
              value={outline[field.key] ?? ''}
              rows={2}
              onChange={(e) => update(field.key, e.target.value)}
              className="w-full border-0 bg-transparent text-sm text-slate-700 focus:outline-none"
            />
          </label>
        ))}
      </div>
    </div>
  );
}
