import { SpikeVentureLogo } from './SpikeVentureLogo.jsx';

/** Raster fallbacks — prefer SpikeVentureLogo SVG for theme-aware rendering */
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
  const logoVariant = variant === 'onDark' ? 'onDark' : 'onLight';
  const sizeClass = SIZE_CLASS[size] ?? SIZE_CLASS.md;

  return (
    <SpikeVentureLogo
      variant={logoVariant}
      alt={alt}
      className={`${sizeClass} ${variant === 'onDark' ? 'drop-shadow-md' : ''} ${className}`}
    />
  );
}
