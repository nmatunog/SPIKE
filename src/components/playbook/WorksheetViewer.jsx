import { useMemo, useState } from 'react';
import { CheckCircle } from 'lucide-react';
import { completeWorksheet, getWorksheetSubmission, isWorksheetCompleted } from '../../lib/playbookProgress.js';
import { isWithinCohortEditWindow } from '../../lib/portfolioEditWindow.js';

/**
 * @param {{
 *   worksheet: { id: string, dayId?: string, title: string, questionIds: string[] },
 *   questions: Array<{ id: string, prompt: string, type: string, required: boolean }>,
 *   participantId?: string,
 *   onCompleted?: () => void,
 * }} props
 */
export function WorksheetViewer({ worksheet, questions, participantId, onCompleted }) {
  const sorted = useMemo(
    () => [...questions].sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0)),
    [questions],
  );

  const saved = participantId ? getWorksheetSubmission(participantId, worksheet.id) : null;
  const canReopen = isWithinCohortEditWindow();

  const [answers, setAnswers] = useState(() => saved?.answers ?? {});
  const [submitted, setSubmitted] = useState(
    () => participantId && isWorksheetCompleted(participantId, worksheet.id),
  );
  const [editing, setEditing] = useState(false);
  const [error, setError] = useState('');

  const readOnly = submitted && !editing;

  function setAnswer(id, value) {
    setAnswers((prev) => ({ ...prev, [id]: value }));
  }

  function handleSubmit(event) {
    event.preventDefault();
    const missing = sorted.filter((q) => q.required && !answers[q.id] && answers[q.id] !== 0);
    if (missing.length > 0) {
      setError('Please complete all required fields.');
      return;
    }
    if (participantId) {
      completeWorksheet(participantId, worksheet.id, answers, worksheet.dayId, sorted);
    }
    setSubmitted(true);
    setEditing(false);
    setError('');
    onCompleted?.();
  }

  return (
    <article className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm sm:p-5">
      <div className="mb-4 flex items-center justify-between gap-2">
        <h4 className="font-bold text-gray-900">{worksheet.title}</h4>
        {submitted && !editing ? (
          <span className="inline-flex items-center gap-1 text-xs font-bold text-green-700" role="status" aria-live="polite">
            <CheckCircle size={14} aria-hidden /> Submitted — updates Venture Blueprint
          </span>
        ) : null}
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {sorted.map((q) => {
          const fieldId = `worksheet-${worksheet.id}-${q.id}`;
          return (
          <div key={q.id}>
            <label htmlFor={fieldId} className="mb-1.5 block text-sm font-semibold text-gray-800">
              {q.prompt}
              {q.required ? <span className="text-[#8B0000]"> *</span> : null}
            </label>
            {renderField(q, fieldId, answers[q.id], (val) => setAnswer(q.id, val), readOnly)}
          </div>
        );
        })}

        {error ? <p className="text-sm font-medium text-red-600" role="alert">{error}</p> : null}

        {!submitted || editing ? (
          <button
            type="submit"
            className="min-h-[44px] rounded-lg bg-[#8B0000] px-4 py-2 text-sm font-bold text-white hover:bg-[#6B0000]"
          >
            {submitted ? 'Save changes' : 'Submit worksheet'}
          </button>
        ) : (
          <div className="space-y-2">
            <p className="text-sm text-gray-600">
              Your responses contribute to Ambition &amp; Purpose in My Venture Blueprint.
            </p>
            {canReopen ? (
              <button
                type="button"
                onClick={() => setEditing(true)}
                className="text-sm font-semibold text-spike hover:underline"
              >
                Edit responses
              </button>
            ) : null}
          </div>
        )}
      </form>
    </article>
  );
}

function renderField(question, fieldId, value, onChange, disabled) {
  const common =
    'w-full rounded-lg border border-gray-300 px-3 py-2 text-sm disabled:bg-gray-50 disabled:text-gray-600';

  switch (question.type) {
    case 'long_text':
      return (
        <textarea
          id={fieldId}
          rows={4}
          className={common}
          value={value || ''}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
        />
      );
    case 'rating':
      return (
        <div className="flex flex-wrap gap-2" role="radiogroup" aria-labelledby={fieldId}>
          <span id={fieldId} className="sr-only">{question.prompt} rating</span>
          {[1, 2, 3, 4, 5].map((n) => (
            <button
              key={n}
              type="button"
              disabled={disabled}
              onClick={() => onChange(n)}
              aria-pressed={Number(value) === n}
              className={`min-h-[44px] min-w-[44px] rounded-lg border text-sm font-bold ${
                Number(value) === n
                  ? 'border-[#8B0000] bg-red-50 text-[#8B0000]'
                  : 'border-gray-300 bg-white text-gray-700'
              }`}
            >
              <span className="sr-only">Rating {n} of 5</span>
              <span aria-hidden>{n}</span>
            </button>
          ))}
        </div>
      );
    case 'checkbox':
      return (
        <label className="flex min-h-[44px] cursor-pointer items-center gap-2 text-sm text-gray-700">
          <input
            id={fieldId}
            type="checkbox"
            checked={Boolean(value)}
            onChange={(e) => onChange(e.target.checked)}
            disabled={disabled}
            className="h-4 w-4 rounded border-gray-300 text-[#8B0000]"
          />
          Yes
        </label>
      );
    case 'file_upload':
      return (
        <input
          id={fieldId}
          type="file"
          aria-label={question.prompt}
          className="block w-full text-sm text-gray-600 file:mr-3 file:rounded-lg file:border-0 file:bg-gray-100 file:px-3 file:py-2 file:text-sm file:font-bold"
          disabled={disabled}
          onChange={(e) => onChange(e.target.files?.[0]?.name || '')}
        />
      );
    case 'short_text':
    default:
      return (
        <input
          id={fieldId}
          type="text"
          className={common}
          value={value || ''}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
        />
      );
  }
}
