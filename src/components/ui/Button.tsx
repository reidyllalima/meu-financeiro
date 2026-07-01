import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { cn } from '../../lib/cn';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'outline';
type Size = 'sm' | 'md' | 'lg';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  variant?: Variant;
  size?: Size;
  full?: boolean;
}

const variantClasses: Record<Variant, string> = {
  primary: 'bg-[var(--color-brand-500)] text-white hover:bg-[var(--color-brand-600)] active:bg-[var(--color-brand-700)]',
  secondary: 'bg-[var(--color-brand-50)] text-[var(--color-brand-700)] hover:bg-[var(--color-brand-100)]',
  ghost: 'bg-transparent text-[var(--color-ink-soft)] hover:bg-black/5',
  danger: 'bg-[var(--color-danger-50)] text-[var(--color-danger-500)] hover:bg-red-100',
  outline: 'bg-transparent ring-1 ring-inset ring-slate-200 text-[var(--color-ink)] hover:bg-slate-50',
};

const sizeClasses: Record<Size, string> = {
  sm: 'text-sm px-3 py-1.5 rounded-lg gap-1.5',
  md: 'text-sm px-4 py-2.5 rounded-xl gap-2',
  lg: 'text-base px-5 py-3.5 rounded-2xl gap-2',
};

export function Button({
  children,
  variant = 'primary',
  size = 'md',
  full,
  className = '',
  ...rest
}: ButtonProps) {
  return (
    <button
      className={cn(
        'inline-flex items-center justify-center font-medium transition-colors disabled:opacity-40 disabled:pointer-events-none',
        variantClasses[variant],
        sizeClasses[size],
        full && 'w-full',
        className,
      )}
      {...rest}
    >
      {children}
    </button>
  );
}
