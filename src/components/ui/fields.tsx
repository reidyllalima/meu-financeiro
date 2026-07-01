import type { InputHTMLAttributes, ReactNode, SelectHTMLAttributes, TextareaHTMLAttributes } from 'react';

const baseFieldClass =
  'w-full rounded-xl border-0 bg-slate-100 px-3.5 py-3 text-[15px] text-[var(--color-ink)] placeholder:text-[var(--color-ink-faint)] outline-none ring-1 ring-inset ring-transparent focus:ring-2 focus:ring-[var(--color-brand-500)] focus:bg-white transition-colors';

interface FieldWrapperProps {
  label?: string;
  hint?: string;
  error?: string;
  children: ReactNode;
  required?: boolean;
}

function FieldWrapper({ label, hint, error, children, required }: FieldWrapperProps) {
  return (
    <label className="block">
      {label && (
        <span className="mb-1.5 block text-[13px] font-medium text-[var(--color-ink-soft)]">
          {label}
          {required && <span className="text-[var(--color-danger-500)]"> *</span>}
        </span>
      )}
      {children}
      {hint && !error && <span className="mt-1 block text-xs text-[var(--color-ink-faint)]">{hint}</span>}
      {error && <span className="mt-1 block text-xs text-[var(--color-danger-500)]">{error}</span>}
    </label>
  );
}

interface TextFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  hint?: string;
  error?: string;
}

export function TextField({ label, hint, error, className = '', required, ...rest }: TextFieldProps) {
  return (
    <FieldWrapper label={label} hint={hint} error={error} required={required}>
      <input className={`${baseFieldClass} ${className}`} required={required} {...rest} />
    </FieldWrapper>
  );
}

interface SelectFieldProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  hint?: string;
  error?: string;
  children: ReactNode;
}

export function SelectField({ label, hint, error, className = '', children, required, ...rest }: SelectFieldProps) {
  return (
    <FieldWrapper label={label} hint={hint} error={error} required={required}>
      <select className={`${baseFieldClass} appearance-none ${className}`} required={required} {...rest}>
        {children}
      </select>
    </FieldWrapper>
  );
}

interface TextAreaFieldProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  hint?: string;
  error?: string;
}

export function TextAreaField({ label, hint, error, className = '', required, ...rest }: TextAreaFieldProps) {
  return (
    <FieldWrapper label={label} hint={hint} error={error} required={required}>
      <textarea className={`${baseFieldClass} resize-none ${className}`} required={required} {...rest} />
    </FieldWrapper>
  );
}

export function MoneyInput({
  label,
  hint,
  error,
  value,
  onValueChange,
  required,
}: {
  label?: string;
  hint?: string;
  error?: string;
  value: number | '';
  onValueChange: (v: number) => void;
  required?: boolean;
}) {
  return (
    <FieldWrapper label={label} hint={hint} error={error} required={required}>
      <div className="relative">
        <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[15px] text-[var(--color-ink-faint)]">
          R$
        </span>
        <input
          inputMode="decimal"
          type="number"
          step="0.01"
          min="0"
          className={`${baseFieldClass} pl-10`}
          value={value}
          required={required}
          onChange={(e) => onValueChange(e.target.value === '' ? 0 : parseFloat(e.target.value))}
          placeholder="0,00"
        />
      </div>
    </FieldWrapper>
  );
}
