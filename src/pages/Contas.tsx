import { useMemo, useState, type FormEvent } from 'react';
import { useSearchParams } from 'react-router-dom';
import { CheckCircle2, CircleDashed, ClipboardList, CreditCard as CreditCardIcon, Plus, Trash2 } from 'lucide-react';
import { Panel } from '../components/ui/Panel';
import { Button } from '../components/ui/Button';
import { Sheet } from '../components/ui/Sheet';
import { MoneyInput, SelectField, TextField } from '../components/ui/fields';
import { Toggle } from '../components/ui/Toggle';
import { ProgressBar } from '../components/ui/ProgressBar';
import { MonthSwitcher } from '../components/ui/MonthSwitcher';
import { EmptyState } from '../components/ui/EmptyState';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';
import { useStore } from '../store/useStore';
import { useUiStore } from '../store/useUiStore';
import {
  buildMonthlyChecklist,
  formatCurrency,
  todayMonthKey,
  totalIncomeForMonth,
  type ChecklistItem,
} from '../lib/calc';
import type { MonthKey } from '../types';
import { getCategoryIcon } from '../lib/icons';

function emptyForm(categoryId: string) {
  return { description: '', amount: 0, categoryId, recurring: false };
}

export function Contas() {
  const [searchParams] = useSearchParams();
  const [month, setMonth] = useState<MonthKey>(() => {
    const monthParam = parseInt(searchParams.get('month') ?? '', 10);
    const yearParam = parseInt(searchParams.get('year') ?? '', 10);
    if (!Number.isNaN(monthParam) && !Number.isNaN(yearParam)) return { month: monthParam, year: yearParam };
    return todayMonthKey();
  });

  const incomes = useStore((s) => s.incomes);
  const bills = useStore((s) => s.bills);
  const cardPurchases = useStore((s) => s.cardPurchases);
  const cards = useStore((s) => s.cards);
  const categories = useStore((s) => s.categories);
  const addBill = useStore((s) => s.addBill);
  const removeBill = useStore((s) => s.removeBill);
  const removeCardPurchase = useStore((s) => s.removeCardPurchase);
  const toggleBillPaid = useStore((s) => s.toggleBillPaid);
  const toggleCardPurchasePaid = useStore((s) => s.toggleCardPurchasePaid);
  const toggleCardInvoicePaid = useStore((s) => s.toggleCardInvoicePaid);
  const showToast = useUiStore((s) => s.showToast);

  const checklist = useMemo(
    () => buildMonthlyChecklist(bills, cardPurchases, cards, month),
    [bills, cardPurchases, cards, month],
  );

  const income = totalIncomeForMonth(incomes, month);
  const totalGastos = checklist.reduce((s, i) => s + i.amount, 0);
  const totalPago = checklist.filter((i) => i.paid).reduce((s, i) => s + i.amount, 0);
  const saldo = income - totalGastos;
  const paidCount = checklist.filter((i) => i.paid).length;
  const progress = checklist.length > 0 ? (paidCount / checklist.length) * 100 : 0;

  const [sheetOpen, setSheetOpen] = useState(false);
  const [form, setForm] = useState(() => emptyForm(categories[0]?.id ?? ''));
  const [pendingDelete, setPendingDelete] = useState<ChecklistItem | null>(null);

  function openCreate() {
    setForm(emptyForm(categories[0]?.id ?? ''));
    setSheetOpen(true);
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!form.description.trim() || form.amount <= 0) return;
    addBill({
      description: form.description.trim(),
      amount: form.amount,
      categoryId: form.categoryId,
      recurring: form.recurring,
      active: true,
      month: form.recurring ? undefined : month.month,
      year: form.recurring ? undefined : month.year,
    });
    showToast('Conta adicionada');
    setSheetOpen(false);
  }

  function toggle(item: ChecklistItem) {
    if (item.kind === 'bill') toggleBillPaid(item.refId, month);
    if (item.kind === 'purchase') toggleCardPurchasePaid(item.refId, month);
    if (item.kind === 'invoice') toggleCardInvoicePaid(item.refId, month);
  }

  function confirmDelete() {
    if (!pendingDelete) return;
    if (pendingDelete.kind === 'bill') removeBill(pendingDelete.refId);
    if (pendingDelete.kind === 'purchase') removeCardPurchase(pendingDelete.refId);
    showToast('Conta removida');
    setPendingDelete(null);
  }

  return (
    <div className="flex flex-col gap-5 pb-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-[var(--color-ink)]">Contas do Mês</h1>
        <MonthSwitcher value={month} onChange={setMonth} />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Panel className="bg-[var(--color-warn-50)]">
          <p className="text-xs font-medium text-amber-700/80">Total Gastos</p>
          <p className="mt-1 text-xl font-bold text-amber-700">{formatCurrency(totalGastos)}</p>
        </Panel>
        <Panel className={saldo < 0 ? 'bg-[var(--color-danger-50)]' : 'bg-[var(--color-brand-50)]'}>
          <p className={`text-xs font-medium ${saldo < 0 ? 'text-[var(--color-danger-500)]/80' : 'text-[var(--color-brand-700)]/80'}`}>Saldo</p>
          <p className={`mt-1 text-xl font-bold ${saldo < 0 ? 'text-[var(--color-danger-500)]' : 'text-[var(--color-brand-700)]'}`}>
            {formatCurrency(saldo)}
          </p>
        </Panel>
      </div>

      {checklist.length > 0 && (
        <Panel>
          <div className="flex items-center justify-between text-sm">
            <span className="font-medium text-[var(--color-ink-soft)]">
              {paidCount} de {checklist.length} contas pagas
            </span>
            <span className="text-[var(--color-ink-faint)]">
              {formatCurrency(totalPago)} de {formatCurrency(totalGastos)}
            </span>
          </div>
          <div className="mt-2">
            <ProgressBar value={progress} />
          </div>
        </Panel>
      )}

      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-[var(--color-ink-soft)]">Checklist</p>
        <Button size="sm" variant="secondary" onClick={openCreate}>
          <Plus className="h-4 w-4" /> Nova conta
        </Button>
      </div>

      {checklist.length === 0 ? (
        <EmptyState
          icon={ClipboardList}
          title="Nenhuma conta neste mês"
          description="Adicione as contas que você precisa pagar este mês e marque como paga conforme for quitando."
        />
      ) : (
        <Panel padded={false} className="divide-y divide-slate-100">
          {checklist.map((item) => (
            <ChecklistRow
              key={item.key}
              item={item}
              onToggle={() => toggle(item)}
              onDelete={item.kind !== 'invoice' ? () => setPendingDelete(item) : undefined}
            />
          ))}
        </Panel>
      )}

      <Sheet open={sheetOpen} onClose={() => setSheetOpen(false)} title="Nova conta">
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <TextField
            label="Descrição"
            placeholder="Ex: Patricia, Café da manhã, Cheque especial..."
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            autoFocus
            required
          />
          <MoneyInput label="Valor" value={form.amount || ''} onValueChange={(v) => setForm({ ...form, amount: v })} required />
          <SelectField label="Categoria" value={form.categoryId} onChange={(e) => setForm({ ...form, categoryId: e.target.value })}>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </SelectField>
          <Toggle
            checked={form.recurring}
            onChange={(v) => setForm({ ...form, recurring: v })}
            label="Repetir todo mês"
          />
          <Button type="submit" size="lg" full>
            Adicionar
          </Button>
        </form>
      </Sheet>

      <ConfirmDialog
        open={!!pendingDelete}
        title="Remover conta?"
        description={
          pendingDelete?.kind === 'purchase'
            ? 'Isso remove o parcelamento inteiro (todas as parcelas, passadas e futuras).'
            : 'Essa ação não pode ser desfeita.'
        }
        confirmLabel="Remover"
        onConfirm={confirmDelete}
        onCancel={() => setPendingDelete(null)}
      />
    </div>
  );
}

function ChecklistRow({ item, onToggle, onDelete }: { item: ChecklistItem; onToggle: () => void; onDelete?: () => void }) {
  const category = useStore((s) => (item.categoryId ? s.categories.find((c) => c.id === item.categoryId) : undefined));
  const Icon = item.kind === 'invoice' ? CreditCardIcon : getCategoryIcon(category?.icon ?? '');
  const iconColor = item.kind === 'invoice' ? '#0f172a' : (category?.color ?? '#94a3b8');

  return (
    <div className="flex items-start gap-3 px-4 py-3">
      <div
        className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-full"
        style={{ backgroundColor: `${iconColor}1A` }}
      >
        <Icon className="h-[18px] w-[18px]" style={{ color: iconColor }} />
      </div>
      <div className="min-w-0 flex-1">
        <p className="break-words text-[14.5px] font-medium leading-snug text-[var(--color-ink)]">{item.description}</p>
        {item.badge && <p className="mt-0.5 text-xs text-[var(--color-ink-faint)]">Parcela {item.badge}</p>}
        <button
          onClick={onToggle}
          className={`mt-2 flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold transition-colors ${
            item.paid
              ? 'bg-[var(--color-brand-100)] text-[var(--color-brand-700)]'
              : 'bg-[var(--color-danger-50)] text-[var(--color-danger-500)]'
          }`}
        >
          {item.paid ? <CheckCircle2 className="h-3.5 w-3.5" /> : <CircleDashed className="h-3.5 w-3.5" />}
          {item.paid ? 'Pago' : 'Pendente'}
        </button>
      </div>
      <div className="flex shrink-0 flex-col items-end gap-2">
        <p className="text-[14.5px] font-semibold text-[var(--color-ink)]">{formatCurrency(item.amount)}</p>
        {onDelete && (
          <button
            onClick={onDelete}
            className="flex h-7 w-7 items-center justify-center rounded-full text-[var(--color-ink-faint)] hover:bg-red-50 hover:text-[var(--color-danger-500)]"
            aria-label="Remover"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        )}
      </div>
    </div>
  );
}
