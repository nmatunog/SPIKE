import { useEffect, useMemo, useState } from 'react';
import { Cloud, CloudOff, Loader2 } from 'lucide-react';
import { formatWeek2SyncTime, getWeek2SyncMeta } from '../../lib/customerDiscovery/week2SyncStatus.js';

/**
 * Shows last local save and cloud sync times for Week 2 discovery tasks.
 * @param {{ participantId: string, syncing?: boolean, refreshKey?: number, className?: string }} props
 */
export function Week2SyncStatus({ participantId, syncing = false, refreshKey = 0, className = '' }) {
  const [, pollTick] = useState(0);
  const meta = useMemo(() => getWeek2SyncMeta(participantId), [participantId, refreshKey, pollTick]);

  useEffect(() => {
    if (!meta.pendingCloud || syncing) return undefined;
    const id = window.setInterval(() => pollTick((n) => n + 1), 2000);
    return () => window.clearInterval(id);
  }, [meta.pendingCloud, syncing]);

  const savedLabel = formatWeek2SyncTime(meta.savedAt);
  const cloudLabel = formatWeek2SyncTime(meta.cloudSyncedAt);

  let statusText = 'Not saved yet';
  let tone = 'text-slate-500';
  let Icon = CloudOff;

  if (syncing || meta.pendingCloud) {
    statusText = meta.savedAt
      ? `Saving… last saved ${savedLabel}`
      : 'Saving…';
    tone = 'text-amber-700';
    Icon = Loader2;
  } else if (meta.cloudSyncedAt && meta.savedAt) {
    statusText = `Last synced ${cloudLabel} (saved ${savedLabel})`;
    tone = 'text-emerald-700';
    Icon = Cloud;
  } else if (meta.savedAt) {
    statusText = `Saved on device ${savedLabel} · cloud sync pending`;
    tone = 'text-amber-700';
    Icon = CloudOff;
  }

  return (
    <p className={`flex items-start gap-1.5 text-xs leading-snug ${tone} ${className}`.trim()}>
      <Icon size={14} className={`mt-0.5 shrink-0 ${syncing || meta.pendingCloud ? 'animate-spin' : ''}`} aria-hidden />
      <span>{statusText}</span>
    </p>
  );
}
