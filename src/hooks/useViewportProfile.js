import { useEffect, useState } from 'react';

/**
 * @typedef {'mobile' | 'tablet' | 'desktop' | 'wide' | 'projection'} ViewportTier
 */

/** @returns {ViewportTier} */
function readTier(width) {
  if (width < 640) return 'mobile';
  if (width < 1024) return 'tablet';
  if (width < 1536) return 'desktop';
  if (width < 1920) return 'wide';
  return 'projection';
}

function readProfile() {
  if (typeof window === 'undefined') {
    return {
      tier: 'mobile',
      width: 0,
      compactNav: true,
      isMobile: true,
      isTablet: false,
      isDesktop: false,
      isWide: false,
      isProjection: false,
    };
  }

  const width = window.innerWidth;
  const tier = readTier(width);

  return {
    tier,
    width,
    /** Bottom tab bar — phones and small tablets only */
    compactNav: width < 1024,
    isMobile: tier === 'mobile',
    isTablet: tier === 'tablet',
    isDesktop: tier === 'desktop',
    isWide: tier === 'wide',
    isProjection: tier === 'projection' || tier === 'wide',
  };
}

/** Responsive layout profile for mobile-first UI with projection/large-display support. */
export function useViewportProfile() {
  const [profile, setProfile] = useState(readProfile);

  useEffect(() => {
    const update = () => setProfile(readProfile());
    window.addEventListener('resize', update, { passive: true });
    window.addEventListener('orientationchange', update, { passive: true });
    update();
    return () => {
      window.removeEventListener('resize', update);
      window.removeEventListener('orientationchange', update);
    };
  }, []);

  return profile;
}

/** @deprecated Prefer useViewportProfile().compactNav */
export function useCompactNav() {
  return useViewportProfile().compactNav;
}
