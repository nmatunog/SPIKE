import { Link } from 'react-router-dom';
import { Eye } from 'lucide-react';
import { ROUTES } from '../../routes/paths.js';

/**
 * Banner shown when a coach previews the RA-SPIKE playbook (read-only).
 */
export function RaSpikeCoachPreviewBar() {
  return (
    <div className="border-b border-amber-200 bg-amber-50 px-4 py-2.5 text-sm text-amber-950">
      <div className="mx-auto flex max-w-3xl flex-wrap items-center justify-between gap-2">
        <p className="inline-flex items-center gap-2 font-medium">
          <Eye size={16} aria-hidden className="shrink-0" />
          Coach preview — browse week content; rookies complete assignments in their own accounts.
        </p>
        <Link
          to={ROUTES.programCoachRaSpike}
          className="font-semibold text-spike hover:underline"
        >
          Back to Coach hub
        </Link>
      </div>
    </div>
  );
}
