import { useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { getWeek2State, saveAssumptions } from '../../lib/customerDiscovery/week2DiscoveryService.js';

/**
 * @param {{ participantId: string, onSaved?: () => void }} props
 */
export function AssumptionsTask({ participantId, onSaved }) {
  const initial = getWeek2State(participantId).assumptions ?? [];
  const [rows, setRows] = useState(
    initial.length
      ? initial
      : [
          { id: 'a-1', belief: '', priority: 'High' },
          { id: 'a-2', belief: '', priority: 'Medium' },
        ],
  );

  function persist(next) {
    setRows(next);
    saveAssumptions(participantId, next);
    onSaved?.();
  }

  function updateRow(id, belief) {
    persist(rows.map((r) => (r.id === id ? { ...r, belief } : r)));
  }

  function addRow() {
    if (rows.length >= 6) return;
    persist([...rows, { id: `a-${Date.now()}`, belief: '', priority: 'Medium' }]);
  }

  function removeRow(id) {
    if (rows.length <= 2) return;
    persist(rows.filter((r) => r.id !== id));
  }

  const filled = rows.filter((r) => String(r.belief ?? '').trim().length > 5).length;

  return (
    <div className="space-y-6">
      <section className="spike-surface space-y-2">
        <p className="spike-label">Research studio</p>
        <h2 className="text-xl font-bold text-slate-900">Identify your assumptions</h2>
        <p className="text-sm text-slate-600">
          Assumptions are not evidence. List what your squad believes — then test it in the field.
        </p>
        <p className="text-xs font-semibold tabular-nums text-spike">{filled} / 2 minimum</p>
        <p className="text-xs text-slate-500">Add, edit, or remove assumptions anytime — changes save automatically.</p>
      </section>
      <ul className="space-y-3">
        {rows.map((row, idx) => (
          <li key={row.id} className="spike-surface flex gap-2">
            <span className="mt-3 text-xs font-bold text-slate-400">{idx + 1}</span>
            <input
              type="text"
              value={row.belief}
              onChange={(e) => updateRow(row.id, e.target.value)}
              placeholder="We assume our customers…"
              className="min-w-0 flex-1 border-0 bg-transparent py-3 text-sm font-medium text-slate-900 focus:outline-none"
            />
            <button type="button" onClick={() => removeRow(row.id)} className="p-2 text-slate-400 hover:text-red-600">
              <Trash2 size={16} />
            </button>
          </li>
        ))}
      </ul>
      <button type="button" onClick={addRow} className="spike-btn-secondary inline-flex text-sm">
        <Plus size={16} /> Add assumption
      </button>
    </div>
  );
}
