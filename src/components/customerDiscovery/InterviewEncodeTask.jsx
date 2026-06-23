import { useEffect, useMemo, useRef, useState } from 'react';
import { Check, Save } from 'lucide-react';
import {
  getWeek2State,
  padInterviewAnswers,
  saveEncodedInterview,
  saveInterviewQuestions,
} from '../../lib/customerDiscovery/week2DiscoveryService.js';
import {
  MAX_INTERVIEW_QUESTIONS,
  MIN_ENCODED_INTERVIEWS,
  SQUAD_INTERVIEW_TARGET,
} from '../../lib/customerDiscovery/week2Constants.js';
import { squadEvidenceSummary } from '../../lib/customerDiscovery/week2SquadEvidenceService.js';

function readInterviewDraft(participantId, interviewIndex) {
  const state = getWeek2State(participantId);
  const existing = state.interviews?.[interviewIndex] ?? {};
  return {
    questions: state.questions ?? [],
    alias: existing.alias ?? '',
    occupation: existing.occupation ?? '',
    answers: padInterviewAnswers(existing.answers),
    reflection: existing.reflection ?? '',
    insights: existing.aiInsights ?? null,
    encoded: Boolean(existing.encoded),
  };
}

/**
 * Discover mode — encode one field interview; drafts persist on save and when leaving the screen.
 * @param {{ participantId: string, interviewIndex: number, onSaved?: () => void }} props
 */
export function InterviewEncodeTask({ participantId, interviewIndex, onSaved }) {
  const initial = useMemo(
    () => readInterviewDraft(participantId, interviewIndex),
    [participantId, interviewIndex],
  );

  const [questions, setQuestions] = useState(initial.questions);
  const [alias, setAlias] = useState(initial.alias);
  const [occupation, setOccupation] = useState(initial.occupation);
  const [answers, setAnswers] = useState(initial.answers);
  const [reflection, setReflection] = useState(initial.reflection);
  const [insights, setInsights] = useState(initial.insights);
  const [encoded, setEncoded] = useState(initial.encoded);
  const [saveState, setSaveState] = useState('idle');

  const draftRef = useRef({ alias, occupation, answers, reflection, questions });

  useEffect(() => {
    const draft = readInterviewDraft(participantId, interviewIndex);
    setQuestions(draft.questions);
    setAlias(draft.alias);
    setOccupation(draft.occupation);
    setAnswers(draft.answers);
    setReflection(draft.reflection);
    setInsights(draft.insights);
    setEncoded(draft.encoded);
    setSaveState('idle');
  }, [participantId, interviewIndex]);

  useEffect(() => {
    draftRef.current = { alias, occupation, answers, reflection, questions };
  }, [alias, occupation, answers, reflection, questions]);

  const squadEvidence = useMemo(() => squadEvidenceSummary(participantId), [participantId]);

  function flushDraft({ notify = false, showFeedback = false } = {}) {
    const draft = draftRef.current;
    saveInterviewQuestions(participantId, draft.questions);
    const next = saveEncodedInterview(participantId, interviewIndex, {
      alias: draft.alias,
      occupation: draft.occupation,
      answers: draft.answers,
      reflection: draft.reflection,
    });
    const iv = next.interviews?.[interviewIndex];
    if (iv?.aiInsights) setInsights(iv.aiInsights);
    setEncoded(Boolean(iv?.encoded));
    if (showFeedback) {
      setSaveState('saved');
      window.setTimeout(() => setSaveState('idle'), 2000);
    }
    if (notify) onSaved?.();
    return next;
  }

  useEffect(() => {
    return () => {
      const draft = draftRef.current;
      saveInterviewQuestions(participantId, draft.questions);
      saveEncodedInterview(participantId, interviewIndex, {
        alias: draft.alias,
        occupation: draft.occupation,
        answers: draft.answers,
        reflection: draft.reflection,
      });
    };
  }, [participantId, interviewIndex]);

  function persist(patch) {
    const merged = {
      alias: patch.alias ?? draftRef.current.alias,
      occupation: patch.occupation ?? draftRef.current.occupation,
      answers: patch.answers ?? draftRef.current.answers,
      reflection: patch.reflection ?? draftRef.current.reflection,
      questions: patch.questions ?? draftRef.current.questions,
    };
    draftRef.current = merged;
    saveInterviewQuestions(participantId, merged.questions);
    const next = saveEncodedInterview(participantId, interviewIndex, merged);
    const iv = next.interviews?.[interviewIndex];
    if (iv?.aiInsights) setInsights(iv.aiInsights);
    setEncoded(Boolean(iv?.encoded));
  }

  function updateQuestion(qi, text) {
    const nextQuestions = questions.map((q, i) => (i === qi ? { ...q, text } : q));
    setQuestions(nextQuestions);
    persist({ questions: nextQuestions });
  }

  const filledAnswers = answers.filter((a) => String(a).trim().length > 0).length;

  return (
    <div className="space-y-6">
      <section className="spike-surface space-y-2">
        <p className="spike-label">Discover mode</p>
        <h2 className="text-xl font-bold text-slate-900">Interview {interviewIndex + 1}</h2>
        <p className="text-sm text-slate-600">
          Minimum {MIN_ENCODED_INTERVIEWS} per member · Squad target {SQUAD_INTERVIEW_TARGET} · Your squad:{' '}
          {squadEvidence.interviewCount}
        </p>
        <p className="text-xs text-slate-500">
          Answers save as you type and when you leave this screen. Use Save before switching sections if you want to be sure.
        </p>
      </section>

      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={() => flushDraft({ notify: true, showFeedback: true })}
          className="spike-btn-primary inline-flex min-h-[44px] items-center gap-2"
        >
          <Save size={16} aria-hidden />
          Save interview
        </button>
        {saveState === 'saved' ? (
          <span className="inline-flex items-center gap-1 text-sm font-medium text-venture-discover">
            <Check size={14} aria-hidden />
            Saved
          </span>
        ) : null}
        {encoded ? (
          <span className="rounded-full bg-venture-discover/15 px-2.5 py-0.5 text-xs font-semibold text-venture-discover">
            Encoded ✓
          </span>
        ) : (
          <span className="text-xs text-slate-500">
            {filledAnswers} / {MAX_INTERVIEW_QUESTIONS} answers · alias required for encode
          </span>
        )}
      </div>

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
          <li key={questions[qi]?.id ?? `q-${qi}`} className="spike-surface space-y-2">
            <p className="text-[10px] font-semibold uppercase text-slate-400">
              Q{qi + 1}
              {questions[qi]?.section ? ` · ${questions[qi].section}` : ''}
            </p>
            <input
              type="text"
              value={questions[qi]?.text ?? ''}
              onChange={(e) => updateQuestion(qi, e.target.value)}
              placeholder={questions[qi]?.placeholder ?? 'Question you asked in the field'}
              className="w-full border-0 bg-transparent text-sm font-medium text-slate-800 focus:outline-none"
            />
            <textarea
              value={ans}
              rows={2}
              onChange={(e) => {
                const next = [...answers];
                next[qi] = e.target.value;
                setAnswers(next);
                persist({ answers: next });
              }}
              onBlur={() => flushDraft()}
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
          onBlur={() => flushDraft()}
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
