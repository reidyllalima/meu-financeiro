import { useState, type FormEvent } from 'react';
import { Plus, Trash2, CalendarClock } from 'lucide-react';
import { Panel } from '../../components/ui/Panel';
import { Button } from '../../components/ui/Button';
import { Sheet } from '../../components/ui/Sheet';
import { MoneyInput, SelectField, TextField } from '../../components/ui/fields';
import { EmptyState } from '../../components/ui/EmptyState';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog';
import { useStore } from '../../store/useStore';
import { useUiStore } from '../../store/useUiStore';
import { formatCurrency, roundCurrency, todayISODate, todayMonthKey } from '../../lib/calc';

const MONTH_NAMES = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
];

const NO_CARD = '';

function emptyForm(cardId: string, categoryId: string) {
  const today = todayMonthKey();
  return {
    description: '',
    cardId,
    categoryId,
    installmentValue: 0 as number,
    totalInstallments: 2,
    anchorInstallmentNumber: 1,
    anchorMonth: today.month,
    anchorYear: today.year,
  };
}

export function InstallmentsSection() {
  const cards = useStore((s) => s.cards);
  const categories = useStore((s) => s.categories);
  const cardPurchases = useStore((s) => s.cardPurchases);
  const addCardPurchase = useStore((s) => s.addCardPurchase);
  const removeCardPurchase = useStore((s) => s.removeCardPurchase);
  const showToast = useUiStore((s) => s.showToast);

  const plans = cardPurchases.filter((p) => p.totalInstallments > 1);

  const [sheetOpen, setSheetOpen] = useState(false);
  const [form, setForm] = useState(() => emptyForm(NO_CARD, categories[0]?.id ?? ''));
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);

  const years = Array.from({ length: 4 }, (_, i) => new Date().getFullYear() - 1 + i);

  function openCreate() {
    setForm(emptyForm(NO_CARD, categories[0]?.id ?? ''));
    setSheetOpen(true);
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!form.description.trim() || form.installmentValue <= 0 || form.totalInstallments < 1) return;

    addCardPurchase({
      description: form.description.trim(),
      cardId: form.cardId || undefined,
      categoryId: form.categoryId,
      installmentValue: form.installmentValue,
      totalAmount: roundCurrency(form.installmentValue * form.totalInstallments),
      totalInstallments: form.totalInstallments,
      anchorInstallmentNumber: form.anchorInstallmentNumber,
      anchorMonth: form.anchorMonth,
      anchorYear: form.anchorYear,
      purchaseDate: todayISODate(),
    });
    showToast('Parcelamento cadastrado');
    setSheetOpen(false);
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-semibold text-[var(--color-ink)]">Parcelamentos existentes</h2>
          <p className="text-xs text-[var(--color-ink-faint)]">Compras parceladas que você já possui</p>
        </div>
        <Button size="sm" variant="secondary" onClick={openCreate}>
          <Plus className="h-4 w-4" /> Novo
        </Button>
      </div>

      {plans.length === 0 ? (
        <EmptyState
          icon={CalendarClock}
          title="Nenhum parcelamento cadastrado"
          description="Se você já tem compras parceladas em andamento, cadastre aqui para projetarmos o restante automaticamente."
        />
      ) : (
        <Panel padded={false} className="divide-y divide-slate-100">
          {plans.map((p) => {
            const card = cards.find((c) => c.id === p.cardId);
            return (
              <div key={p.id} className="flex items-center gap-3 px-4 py-3">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-[var(--color-ink)]">{p.description}</p>
                  <p className="text-xs text-[var(--color-ink-faint)]">
                    {card?.name ?? 'Sem cartão (financiamento direto)'} · {p.anchorInstallmentNumber}/{p.totalInstallments} parcelas
                  </p>
                </div>
                <p className="text-sm font-semibold text-[var(--color-ink)]">{formatCurrency(p.installmentValue)}</p>
                <button
                  onClick={() => setPendingDeleteId(p.id)}
                  className="flex h-8 w-8 items-center justify-center rounded-full text-[var(--color-ink-faint)] hover:bg-red-50 hover:text-[var(--color-danger-500)]"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            );
          })}
        </Panel>
      )}

      <Sheet open={sheetOpen} onClose={() => setSheetOpen(false)} title="Novo parcelamento existente">
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <TextField
            label="Nome da compra"
            placeholder="Ex: Notebook, Sofá, Viagem..."
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            required
          />
          <SelectField label="Cartão" value={form.cardId} onChange={(e) => setForm({ ...form, cardId: e.target.value })}>
            <option value={NO_CARD}>Sem cartão (financiamento direto)</option>
            {cards.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </SelectField>
          <SelectField label="Categoria" value={form.categoryId} onChange={(e) => setForm({ ...form, categoryId: e.target.value })}>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </SelectField>
          <MoneyInput label="Valor da parcela" value={form.installmentValue || ''} onValueChange={(v) => setForm({ ...form, installmentValue: v })} required />
          <div className="grid grid-cols-2 gap-3">
            <TextField
              label="Parcela atual"
              type="number"
              min={1}
              value={form.anchorInstallmentNumber}
              onChange={(e) => setForm({ ...form, anchorInstallmentNumber: parseInt(e.target.value) || 1 })}
              hint="Ex: 3 (de 10)"
              required
            />
            <TextField
              label="Total de parcelas"
              type="number"
              min={form.anchorInstallmentNumber}
              value={form.totalInstallments}
              onChange={(e) => setForm({ ...form, totalInstallments: parseInt(e.target.value) || 1 })}
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <SelectField
              label="Mês de vencimento (parcela atual)"
              value={form.anchorMonth}
              onChange={(e) => setForm({ ...form, anchorMonth: parseInt(e.target.value) })}
            >
              {MONTH_NAMES.map((name, i) => (
                <option key={i} value={i}>{name}</option>
              ))}
            </SelectField>
            <SelectField label="Ano" value={form.anchorYear} onChange={(e) => setForm({ ...form, anchorYear: parseInt(e.target.value) })}>
              {years.map((y) => (
                <option key={y} value={y}>{y}</option>
              ))}
            </SelectField>
          </div>
          <p className="text-xs text-[var(--color-ink-faint)]">
            Total estimado: {formatCurrency(roundCurrency(form.installmentValue * form.totalInstallments))}
          </p>
          <Button type="submit" size="lg" full>
            Cadastrar parcelamento
          </Button>
        </form>
      </Sheet>

      <ConfirmDialog
        open={!!pendingDeleteId}
        title="Remover parcelamento?"
        description="Isso remove a compra e todas as suas parcelas (passadas e futuras)."
        confirmLabel="Remover"
        onConfirm={() => {
          if (pendingDeleteId) removeCardPurchase(pendingDeleteId);
          showToast('Parcelamento removido');
          setPendingDeleteId(null);
        }}
        onCancel={() => setPendingDeleteId(null)}
      />
    </div>
  );
}
