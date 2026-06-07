import { useState } from 'react';
import { BookMarked, CheckCircle } from 'lucide-react';
import {
  isReflectionCompleted,
  markReflectionCompleted,
} from '../../lib/playbookProgress.js';

/**
 * @param {{
 *   reflection: { id: string, title: string, prompts: string[] },
 *   participantId?: string,
 *   onCompleted?: () => void,
 * }} props
 */
export function ReflectionViewer({ reflection, participantId, onCompleted }) {
  const [responses, setResponses] = useState({});
  const [submitted, setSubmitted] = useState(
    () => participantId && isReflectionCompleted(participantId, reflection.id),
  );
  const [error, setError] = useState('');

  function setResponse(prompt, value) {
    setResponses((prev) => ({ ...prev, [prompt]: value }));
  }

  function handleSubmit(event) {
    event.preventDefault();
    const missing = reflection.prompts.filter((p) => !String(responses[p] || '').trim());
    if (missing.length > 0) {
      setError('Please respond to all reflection prompts.');
      return;
    }
    if (participantId) {
      markReflectionCompleted(participantId, reflection.id, responses, reflection.dayId, reflection);
    }
    setSubmitted(true);
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
        {submitted ? (
          <span className="inline-flex items-center gap-1 text-xs font-bold text-green-700">
            <CheckCircle size={14} /> Saved
          </span>
        ) : null}
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {reflection.prompts.map((prompt) => (
          <div key={prompt}>
            <label className="mb-1.5 block text-sm font-semibold text-gray-800">{prompt}</label>
            <textarea
              rows={3}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm disabled:bg-gray-50"
              value={responses[prompt] || ''}
              onChange={(e) => setResponse(prompt, e.target.value)}
              disabled={submitted}
            />
          </div>
        ))}

        {error ? <p className="text-sm font-medium text-red-600">{error}</p> : null}

        {!submitted ? (
          <button
            type="submit"
            className="min-h-[44px] rounded-lg bg-amber-700 px-4 py-2 text-sm font-bold text-white hover:bg-amber-800"
          >
            Save reflection
          </button>
        ) : (
          <p className="text-sm text-gray-600">Reflection recorded for mentor review.</p>
        )}
      </form>
    </article>
  );
}
