import { Link } from 'react-router-dom';
import { Layout } from 'lucide-react';
import { internFecCanvasHref } from '../../routes/paths.js';

/**
 * Prominent intern CTA — opens full FEC board with their saved outputs.
 * @param {{
 *   exit?: string,
 *   className?: string,
 *   label?: string,
 *   compact?: boolean,
 * }} props
 */
export function ViewMyFecCanvasLink({
  exit,
  className = '',
  label = 'View my FEC Canvas',
  compact = false,
}) {
  const href = internFecCanvasHref(exit ? { exit } : {});

  if (compact) {
    return (
      <Link
        to={href}
        className={`inline-flex items-center gap-1.5 text-sm font-semibold text-spike hover:underline ${className}`}
      >
        <Layout size={14} aria-hidden />
        {label}
      </Link>
    );
  }

  return (
    <Link
      to={href}
      className={`inline-flex min-h-[44px] items-center justify-center gap-2 rounded-xl border border-spike/30 bg-white px-5 py-2.5 text-sm font-bold text-spike shadow-sm transition hover:border-spike hover:bg-spike/5 ${className}`}
    >
      <Layout size={16} aria-hidden />
      {label}
    </Link>
  );
}
