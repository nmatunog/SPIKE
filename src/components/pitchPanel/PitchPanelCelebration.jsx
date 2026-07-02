import { useEffect, useRef, useState } from 'react';

/** Lightweight confetti burst for Demo Day winner reveal. */
export function ConfettiCelebration({ active = false, durationMs = 4000 }) {
  const [pieces, setPieces] = useState([]);
  const timerRef = useRef(null);

  useEffect(() => {
    if (!active) {
      setPieces([]);
      return undefined;
    }

    const colors = ['#f97316', '#fbbf24', '#34d399', '#60a5fa', '#f472b6', '#fff'];
    const next = Array.from({ length: 48 }, (_, i) => ({
      id: i,
      left: Math.random() * 100,
      delay: Math.random() * 0.8,
      duration: 2 + Math.random() * 2,
      color: colors[i % colors.length],
      size: 6 + Math.random() * 8,
      rotate: Math.random() * 360,
    }));
    setPieces(next);

    timerRef.current = window.setTimeout(() => setPieces([]), durationMs);
    return () => {
      if (timerRef.current) window.clearTimeout(timerRef.current);
    };
  }, [active, durationMs]);

  if (!pieces.length) return null;

  return (
    <div className="pointer-events-none fixed inset-0 z-50 overflow-hidden" aria-hidden>
      {pieces.map((p) => (
        <span
          key={p.id}
          className="absolute top-0 block animate-[confetti-fall_linear_forwards]"
          style={{
            left: `${p.left}%`,
            width: p.size,
            height: p.size * 0.6,
            backgroundColor: p.color,
            animationDuration: `${p.duration}s`,
            animationDelay: `${p.delay}s`,
            transform: `rotate(${p.rotate}deg)`,
            borderRadius: 2,
          }}
        />
      ))}
      <style>{`
        @keyframes confetti-fall {
          0% { transform: translateY(-10vh) rotate(0deg); opacity: 1; }
          100% { transform: translateY(110vh) rotate(720deg); opacity: 0; }
        }
      `}</style>
    </div>
  );
}

/**
 * Animated peso counter.
 * @param {{ value: number, className?: string }} props
 */
export function AnimatedPeso({ value, className = '' }) {
  const [display, setDisplay] = useState(value);
  const prevRef = useRef(value);

  useEffect(() => {
    const from = prevRef.current;
    const to = value;
    if (from === to) return undefined;

    const start = performance.now();
    const duration = 450;

    let frame = 0;
    function tick(now) {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - (1 - t) ** 3;
      setDisplay(Math.round(from + (to - from) * eased));
      if (t < 1) frame = requestAnimationFrame(tick);
      else prevRef.current = to;
    }
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [value]);

  return (
    <span className={`tabular-nums ${className}`}>
      ₱{display.toLocaleString()}
    </span>
  );
}
