import type { LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description?: string;
  action?: ReactNode;
}

export function EmptyState({ icon: Icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-slate-200 px-6 py-12 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-100">
        <Icon className="h-6 w-6 text-[var(--color-ink-faint)]" />
      </div>
      <div>
        <p className="font-medium text-[var(--color-ink)]">{title}</p>
        {description && <p className="mt-1 max-w-xs text-sm text-[var(--color-ink-faint)]">{description}</p>}
      </div>
      {action}
    </div>
  );
}
