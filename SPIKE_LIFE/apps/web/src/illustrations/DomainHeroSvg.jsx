/**
 * Domain hero illustrations — cropped from SPIKE LIFE domain board mockup.
 * Served as PNG from /public/illustrations/domains/ (SVG wrappers omit external refs in <img>).
 */

const DOMAIN_HERO_IDS = new Set([
  'career',
  'business',
  'income_finance',
  'family',
  'health',
  'housing',
  'education',
  'lifestyle',
  'community',
  'government',
  'investment',
  'milestone',
])

function heroSrc(domainId) {
  const id = DOMAIN_HERO_IDS.has(domainId) ? domainId : 'career'
  return `/illustrations/domains/${id}.png`
}

export default function DomainHeroSvg({ domainId = 'career', className = '' }) {
  return (
    <img
      src={heroSrc(domainId)}
      alt=""
      aria-hidden
      className={className}
      loading="eager"
      decoding="async"
      draggable={false}
    />
  )
}
