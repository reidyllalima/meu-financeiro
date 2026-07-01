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
import { formatCurrency } from '../../lib/calc';

function emptyForm(categoryId: string) {
  return { description: '', amount: 0, categoryId, dueDay: 10, active: true };
}

export function RecurringBillsSection() {
  const categories = useStore((s) => s.categories);
  const bills = useStore((s) => s.recurringBills);
  const addRecurringBill = useStore((s) => s.addRecurringBill);
  const updateRecurringBill = useStore((s) => s.updateRecurringBill);
  const removeRecurringBill = useStore((s) => s.removeRecurringBill);
  const showToast = useUiStore((s) => s.showToast);

  const [sheetOpen, setSheetOpen] = useState(false);
  const [form, setForm] = useState(() => emptyForm(categories[0]?.id ?? ''));
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);

  function openCreate() {
    setForm(emptyForm(categories[0]?.id ?? ''));
    setSheetOpen(true);
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!form.description.trim() || form.amount <= 0) return;
    addRecurringBill(form);
    showToast('Conta recorrente cadastrada');
    setSheetOpen(false);
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-semibold text-[var(--color-ink)]">Contas recorrentes</h2>
          <p className="text-xs text-[var(--color-ink-faint)]">Aluguel, internet, assinaturas fixas...</p>
        </div>
        <Button size="sm" variant="secondary" onClick={openCreate}>
          <Plus className="h-4 w-4" /> Nova
        </Button>
      </div>

      {bills.length === 0 ? (
        <EmptyState icon={ReceiptText} title="Nenhuma conta recorrente" description="Cadastre contas fixas mensais para entrarem na sua previsão financeira." />
      ) : (
        <Panel padded={false} className="divide-y divide-slate-100">
          {bills.map((bill) => (
            <div key={bill.id} className="flex items-center gap-3 px-4 py-3">
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-[var(--color-ink)]">{bill.description}</p>
                <p className="text-xs text-[var(--color-ink-faint)]">Vence dia {bill.dueDay}</p>
              </div>
              <p className="text-sm font-semibold text-[var(--color-ink)]">{formatCurrency(bill.amount)}</p>
              <Toggle checked={bill.active} onChange={(v) => updateRecurringBill(bill.id, { active: v })} />
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

      <Sheet open={sheetOpen} onClose={() => setSheetOpen(false)} title="Nova conta recorrente">
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <TextField
            label="Descrição"
            placeholder="Ex: Aluguel, Internet, Streaming..."
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            required
          />
          <MoneyInput label="Valor mensal" value={form.amount || ''} onValueChange={(v) => setForm({ ...form, amount: v })} required />
          <SelectField label="Categoria" value={form.categoryId} onChange={(e) => setForm({ ...form, categoryId: e.target.value })}>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </SelectField>
          <TextField
            label="Dia do vencimento"
            type="number"
            min={1}
            max={31}
            value={form.dueDay}
            onChange={(e) => setForm({ ...form, dueDay: parseInt(e.target.value) || 1 })}
            required
          />
          <Button type="submit" size="lg" full>
            Cadastrar conta
          </Button>
        </form>
      </Sheet>

      <ConfirmDialog
        open={!!pendingDeleteId}
        title="Remover conta recorrente?"
        confirmLabel="Remover"
        onConfirm={() => {
          if (pendingDeleteId) removeRecurringBill(pendingDeleteId);
          showToast('Conta removida');
          setPendingDeleteId(null);
        }}
        onCancel={() => setPendingDeleteId(null)}
      />
    </div>
  );
}
