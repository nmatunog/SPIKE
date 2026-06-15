import { useEffect, useState } from 'react';
import { AlertTriangle, CloudUpload } from 'lucide-react';
import { fetchCohortRemoteSyncStatus } from '../../lib/participantRemoteData.js';

/**
 * Shows how many interns have Day 1 work synced to Supabase (production store).
 * @param {{ interns: Array<{ id: string, name: string }> }} props
 */
export function FacultyCohortSyncPanel({ interns }) {
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    (async () => {
      const result = await fetchCohortRemoteSyncStatus(interns.map((i) => i.id));
      if (!cancelled) {
        setStatus(result);
        setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [interns]);

  if (loading) {
    return (
      <section className="spike-card text-sm text-slate-600">
        Checking Day 1 cloud sync status…
      </section>
    );
  }

  if (!status) return null;

  const allSynced = status.unsynced === 0 && status.total > 0;
  const noneSynced = status.synced === 0 && status.total > 0;

  return (
    <section
      className={`spike-card space-y-3 ${
        noneSynced
          ? 'border-amber-300 bg-amber-50'
          : allSynced
            ? 'border-emerald-200 bg-emerald-50/50'
            : 'border-sky-200 bg-sky-50/50'
      }`}
    >
      <div className="flex items-start gap-3">
        {noneSynced ? (
          <AlertTriangle className="mt-0.5 shrink-0 text-amber-700" size={20} />
        ) : (
          <CloudUpload className="mt-0.5 shrink-0 text-sky-700" size={20} />
        )}
        <div>
          <h3 className="text-sm font-semibold text-slate-900">Cloud sync (production)</h3>
          <p className="mt-1 text-sm text-slate-700">
            {status.synced}/{status.total} participants have work in Supabase (Day 1 builders, blueprint,
            playbook, surveys, canvas).
          </p>
          {noneSynced ? (
            <p className="mt-2 text-sm text-amber-900">
              Day 1 was saved on intern devices but not uploaded yet. Ask every intern to{' '}
              <strong>sign in once</strong> on phone or laptop — their work uploads automatically.
            </p>
          ) : status.unsynced > 0 ? (
            <p className="mt-2 text-sm text-slate-700">
              {status.unsynced} participant(s) still need to sign in to upload their Day 1 work.
            </p>
          ) : (
            <p className="mt-2 text-sm text-emerald-900">All participants synced — mentor views should show their outputs.</p>
          )}
        </div>
      </div>

      {status.unsynced > 0 ? (
        <ul className="max-h-40 overflow-y-auto rounded-lg border border-white/80 bg-white/70 text-sm">
          {status.participants
            .filter((p) => !p.hasRemoteData)
            .map((p) => {
              const intern = interns.find((i) => i.id === p.id);
              return (
                <li key={p.id} className="border-b border-slate-100 px-3 py-2 last:border-0">
                  {intern?.name ?? p.id} — not in cloud yet
                </li>
              );
            })}
        </ul>
      ) : null}
    </section>
  );
}
