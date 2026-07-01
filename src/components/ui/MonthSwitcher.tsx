import { ChevronLeft, ChevronRight } from 'lucide-react';
import type { MonthKey } from '../../types';
import { addMonthsToKey, formatMonthLabel } from '../../lib/calc';

interface MonthSwitcherProps {
  value: MonthKey;
  onChange: (next: MonthKey) => void;
}

export function MonthSwitcher({ value, onChange }: MonthSwitcherProps) {
  return (
    <div className="flex items-center gap-1">
      <button
        onClick={() => onChange(addMonthsToKey(value, -1))}
        className="flex h-8 w-8 items-center justify-center rounded-full text-[var(--color-ink-soft)] hover:bg-black/5"
        aria-label="Mês anterior"
      >
        <ChevronLeft className="h-5 w-5" />
      </button>
      <span className="min-w-[136px] text-center text-[15px] font-semibold capitalize text-[var(--color-ink)]">
        {formatMonthLabel(value)}
      </span>
      <button
        onClick={() => onChange(addMonthsToKey(value, 1))}
        className="flex h-8 w-8 items-center justify-center rounded-full text-[var(--color-ink-soft)] hover:bg-black/5"
        aria-label="Próximo mês"
      >
        <ChevronRight className="h-5 w-5" />
      </button>
    </div>
  );
}
