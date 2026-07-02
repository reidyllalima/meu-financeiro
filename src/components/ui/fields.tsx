import { useEffect, useRef, useState, type InputHTMLAttributes, type ReactNode, type SelectHTMLAttributes, type TextareaHTMLAttributes } from 'react';

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

/** Só dígitos e uma vírgula (até 2 casas), sem sinal — equivalente ao "min=0" que tínhamos no input number. */
function sanitizeMoneyText(raw: string): string {
  const cleaned = raw.replace(/[^0-9,]/g, '');
  const commaIndex = cleaned.indexOf(',');
  if (commaIndex === -1) return cleaned;
  const intPart = cleaned.slice(0, commaIndex);
  const decPart = cleaned.slice(commaIndex + 1).replace(/,/g, '').slice(0, 2);
  return `${intPart},${decPart}`;
}

function parseMoneyText(text: string): number {
  if (text === '' || text === ',') return 0;
  const parsed = parseFloat(text.replace(',', '.'));
  return isNaN(parsed) ? 0 : parsed;
}

function formatMoneyText(value: number | ''): string {
  if (value === '') return '';
  return String(value).replace('.', ',');
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
  const [text, setText] = useState(() => formatMoneyText(value));
  const lastEmitted = useRef(value);

  // Só resincroniza quando `value` muda por fora (ex: editar um lançamento existente,
  // limpar o formulário depois de salvar) — nunca por causa da própria digitação, senão
  // a vírgula digitada seria descartada a cada re-render (o input "limpava" o valor).
  useEffect(() => {
    if (value !== lastEmitted.current) {
      setText(formatMoneyText(value));
      lastEmitted.current = value;
    }
  }, [value]);

  return (
    <FieldWrapper label={label} hint={hint} error={error} required={required}>
      <div className="relative">
        <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[15px] text-[var(--color-ink-faint)]">
          R$
        </span>
        <input
          inputMode="decimal"
          type="text"
          className={`${baseFieldClass} pl-10`}
          value={text}
          required={required}
          onChange={(e) => {
            const sanitized = sanitizeMoneyText(e.target.value);
            setText(sanitized);
            const parsed = parseMoneyText(sanitized);
            lastEmitted.current = parsed;
            onValueChange(parsed);
          }}
          placeholder="0,00"
        />
      </div>
    </FieldWrapper>
  );
}
