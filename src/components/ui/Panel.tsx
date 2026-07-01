import type { HTMLAttributes, ReactNode } from 'react';
import { cn } from '../../lib/cn';

interface PanelProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  padded?: boolean;
}

export function Panel({ children, className = '', padded = true, ...rest }: PanelProps) {
  return (
    <div
      className={cn('rounded-2xl bg-[var(--color-surface)] shadow-sm ring-1 ring-black/[0.04]', padded && 'p-4 sm:p-5', className)}
      {...rest}
    >
      {children}
    </div>
  );
}
