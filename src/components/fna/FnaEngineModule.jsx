import { useState } from 'react';
import { FileText, Plus } from 'lucide-react';
import { FnaForm } from './FnaForm.jsx';
import { listFnas, updateFnaStatus } from '../../lib/fnaService.js';

/**
 * @param {{ participantId: string, onUpdated?: () => void }} props
 */
export function FnaEngineModule({ participantId, onUpdated }) {
  const [showForm, setShowForm] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  void refreshKey;
  const fnas = listFnas(participantId);

  function refresh() {
    setRefreshKey((k) => k + 1);
    onUpdated?.();
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h4 className="inline-flex items-center gap-2 font-bold text-gray-900">
          <FileText size={18} className="text-emerald-700" />
          Financial Needs Analyses
        </h4>
        {!showForm ? (
          <button
            type="button"
            onClick={() => setShowForm(true)}
            className="inline-flex min-h-[44px] items-center gap-1 rounded-lg bg-emerald-700 px-4 py-2 text-sm font-bold text-white"
          >
            <Plus size={16} /> New FNA
          </button>
        ) : null}
      </div>

      {showForm ? (
        <FnaForm
          participantId={participantId}
          onSaved={() => {
            setShowForm(false);
            refresh();
          }}
          onCancel={() => setShowForm(false)}
        />
      ) : null}

      {fnas.length === 0 ? (
        <p className="rounded-lg border border-dashed border-gray-200 bg-gray-50 p-4 text-sm text-gray-600">
          No FNAs yet. Complete an FNA to populate your Client Growth funnel and Blueprint Advisor
          Startup portfolio section.
        </p>
      ) : (
        <ul className="space-y-3">
          {fnas.map((fna) => (
            <li
              key={fna.id}
              className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm"
            >
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <p className="font-bold text-gray-900">{fna.clientName}</p>
                  <p className="mt-1 text-xs text-gray-500">
                    Protection gap ${Number(fna.protectionGap ?? 0).toLocaleString()} · Retirement gap $
                    {Number(fna.retirementGap ?? 0).toLocaleString()}
                  </p>
                </div>
                <span className="rounded-full bg-gray-100 px-2.5 py-1 text-xs font-bold uppercase text-gray-700">
                  {fna.status}
                </span>
              </div>
              {fna.status === 'completed' ? (
                <button
                  type="button"
                  onClick={() => {
                    updateFnaStatus(participantId, fna.id, 'presented');
                    refresh();
                  }}
                  className="mt-3 text-xs font-bold text-[#8B0000]"
                >
                  Mark presented →
                </button>
              ) : null}
              {fna.status === 'presented' ? (
                <button
                  type="button"
                  onClick={() => {
                    updateFnaStatus(participantId, fna.id, 'implemented');
                    refresh();
                  }}
                  className="mt-3 text-xs font-bold text-emerald-700"
                >
                  Mark issued / implemented →
                </button>
              ) : null}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
