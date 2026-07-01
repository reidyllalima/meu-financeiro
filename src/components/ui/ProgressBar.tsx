interface ProgressBarProps {
  value: number; // 0-100
  colorClass?: string;
  trackClassName?: string;
  height?: number;
}

export function ProgressBar({ value, colorClass = 'bg-[var(--color-brand-500)]', trackClassName = 'bg-slate-100', height = 8 }: ProgressBarProps) {
  const clamped = Math.max(0, Math.min(100, value));
  return (
    <div className={`w-full overflow-hidden rounded-full ${trackClassName}`} style={{ height }}>
      <div
        className={`h-full rounded-full transition-all duration-500 ${colorClass}`}
        style={{ width: `${clamped}%` }}
      />
    </div>
  );
}
