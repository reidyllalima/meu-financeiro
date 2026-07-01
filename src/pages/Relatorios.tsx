import { useMemo, useState } from 'react';
import { Bar, CartesianGrid, Line, ComposedChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { ArrowDownRight, ArrowUpRight, BarChart3, Minus } from 'lucide-react';
import { Panel } from '../components/ui/Panel';
import { MonthSwitcher } from '../components/ui/MonthSwitcher';
import { EmptyState } from '../components/ui/EmptyState';
import { useStore } from '../store/useStore';
import {
  addMonthsToKey,
  cardTotalsForMonth,
  categoryTotalsForMonth,
  formatCurrency,
  formatMonthLabel,
  formatMonthShort,
  totalExpenseForMonth,
  totalIncomeForMonth,
  todayMonthKey,
} from '../lib/calc';
import type { MonthKey } from '../types';

const HISTORY_MONTHS = 6;

export function Relatorios() {
  const [month, setMonth] = useState<MonthKey>(todayMonthKey());

  const expenses = useStore((s) => s.expenses);
  const cardPurchases = useStore((s) => s.cardPurchases);
  const incomes = useStore((s) => s.incomes);
  const cards = useStore((s) => s.cards);
  const categories = useStore((s) => s.categories);

  const categoryTotals = useMemo(
    () => categoryTotalsForMonth(expenses, cardPurchases, month),
    [expenses, cardPurchases, month],
  );

  const cardTotals = useMemo(
    () => cardTotalsForMonth(cardPurchases, cards, month).filter((c) => c.total > 0),
    [cardPurchases, cards, month],
  );

  const history = useMemo(() => {
    const months: MonthKey[] = [];
    for (let i = HISTORY_MONTHS - 1; i >= 0; i--) months.push(addMonthsToKey(todayMonthKey(), -i));
    return months.map((m) => ({
      monthKey: m,
      name: formatMonthShort(m),
      Receita: totalIncomeForMonth(incomes, m),
      Gastos: totalExpenseForMonth(expenses, cardPurchases, m),
    }));
  }, [incomes, expenses, cardPurchases]);

  const hasData = expenses.length > 0 || cardPurchases.length > 0;
  const maxCategory = categoryTotals[0]?.total ?? 0;

  return (
    <div className="flex flex-col gap-5 pb-4">
      <h1 className="text-xl font-bold text-[var(--color-ink)]">Relatórios</h1>

      {!hasData ? (
        <EmptyState
          icon={BarChart3}
          title="Sem gastos registrados ainda"
          description="Assim que você lançar gastos, os relatórios aparecem aqui."
        />
      ) : (
        <>
          <Panel>
            <p className="mb-3 text-sm font-medium text-[var(--color-ink-soft)]">Evolução mensal (receita x gastos)</p>
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={history}>
                  <CartesianGrid vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="name" tickLine={false} axisLine={false} fontSize={12} />
                  <YAxis yAxisId="gastos" hide domain={[0, (max: number) => max * 1.15]} />
                  <YAxis yAxisId="receita" orientation="right" hide domain={[0, (max: number) => max * 1.15]} />
                  <Tooltip formatter={(v) => formatCurrency(Number(v))} />
                  <Bar yAxisId="gastos" dataKey="Gastos" fill="#ef4444" radius={[6, 6, 0, 0]} barSize={22} />
                  <Line yAxisId="receita" type="monotone" dataKey="Receita" stroke="#16a673" strokeWidth={2.5} dot={{ r: 3 }} />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </Panel>

          <Panel>
            <p className="mb-3 text-sm font-medium text-[var(--color-ink-soft)]">Comparação entre meses</p>
            <div className="flex flex-col divide-y divide-slate-100">
              {history.map((h, i) => {
                const prev = history[i - 1];
                const delta = prev ? h.Gastos - prev.Gastos : 0;
                return (
                  <div key={i} className="flex items-center justify-between py-2.5">
                    <span className="text-sm text-[var(--color-ink-soft)]">{h.name}</span>
                    <span className="text-sm font-semibold text-[var(--color-ink)]">{formatCurrency(h.Gastos)}</span>
                    {prev ? (
                      <span
                        className={`flex w-24 items-center justify-end gap-1 text-xs font-medium ${
                          delta > 0 ? 'text-[var(--color-danger-500)]' : delta < 0 ? 'text-[var(--color-brand-600)]' : 'text-[var(--color-ink-faint)]'
                        }`}
                      >
                        {delta === 0 ? <Minus className="h-3 w-3" /> : delta > 0 ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                        {formatCurrency(Math.abs(delta))}
                      </span>
                    ) : (
                      <span className="w-24" />
                    )}
                  </div>
                );
              })}
            </div>
          </Panel>

          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-[var(--color-ink-soft)]">Detalhamento do mês</p>
            <MonthSwitcher value={month} onChange={setMonth} />
          </div>

          <Panel>
            <p className="mb-3 text-sm font-medium text-[var(--color-ink-soft)]">
              Gastos por categoria — {formatMonthLabel(month)}
            </p>
            {categoryTotals.length === 0 ? (
              <p className="text-sm text-[var(--color-ink-faint)]">Nenhum gasto neste mês.</p>
            ) : (
              <div className="flex flex-col gap-3">
                {categoryTotals.map((ct) => {
                  const cat = categories.find((c) => c.id === ct.categoryId);
                  const pct = maxCategory > 0 ? (ct.total / maxCategory) * 100 : 0;
                  return (
                    <div key={ct.categoryId}>
                      <div className="mb-1 flex items-center justify-between text-sm">
                        <span className="text-[var(--color-ink-soft)]">{cat?.name ?? 'Outros'}</span>
                        <span className="font-medium text-[var(--color-ink)]">{formatCurrency(ct.total)}</span>
                      </div>
                      <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                        <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: cat?.color ?? '#94a3b8' }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </Panel>

          <Panel>
            <p className="mb-3 text-sm font-medium text-[var(--color-ink-soft)]">
              Gastos por cartão — {formatMonthLabel(month)}
            </p>
            {cardTotals.length === 0 ? (
              <p className="text-sm text-[var(--color-ink-faint)]">Nenhum gasto no cartão neste mês.</p>
            ) : (
              <div className="flex flex-col gap-2">
                {cardTotals.map(({ card, total }) => (
                  <div key={card.id} className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: card.color }} />
                      <span className="text-[var(--color-ink-soft)]">{card.name}</span>
                    </div>
                    <span className="font-medium text-[var(--color-ink)]">{formatCurrency(total)}</span>
                  </div>
                ))}
              </div>
            )}
          </Panel>
        </>
      )}
    </div>
  );
}
