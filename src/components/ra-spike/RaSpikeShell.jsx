import { useCompactNav } from '../../hooks/useCompactNav.js';
import { RaSpikeContextBar } from './RaSpikeContextBar.jsx';

/**
 * Layout chrome for RA-SPIKE participant pages.
 * @param {{ user?: { internProgress?: object | null }, children: import('react').ReactNode, showContextBar?: boolean }} props
 */
export function RaSpikeShell({ user, children, showContextBar = true }) {
  const compact = useCompactNav();

  return (
    <div className={compact ? 'pb-[calc(3.5rem+env(safe-area-inset-bottom,0px))]' : ''}>
      {showContextBar ? <RaSpikeContextBar internProgress={user?.internProgress} /> : null}
      {children}
    </div>
  );
}
