import { useState } from 'react';
import { Award, Upload } from 'lucide-react';
import { getWeek2State, saveProfessionalReadiness, saveReadinessReflection } from '../../lib/customerDiscovery/week2DiscoveryService.js';

/**
 * Wednesday — Professional Readiness (not "licensing").
 * @param {{ participantId: string, onSaved?: () => void, mode?: 'mission' | 'reflect' }} props
 */
export function ProfessionalReadinessTask({ participantId, onSaved, mode = 'mission' }) {
  const state = getWeek2State(participantId);
  const [evidence, setEvidence] = useState(state.readinessEvidenceNote ?? '');
  const [reflection, setReflection] = useState(
    (state.thinkingShifts ?? []).find((s) => s.taskId === 'readiness-reflect')?.response ?? '',
  );

  if (mode === 'reflect') {
    return (
      <div className="space-y-6">
        <section className="spike-surface space-y-2">
          <p className="spike-label">Professional Readiness</p>
          <h2 className="text-xl font-bold text-slate-900">Reflection</h2>
          <p className="text-sm text-slate-600">
            What did you learn that will make you a better financial professional?
          </p>
        </section>
        <textarea
          value={reflection}
          onChange={(e) => {
            setReflection(e.target.value);
            if (e.target.value.trim().length > 15) {
              saveReadinessReflection(participantId, e.target.value);
              onSaved?.();
            }
          }}
          rows={5}
          className="w-full rounded-xl border border-slate-200 p-4 text-sm focus:border-spike focus:outline-none"
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <section className="overflow-hidden rounded-2xl border border-spike/20 bg-gradient-to-br from-slate-900 to-spike-dark p-6 text-white">
        <p className="text-xs font-bold uppercase tracking-widest text-spike-light/90">Professional Readiness</p>
        <h2 className="mt-2 text-2xl font-bold">Complete AIA Pre-Contract Training</h2>
        <p className="mt-2 text-sm text-slate-300">Estimated time · 4 hours · Complete before Friday</p>
        <p className="mt-4 text-sm text-slate-200">
          SPIKE prepares entrepreneurs. AIA prepares professionals. This week, those journeys connect.
        </p>
      </section>

      <div className="spike-surface space-y-3">
        <p className="text-sm font-semibold text-slate-800">Completion evidence</p>
        <p className="text-xs text-slate-500">Upload certificate note, LMS screenshot reference, or mentor verification code.</p>
        <textarea
          value={evidence}
          onChange={(e) => {
            setEvidence(e.target.value);
            saveProfessionalReadiness(participantId, e.target.value);
            onSaved?.();
          }}
          rows={3}
          placeholder="e.g. Completed Module 1–4 on AIA LMS · verified by mentor"
          className="w-full rounded-lg border border-slate-200 p-3 text-sm"
        />
        <div className="flex flex-wrap gap-2 text-xs text-slate-500">
          <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-1">
            <Upload size={12} /> Upload
          </span>
          <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-1">
            Mentor verification
          </span>
          <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-1 text-amber-800">
            <Award size={12} /> Badge: Professional Readiness
          </span>
        </div>
      </div>
    </div>
  );
}
