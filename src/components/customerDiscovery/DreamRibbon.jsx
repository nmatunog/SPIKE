import { Heart } from 'lucide-react';
import { getDreamConnection } from '../../lib/customerDiscovery/week2DiscoveryService.js';

/**
 * Thin dream ribbon — emotional connection to Week 1 identity work.
 * @param {{ participantId: string, squadName?: string }} props
 */
export function DreamRibbon({ participantId, squadName }) {
  const { dream, connection } = getDreamConnection(participantId, squadName);
  const shortDream = dream.length > 72 ? `${dream.slice(0, 69)}…` : dream;

  return (
    <div className="mb-6 flex gap-3 rounded-xl bg-spike-muted/50 px-4 py-3">
      <Heart size={16} className="mt-0.5 shrink-0 text-spike" aria-hidden />
      <div className="min-w-0 text-sm">
        <p className="font-semibold text-slate-900">Your dream: {shortDream}</p>
        <p className="mt-0.5 text-slate-600">{connection}</p>
      </div>
    </div>
  );
}
