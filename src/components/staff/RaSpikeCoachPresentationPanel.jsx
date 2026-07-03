import { useMemo, useState } from 'react';
import { PresentationViewer } from '../playbook/PresentationViewer.jsx';
import {
  getRaSpikeCoachPresentation,
  getRaSpikeDayContent,
  listRaSpikeCoachPresentations,
} from '../../lib/raSpikeContentLoader.js';

/**
 * Coach presentation materials for RA-SPIKE weeks (Day 1 decks).
 */
export function RaSpikeCoachPresentationPanel() {
  const decks = useMemo(() => listRaSpikeCoachPresentations(), []);
  const [selectedKey, setSelectedKey] = useState(() =>
    decks[0] ? `${decks[0].week}-${decks[0].day}` : '',
  );

  const selected = useMemo(() => {
    const [week, day] = selectedKey.split('-').map(Number);
    if (!week || !day) return null;
    const presentation = getRaSpikeCoachPresentation(week, day);
    const dayMeta = getRaSpikeDayContent(week, day);
    if (!presentation) return null;
    return { week, day, presentation, dayMeta };
  }, [selectedKey]);

  if (!decks.length) {
    return (
      <section className="rounded-2xl border border-slate-200 bg-white p-5">
        <h2 className="text-lg font-semibold text-slate-900">Coach presentation materials</h2>
        <p className="mt-2 text-sm text-slate-600">
          No RA-SPIKE coach decks imported yet.
        </p>
      </section>
    );
  }

  return (
    <section className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5">
      <header className="space-y-1">
        <h2 className="text-lg font-semibold text-slate-900">Coach presentation materials</h2>
        <p className="text-sm text-slate-600">
          Facilitator decks for classroom sessions. Download the PDF or present slide-by-slide with notes.
        </p>
      </header>

      <label className="block text-sm font-medium text-slate-700">
        Deck
        <select
          className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
          value={selectedKey}
          onChange={(e) => setSelectedKey(e.target.value)}
        >
          {decks.map((d) => (
            <option key={`${d.week}-${d.day}`} value={`${d.week}-${d.day}`}>
              Week {d.week} Day {d.day} — {d.title} ({d.slideCount} slides)
            </option>
          ))}
        </select>
      </label>

      {selected?.dayMeta ? (
        <div className="rounded-xl border border-spike/20 bg-spike-muted/30 px-4 py-3 text-sm text-slate-700">
          <p className="font-semibold text-slate-900">{selected.dayMeta.title}</p>
          {selected.dayMeta.summary ? (
            <p className="mt-1 text-slate-600">{selected.dayMeta.summary}</p>
          ) : null}
          {Array.isArray(selected.dayMeta.agenda) && selected.dayMeta.agenda.length ? (
            <ol className="mt-3 list-decimal space-y-1 pl-5">
              {selected.dayMeta.agenda.map((item) => (
                <li key={`${item.item}-${item.minutes}`}>
                  <span className="font-medium text-slate-800">{item.minutes} min</span>
                  {' — '}
                  {item.item}
                </li>
              ))}
            </ol>
          ) : null}
        </div>
      ) : null}

      {selected?.presentation ? (
        <PresentationViewer
          presentation={selected.presentation.presentation}
          slides={selected.presentation.slides}
          facultyMode
        />
      ) : null}
    </section>
  );
}
