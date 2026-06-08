import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { ChevronDown, ChevronUp, Save } from 'lucide-react';
import { ContentStudioPanel, ContentStudioShell, StatusBadge } from './ContentStudioShell.jsx';
import { DAY_TEMPLATE_SECTIONS } from '../../../lib/contentStudioConstants.js';
import {
  fetchContentBlocks,
  fetchDaySequence,
  loadCurriculumTreeForStudio,
  saveDaySequence,
} from '../../../lib/contentStudioService.js';

export function ContentStudioDayBuilderPage() {
  const [params] = useSearchParams();
  const [tree, setTree] = useState(null);
  const [selectedDaySlug, setSelectedDaySlug] = useState(params.get('day') ?? '');
  const [sequence, setSequence] = useState(/** @type {Array<{ id: string, title?: string, block_type?: string, status?: string }>} */ ([]));
  const [library, setLibrary] = useState(/** @type {Array<{ id: string, title: string, block_type: string }>} */ ([]));
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    loadCurriculumTreeForStudio().then((data) => {
      setTree(data);
      setSelectedDaySlug((current) => current || String(data.days?.[0]?.slug ?? ''));
    });
    fetchContentBlocks().then(setLibrary).catch(() => setLibrary([]));
  }, []);

  useEffect(() => {
    if (!selectedDaySlug) return;
    fetchDaySequence(selectedDaySlug)
      .then(setSequence)
      .catch(() => setSequence([]));
  }, [selectedDaySlug]);

  const selectedDay = tree?.days?.find((d) => d.slug === selectedDaySlug);

  function moveBlock(index, direction) {
    const next = [...sequence];
    const target = index + direction;
    if (target < 0 || target >= next.length) return;
    [next[index], next[target]] = [next[target], next[index]];
    setSequence(next);
  }

  function addBlock(blockId) {
    if (sequence.some((b) => b.id === blockId)) return;
    const block = library.find((b) => b.id === blockId);
    if (!block) return;
    setSequence([...sequence, block]);
  }

  function removeBlock(blockId) {
    setSequence(sequence.filter((b) => b.id !== blockId));
  }

  async function handleSave() {
    if (!selectedDaySlug) return;
    setSaving(true);
    setMessage('');
    try {
      await saveDaySequence(
        selectedDaySlug,
        sequence.map((b) => b.id),
      );
      setMessage('Day sequence saved.');
    } catch (err) {
      setMessage(String(err?.message ?? 'Save failed.'));
    } finally {
      setSaving(false);
    }
  }

  return (
    <ContentStudioShell>
      <ContentStudioPanel
        title="Day Builder"
        description="Assemble presentations, activities, worksheets, surveys, and assessments into a complete day."
      >
        <div className="grid gap-4 lg:grid-cols-2">
          <label className="block text-sm">
            <span className="mb-1 block font-semibold text-slate-700">Select day</span>
            <select
              className="w-full rounded-xl border border-slate-200 px-3 py-2"
              value={selectedDaySlug}
              onChange={(e) => setSelectedDaySlug(e.target.value)}
            >
              {(tree?.days ?? []).map((day) => (
                <option key={day.id} value={day.slug ?? ''}>
                  Day {day.day_number}: {day.theme || day.title}
                </option>
              ))}
            </select>
          </label>

          {selectedDay ? (
            <div className="rounded-xl bg-slate-50 px-4 py-3 text-sm">
              <p className="font-semibold text-slate-800">{selectedDay.theme || selectedDay.title}</p>
              <p className="mt-1 text-slate-600">{selectedDay.description || 'No description yet.'}</p>
              <div className="mt-2">
                <StatusBadge status={String(selectedDay.status ?? 'draft')} />
              </div>
            </div>
          ) : null}
        </div>

        <div className="rounded-xl border border-slate-200 bg-slate-50/80 p-4">
          <p className="mb-2 text-xs font-bold uppercase tracking-wide text-slate-500">Day template</p>
          <div className="flex flex-wrap gap-2">
            {DAY_TEMPLATE_SECTIONS.map((section) => (
              <span
                key={section}
                className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-medium text-slate-700"
              >
                {section}
              </span>
            ))}
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1fr_280px]">
          <div>
            <h3 className="mb-2 text-sm font-semibold text-slate-800">Day sequence</h3>
            {sequence.length === 0 ? (
              <p className="rounded-xl border border-dashed border-slate-200 px-4 py-6 text-sm text-slate-500">
                No blocks yet — add from the library →
              </p>
            ) : (
              <ul className="space-y-2">
                {sequence.map((block, index) => (
                  <li
                    key={block.id}
                    className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2"
                  >
                    <span className="w-6 text-xs font-bold text-slate-400">{index + 1}</span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-slate-900">{block.title}</p>
                      <p className="text-2xs uppercase text-slate-500">{block.block_type}</p>
                    </div>
                    <button type="button" onClick={() => moveBlock(index, -1)} className="rounded p-1 hover:bg-slate-100">
                      <ChevronUp size={16} />
                    </button>
                    <button type="button" onClick={() => moveBlock(index, 1)} className="rounded p-1 hover:bg-slate-100">
                      <ChevronDown size={16} />
                    </button>
                    <button
                      type="button"
                      onClick={() => removeBlock(block.id)}
                      className="text-xs font-semibold text-red-700"
                    >
                      Remove
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div>
            <h3 className="mb-2 text-sm font-semibold text-slate-800">Block library</h3>
            <ul className="max-h-80 space-y-2 overflow-y-auto">
              {library.map((block) => (
                <li key={block.id} className="rounded-lg border border-slate-200 bg-white px-3 py-2">
                  <p className="text-sm font-medium text-slate-900">{block.title}</p>
                  <p className="text-2xs uppercase text-slate-500">{block.block_type}</p>
                  <button
                    type="button"
                    onClick={() => addBlock(block.id)}
                    className="mt-1 text-xs font-bold text-spike underline hover:no-underline"
                  >
                    Add to day
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 border-t border-slate-200 pt-4">
          <button type="button" onClick={handleSave} disabled={saving || !selectedDaySlug} className="spike-btn-primary">
            <Save size={16} className="mr-2 inline" />
            {saving ? 'Saving…' : 'Save day sequence'}
          </button>
          {message ? <p className="text-sm text-slate-600">{message}</p> : null}
        </div>
      </ContentStudioPanel>
    </ContentStudioShell>
  );
}
