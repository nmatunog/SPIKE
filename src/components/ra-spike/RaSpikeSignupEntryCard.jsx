import { memo } from 'react';
import { raSpikeRookieEntryHref } from '../../routes/paths.js';

/**
 * Shown on the SPIKE Internship welcome page — rookies must sign up under /ra-spike/
 * (separate app + database). Avoids the legacy batch-code signup on the main deploy.
 */
export const RaSpikeSignupEntryCard = memo(function RaSpikeSignupEntryCard() {
  const href = raSpikeRookieEntryHref();

  return (
    <div className="w-full rounded-2xl border border-spike/25 bg-gradient-to-b from-spike-muted/40 to-white p-4">
      <p className="text-sm font-bold text-slate-900">Join RA-SPIKE™ Rookie Academy</p>
      <p className="mt-1 text-xs leading-relaxed text-slate-600">
        RA-SPIKE signup lives on its own portal page — not here. No batch code or invite code needed.
      </p>
      <a href={href} className="spike-btn-primary mt-4 inline-flex min-h-[48px] w-full items-center justify-center text-center no-underline">
        Go to RA-SPIKE signup
      </a>
      <p className="mt-2 text-center text-xs text-slate-500">
        <span className="font-mono text-slate-600">portal.1cma.online/ra-spike</span>
        {' '}— bookmark this link if you are a rookie.
      </p>
    </div>
  );
});
