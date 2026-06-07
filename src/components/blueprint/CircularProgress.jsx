/**
 * Circular progress indicator for canvas completion.
 * @param {{ value: number, size?: number, stroke?: number, label?: string }} props
 */
export function CircularProgress({ value, size = 88, stroke = 8, label = 'Canvas Completion' }) {
  const pct = Math.min(100, Math.max(0, Math.round(value)));
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (pct / 100) * circumference;

  return (
    <div className="flex flex-col items-center gap-1">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="-rotate-90">
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="#E2E8F0"
            strokeWidth={stroke}
          />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="#8B0000"
            strokeWidth={stroke}
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
            className="transition-all duration-500"
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-lg font-bold text-spike">{pct}%</span>
        </div>
      </div>
      <p className="spike-label text-center">{label}</p>
    </div>
  );
}
