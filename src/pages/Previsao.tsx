import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { ChevronRight, LineChart as LineChartIcon } from 'lucide-react';
import { Panel } from '../components/ui/Panel';
import { EmptyState } from '../components/ui/EmptyState';
import { useStore } from '../store/useStore';
import { buildForecast, cardTotalsForMonth, formatCurrency, formatMonthLabel, formatMonthShort } from '../lib/calc';

const MONTHS_AHEAD = 6;

export function Previsao() {
  const navigate = useNavigate();
  const incomes = useStore((s) => s.incomes);
  const cardPurchases = useStore((s) => s.cardPurchases);
  const bills = useStore((s) => s.bills);
  const cards = useStore((s) => s.cards);

  const forecast = useMemo(
    () => buildForecast(incomes, cardPurchases, bills, MONTHS_AHEAD),
    [incomes, cardPurchases, bills],
  );

  const cardForecast = useMemo(
    () => forecast.map((f) => cardTotalsForMonth(cardPurchases, cards, f.monthKey)),
    [forecast, cardPurchases, cards],
  );

  const chartData = forecast.map((f) => ({
    name: formatMonthShort(f.monthKey),
    Receita: f.income,
    Comprometido: f.cardCommitted + f.recurringBills,
  }));

  const hasAnyData = incomes.length > 0 || cardPurchases.length > 0 || bills.length > 0;

  return (
    <div className="flex flex-col gap-5 pb-4">
      <div>
        <h1 className="text-xl font-bold text-[var(--color-ink)]">Previsão financeira</h1>
        <p className="mt-1 text-sm text-[var(--color-ink-faint)]">
          Quanto do seu salário dos próximos meses já está comprometido.
        </p>
      </div>

      {!hasAnyData ? (
        <EmptyState
          icon={LineChartIcon}
          title="Sem dados suficientes"
          description="Cadastre sua renda, cartões e contas em Configurações para ver a previsão."
        />
      ) : (
        <>
          <Panel>
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} barGap={4}>
                  <CartesianGrid vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="name" tickLine={false} axisLine={false} fontSize={12} />
                  <YAxis hide />
                  <Tooltip formatter={(v) => formatCurrency(Number(v))} />
                  <Bar dataKey="Receita" fill="#16a673" radius={[6, 6, 0, 0]} />
                  <Bar dataKey="Comprometido" fill="#f59e0b" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Panel>

          <div className="flex flex-col gap-3">
            {forecast.map((f, i) => (
              <Panel key={i}>
                <div className="flex items-center justify-between">
                  <p className="font-semibold text-[var(--color-ink)]">{formatMonthLabel(f.monthKey)}</p>
                  <p className={`text-[15px] font-bold ${f.balance < 0 ? 'text-[var(--color-danger-500)]' : 'text-[var(--color-brand-600)]'}`}>
                    {formatCurrency(f.balance)}
                  </p>
                </div>
                <button
                  onClick={() => navigate(`/contas?month=${f.monthKey.month}&year=${f.monthKey.year}`)}
                  className="mt-3 flex w-full items-center justify-between rounded-xl bg-slate-50 p-3 text-left transition-colors hover:bg-slate-100"
                >
                  <div>
                    <p className="text-xs text-[var(--color-ink-faint)]">Total de gastos previstos</p>
                    <p className="mt-0.5 text-lg font-bold text-[var(--color-ink)]">
                      {formatCurrency(f.cardCommitted + f.recurringBills)}
                    </p>
                  </div>
                  <ChevronRight className="h-5 w-5 shrink-0 text-[var(--color-ink-faint)]" />
                </button>

                <div className="mt-3 grid grid-cols-3 gap-2 text-center">
                  <div>
                    <p className="text-xs text-[var(--color-ink-faint)]">Receita</p>
                    <p className="mt-0.5 text-sm font-medium text-[var(--color-ink)]">{formatCurrency(f.income)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-[var(--color-ink-faint)]">Parcelas</p>
                    <p className="mt-0.5 text-sm font-medium text-[var(--color-ink)]">{formatCurrency(f.cardCommitted)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-[var(--color-ink-faint)]">Contas fixas</p>
                    <p className="mt-0.5 text-sm font-medium text-[var(--color-ink)]">{formatCurrency(f.recurringBills)}</p>
                  </div>
                </div>
              </Panel>
            ))}
          </div>

          {cards.length > 0 && (
            <Panel>
              <p className="mb-3 text-sm font-medium text-[var(--color-ink-soft)]">Previsão de faturas por cartão</p>
              <div className="flex flex-col gap-4">
                {cards.map((card, cardIndex) => (
                  <div key={card.id}>
                    <div className="mb-2 flex items-center gap-2">
                      <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: card.color }} />
                      <span className="text-sm font-medium text-[var(--color-ink)]">{card.name}</span>
                    </div>
                    <div className="relative -mx-4 sm:-mx-5">
                      <div className="flex gap-2 overflow-x-auto no-scrollbar px-4 sm:px-5">
                        {forecast.map((f, monthIndex) => {
                          const total = cardForecast[monthIndex][cardIndex].total;
                          return (
                            <div
                              key={monthIndex}
                              className="min-w-[92px] shrink-0 rounded-xl bg-slate-50 px-3 py-2 text-center"
                            >
                              <p className="text-xs text-[var(--color-ink-faint)]">{formatMonthShort(f.monthKey)}</p>
                              <p className="mt-0.5 text-sm font-semibold text-[var(--color-ink)]">{formatCurrency(total)}</p>
                            </div>
                          );
                        })}
                      </div>
                      <div className="pointer-events-none absolute inset-y-0 right-0 w-8 bg-gradient-to-l from-[var(--color-surface)] to-transparent" />
                    </div>
                  </div>
                ))}
              </div>
            </Panel>
          )}
        </>
      )}
    </div>
  );
}
