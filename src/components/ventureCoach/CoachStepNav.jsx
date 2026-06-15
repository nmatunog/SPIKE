import { useCompactNav } from '../../hooks/useCompactNav.js';

/**
 * @param {{
 *   onBack?: () => void,
 *   onForward?: () => void,
 *   backLabel?: string,
 *   forwardLabel?: string,
 *   backDisabled?: boolean,
 *   forwardDisabled?: boolean,
 *   sticky?: boolean,
 * }} props
 */
export function CoachStepNav({
  onBack,
  onForward,
  backLabel = 'Back',
  forwardLabel = 'Continue',
  backDisabled = false,
  forwardDisabled = false,
  sticky = true,
}) {
  const compactNav = useCompactNav();
  const pinActions = sticky && compactNav && (onBack || onForward);

  return (
    <div
      className={
        pinActions
          ? 'sticky bottom-[var(--spike-bottom-nav-offset,calc(4.75rem+env(safe-area-inset-bottom,0px)))] z-30 -mx-1 flex flex-wrap items-center gap-3 border-t border-slate-200/90 bg-slate-50/95 px-1 py-3 backdrop-blur supports-[backdrop-filter]:bg-slate-50/90 sm:-mx-2 sm:px-2 lg:static lg:z-auto lg:mx-0 lg:border-0 lg:bg-transparent lg:p-0 lg:backdrop-blur-none'
          : 'flex flex-wrap items-center gap-3'
      }
    >
      {onBack ? (
        <button type="button" onClick={onBack} disabled={backDisabled} className="spike-btn-secondary disabled:opacity-50">
          {backLabel}
        </button>
      ) : null}
      {onForward ? (
        <button
          type="button"
          onClick={onForward}
          disabled={forwardDisabled}
          className="spike-btn-primary min-w-[9rem] flex-1 disabled:opacity-50 sm:flex-none"
        >
          {forwardLabel}
        </button>
      ) : null}
    </div>
  );
}
