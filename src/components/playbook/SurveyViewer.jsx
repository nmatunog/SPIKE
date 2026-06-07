import { useMemo, useState } from 'react';
import { CheckCircle, ClipboardList } from 'lucide-react';
import { isSurveySubmitted, submitSurveyResponse } from '../../lib/surveyService.js';
import { completeSurvey } from '../../lib/playbookProgress.js';

/**
 * @typedef {import('../../types/playbook').SurveyQuestion} SurveyQuestion
 */

/**
 * @param {{
 *   survey: { id: string, dayId?: string, title: string, description: string, status: string },
 *   questions: SurveyQuestion[],
 *   participantId?: string,
 *   onCompleted?: () => void,
 * }} props
 */
export function SurveyViewer({ survey, questions, participantId, onCompleted }) {
  const sorted = useMemo(
    () => [...questions].sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0)),
    [questions],
  );

  const [answers, setAnswers] = useState({});
  const [submitted, setSubmitted] = useState(
    () => participantId && isSurveySubmitted(participantId, survey.id),
  );
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (survey.status === 'draft') {
    return (
      <article className="rounded-xl border border-dashed border-gray-300 bg-gray-50 p-4 text-sm text-gray-600">
        <p className="font-bold text-gray-800">{survey.title}</p>
        <p className="mt-1">{survey.description}</p>
        <p className="mt-2 text-xs uppercase text-amber-700">Survey not yet published.</p>
      </article>
    );
  }

  if (survey.status === 'closed' && !submitted) {
    return (
      <article className="rounded-xl border border-gray-200 bg-gray-50 p-4 text-sm text-gray-600">
        <p className="font-bold text-gray-800">{survey.title}</p>
        <p className="mt-2 text-xs uppercase text-gray-500">Survey closed.</p>
      </article>
    );
  }

  function setAnswer(id, value) {
    setAnswers((prev) => ({ ...prev, [id]: value }));
  }

  function toggleMultipleChoice(questionId, option) {
    setAnswers((prev) => {
      const current = Array.isArray(prev[questionId]) ? prev[questionId] : [];
      const next = current.includes(option)
        ? current.filter((o) => o !== option)
        : [...current, option];
      return { ...prev, [questionId]: next };
    });
  }

  function setRanking(questionId, option, rank) {
    setAnswers((prev) => {
      const current = /** @type {Record<string, number>} */ (
        typeof prev[questionId] === 'object' && !Array.isArray(prev[questionId])
          ? prev[questionId]
          : {}
      );
      const next = { ...current };
      if (rank === '') {
        delete next[option];
      } else {
        next[option] = Number(rank);
      }
      return { ...prev, [questionId]: next };
    });
  }

  async function handleSubmit(event) {
    event.preventDefault();
    const missing = sorted.filter((q) => {
      if (!q.required) return false;
      const val = answers[q.id];
      if (q.type === 'multiple_choice') return !Array.isArray(val) || val.length === 0;
      if (q.type === 'ranking') {
        const ranks = val && typeof val === 'object' ? Object.keys(val) : [];
        return ranks.length < (q.options?.length ?? 0);
      }
      return val == null || val === '' || val === false;
    });

    if (missing.length > 0) {
      setError('Please complete all required questions.');
      return;
    }

    if (!participantId) {
      setError('Sign in to submit this survey.');
      return;
    }

    setSubmitting(true);
    try {
      await submitSurveyResponse(participantId, survey.id, answers, survey.dayId, sorted);
      completeSurvey(participantId, survey.id, answers, survey.dayId, sorted, survey);
      setSubmitted(true);
      setError('');
      onCompleted?.();
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <article className="rounded-xl border border-sky-200 bg-sky-50/30 p-4 sm:p-5">
      <div className="mb-4 flex items-start justify-between gap-2">
        <div>
          <h4 className="inline-flex items-center gap-2 font-bold text-gray-900">
            <ClipboardList size={18} className="text-sky-700" />
            {survey.title}
          </h4>
          <p className="mt-1 text-sm text-gray-600">{survey.description}</p>
        </div>
        {submitted ? (
          <span className="inline-flex shrink-0 items-center gap-1 text-xs font-bold text-green-700">
            <CheckCircle size={14} /> Submitted — updates Market Intelligence
          </span>
        ) : null}
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {sorted.map((q) => (
          <div key={q.id}>
            <label className="mb-1.5 block text-sm font-semibold text-gray-800">
              {q.prompt}
              {q.required ? <span className="text-[#8B0000]"> *</span> : null}
            </label>
            {renderSurveyField(
              q,
              answers[q.id],
              setAnswer,
              toggleMultipleChoice,
              setRanking,
              submitted,
            )}
          </div>
        ))}

        {error ? <p className="text-sm font-medium text-red-600">{error}</p> : null}

        {!submitted ? (
          <button
            type="submit"
            disabled={submitting}
            className="min-h-[44px] rounded-lg bg-sky-700 px-4 py-2 text-sm font-bold text-white hover:bg-sky-800 disabled:opacity-60"
          >
            {submitting ? 'Submitting…' : 'Submit survey'}
          </button>
        ) : (
          <p className="text-sm text-gray-600">
            Responses feed Market Intelligence in My Venture Blueprint.
          </p>
        )}
      </form>
    </article>
  );
}

/**
 * @param {SurveyQuestion} question
 * @param {unknown} value
 * @param {(id: string, val: unknown) => void} onChange
 * @param {(qid: string, opt: string) => void} toggleMulti
 * @param {(qid: string, opt: string, rank: string) => void} setRank
 * @param {boolean} disabled
 */
function renderSurveyField(question, value, onChange, toggleMulti, setRank, disabled) {
  const common =
    'w-full rounded-lg border border-gray-300 px-3 py-2 text-sm disabled:bg-gray-50 disabled:text-gray-600';

  switch (question.type) {
    case 'long_text':
      return (
        <textarea
          rows={4}
          className={common}
          value={/** @type {string} */ (value || '')}
          onChange={(e) => onChange(question.id, e.target.value)}
          disabled={disabled}
        />
      );
    case 'short_text':
      return (
        <input
          type="text"
          className={common}
          value={/** @type {string} */ (value || '')}
          onChange={(e) => onChange(question.id, e.target.value)}
          disabled={disabled}
        />
      );
    case 'rating':
      return (
        <div className="flex flex-wrap gap-2">
          {[1, 2, 3, 4, 5].map((n) => (
            <button
              key={n}
              type="button"
              disabled={disabled}
              onClick={() => onChange(question.id, n)}
              className={`min-h-[44px] min-w-[44px] rounded-lg border text-sm font-bold ${
                Number(value) === n
                  ? 'border-sky-700 bg-sky-50 text-sky-800'
                  : 'border-gray-300 bg-white text-gray-700'
              }`}
            >
              {n}
            </button>
          ))}
        </div>
      );
    case 'checkbox':
      return (
        <label className="flex min-h-[44px] cursor-pointer items-center gap-2 text-sm text-gray-700">
          <input
            type="checkbox"
            checked={Boolean(value)}
            onChange={(e) => onChange(question.id, e.target.checked)}
            disabled={disabled}
            className="h-4 w-4 rounded border-gray-300 text-sky-700"
          />
          Yes
        </label>
      );
    case 'single_choice':
      return (
        <div className="space-y-2">
          {(question.options ?? []).map((opt) => (
            <label
              key={opt}
              className="flex min-h-[44px] cursor-pointer items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 text-sm"
            >
              <input
                type="radio"
                name={question.id}
                checked={value === opt}
                onChange={() => onChange(question.id, opt)}
                disabled={disabled}
                className="text-sky-700"
              />
              {opt}
            </label>
          ))}
        </div>
      );
    case 'multiple_choice':
      return (
        <div className="space-y-2">
          {(question.options ?? []).map((opt) => (
            <label
              key={opt}
              className="flex min-h-[44px] cursor-pointer items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 text-sm"
            >
              <input
                type="checkbox"
                checked={Array.isArray(value) && value.includes(opt)}
                onChange={() => toggleMulti(question.id, opt)}
                disabled={disabled}
                className="rounded border-gray-300 text-sky-700"
              />
              {opt}
            </label>
          ))}
        </div>
      );
    case 'ranking':
      return (
        <div className="space-y-2">
          {(question.options ?? []).map((opt) => (
            <div
              key={opt}
              className="flex flex-wrap items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm"
            >
              <span className="min-w-0 flex-1 font-medium text-gray-800">{opt}</span>
              <select
                className="rounded-lg border border-gray-300 px-2 py-1 text-sm"
                value={
                  value && typeof value === 'object' && !Array.isArray(value)
                    ? String(value[opt] ?? '')
                    : ''
                }
                onChange={(e) => setRank(question.id, opt, e.target.value)}
                disabled={disabled}
              >
                <option value="">Rank…</option>
                {(question.options ?? []).map((_, idx) => (
                  <option key={idx + 1} value={String(idx + 1)}>
                    {idx + 1}
                  </option>
                ))}
              </select>
            </div>
          ))}
        </div>
      );
    default:
      return (
        <input
          type="text"
          className={common}
          value={/** @type {string} */ (value || '')}
          onChange={(e) => onChange(question.id, e.target.value)}
          disabled={disabled}
        />
      );
  }
}
