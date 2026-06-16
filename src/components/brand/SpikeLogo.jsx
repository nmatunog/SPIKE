/** Official SPIKE Venture Studio logo — served from /public/spike-logo.png */
export const SPIKE_LOGO_SRC = '/spike-logo.png';
export const SPIKE_LOGO_ON_DARK_SRC = '/spike-logo-on-dark.png';

const SIZE_CLASS = {
  sm: 'h-8',
  md: 'h-10',
  lg: 'h-14',
  xl: 'h-16',
};

/**
 * @param {{
 *   size?: 'sm' | 'md' | 'lg' | 'xl',
 *   variant?: 'default' | 'onDark',
 *   className?: string,
 *   alt?: string,
 * }} props
 */
export function SpikeLogo({
  size = 'md',
  variant = 'default',
  className = '',
  alt = 'SPIKE Venture Studio',
}) {
  const src = variant === 'onDark' ? SPIKE_LOGO_ON_DARK_SRC : SPIKE_LOGO_SRC;

  return (
    <img
      src={src}
      alt={alt}
      width={320}
      height={80}
      className={`w-auto shrink-0 object-contain object-left ${variant === 'onDark' ? 'drop-shadow-md' : ''} ${SIZE_CLASS[size]} ${className}`}
    />
  );
}
