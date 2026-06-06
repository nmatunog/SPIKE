/** Mobile-first page wrapper — tighter padding on small screens. */
export function PageContainer({ children, className = '' }) {
  return (
    <div className={`container mx-auto px-4 py-6 sm:px-6 sm:py-8 ${className}`.trim()}>
      {children}
    </div>
  );
}

export function PageTitle({ children, className = '' }) {
  return (
    <h2 className={`text-2xl font-bold text-gray-900 sm:text-3xl ${className}`}>{children}</h2>
  );
}
