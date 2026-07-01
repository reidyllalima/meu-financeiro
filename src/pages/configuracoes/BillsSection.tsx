import { useState, type FormEvent } from 'react';
import { Plus, Trash2, ReceiptText } from 'lucide-react';
import { Panel } from '../../components/ui/Panel';
import { Button } from '../../components/ui/Button';
import { Sheet } from '../../components/ui/Sheet';
import { MoneyInput, SelectField, TextField } from '../../components/ui/fields';
import { Toggle } from '../../components/ui/Toggle';
import { EmptyState } from '../../components/ui/EmptyState';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog';
import { useStore } from '../../store/useStore';
import { useUiStore } from '../../store/useUiStore';
import { formatCurrency, formatMonthLabel, todayMonthKey } from '../../lib/calc';

const MONTH_NAMES = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
];

function emptyForm(categoryId: string) {
  const today = todayMonthKey();
  return { description: '', amount: 0, categoryId, recurring: true, active: true, month: today.month, year: today.year };
}

export function BillsSection() {
  const categories = useStore((s) => s.categories);
  const bills = useStore((s) => s.bills);
  const addBill = useStore((s) => s.addBill);
  const updateBill = useStore((s) => s.updateBill);
  const removeBill = useStore((s) => s.removeBill);
  const showToast = useUiStore((s) => s.showToast);

  const [sheetOpen, setSheetOpen] = useState(false);
  const [form, setForm] = useState(() => emptyForm(categories[0]?.id ?? ''));
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);

  const years = Array.from({ length: 4 }, (_, i) => new Date().getFullYear() - 1 + i);

  function openCreate() {
    setForm(emptyForm(categories[0]?.id ?? ''));
    setSheetOpen(true);
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!form.description.trim() || form.amount <= 0) return;
    addBill(form);
    showToast('Conta cadastrada');
    setSheetOpen(false);
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-semibold text-[var(--color-ink)]">Contas</h2>
          <p className="text-xs text-[var(--color-ink-faint)]">Aluguel, internet, assinaturas, pagamentos avulsos...</p>
        </div>
        <Button size="sm" variant="secondary" onClick={openCreate}>
          <Plus className="h-4 w-4" /> Nova
        </Button>
      </div>

      {bills.length === 0 ? (
        <EmptyState icon={ReceiptText} title="Nenhuma conta cadastrada" description="Cadastre contas fixas ou avulsas para acompanhar no checklist de Contas do Mês e na Previsão." />
      ) : (
        <Panel padded={false} className="divide-y divide-slate-100">
          {bills.map((bill) => (
            <div key={bill.id} className="flex items-center gap-3 px-4 py-3">
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-[var(--color-ink)]">{bill.description}</p>
                <p className="text-xs text-[var(--color-ink-faint)]">
                  {bill.recurring ? 'Recorrente (todo mês)' : `Única · ${formatMonthLabel({ month: bill.month!, year: bill.year! })}`}
                </p>
              </div>
              <p className="text-sm font-semibold text-[var(--color-ink)]">{formatCurrency(bill.amount)}</p>
              {bill.recurring && <Toggle checked={bill.active} onChange={(v) => updateBill(bill.id, { active: v })} />}
              <button
                onClick={() => setPendingDeleteId(bill.id)}
                className="flex h-8 w-8 items-center justify-center rounded-full text-[var(--color-ink-faint)] hover:bg-red-50 hover:text-[var(--color-danger-500)]"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
        </Panel>
      )}

      <Sheet open={sheetOpen} onClose={() => setSheetOpen(false)} title="Nova conta">
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <TextField
            label="Descrição"
            placeholder="Ex: Aluguel, Internet, Cheque especial..."
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            required
          />
          <MoneyInput label="Valor" value={form.amount || ''} onValueChange={(v) => setForm({ ...form, amount: v })} required />
          <SelectField label="Categoria" value={form.categoryId} onChange={(e) => setForm({ ...form, categoryId: e.target.value })}>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </SelectField>
          <Toggle checked={form.recurring} onChange={(v) => setForm({ ...form, recurring: v })} label="Recorrente (repete todo mês)" />
          {!form.recurring && (
            <div className="grid grid-cols-2 gap-3">
              <SelectField label="Mês" value={form.month} onChange={(e) => setForm({ ...form, month: parseInt(e.target.value) })}>
                {MONTH_NAMES.map((name, i) => (
                  <option key={i} value={i}>{name}</option>
                ))}
              </SelectField>
              <SelectField label="Ano" value={form.year} onChange={(e) => setForm({ ...form, year: parseInt(e.target.value) })}>
                {years.map((y) => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </SelectField>
            </div>
          )}
          <Button type="submit" size="lg" full>
            Cadastrar conta
          </Button>
        </form>
      </Sheet>

      <ConfirmDialog
        open={!!pendingDeleteId}
        title="Remover conta?"
        confirmLabel="Remover"
        onConfirm={() => {
          if (pendingDeleteId) removeBill(pendingDeleteId);
          showToast('Conta removida');
          setPendingDeleteId(null);
        }}
        onCancel={() => setPendingDeleteId(null)}
      />
    </div>
  );
}
