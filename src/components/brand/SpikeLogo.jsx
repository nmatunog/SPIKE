/** Official SPIKE Venture Studio logo — served from /public/spike-logo.png */
export const SPIKE_LOGO_SRC = '/spike-logo.png';

const SIZE_CLASS = {
  sm: 'h-8',
  md: 'h-10',
  lg: 'h-14',
  xl: 'h-16',
};

/**
 * @param {{
 *   size?: 'sm' | 'md' | 'lg' | 'xl',
 *   className?: string,
 *   alt?: string,
 * }} props
 */
export function SpikeLogo({
  size = 'md',
  className = '',
  alt = 'SPIKE Venture Studio',
}) {
  return (
    <img
      src={SPIKE_LOGO_SRC}
      alt={alt}
      width={320}
      height={80}
      className={`w-auto shrink-0 object-contain object-left ${SIZE_CLASS[size]} ${className}`}
    />
  );
}
