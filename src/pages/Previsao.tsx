import { useMemo } from 'react';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { LineChart as LineChartIcon } from 'lucide-react';
import { Panel } from '../components/ui/Panel';
import { EmptyState } from '../components/ui/EmptyState';
import { useStore } from '../store/useStore';
import { buildForecast, formatCurrency, formatMonthLabel, formatMonthShort } from '../lib/calc';

const MONTHS_AHEAD = 6;

export function Previsao() {
  const incomes = useStore((s) => s.incomes);
  const cardPurchases = useStore((s) => s.cardPurchases);
  const bills = useStore((s) => s.bills);

  const forecast = useMemo(
    () => buildForecast(incomes, cardPurchases, bills, MONTHS_AHEAD),
    [incomes, cardPurchases, bills],
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
        </>
      )}
    </div>
  );
}
