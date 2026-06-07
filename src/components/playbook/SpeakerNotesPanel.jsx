/** @param {{ notes: string }} props */
export function SpeakerNotesPanel({ notes }) {
  if (!notes) return null;

  return (
    <aside className="rounded-xl border border-amber-200 bg-amber-50/80 p-4 lg:p-5 2xl:p-6">
      <h5 className="mb-2 text-xs font-semibold uppercase tracking-wider text-amber-900 lg:text-sm">
        Speaker notes
      </h5>
      <p className="text-sm leading-relaxed text-amber-950 lg:text-base 2xl:text-lg 2xl:leading-8">
        {notes}
      </p>
    </aside>
  );
}
