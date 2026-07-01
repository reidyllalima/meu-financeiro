import { useState } from 'react';
import { Link } from 'react-router-dom';
import { CreditCard, Plus, ChevronDown, ChevronUp } from 'lucide-react';
import { Panel } from '../components/ui/Panel';
import { ProgressBar } from '../components/ui/ProgressBar';
import { EmptyState } from '../components/ui/EmptyState';
import { Button } from '../components/ui/Button';
import { useStore } from '../store/useStore';
import {
  addMonthsToKey,
  cardOccurrencesForCardInMonth,
  cardUsedLimit,
  formatCurrency,
  formatMonthLabel,
  isPurchaseFinished,
  todayMonthKey,
} from '../lib/calc';
import { getCategoryIcon } from '../lib/icons';

export function Cartoes() {
  const cards = useStore((s) => s.cards);
  const cardPurchases = useStore((s) => s.cardPurchases);
  const categories = useStore((s) => s.categories);

  const currentMonth = todayMonthKey();
  const nextMonth = addMonthsToKey(currentMonth, 1);

  const [expandedId, setExpandedId] = useState<string | null>(cards[0]?.id ?? null);

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
          const currentInvoice = cardOccurrencesForCardInMonth(cardPurchases, card.id, currentMonth);
          const nextInvoice = cardOccurrencesForCardInMonth(cardPurchases, card.id, nextMonth);
          const currentTotal = currentInvoice.reduce((s, o) => s + o.value, 0);
          const nextTotal = nextInvoice.reduce((s, o) => s + o.value, 0);
          const purchases = cardPurchases
            .filter((p) => p.cardId === card.id)
            .filter((p) => !isPurchaseFinished(p))
            .sort((a, b) => (a.purchaseDate < b.purchaseDate ? 1 : -1));
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
                <div className="mt-4 flex items-end justify-between text-white">
                  <div>
                    <p className="text-xs text-white/70">Limite disponível</p>
                    <p className="text-xl font-bold">{formatCurrency(available)}</p>
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

              <div className="grid grid-cols-2 divide-x divide-slate-100 border-b border-slate-100">
                <div className="p-4">
                  <p className="text-xs text-[var(--color-ink-faint)]">Fatura de {formatMonthLabel(currentMonth)}</p>
                  <p className="mt-0.5 text-[15px] font-semibold text-[var(--color-ink)]">{formatCurrency(currentTotal)}</p>
                </div>
                <div className="p-4">
                  <p className="text-xs text-[var(--color-ink-faint)]">Próxima fatura ({formatMonthLabel(nextMonth)})</p>
                  <p className="mt-0.5 text-[15px] font-semibold text-[var(--color-ink)]">{formatCurrency(nextTotal)}</p>
                </div>
              </div>

              <button
                onClick={() => setExpandedId(expanded ? null : card.id)}
                className="flex w-full items-center justify-between px-4 py-3 text-sm font-medium text-[var(--color-ink-soft)] hover:bg-slate-50 sm:px-5"
              >
                Compras do cartão ({purchases.length})
                {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </button>

              {expanded && (
                <div className="divide-y divide-slate-100 border-t border-slate-100">
                  {purchases.length === 0 ? (
                    <p className="px-5 py-4 text-sm text-[var(--color-ink-faint)]">Nenhuma compra em aberto neste cartão.</p>
                  ) : (
                    purchases.map((p) => {
                      const cat = categories.find((c) => c.id === p.categoryId);
                      const Icon = getCategoryIcon(cat?.icon ?? '');
                      return (
                        <div key={p.id} className="flex items-center gap-3 px-4 py-3 sm:px-5">
                          <div
                            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full"
                            style={{ backgroundColor: `${cat?.color ?? '#94a3b8'}1A` }}
                          >
                            <Icon className="h-4 w-4" style={{ color: cat?.color ?? '#94a3b8' }} />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-medium text-[var(--color-ink)]">{p.description}</p>
                            <p className="text-xs text-[var(--color-ink-faint)]">
                              {p.totalInstallments > 1 ? `Parcelado em ${p.totalInstallments}x` : 'À vista'}
                            </p>
                          </div>
                          <p className="text-sm font-semibold text-[var(--color-ink)]">{formatCurrency(p.installmentValue)}</p>
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
    </div>
  );
}
