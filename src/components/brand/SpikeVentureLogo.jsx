/** Brand red from official SPIKE Venture Studio lockup */
export const SPIKE_MARK_RED = '#E5282B';

const THEME = {
  onLight: {
    title: '#1a2b48',
    subtitle: '#1a2b48',
    subtitleOpacity: 0.72,
    spike: SPIKE_MARK_RED,
    hole: '#f8f9fc',
  },
  onDark: {
    title: '#ffffff',
    subtitle: '#ffffff',
    subtitleOpacity: 0.92,
    spike: SPIKE_MARK_RED,
    hole: '#8B0000',
  },
};

function SpikeMarkIcon({ spike, hole }) {
  return (
    <g transform="translate(0 1)">
      {[0, 45, 90, 135].map((angle) => (
        <rect
          key={angle}
          x="15.25"
          y="2.5"
          width="3.5"
          height="31"
          rx="1.75"
          fill={spike}
          transform={`rotate(${angle} 17 18)`}
        />
      ))}
      <circle cx="17" cy="18" r="2.6" fill={hole} />
    </g>
  );
}

/**
 * Official SPIKE Venture Studio wordmark — vector lockup for crisp scaling.
 * @param {{
 *   variant?: 'onLight' | 'onDark',
 *   className?: string,
 *   alt?: string,
 * }} props
 */
export function SpikeVentureLogo({
  variant = 'onLight',
  className = '',
  alt = 'SPIKE Venture Studio',
}) {
  const theme = THEME[variant] ?? THEME.onLight;

  return (
    <svg
      role="img"
      aria-label={alt}
      viewBox="0 0 214 40"
      className={`w-auto shrink-0 object-contain object-left ${className}`}
    >
      <title>{alt}</title>
      <SpikeMarkIcon spike={theme.spike} hole={theme.hole} />
      <text
        x="42"
        y="19.5"
        fill={theme.title}
        fontFamily="Inter, system-ui, -apple-system, Segoe UI, sans-serif"
        fontSize="17.5"
        fontWeight="700"
        letterSpacing="0.04em"
      >
        SPIKE
      </text>
      <text
        x="42"
        y="33.5"
        fill={theme.subtitle}
        fillOpacity={theme.subtitleOpacity}
        fontFamily="Inter, system-ui, -apple-system, Segoe UI, sans-serif"
        fontSize="7.25"
        fontWeight="500"
        letterSpacing="0.34em"
      >
        VENTURE STUDIO
      </text>
    </svg>
  );
}
