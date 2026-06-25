import { useEffect, useState } from 'react';
import { Copy, Loader2, Users, X } from 'lucide-react';
import { hydrateSquadWeek2Discovery } from '../../lib/customerDiscovery/week2DiscoverySync.js';
import {
  adoptSquadDiscoveryFromMember,
  deriveSquadDataAdoptOffer,
  dismissSquadDataAdoptPrompt,
  isWeek2DiscoveryEmpty,
} from '../../lib/customerDiscovery/week2SquadDataAdoptService.js';

/**
 * Nudge interns to adopt the squadmate save with the most Week 2 fields filled.
 * @param {{
 *   participantId: string,
 *   memberNames?: Record<string, string>,
 *   onAdopted?: () => void,
 * }} props
 */
export function SquadDataAdoptPrompt({ participantId, memberNames = {}, onAdopted }) {
  const [syncing, setSyncing] = useState(true);
  const [offer, setOffer] = useState(null);
  const [adopting, setAdopting] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  const memberKey = Object.entries(memberNames).map(([id, name]) => `${id}:${name}`).join('|');

  useEffect(() => {
    let cancelled = false;
    setSyncing(true);
    void hydrateSquadWeek2Discovery(participantId)
      .catch(() => {})
      .finally(() => {
        if (cancelled) return;
        setSyncing(false);
        if (isWeek2DiscoveryEmpty(participantId)) {
          setOffer(null);
          return;
        }
        setOffer(deriveSquadDataAdoptOffer(participantId, memberNames));
      });
    return () => {
      cancelled = true;
    };
  }, [participantId, memberKey]);

  if (syncing || dismissed || !offer) return null;

  async function handleAdopt() {
    setAdopting(true);
    try {
      adoptSquadDiscoveryFromMember(participantId, offer.sourceMemberId);
      setOffer(null);
      onAdopted?.();
    } finally {
      setAdopting(false);
    }
  }

  function handleDismiss() {
    dismissSquadDataAdoptPrompt(participantId, offer.sourceMemberId, offer.richestFieldCount);
    setDismissed(true);
  }

  return (
    <section className="rounded-xl border border-amber-200 bg-gradient-to-r from-amber-50 to-orange-50/80 p-4 shadow-sm">
      <div className="flex items-start gap-3">
        <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-amber-100 text-amber-800">
          <Users size={18} aria-hidden />
        </span>
        <div className="min-w-0 flex-1 space-y-3">
          <div>
            <p className="text-sm font-bold text-amber-950">Squad work is shared — catch up in one tap</p>
            <p className="mt-1 text-sm text-amber-900/90">
              <strong>{offer.sourceLabel}</strong> has the most Week 2 data saved (
              {offer.richestFilled}/{offer.selfTotal} mission steps · {offer.richestFieldCount} filled fields).
              You have {offer.selfFilled}/{offer.selfTotal} steps · {offer.selfFieldCount} fields.
              Adopt their entries for mission fields, interviews, and reflections — then edit anything that needs your name on it.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => void handleAdopt()}
              disabled={adopting}
              className="inline-flex min-h-[40px] items-center gap-2 rounded-lg bg-spike px-4 py-2 text-sm font-semibold text-white hover:bg-spike-light disabled:opacity-60"
            >
              {adopting ? <Loader2 size={16} className="animate-spin" /> : <Copy size={16} />}
              Adopt squad&apos;s fullest save
            </button>
            <button
              type="button"
              onClick={handleDismiss}
              className="inline-flex min-h-[40px] items-center gap-1.5 rounded-lg border border-amber-200 bg-white/80 px-3 py-2 text-sm font-medium text-amber-900 hover:bg-white"
            >
              <X size={14} aria-hidden />
              Not now
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
