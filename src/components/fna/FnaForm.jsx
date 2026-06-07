import { useMemo, useState } from 'react';
import { suggestFnaGaps } from '../../lib/fnaGaps.js';
import { createFnaDraft, saveFna } from '../../lib/fnaService.js';

const STEPS = [
  { id: 'profile', label: 'Client profile' },
  { id: 'financials', label: 'Income & balance sheet' },
  { id: 'gaps', label: 'Protection & retirement gaps' },
  { id: 'recommendations', label: 'Recommendations' },
  { id: 'review', label: 'Review' },
];

/**
 * Reusable FNA form — shared with Client CRM in Sprint 06.
 * @param {{
 *   participantId: string,
 *   onSaved?: (record: object) => void,
 *   onCancel?: () => void,
 * }} props
 */
export function FnaForm({ participantId, onSaved, onCancel }) {
  const [step, setStep] = useState(0);
  const [form, setForm] = useState({
    clientName: '',
    clientAge: '',
    dependents: '0',
    income: '',
    assets: '',
    liabilities: '',
    protectionGap: '',
    retirementGap: '',
    notes: '',
    recommendations: [{ id: 'rec-1', title: '', description: '', priority: 1 }],
  });
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const gaps = useMemo(
    () =>
      suggestFnaGaps({
        clientAge: form.clientAge ? Number(form.clientAge) : null,
        income: form.income ? Number(form.income) : null,
        assets: form.assets ? Number(form.assets) : null,
        liabilities: form.liabilities ? Number(form.liabilities) : null,
      }),
    [form.clientAge, form.income, form.assets, form.liabilities],
  );

  function patch(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  function patchRecommendation(index, field, value) {
    setForm((prev) => {
      const list = [...prev.recommendations];
      list[index] = { ...list[index], [field]: value };
      return { ...prev, recommendations: list };
    });
  }

  function addRecommendation() {
    setForm((prev) => ({
      ...prev,
      recommendations: [
        ...prev.recommendations,
        { id: `rec-${crypto.randomUUID()}`, title: '', description: '', priority: 2 },
      ],
    }));
  }

  function validateStep() {
    if (step === 0 && !form.clientName.trim()) {
      setError('Client name is required.');
      return false;
    }
    setError('');
    return true;
  }

  function next() {
    if (!validateStep()) return;
    setStep((s) => Math.min(s + 1, STEPS.length - 1));
  }

  function back() {
    setError('');
    setStep((s) => Math.max(s - 1, 0));
  }

  async function handleSave(status) {
    if (!form.clientName.trim()) {
      setError('Client name is required.');
      return;
    }

    setSaving(true);
    try {
      const recommendations = form.recommendations
        .filter((r) => r.title.trim())
        .map((r, idx) => ({
          id: r.id,
          title: r.title.trim(),
          description: r.description,
          priority: r.priority ?? idx + 1,
        }));

      const draft = createFnaDraft(participantId, { clientName: form.clientName.trim() });
      const { record } = saveFna(participantId, draft.id, {
        clientName: form.clientName.trim(),
        clientAge: form.clientAge ? Number(form.clientAge) : null,
        dependents: Number(form.dependents) || 0,
        income: form.income ? Number(form.income) : null,
        assets: form.assets ? Number(form.assets) : null,
        liabilities: form.liabilities ? Number(form.liabilities) : null,
        protectionGap: form.protectionGap ? Number(form.protectionGap) : gaps.protectionGap,
        retirementGap: form.retirementGap ? Number(form.retirementGap) : gaps.retirementGap,
        notes: form.notes,
        status,
        recommendations,
      });
      onSaved?.(record);
    } finally {
      setSaving(false);
    }
  }

  const inputClass =
    'w-full rounded-lg border border-gray-300 px-3 py-2 text-sm disabled:bg-gray-50';

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm sm:p-5">
      <div className="mb-4 flex flex-wrap gap-2">
        {STEPS.map((s, idx) => (
          <span
            key={s.id}
            className={`rounded-full px-3 py-1 text-xs font-bold ${
              idx === step ? 'bg-[#8B0000] text-white' : 'bg-gray-100 text-gray-600'
            }`}
          >
            {idx + 1}. {s.label}
          </span>
        ))}
      </div>

      {step === 0 ? (
        <div className="space-y-3">
          <label className="block text-sm font-semibold text-gray-800">
            Client name <span className="text-[#8B0000]">*</span>
            <input
              className={`mt-1 ${inputClass}`}
              value={form.clientName}
              onChange={(e) => patch('clientName', e.target.value)}
            />
          </label>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block text-sm font-semibold text-gray-800">
              Age
              <input
                type="number"
                min={0}
                max={120}
                className={`mt-1 ${inputClass}`}
                value={form.clientAge}
                onChange={(e) => patch('clientAge', e.target.value)}
              />
            </label>
            <label className="block text-sm font-semibold text-gray-800">
              Dependents
              <input
                type="number"
                min={0}
                className={`mt-1 ${inputClass}`}
                value={form.dependents}
                onChange={(e) => patch('dependents', e.target.value)}
              />
            </label>
          </div>
        </div>
      ) : null}

      {step === 1 ? (
        <div className="grid gap-3 sm:grid-cols-3">
          {[
            ['income', 'Annual income'],
            ['assets', 'Total assets'],
            ['liabilities', 'Total liabilities'],
          ].map(([key, label]) => (
            <label key={key} className="block text-sm font-semibold text-gray-800">
              {label}
              <input
                type="number"
                min={0}
                className={`mt-1 ${inputClass}`}
                value={form[key]}
                onChange={(e) => patch(key, e.target.value)}
              />
            </label>
          ))}
        </div>
      ) : null}

      {step === 2 ? (
        <div className="space-y-3">
          <p className="text-sm text-gray-600">
            Suggested gaps update from financials. You may override for coaching scenarios.
          </p>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block text-sm font-semibold text-gray-800">
              Protection gap (suggested {gaps.protectionGap.toLocaleString()})
              <input
                type="number"
                min={0}
                className={`mt-1 ${inputClass}`}
                value={form.protectionGap || gaps.protectionGap}
                onChange={(e) => patch('protectionGap', e.target.value)}
              />
            </label>
            <label className="block text-sm font-semibold text-gray-800">
              Retirement gap (suggested {gaps.retirementGap.toLocaleString()})
              <input
                type="number"
                min={0}
                className={`mt-1 ${inputClass}`}
                value={form.retirementGap || gaps.retirementGap}
                onChange={(e) => patch('retirementGap', e.target.value)}
              />
            </label>
          </div>
        </div>
      ) : null}

      {step === 3 ? (
        <div className="space-y-3">
          {form.recommendations.map((rec, idx) => (
            <div key={rec.id} className="rounded-lg border border-gray-100 bg-gray-50 p-3">
              <input
                className={`mb-2 ${inputClass}`}
                placeholder="Recommendation title"
                value={rec.title}
                onChange={(e) => patchRecommendation(idx, 'title', e.target.value)}
              />
              <textarea
                rows={2}
                className={inputClass}
                placeholder="Description"
                value={rec.description}
                onChange={(e) => patchRecommendation(idx, 'description', e.target.value)}
              />
            </div>
          ))}
          <button
            type="button"
            onClick={addRecommendation}
            className="text-sm font-bold text-[#8B0000]"
          >
            + Add recommendation
          </button>
          <label className="block text-sm font-semibold text-gray-800">
            Session notes
            <textarea
              rows={3}
              className={`mt-1 ${inputClass}`}
              value={form.notes}
              onChange={(e) => patch('notes', e.target.value)}
            />
          </label>
        </div>
      ) : null}

      {step === 4 ? (
        <div className="space-y-2 text-sm text-gray-700">
          <p>
            <strong>Client:</strong> {form.clientName}
          </p>
          <p>
            <strong>Gaps:</strong> Protection ${Number(form.protectionGap || gaps.protectionGap).toLocaleString()} · Retirement $
            {Number(form.retirementGap || gaps.retirementGap).toLocaleString()}
          </p>
          <p>
            <strong>Recommendations:</strong>{' '}
            {form.recommendations.filter((r) => r.title.trim()).length || 0}
          </p>
        </div>
      ) : null}

      {error ? <p className="mt-3 text-sm font-medium text-red-600">{error}</p> : null}

      <div className="mt-5 flex flex-wrap gap-2">
        {onCancel ? (
          <button
            type="button"
            onClick={onCancel}
            className="min-h-[44px] rounded-lg border border-gray-300 px-4 py-2 text-sm font-bold text-gray-700"
          >
            Cancel
          </button>
        ) : null}
        {step > 0 ? (
          <button
            type="button"
            onClick={back}
            className="min-h-[44px] rounded-lg bg-gray-100 px-4 py-2 text-sm font-bold text-gray-800"
          >
            Back
          </button>
        ) : null}
        {step < STEPS.length - 1 ? (
          <button
            type="button"
            onClick={next}
            className="min-h-[44px] rounded-lg bg-[#8B0000] px-4 py-2 text-sm font-bold text-white"
          >
            Next
          </button>
        ) : (
          <>
            <button
              type="button"
              disabled={saving}
              onClick={() => handleSave('draft')}
              className="min-h-[44px] rounded-lg border border-gray-300 px-4 py-2 text-sm font-bold text-gray-800"
            >
              Save draft
            </button>
            <button
              type="button"
              disabled={saving}
              onClick={() => handleSave('completed')}
              className="min-h-[44px] rounded-lg bg-emerald-700 px-4 py-2 text-sm font-bold text-white"
            >
              {saving ? 'Saving…' : 'Complete FNA'}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
