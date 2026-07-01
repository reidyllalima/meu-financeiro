import { useState, type FormEvent } from 'react';
import { Plus, Trash2, Pencil, Wallet } from 'lucide-react';
import { Panel } from '../../components/ui/Panel';
import { Button } from '../../components/ui/Button';
import { Sheet } from '../../components/ui/Sheet';
import { MoneyInput, SelectField, TextField } from '../../components/ui/fields';
import { Toggle } from '../../components/ui/Toggle';
import { EmptyState } from '../../components/ui/EmptyState';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog';
import { useStore } from '../../store/useStore';
import { useUiStore } from '../../store/useUiStore';
import { formatCurrency, formatMonthLabel } from '../../lib/calc';
import type { Income } from '../../types';

const MONTH_NAMES = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
];

function emptyForm(): Omit<Income, 'id' | 'createdAt'> {
  const now = new Date();
  return { description: '', amount: 0, recurring: true, month: now.getMonth(), year: now.getFullYear() };
}

export function IncomesSection() {
  const incomes = useStore((s) => s.incomes);
  const addIncome = useStore((s) => s.addIncome);
  const updateIncome = useStore((s) => s.updateIncome);
  const removeIncome = useStore((s) => s.removeIncome);
  const showToast = useUiStore((s) => s.showToast);

  const [sheetOpen, setSheetOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm());
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);

  function openCreate() {
    setEditingId(null);
    setForm(emptyForm());
    setSheetOpen(true);
  }

  function openEdit(income: Income) {
    setEditingId(income.id);
    setForm({ description: income.description, amount: income.amount, recurring: income.recurring, month: income.month, year: income.year });
    setSheetOpen(true);
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!form.description.trim() || form.amount <= 0) return;
    if (editingId) {
      updateIncome(editingId, form);
      showToast('Renda atualizada');
    } else {
      addIncome(form);
      showToast('Renda cadastrada');
    }
    setSheetOpen(false);
  }

  const years = Array.from({ length: 4 }, (_, i) => new Date().getFullYear() - 1 + i);

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-semibold text-[var(--color-ink)]">Receitas</h2>
          <p className="text-xs text-[var(--color-ink-faint)]">Salário e outras rendas</p>
        </div>
        <Button size="sm" variant="secondary" onClick={openCreate}>
          <Plus className="h-4 w-4" /> Nova
        </Button>
      </div>

      {incomes.length === 0 ? (
        <EmptyState icon={Wallet} title="Nenhuma renda cadastrada" description="Cadastre seu salário e outras rendas para começar a usar o dashboard." />
      ) : (
        <Panel padded={false} className="divide-y divide-slate-100">
          {incomes.map((inc) => (
            <div key={inc.id} className="flex items-center gap-3 px-4 py-3">
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-[var(--color-ink)]">{inc.description}</p>
                <p className="text-xs text-[var(--color-ink-faint)]">
                  {inc.recurring ? 'Recorrente (todo mês)' : `Pontual · ${formatMonthLabel({ month: inc.month!, year: inc.year! })}`}
                </p>
              </div>
              <p className="text-sm font-semibold text-[var(--color-brand-600)]">{formatCurrency(inc.amount)}</p>
              <button onClick={() => openEdit(inc)} className="flex h-8 w-8 items-center justify-center rounded-full text-[var(--color-ink-faint)] hover:bg-slate-100">
                <Pencil className="h-4 w-4" />
              </button>
              <button onClick={() => setPendingDeleteId(inc.id)} className="flex h-8 w-8 items-center justify-center rounded-full text-[var(--color-ink-faint)] hover:bg-red-50 hover:text-[var(--color-danger-500)]">
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
        </Panel>
      )}

      <Sheet open={sheetOpen} onClose={() => setSheetOpen(false)} title={editingId ? 'Editar renda' : 'Nova renda'}>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <TextField
            label="Descrição"
            placeholder="Ex: Salário, Freelance, 13º..."
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            required
          />
          <MoneyInput label="Valor" value={form.amount || ''} onValueChange={(v) => setForm({ ...form, amount: v })} required />
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
            {editingId ? 'Salvar alterações' : 'Cadastrar renda'}
          </Button>
        </form>
      </Sheet>

      <ConfirmDialog
        open={!!pendingDeleteId}
        title="Remover renda?"
        description="Essa ação não pode ser desfeita."
        confirmLabel="Remover"
        onConfirm={() => {
          if (pendingDeleteId) removeIncome(pendingDeleteId);
          showToast('Renda removida');
          setPendingDeleteId(null);
        }}
        onCancel={() => setPendingDeleteId(null)}
      />
    </div>
  );
}
