import { useMemo, useState } from 'react';
import { CalendarClock } from 'lucide-react';
import { Panel } from '../components/ui/Panel';
import { ProgressBar } from '../components/ui/ProgressBar';
import { EmptyState } from '../components/ui/EmptyState';
import { useStore } from '../store/useStore';
import {
  currentInstallmentNumber,
  finalInstallmentMonth,
  formatCurrency,
  formatMonthLabel,
  isPurchaseFinished,
  outstandingAmount,
} from '../lib/calc';
import { getCategoryIcon } from '../lib/icons';

export function Parcelamentos() {
  const cardPurchases = useStore((s) => s.cardPurchases);
  const cards = useStore((s) => s.cards);
  const categories = useStore((s) => s.categories);

  const [tab, setTab] = useState<'ativos' | 'concluidos'>('ativos');

  const installmentPlans = useMemo(
    () => cardPurchases.filter((p) => p.totalInstallments > 1),
    [cardPurchases],
  );

  const filtered = installmentPlans
    .filter((p) => (tab === 'ativos' ? !isPurchaseFinished(p) : isPurchaseFinished(p)))
    .sort((a, b) => (a.purchaseDate < b.purchaseDate ? 1 : -1));

  const totalCommitted = installmentPlans
    .filter((p) => !isPurchaseFinished(p))
    .reduce((sum, p) => sum + outstandingAmount(p), 0);

  return (
    <div className="flex flex-col gap-5 pb-4">
      <h1 className="text-xl font-bold text-[var(--color-ink)]">Parcelamentos</h1>

      <Panel className="bg-[var(--color-ink)] text-white">
        <p className="text-sm text-white/60">Total ainda comprometido em parcelas</p>
        <p className="mt-1 text-2xl font-bold">{formatCurrency(totalCommitted)}</p>
      </Panel>

      <div className="flex gap-1 rounded-xl bg-slate-100 p-1">
        {(['ativos', 'concluidos'] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`flex-1 rounded-lg py-2 text-sm font-medium transition-colors ${
              tab === t ? 'bg-white text-[var(--color-ink)] shadow-sm' : 'text-[var(--color-ink-faint)]'
            }`}
          >
            {t === 'ativos' ? 'Em andamento' : 'Concluídos'}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon={CalendarClock}
          title={tab === 'ativos' ? 'Nenhum parcelamento em andamento' : 'Nenhum parcelamento concluído'}
          description="Compras parceladas no cartão ou financiamentos diretos aparecem aqui automaticamente."
        />
      ) : (
        <div className="flex flex-col gap-3">
          {filtered.map((p) => {
            const card = cards.find((c) => c.id === p.cardId);
            const cat = categories.find((c) => c.id === p.categoryId);
            const Icon = getCategoryIcon(cat?.icon ?? '');
            const current = Math.min(Math.max(currentInstallmentNumber(p), 1), p.totalInstallments);
            const progress = (current / p.totalInstallments) * 100;
            const finalMonth = finalInstallmentMonth(p);

            return (
              <Panel key={p.id}>
                <div className="flex items-start gap-3">
                  <div
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full"
                    style={{ backgroundColor: `${cat?.color ?? '#94a3b8'}1A` }}
                  >
                    <Icon className="h-[18px] w-[18px]" style={{ color: cat?.color ?? '#94a3b8' }} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium text-[var(--color-ink)]">{p.description}</p>
                    <p className="text-xs text-[var(--color-ink-faint)]">{card?.name ?? 'Sem cartão (financiamento direto)'}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-[var(--color-ink)]">{formatCurrency(p.installmentValue)}</p>
                    <p className="text-xs text-[var(--color-ink-faint)]">por mês</p>
                  </div>
                </div>

                <div className="mt-3">
                  <div className="mb-1.5 flex items-center justify-between text-xs text-[var(--color-ink-faint)]">
                    <span>
                      Parcela {current} de {p.totalInstallments}
                    </span>
                    <span>
                      {tab === 'ativos' ? `Termina em ${formatMonthLabel(finalMonth)}` : `Encerrado em ${formatMonthLabel(finalMonth)}`}
                    </span>
                  </div>
                  <ProgressBar value={progress} />
                </div>
              </Panel>
            );
          })}
        </div>
      )}
    </div>
  );
}
