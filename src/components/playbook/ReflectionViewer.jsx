import { useState } from 'react';
import { BookMarked, CheckCircle } from 'lucide-react';
import {
  getReflectionSubmission,
  isReflectionCompleted,
  markReflectionCompleted,
} from '../../lib/playbookProgress.js';
import { isWithinCohortEditWindow } from '../../lib/portfolioEditWindow.js';

/**
 * @param {{
 *   reflection: { id: string, title: string, prompts: string[], dayId?: string },
 *   participantId?: string,
 *   onCompleted?: () => void,
 *   submitLabel?: string,
 *   savedMessage?: string,
 * }} props
 */
export function ReflectionViewer({
  reflection,
  participantId,
  onCompleted,
  submitLabel = 'Save reflection',
  savedMessage = 'Reflection recorded for mentor review.',
}) {
  const saved = participantId ? getReflectionSubmission(participantId, reflection.id) : null;
  const canReopen = isWithinCohortEditWindow();

  const [responses, setResponses] = useState(() => saved?.responses ?? {});
  const [submitted, setSubmitted] = useState(
    () => participantId && isReflectionCompleted(participantId, reflection.id),
  );
  const [editing, setEditing] = useState(false);
  const [error, setError] = useState('');

  const readOnly = submitted && !editing;

  function setResponse(prompt, value) {
    setResponses((prev) => ({ ...prev, [prompt]: value }));
  }

  function handleSubmit(event) {
    event.preventDefault();
    const missing = (reflection.prompts ?? []).filter((p) => !String(responses[p] || '').trim());
    if (missing.length > 0) {
      setError('Please respond to all reflection prompts.');
      return;
    }
    if (participantId) {
      markReflectionCompleted(participantId, reflection.id, responses, reflection.dayId, reflection);
    }
    setSubmitted(true);
    setEditing(false);
    setError('');
    onCompleted?.();
  }

  return (
    <article className="rounded-xl border border-amber-200 bg-amber-50/40 p-4 sm:p-5">
      <div className="mb-4 flex items-center justify-between gap-2">
        <h4 className="inline-flex items-center gap-2 font-bold text-gray-900">
          <BookMarked size={18} className="text-amber-700" />
          {reflection.title}
        </h4>
        {submitted && !editing ? (
          <span className="inline-flex items-center gap-1 text-xs font-bold text-green-700" role="status" aria-live="polite">
            <CheckCircle size={14} aria-hidden /> Saved
          </span>
        ) : null}
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {reflection.prompts?.map((prompt, index) => {
          const fieldId = `reflection-${reflection.id}-${index}`;
          return (
          <div key={prompt}>
            <label htmlFor={fieldId} className="mb-1.5 block text-sm font-semibold text-gray-800">
              {prompt}
            </label>
            <textarea
              id={fieldId}
              rows={3}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm disabled:bg-gray-50 disabled:text-gray-600"
              value={responses[prompt] || ''}
              onChange={(e) => setResponse(prompt, e.target.value)}
              disabled={readOnly}
            />
          </div>
        );
        })}

        {error ? <p className="text-sm font-medium text-red-600" role="alert">{error}</p> : null}

        {!submitted || editing ? (
          <button
            type="submit"
            className="min-h-[44px] rounded-lg bg-amber-800 px-4 py-2 text-sm font-bold text-white hover:bg-amber-900"
          >
            {submitted ? 'Save changes' : submitLabel}
          </button>
        ) : (
          <div className="space-y-2">
            <p className="text-sm text-gray-600">{savedMessage}</p>
            {canReopen ? (
              <button
                type="button"
                onClick={() => setEditing(true)}
                className="text-sm font-semibold text-spike hover:underline"
              >
                Edit reflection
              </button>
            ) : null}
          </div>
        )}
      </form>
    </article>
  );
}
