import { useEffect, useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { CreditCard, Plus, ChevronDown, ChevronUp, CheckCircle2, CircleDashed, Pencil, Trash2 } from 'lucide-react';
import { Panel } from '../components/ui/Panel';
import { ProgressBar } from '../components/ui/ProgressBar';
import { EmptyState } from '../components/ui/EmptyState';
import { Button } from '../components/ui/Button';
import { MonthSwitcher } from '../components/ui/MonthSwitcher';
import { Sheet } from '../components/ui/Sheet';
import { MoneyInput, SelectField, TextField } from '../components/ui/fields';
import { Toggle } from '../components/ui/Toggle';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';
import { useStore } from '../store/useStore';
import { useUiStore } from '../store/useUiStore';
import {
  cardOccurrencesForCardInMonth,
  cardUsedLimit,
  computeInstallmentValue,
  DEFAULT_INVOICE_ALERT_THRESHOLD,
  formatCurrency,
  formatMonthLabel,
  invoiceAlertLevel,
  invoiceMonthForPurchase,
  isCardInvoicePaidForMonth,
  roundCurrency,
  todayISODate,
  todayMonthKey,
} from '../lib/calc';
import type { CardPurchase, CreditCard as CreditCardType, MonthKey } from '../types';
import { getCategoryIcon } from '../lib/icons';

function emptyPurchaseForm(categoryId: string) {
  return {
    description: '',
    amount: '' as number | '',
    categoryId,
    date: todayISODate(),
    isInstallment: false,
    installments: '' as number | '',
    installmentValue: '' as number | '',
  };
}

export function Cartoes() {
  const cards = useStore((s) => s.cards);
  const cardPurchases = useStore((s) => s.cardPurchases);
  const categories = useStore((s) => s.categories);
  const toggleCardInvoicePaid = useStore((s) => s.toggleCardInvoicePaid);
  const addCardPurchase = useStore((s) => s.addCardPurchase);
  const updateCardPurchase = useStore((s) => s.updateCardPurchase);
  const removeCardPurchase = useStore((s) => s.removeCardPurchase);
  const showToast = useUiStore((s) => s.showToast);

  const [month, setMonth] = useState<MonthKey>(todayMonthKey());
  const [expandedId, setExpandedId] = useState<string | null>(cards[0]?.id ?? null);

  const [purchaseCard, setPurchaseCard] = useState<CreditCardType | null>(null);
  const [editingPurchaseId, setEditingPurchaseId] = useState<string | null>(null);
  const [form, setForm] = useState(() => emptyPurchaseForm(categories[0]?.id ?? ''));
  const [pendingDeletePurchase, setPendingDeletePurchase] = useState<CardPurchase | null>(null);

  // Sugere o valor da parcela dividindo igualmente; o usuário pode ajustar
  // (a fatura real pode ter juros e não bater com a divisão exata).
  useEffect(() => {
    if (!editingPurchaseId && form.isInstallment && form.amount && form.installments && form.installments >= 2) {
      const suggested = computeInstallmentValue(form.amount, form.installments);
      setForm((f) => (f.installmentValue === suggested ? f : { ...f, installmentValue: suggested }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.amount, form.installments, form.isInstallment, editingPurchaseId]);

  function openAddPurchase(card: CreditCardType) {
    setEditingPurchaseId(null);
    setForm(emptyPurchaseForm(categories[0]?.id ?? ''));
    setPurchaseCard(card);
  }

  function openEditPurchase(purchase: CardPurchase, card: CreditCardType) {
    setEditingPurchaseId(purchase.id);
    setForm({
      description: purchase.description,
      amount: purchase.installmentValue,
      categoryId: purchase.categoryId,
      date: purchase.purchaseDate,
      isInstallment: purchase.totalInstallments > 1,
      installments: purchase.totalInstallments,
      installmentValue: purchase.installmentValue,
    });
    setPurchaseCard(card);
  }

  function handleSavePurchase(e: FormEvent) {
    e.preventDefault();
    if (!purchaseCard || !form.description.trim()) return;
    if (form.isInstallment && (!form.installments || !form.installmentValue)) return;
    if (!form.isInstallment && !form.amount) return;

    const total = form.isInstallment ? Math.max(2, Number(form.installments) || 2) : 1;
    const installmentValue = form.isInstallment ? Number(form.installmentValue) : Number(form.amount);
    const totalAmount = roundCurrency(installmentValue * total);

    if (editingPurchaseId) {
      updateCardPurchase(editingPurchaseId, {
        description: form.description.trim(),
        categoryId: form.categoryId,
        installmentValue,
        totalInstallments: total,
        totalAmount,
      });
      showToast('Compra atualizada');
    } else {
      const anchorMonthKey = invoiceMonthForPurchase(form.date, purchaseCard.closingDay, purchaseCard.dueDay);
      addCardPurchase({
        description: form.description.trim(),
        categoryId: form.categoryId,
        cardId: purchaseCard.id,
        totalAmount,
        installmentValue,
        totalInstallments: total,
        anchorInstallmentNumber: 1,
        anchorMonth: anchorMonthKey.month,
        anchorYear: anchorMonthKey.year,
        purchaseDate: form.date,
      });
      showToast('Compra registrada');
    }

    setPurchaseCard(null);
    setEditingPurchaseId(null);
  }

  return (
    <div className="flex flex-col gap-5 pb-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-[var(--color-ink)]">Cartões</h1>
        <Link to="/configuracoes">
          <Button size="sm" variant="secondary">
            <Plus className="h-4 w-4" /> Cartão
          </Button>
        </Link>
      </div>

      {cards.length > 0 && (
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium text-[var(--color-ink-soft)]">Fatura de</p>
          <MonthSwitcher value={month} onChange={setMonth} />
        </div>
      )}

      {cards.length === 0 ? (
        <EmptyState
          icon={CreditCard}
          title="Nenhum cartão cadastrado"
          description="Cadastre seus cartões de crédito para acompanhar limite, faturas e compras parceladas."
          action={
            <Link to="/configuracoes">
              <Button size="sm">Cadastrar cartão</Button>
            </Link>
          }
        />
      ) : (
        cards.map((card) => {
          const used = cardUsedLimit(cardPurchases, card.id);
          const available = Math.max(card.limit - used, 0);
          const usedPercent = card.limit > 0 ? (used / card.limit) * 100 : 0;
          const invoice = cardOccurrencesForCardInMonth(cardPurchases, card.id, month)
            .sort((a, b) => b.value - a.value);
          const invoiceTotal = invoice.reduce((s, o) => s + o.value, 0);
          const invoicePaid = isCardInvoicePaidForMonth(card, month);
          const alertLevel = invoiceAlertLevel(invoiceTotal, card.alertThreshold ?? DEFAULT_INVOICE_ALERT_THRESHOLD);
          const invoiceColorClass =
            alertLevel === 'danger'
              ? 'rounded-lg bg-[var(--color-danger-50)] px-2 py-0.5 text-[var(--color-danger-500)]'
              : alertLevel === 'warning'
                ? 'rounded-lg bg-[var(--color-warn-50)] px-2 py-0.5 text-[var(--color-warn-500)]'
                : 'text-white';
          const expanded = expandedId === card.id;

          return (
            <Panel key={card.id} padded={false} className="overflow-hidden">
              <div className="p-4 sm:p-5" style={{ background: `linear-gradient(135deg, ${card.color}, ${card.color}cc)` }}>
                <div className="flex items-center justify-between text-white">
                  <div className="flex items-center gap-2">
                    <CreditCard className="h-5 w-5" />
                    <span className="font-semibold">{card.name}</span>
                  </div>
                  <span className="text-xs text-white/80">
                    Fecha dia {card.closingDay} · Vence dia {card.dueDay}
                  </span>
                </div>

                <div className="mt-4 flex items-center justify-between">
                  <div>
                    <p className="text-xs text-white/70">Fatura de {formatMonthLabel(month)}</p>
                    <p className={`mt-0.5 inline-block text-2xl font-bold ${invoiceColorClass}`}>{formatCurrency(invoiceTotal)}</p>
                  </div>
                  {invoiceTotal > 0 && (
                    <button
                      onClick={() => toggleCardInvoicePaid(card.id, month)}
                      className={`flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold transition-colors ${
                        invoicePaid
                          ? 'bg-[var(--color-brand-100)] text-[var(--color-brand-700)]'
                          : 'bg-[var(--color-danger-50)] text-[var(--color-danger-500)]'
                      }`}
                    >
                      {invoicePaid ? <CheckCircle2 className="h-3.5 w-3.5" /> : <CircleDashed className="h-3.5 w-3.5" />}
                      {invoicePaid ? 'Paga' : 'Pendente'}
                    </button>
                  )}
                </div>

                <div className="mt-3 flex items-center justify-between text-white">
                  <div>
                    <p className="text-xs text-white/70">Limite disponível</p>
                    <p className="text-sm font-medium">{formatCurrency(available)}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-white/70">Limite total</p>
                    <p className="text-sm font-medium">{formatCurrency(card.limit)}</p>
                  </div>
                </div>
                <div className="mt-3">
                  <ProgressBar value={usedPercent} colorClass="bg-white" trackClassName="bg-white/25" height={6} />
                  <p className="mt-1.5 text-xs text-white/70">{formatCurrency(used)} usado de {formatCurrency(card.limit)}</p>
                </div>
              </div>

              <button
                onClick={() => openAddPurchase(card)}
                className="flex w-full items-center gap-2 border-b border-slate-100 px-4 py-3 text-sm font-medium text-[var(--color-brand-600)] hover:bg-slate-50 sm:px-5"
              >
                <Plus className="h-4 w-4" /> Nova compra
              </button>

              <button
                onClick={() => setExpandedId(expanded ? null : card.id)}
                className="flex w-full items-center justify-between px-4 py-3 text-sm font-medium text-[var(--color-ink-soft)] hover:bg-slate-50 sm:px-5"
              >
                Compras da fatura ({invoice.length})
                {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </button>

              {expanded && (
                <div className="divide-y divide-slate-100 border-t border-slate-100">
                  {invoice.length === 0 ? (
                    <p className="px-5 py-4 text-sm text-[var(--color-ink-faint)]">Nenhuma compra nesta fatura.</p>
                  ) : (
                    invoice.map((occ) => {
                      const p = occ.purchase;
                      const cat = categories.find((c) => c.id === p.categoryId);
                      const Icon = getCategoryIcon(cat?.icon ?? '');
                      return (
                        <div key={p.id} className="flex items-start gap-3 px-4 py-3 sm:px-5">
                          <div
                            className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full"
                            style={{ backgroundColor: `${cat?.color ?? '#94a3b8'}1A` }}
                          >
                            <Icon className="h-4 w-4" style={{ color: cat?.color ?? '#94a3b8' }} />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="break-words text-sm font-medium leading-snug text-[var(--color-ink)]">{p.description}</p>
                            <p className="text-xs text-[var(--color-ink-faint)]">
                              {p.totalInstallments > 1 ? `Parcela ${occ.installmentNumber}/${p.totalInstallments}` : 'À vista'}
                            </p>
                          </div>
                          <div className="flex shrink-0 flex-col items-end gap-2">
                            <p className="text-sm font-semibold text-[var(--color-ink)]">{formatCurrency(occ.value)}</p>
                            <div className="flex items-center gap-3">
                              <button
                                onClick={() => openEditPurchase(p, card)}
                                className="flex h-7 w-7 items-center justify-center rounded-full text-[var(--color-ink-faint)] hover:bg-slate-100"
                                aria-label="Editar compra"
                              >
                                <Pencil className="h-3.5 w-3.5" />
                              </button>
                              <button
                                onClick={() => setPendingDeletePurchase(p)}
                                className="flex h-7 w-7 items-center justify-center rounded-full text-[var(--color-ink-faint)] hover:bg-red-50 hover:text-[var(--color-danger-500)]"
                                aria-label="Remover compra"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              )}
            </Panel>
          );
        })
      )}

      <Sheet
        open={!!purchaseCard}
        onClose={() => {
          setPurchaseCard(null);
          setEditingPurchaseId(null);
        }}
        title={
          purchaseCard
            ? `${editingPurchaseId ? 'Editar compra' : 'Nova compra'} · ${purchaseCard.name}`
            : editingPurchaseId
              ? 'Editar compra'
              : 'Nova compra'
        }
      >
        <form onSubmit={handleSavePurchase} className="flex flex-col gap-4">
          <TextField
            label="Descrição"
            placeholder="Ex: Mercado, Farmácia, Notebook..."
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            autoFocus
            required
          />

          {editingPurchaseId ? (
            !form.isInstallment && (
              <MoneyInput label="Valor" value={form.amount} onValueChange={(v) => setForm({ ...form, amount: v })} required />
            )
          ) : (
            <div className="grid grid-cols-2 gap-3">
              <MoneyInput label="Valor" value={form.amount} onValueChange={(v) => setForm({ ...form, amount: v })} required />
              <TextField label="Data" type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} required />
            </div>
          )}

          <SelectField label="Categoria" value={form.categoryId} onChange={(e) => setForm({ ...form, categoryId: e.target.value })}>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>{cat.name}</option>
            ))}
          </SelectField>

          <div className="rounded-xl bg-slate-50 p-3.5">
            <Toggle checked={form.isInstallment} onChange={(v) => setForm({ ...form, isInstallment: v })} label="Compra parcelada?" />
            {form.isInstallment ? (
              <div className="mt-3 flex flex-col gap-3">
                <div className="flex items-center gap-3">
                  <TextField
                    type="number"
                    min={2}
                    max={48}
                    placeholder="Ex: 3"
                    value={form.installments}
                    onChange={(e) => setForm({ ...form, installments: e.target.value === '' ? '' : parseInt(e.target.value) })}
                    className="w-24"
                  />
                  <span className="text-sm text-[var(--color-ink-soft)]">vezes</span>
                </div>
                <MoneyInput
                  label="Valor de cada parcela"
                  hint="Ajuste aqui se a fatura tiver juros — não precisa ser o valor total dividido certinho."
                  value={form.installmentValue}
                  onValueChange={(v) => setForm({ ...form, installmentValue: v })}
                  required
                />
                {form.installments && form.installmentValue && (
                  <p className="text-xs text-[var(--color-ink-faint)]">
                    Total: {form.installments}x de {formatCurrency(form.installmentValue)} = {formatCurrency(roundCurrency(form.installmentValue * Number(form.installments)))}
                  </p>
                )}
              </div>
            ) : (
              <p className="mt-1 text-xs text-[var(--color-ink-faint)]">Cobrada inteira na próxima fatura em aberto (à vista).</p>
            )}
          </div>

          <Button
            type="submit"
            size="lg"
            full
            disabled={
              (!form.isInstallment && !form.amount) ||
              !form.description.trim() ||
              (form.isInstallment && (!form.installments || !form.installmentValue))
            }
          >
            {editingPurchaseId ? 'Salvar alterações' : 'Salvar compra'}
          </Button>
        </form>
      </Sheet>

      <ConfirmDialog
        open={!!pendingDeletePurchase}
        title="Remover compra?"
        description={
          pendingDeletePurchase && pendingDeletePurchase.totalInstallments > 1
            ? 'Isso remove o parcelamento inteiro (todas as parcelas, passadas e futuras).'
            : 'Essa ação não pode ser desfeita.'
        }
        confirmLabel="Remover"
        onConfirm={() => {
          if (pendingDeletePurchase) removeCardPurchase(pendingDeletePurchase.id);
          showToast('Compra removida');
          setPendingDeletePurchase(null);
        }}
        onCancel={() => setPendingDeletePurchase(null)}
      />
    </div>
  );
}
