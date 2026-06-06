/** @param {{ notes: string }} props */
export function SpeakerNotesPanel({ notes }) {
  if (!notes) return null;

  return (
    <aside className="rounded-xl border border-amber-200 bg-amber-50/80 p-4">
      <h5 className="mb-2 text-xs font-bold uppercase tracking-wider text-amber-900">
        Speaker notes
      </h5>
      <p className="text-sm leading-relaxed text-amber-950">{notes}</p>
    </aside>
  );
}
