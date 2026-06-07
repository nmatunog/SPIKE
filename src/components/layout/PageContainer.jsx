/**
 * Mobile-first page wrapper with optional wide / projection layouts.
 *
 * @param {{
 *   children: import('react').ReactNode,
 *   className?: string,
 *   wide?: boolean,
 *   presentation?: boolean,
 * }} props
 */
export function PageContainer({ children, className = '', wide = false, presentation = false }) {
  const maxWidth = presentation
    ? 'max-w-projection'
    : wide
      ? 'max-w-content-wide'
      : 'max-w-content';

  return (
    <div
      className={`mx-auto ${maxWidth} px-4 py-5 sm:px-6 sm:py-7 lg:px-8 lg:py-8 2xl:px-10 2xl:py-10 ${className}`.trim()}
    >
      {children}
    </div>
  );
}

/**
 * @param {{
 *   children: import('react').ReactNode,
 *   className?: string,
 *   subtitle?: import('react').ReactNode,
 *   presentation?: boolean,
 * }} props
 */
export function PageTitle({ children, className = '', subtitle, presentation = false }) {
  return (
    <div className={className}>
      <h2
        className={`font-semibold tracking-tight text-slate-900 ${
          presentation
            ? 'text-xl sm:text-2xl lg:text-3xl 2xl:text-4xl'
            : 'text-xl sm:text-2xl lg:text-3xl'
        }`}
      >
        {children}
      </h2>
      {subtitle ? (
        <p className="mt-1 text-sm text-slate-600 sm:text-base lg:mt-2 lg:text-lg 2xl:text-xl">
          {subtitle}
        </p>
      ) : null}
    </div>
  );
}
