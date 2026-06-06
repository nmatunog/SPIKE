import { useEffect, useState } from 'react';

/** True when bottom tab bar should show (phones + touch devices, incl. Safari). */
function readCompactNav() {
  if (typeof window === 'undefined') return true;
  const narrow = window.matchMedia('(max-width: 1023px)').matches;
  const touch = window.matchMedia('(pointer: coarse)').matches;
  return narrow || touch;
}

export function useCompactNav() {
  const [compact, setCompact] = useState(readCompactNav);

  useEffect(() => {
    const queries = ['(max-width: 1023px)', '(pointer: coarse)'].map((q) =>
      window.matchMedia(q),
    );
    const update = () => setCompact(readCompactNav());
    queries.forEach((mq) => mq.addEventListener('change', update));
    update();
    return () => queries.forEach((mq) => mq.removeEventListener('change', update));
  }, []);

  return compact;
}
