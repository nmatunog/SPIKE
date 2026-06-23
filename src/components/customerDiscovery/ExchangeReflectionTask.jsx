import { useState } from 'react';
import { getWeek2State, saveExchangeReflection } from '../../lib/customerDiscovery/week2DiscoveryService.js';

/**
 * Tuesday PM — Market Intelligence Exchange reflection.
 * @param {{ participantId: string, onSaved?: () => void }} props
 */
export function ExchangeReflectionTask({ participantId, onSaved }) {
  const prior = (getWeek2State(participantId).thinkingShifts ?? []).find((s) => s.taskId === 'exchange');
  const [response, setResponse] = useState(prior?.response ?? '');

  function persist(value) {
    setResponse(value);
    if (value.trim().length > 15) {
      saveExchangeReflection(participantId, value);
    }
  }

  return (
    <div className="space-y-6">
      <section className="spike-surface space-y-2">
        <p className="spike-label">Market Intelligence Exchange</p>
        <h2 className="text-xl font-bold text-slate-900">Midweek intelligence reflection</h2>
        <p className="text-sm text-slate-600">
          One interview is a story. Thirty interviews are evidence. What pattern are you beginning to notice?
        </p>
      </section>
      <textarea
        value={response}
        onChange={(e) => persist(e.target.value)}
        onBlur={() => onSaved?.()}
        rows={6}
        placeholder="What surprised you most? Which assumption changed? What quote stayed with you?"
        className="w-full rounded-xl border border-slate-200 p-4 text-sm focus:border-spike focus:outline-none focus:ring-1 focus:ring-spike"
      />
    </div>
  );
}
