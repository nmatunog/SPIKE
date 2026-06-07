import { Loader2 } from 'lucide-react';

/** @param {{ label?: string }} props */
export function PageLoader({ label = 'Loading…' }) {
  return (
    <div className="flex min-h-[40vh] flex-col items-center justify-center gap-3 text-slate-500">
      <Loader2 className="animate-spin text-spike" size={28} />
      <p className="text-sm font-medium">{label}</p>
    </div>
  );
}
