import { useState } from 'react';
import { Sparkles } from 'lucide-react';
import { saveThinkingShift, synthesizeThinkingShift } from '../../lib/customerDiscovery/week2DiscoveryService.js';

/**
 * End-of-task reflection — one question, optional AI shift synthesis.
 * @param {{
 *   participantId: string,
 *   taskId?: string,
 *   onSaved?: () => void,
 * }} props
 */
export function ThinkingShiftPrompt({ participantId, taskId = 'thinking', onSaved }) {
  const [response, setResponse] = useState('');
  const [beforeThought, setBeforeThought] = useState('');
  const [savedShift, setSavedShift] = useState(null);
  const [saving, setSaving] = useState(false);

  function handleSave() {
    if (!response.trim()) return;
    setSaving(true);
    try {
      const ai = synthesizeThinkingShift(beforeThought, response);
      const shift = saveThinkingShift(participantId, {
        response: response.trim(),
        taskId,
        prompt: 'What changed your thinking today?',
        aiFrom: ai.from,
        aiTo: ai.to,
      });
      setSavedShift(shift.thinkingShifts[shift.thinkingShifts.length - 1]);
      onSaved?.();
    } finally {
      setSaving(false);
    }
  }

  if (savedShift) {
    return (
      <div className="spike-surface space-y-4 animate-spike-fade-in">
        <p className="spike-label text-venture-discover">Thinking shift captured</p>
        <div className="space-y-3 text-sm">
          <div>
            <p className="text-xs font-semibold uppercase text-slate-400">Your thinking shifted from</p>
            <p className="mt-1 font-medium text-slate-700">&ldquo;{savedShift.aiFrom}&rdquo;</p>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase text-slate-400">To</p>
            <p className="mt-1 font-semibold text-slate-900">&ldquo;{savedShift.aiTo}&rdquo;</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="spike-surface space-y-5">
      <div>
        <p className="spike-label flex items-center gap-1.5">
          <Sparkles size={14} className="text-spike" aria-hidden />
          Learning moment
        </p>
        <h2 className="spike-thinking-prompt mt-2">What changed your thinking today?</h2>
      </div>

      <label className="block text-sm">
        <span className="mb-1 block text-xs font-medium text-slate-500">
          Optional — what did you believe before?
        </span>
        <input
          type="text"
          value={beforeThought}
          onChange={(e) => setBeforeThought(e.target.value)}
          placeholder="I thought…"
          className="w-full rounded-xl border-0 bg-slate-50 px-3 py-2.5 text-sm focus:ring-2 focus:ring-spike/30"
        />
      </label>

      <label className="block text-sm">
        <span className="mb-1 block text-xs font-medium text-slate-500">Your insight</span>
        <textarea
          rows={3}
          value={response}
          onChange={(e) => setResponse(e.target.value)}
          placeholder="Now I realize…"
          className="w-full rounded-xl border-0 bg-slate-50 px-3 py-2.5 text-sm focus:ring-2 focus:ring-spike/30"
        />
      </label>

      <button
        type="button"
        disabled={saving || !response.trim()}
        onClick={handleSave}
        className="spike-btn-primary w-full sm:w-auto disabled:opacity-50"
      >
        {saving ? 'Saving…' : 'Save shift'}
      </button>
    </div>
  );
}
