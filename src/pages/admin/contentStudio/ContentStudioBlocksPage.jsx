import { useEffect, useState } from 'react';
import { ContentStudioPanel, ContentStudioShell, StatusBadge } from './ContentStudioShell.jsx';
import { fetchContentBlocks } from '../../../lib/contentStudioService.js';

/**
 * @param {{
 *   title: string,
 *   description: string,
 *   blockType?: string,
 *   emptyHint?: string,
 * }} props
 */
export function ContentStudioBlocksPage({ title, description, blockType, emptyHint }) {
  const [rows, setRows] = useState(/** @type {Array<Record<string, unknown>>} */ ([]));
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    setLoading(true);
    fetchContentBlocks(blockType ? { blockType } : {})
      .then(setRows)
      .catch((err) => setError(String(err?.message ?? err)))
      .finally(() => setLoading(false));
  }, [blockType]);

  return (
    <ContentStudioShell>
      <ContentStudioPanel title={title} description={description}>
        {loading ? <p className="text-sm text-slate-500">Loading…</p> : null}
        {error ? <p className="text-sm text-red-700">{error}</p> : null}

        {!loading && !error && rows.length === 0 ? (
          <p className="rounded-xl border border-dashed border-slate-200 bg-slate-50 px-4 py-8 text-center text-sm text-slate-600">
            {emptyHint ?? 'No content blocks yet. Create one in Supabase or use Day Builder to attach blocks.'}
          </p>
        ) : null}

        {!loading && rows.length ? (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead>
                <tr className="border-b text-2xs uppercase text-slate-500">
                  <th className="py-2">Title</th>
                  <th className="py-2">Type</th>
                  <th className="py-2">Status</th>
                  <th className="py-2">Version</th>
                  <th className="py-2">Updated</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={String(row.id)} className="border-b border-slate-100">
                    <td className="py-3">
                      <p className="font-medium text-slate-900">{String(row.title)}</p>
                      {row.description ? (
                        <p className="text-xs text-slate-500">{String(row.description)}</p>
                      ) : null}
                    </td>
                    <td className="py-3 capitalize">{String(row.block_type ?? '').replace(/_/g, ' ')}</td>
                    <td className="py-3">
                      <StatusBadge status={String(row.status ?? 'draft')} />
                    </td>
                    <td className="py-3">{String(row.version ?? 1)}</td>
                    <td className="py-3 text-xs text-slate-500">
                      {row.updated_at ? new Date(String(row.updated_at)).toLocaleDateString() : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : null}
      </ContentStudioPanel>
    </ContentStudioShell>
  );
}
