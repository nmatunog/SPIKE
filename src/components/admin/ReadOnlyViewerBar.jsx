import { Eye } from 'lucide-react';

/** Sticky banner for temporary view-only admin accounts. */
export function ReadOnlyViewerBar() {
  return (
    <div
      className="border-b border-amber-300/80 bg-amber-100 px-4 py-2 text-center text-sm text-amber-950"
      role="status"
    >
      <p className="inline-flex flex-wrap items-center justify-center gap-2 font-medium">
        <Eye size={16} className="shrink-0" aria-hidden />
        <span>
          <strong>View-only admin</strong> — you can browse dashboards and reports, but cannot edit,
          create, or delete anything.
        </span>
      </p>
    </div>
  );
}
