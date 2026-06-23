import { useMemo, useState } from 'react';
import { Check } from 'lucide-react';
import { getWeek2State, saveEncodedInterview } from '../../lib/customerDiscovery/week2DiscoveryService.js';
import { MIN_ENCODED_INTERVIEWS, TARGET_ENCODED_INTERVIEWS } from '../../lib/customerDiscovery/week2Constants.js';

/**
 * Discover mode — encode one field interview.
 * @param {{ participantId: string, interviewIndex: number, onSaved?: () => void }} props
 */
export function InterviewEncodeTask({ participantId, interviewIndex, onSaved }) {
  const state = getWeek2State(participantId);
  const questions = state.questions ?? [];
  const existing = state.interviews?.[interviewIndex] ?? {
    alias: '',
    occupation: '',
    answers: ['', '', '', '', ''],
    reflection: '',
    encoded: false,
  };

  const [alias, setAlias] = useState(existing.alias ?? '');
  const [occupation, setOccupation] = useState(existing.occupation ?? '');
  const [answers, setAnswers] = useState(existing.answers ?? ['', '', '', '', '']);
  const [reflection, setReflection] = useState(existing.reflection ?? '');
  const [insights, setInsights] = useState(existing.aiInsights ?? null);

  const encodedTotal = useMemo(
    () => (state.interviews ?? []).filter((i) => i.encoded).length,
    [state.interviews],
  );

  function persist(patch) {
    const next = saveEncodedInterview(participantId, interviewIndex, {
      alias: patch.alias ?? alias,
      occupation: patch.occupation ?? occupation,
      answers: patch.answers ?? answers,
      reflection: patch.reflection ?? reflection,
    });
    const iv = next.interviews?.[interviewIndex];
    if (iv?.aiInsights) setInsights(iv.aiInsights);
    onSaved?.();
  }

  return (
    <div className="space-y-6">
      <section className="spike-surface space-y-2">
        <p className="spike-label">Discover mode</p>
        <h2 className="text-xl font-bold text-slate-900">Interview {interviewIndex + 1}</h2>
        <p className="text-sm text-slate-600">
          Minimum {MIN_ENCODED_INTERVIEWS} · Recommended {TARGET_ENCODED_INTERVIEWS} · Squad total: {encodedTotal}
        </p>
      </section>

      <div className="grid gap-3 sm:grid-cols-2">
        <label className="spike-surface block space-y-1">
          <span className="text-xs font-semibold uppercase text-slate-400">Customer alias</span>
          <input
            type="text"
            value={alias}
            onChange={(e) => {
              setAlias(e.target.value);
              persist({ alias: e.target.value });
            }}
            placeholder="e.g. Alex"
            className="w-full border-0 bg-transparent text-sm font-medium focus:outline-none"
          />
        </label>
        <label className="spike-surface block space-y-1">
          <span className="text-xs font-semibold uppercase text-slate-400">Occupation</span>
          <input
            type="text"
            value={occupation}
            onChange={(e) => {
              setOccupation(e.target.value);
              persist({ occupation: e.target.value });
            }}
            placeholder="e.g. Teacher, 3 years"
            className="w-full border-0 bg-transparent text-sm font-medium focus:outline-none"
          />
        </label>
      </div>

      <ol className="space-y-3">
        {answers.map((ans, qi) => (
          <li key={questions[qi]?.id ?? qi} className="spike-surface space-y-1">
            <p className="text-[10px] font-semibold uppercase text-slate-400">
              Q{qi + 1}{questions[qi]?.section ? ` · ${questions[qi].section}` : ''}
            </p>
            <p className="text-xs text-slate-500">{questions[qi]?.text || questions[qi]?.placeholder || 'Your interview question'}</p>
            <textarea
              value={ans}
              rows={2}
              onChange={(e) => {
                const next = [...answers];
                next[qi] = e.target.value;
                setAnswers(next);
                persist({ answers: next });
              }}
              placeholder="Capture their answer — completion over length"
              className="w-full border-0 bg-transparent text-sm text-slate-800 focus:outline-none"
            />
          </li>
        ))}
      </ol>

      <label className="spike-surface block space-y-1">
        <span className="text-xs font-semibold uppercase text-slate-400">Reflection</span>
        <textarea
          value={reflection}
          rows={2}
          onChange={(e) => {
            setReflection(e.target.value);
            persist({ reflection: e.target.value });
          }}
          placeholder="What surprised you?"
          className="w-full border-0 bg-transparent text-sm focus:outline-none"
        />
      </label>

      {insights ? (
        <section className="rounded-xl border border-venture-discover/20 bg-venture-discover/5 p-4 text-sm">
          <p className="mb-2 flex items-center gap-1 font-semibold text-venture-discover">
            <Check size={14} /> AI extracted insights
          </p>
          <div className="grid gap-2 sm:grid-cols-2">
            {insights.goals?.length ? (
              <div>
                <p className="text-xs font-bold text-slate-500">Goals</p>
                <ul className="mt-1 list-disc pl-4 text-slate-700">{insights.goals.map((g) => <li key={g}>{g}</li>)}</ul>
              </div>
            ) : null}
            {insights.painPoints?.length ? (
              <div>
                <p className="text-xs font-bold text-slate-500">Pain points</p>
                <ul className="mt-1 list-disc pl-4 text-slate-700">{insights.painPoints.map((p) => <li key={p}>{p}</li>)}</ul>
              </div>
            ) : null}
            {insights.quotes?.length ? (
              <div className="sm:col-span-2">
                <p className="text-xs font-bold text-slate-500">Quotes</p>
                {insights.quotes.map((q) => (
                  <blockquote key={q} className="mt-1 border-l-2 border-spike pl-3 italic text-slate-600">
                    {q}
                  </blockquote>
                ))}
              </div>
            ) : null}
          </div>
        </section>
      ) : null}
    </div>
  );
}
