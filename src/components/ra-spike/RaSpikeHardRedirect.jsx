import { useEffect } from 'react';
import { Loader2 } from 'lucide-react';

/**
 * Hard navigation to the RA-SPIKE app shell (separate bundle + Supabase project).
 * @param {{ href: string, label: string }} props
 */
export function RaSpikeHardRedirect({ href, label }) {
  useEffect(() => {
    window.location.replace(href);
  }, [href]);

  return (
    <div className="flex flex-col items-center justify-center gap-3 py-24 text-slate-600">
      <Loader2 className="animate-spin text-spike" size={40} aria-hidden />
      <p className="text-sm font-medium">{label}</p>
    </div>
  );
}
