import { useEffect, useState } from 'react';
import { ContentStudioPanel, ContentStudioShell, StatusBadge } from './ContentStudioShell.jsx';
import { fetchContentAssets } from '../../../lib/contentStudioService.js';

export function ContentStudioMediaPage() {
  const [assets, setAssets] = useState(/** @type {Array<Record<string, unknown>>} */ ([]));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchContentAssets()
      .then(setAssets)
      .catch(() => setAssets([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <ContentStudioShell>
      <ContentStudioPanel
        title="Media Library"
        description="Images, videos, PDFs, PPTX, templates, and logos — tagged by segment, week, day, and topic."
      >
        {loading ? <p className="text-sm text-slate-500">Loading…</p> : null}
        {!loading && assets.length === 0 ? (
          <p className="rounded-xl border border-dashed border-slate-200 bg-slate-50 px-4 py-8 text-center text-sm text-slate-600">
            No assets yet. Uploads will connect to Supabase Storage in a follow-up sprint slice.
          </p>
        ) : null}
        {!loading && assets.length ? (
          <div className="grid gap-3 sm:grid-cols-2">
            {assets.map((asset) => (
              <div key={String(asset.id)} className="rounded-xl border border-slate-200 p-4">
                <div className="flex items-start justify-between gap-2">
                  <p className="font-semibold text-slate-900">{String(asset.title)}</p>
                  <StatusBadge status={String(asset.status ?? 'draft')} />
                </div>
                <p className="mt-1 text-xs uppercase text-slate-500">{String(asset.asset_type)}</p>
                {asset.topic ? <p className="mt-2 text-sm text-slate-600">{String(asset.topic)}</p> : null}
              </div>
            ))}
          </div>
        ) : null}
      </ContentStudioPanel>
    </ContentStudioShell>
  );
}
