import { useState, type FormEvent } from 'react';
import { Plus, Trash2, Pencil, CreditCard } from 'lucide-react';
import { Panel } from '../../components/ui/Panel';
import { Button } from '../../components/ui/Button';
import { Sheet } from '../../components/ui/Sheet';
import { MoneyInput, TextField } from '../../components/ui/fields';
import { EmptyState } from '../../components/ui/EmptyState';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog';
import { useStore } from '../../store/useStore';
import { useUiStore } from '../../store/useUiStore';
import { DEFAULT_INVOICE_ALERT_THRESHOLD, formatCurrency } from '../../lib/calc';
import { CARD_COLORS } from '../../lib/categories';
import type { CreditCard as CreditCardType } from '../../types';

function emptyForm() {
  return {
    name: '',
    limit: 0,
    closingDay: '' as number | '',
    dueDay: '' as number | '',
    color: CARD_COLORS[0],
    alertThreshold: DEFAULT_INVOICE_ALERT_THRESHOLD,
  };
}

export function CardsSection() {
  const cards = useStore((s) => s.cards);
  const addCard = useStore((s) => s.addCard);
  const updateCard = useStore((s) => s.updateCard);
  const removeCard = useStore((s) => s.removeCard);
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

  function openEdit(card: CreditCardType) {
    setEditingId(card.id);
    setForm({
      name: card.name,
      limit: card.limit,
      closingDay: card.closingDay,
      dueDay: card.dueDay,
      color: card.color,
      alertThreshold: card.alertThreshold ?? DEFAULT_INVOICE_ALERT_THRESHOLD,
    });
    setSheetOpen(true);
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!form.name.trim() || form.limit <= 0 || !form.closingDay || !form.dueDay || form.alertThreshold <= 0) return;
    const data = { ...form, closingDay: Number(form.closingDay), dueDay: Number(form.dueDay) };
    if (editingId) {
      updateCard(editingId, data);
      showToast('Cartão atualizado');
    } else {
      addCard(data);
      showToast('Cartão cadastrado');
    }
    setSheetOpen(false);
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-semibold text-[var(--color-ink)]">Cartões de crédito</h2>
          <p className="text-xs text-[var(--color-ink-faint)]">Limite, fechamento e vencimento</p>
        </div>
        <Button size="sm" variant="secondary" onClick={openCreate}>
          <Plus className="h-4 w-4" /> Novo
        </Button>
      </div>

      {cards.length === 0 ? (
        <EmptyState icon={CreditCard} title="Nenhum cartão cadastrado" description="Cadastre seus cartões para lançar gastos e parcelamentos." />
      ) : (
        <Panel padded={false} className="divide-y divide-slate-100">
          {cards.map((card) => (
            <div key={card.id} className="flex items-start gap-3 px-4 py-3">
              <span className="mt-0.5 h-9 w-9 shrink-0 rounded-lg" style={{ backgroundColor: card.color }} />
              <div className="min-w-0 flex-1">
                <p className="break-words text-sm font-medium leading-snug text-[var(--color-ink)]">{card.name}</p>
                <p className="mt-0.5 text-xs text-[var(--color-ink-faint)]">
                  Limite {formatCurrency(card.limit)} · Fecha {card.closingDay} · Vence {card.dueDay}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-1">
                <button onClick={() => openEdit(card)} className="flex h-8 w-8 items-center justify-center rounded-full text-[var(--color-ink-faint)] hover:bg-slate-100">
                  <Pencil className="h-4 w-4" />
                </button>
                <button onClick={() => setPendingDeleteId(card.id)} className="flex h-8 w-8 items-center justify-center rounded-full text-[var(--color-ink-faint)] hover:bg-red-50 hover:text-[var(--color-danger-500)]">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </Panel>
      )}

      <Sheet open={sheetOpen} onClose={() => setSheetOpen(false)} title={editingId ? 'Editar cartão' : 'Novo cartão'}>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <TextField label="Nome do cartão" placeholder="Ex: Nubank, Inter, C6..." value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
          <MoneyInput label="Limite total" value={form.limit || ''} onValueChange={(v) => setForm({ ...form, limit: v })} required />
          <MoneyInput
            label="Alertar quando a fatura passar de"
            hint="A fatura fica laranja a partir desse valor, e vermelha bem acima dele."
            value={form.alertThreshold || ''}
            onValueChange={(v) => setForm({ ...form, alertThreshold: v })}
            required
          />
          <div className="grid grid-cols-2 gap-3">
            <TextField
              label="Dia do fechamento"
              type="number"
              min={1}
              max={31}
              placeholder="Ex: 20"
              value={form.closingDay}
              onChange={(e) => setForm({ ...form, closingDay: e.target.value === '' ? '' : parseInt(e.target.value) })}
              required
            />
            <TextField
              label="Dia do vencimento"
              type="number"
              min={1}
              max={31}
              placeholder="Ex: 27"
              value={form.dueDay}
              onChange={(e) => setForm({ ...form, dueDay: e.target.value === '' ? '' : parseInt(e.target.value) })}
              required
            />
          </div>
          <div>
            <span className="mb-1.5 block text-[13px] font-medium text-[var(--color-ink-soft)]">Cor</span>
            <div className="flex flex-wrap gap-2">
              {CARD_COLORS.map((color) => (
                <button
                  key={color}
                  type="button"
                  onClick={() => setForm({ ...form, color })}
                  className={`h-8 w-8 rounded-full ring-2 ring-offset-2 transition-all ${form.color === color ? 'ring-[var(--color-ink)]' : 'ring-transparent'}`}
                  style={{ backgroundColor: color }}
                  aria-label={color}
                />
              ))}
            </div>
          </div>
          <Button type="submit" size="lg" full>
            {editingId ? 'Salvar alterações' : 'Cadastrar cartão'}
          </Button>
        </form>
      </Sheet>

      <ConfirmDialog
        open={!!pendingDeleteId}
        title="Remover cartão?"
        description="Todas as compras e parcelamentos deste cartão também serão removidos."
        confirmLabel="Remover"
        onConfirm={() => {
          if (pendingDeleteId) removeCard(pendingDeleteId);
          showToast('Cartão removido');
          setPendingDeleteId(null);
        }}
        onCancel={() => setPendingDeleteId(null)}
      />
    </div>
  );
}
