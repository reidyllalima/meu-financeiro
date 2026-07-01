import { useMemo, useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { AlertTriangle, CheckCircle2, ChevronRight, HandCoins, Landmark, Pencil, Plus, Trash2, Wallet, TrendingDown, TrendingUp, Banknote, QrCode, CreditCard as CreditCardIcon } from 'lucide-react';
import { Panel } from '../components/ui/Panel';
import { ProgressBar } from '../components/ui/ProgressBar';
import { MonthSwitcher } from '../components/ui/MonthSwitcher';
import { EmptyState } from '../components/ui/EmptyState';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';
import { Sheet } from '../components/ui/Sheet';
import { Button } from '../components/ui/Button';
import { MoneyInput, TextField } from '../components/ui/fields';
import { useStore } from '../store/useStore';
import { useUiStore } from '../store/useUiStore';
import {
  addMonthsToKey,
  bankExpensesForMonth,
  buildForecast,
  cardOccurrencesForMonth,
  categoryTotalsForMonth,
  computeMonthOverdraft,
  expensesForMonth,
  formatCurrency,
  formatDateBR,
  formatMonthLabel,
  formatPercent,
  sameMonthKey,
  todayMonthKey,
} from '../lib/calc';
import type { Income, MonthKey } from '../types';
import { getCategoryIcon } from '../lib/icons';

const FORECAST_MONTHS_AHEAD = 3;

interface TimelineItem {
  key: string;
  id: string;
  kind: 'expense' | 'card';
  description: string;
  amount: number;
  categoryId: string;
  date: string;
  badge: string;
  paymentMethod?: string;
  isCardless: boolean;
  isMultiInstallment: boolean;
}

export function Dashboard() {
  const navigate = useNavigate();
  const [month, setMonth] = useState<MonthKey>(todayMonthKey());

  const incomes = useStore((s) => s.incomes);
  const expenses = useStore((s) => s.expenses);
  const cardPurchases = useStore((s) => s.cardPurchases);
  const cards = useStore((s) => s.cards);
  const bills = useStore((s) => s.bills);
  const categories = useStore((s) => s.categories);
  const overdraftBalance = useStore((s) => s.settings.overdraftBalance);
  const addIncome = useStore((s) => s.addIncome);
  const updateIncome = useStore((s) => s.updateIncome);
  const removeIncome = useStore((s) => s.removeIncome);
  const removeExpense = useStore((s) => s.removeExpense);
  const removeCardPurchase = useStore((s) => s.removeCardPurchase);
  const showToast = useUiStore((s) => s.showToast);

  const [extraBalanceOpen, setExtraBalanceOpen] = useState(false);
  const [editingIncomeId, setEditingIncomeId] = useState<string | null>(null);
  const [extraBalanceForm, setExtraBalanceForm] = useState({ description: '', amount: '' as number | '' });
  const [pendingIncomeDelete, setPendingIncomeDelete] = useState<Income | null>(null);

  function openAddExtraBalance() {
    setEditingIncomeId(null);
    setExtraBalanceForm({ description: '', amount: '' });
    setExtraBalanceOpen(true);
  }

  function openEditExtraBalance(inc: Income) {
    setEditingIncomeId(inc.id);
    setExtraBalanceForm({ description: inc.description, amount: inc.amount });
    setExtraBalanceOpen(true);
  }

  function handleSaveExtraBalance(e: FormEvent) {
    e.preventDefault();
    if (!extraBalanceForm.description.trim() || !extraBalanceForm.amount || extraBalanceForm.amount <= 0) return;
    if (editingIncomeId) {
      updateIncome(editingIncomeId, { description: extraBalanceForm.description.trim(), amount: extraBalanceForm.amount });
      showToast('Saldo atualizado');
    } else {
      addIncome({
        description: extraBalanceForm.description.trim(),
        amount: extraBalanceForm.amount,
        recurring: false,
        month: month.month,
        year: month.year,
      });
      showToast('Saldo adicionado');
    }
    setExtraBalanceForm({ description: '', amount: '' });
    setEditingIncomeId(null);
    setExtraBalanceOpen(false);
  }

  const monthExtraBalances = useMemo(
    () => incomes.filter((inc) => !inc.recurring && inc.month === month.month && inc.year === month.year),
    [incomes, month],
  );

  const upcomingForecast = useMemo(
    () => buildForecast(incomes, cardPurchases, bills, FORECAST_MONTHS_AHEAD, addMonthsToKey(todayMonthKey(), 1)),
    [incomes, cardPurchases, bills],
  );

  const hasSetup = incomes.length > 0;

  const isCurrentMonth = sameMonthKey(month, todayMonthKey());
  const overdraftDeduction = isCurrentMonth ? overdraftBalance : 0;

  const rawIncome = useMemo(() => {
    return incomes.reduce((sum, inc) => {
      if (inc.recurring) return sum + inc.amount;
      if (inc.month === month.month && inc.year === month.year) return sum + inc.amount;
      return sum;
    }, 0);
  }, [incomes, month]);

  const income = rawIncome - overdraftDeduction;

  const bankExpensesThisMonth = useMemo(() => bankExpensesForMonth(expenses, month), [expenses, month]);
  const overdraftUsedThisMonth = useMemo(
    () => (isCurrentMonth ? computeMonthOverdraft(rawIncome, overdraftBalance, bankExpensesThisMonth).usedThisMonth : 0),
    [isCurrentMonth, rawIncome, overdraftBalance, bankExpensesThisMonth],
  );

  const monthExpenses = useMemo(() => expensesForMonth(expenses, month), [expenses, month]);
  const monthCardOccurrences = useMemo(() => cardOccurrencesForMonth(cardPurchases, month), [cardPurchases, month]);

  const totalSpent = useMemo(
    () => monthExpenses.reduce((s, e) => s + e.amount, 0) + monthCardOccurrences.reduce((s, o) => s + o.value, 0),
    [monthExpenses, monthCardOccurrences],
  );

  const balance = income - totalSpent;
  const percentUsed = income > 0 ? (totalSpent / income) * 100 : totalSpent > 0 ? 100 : 0;

  const alertLevel: 'ok' | 'warn' | 'danger' =
    percentUsed >= 100 ? 'danger' : percentUsed >= 80 ? 'warn' : 'ok';

  const categoryTotals = useMemo(
    () => categoryTotalsForMonth(expenses, cardPurchases, month),
    [expenses, cardPurchases, month],
  );

  const categoryData = categoryTotals.map((ct) => {
    const cat = categories.find((c) => c.id === ct.categoryId);
    return { name: cat?.name ?? 'Outros', value: ct.total, color: cat?.color ?? '#94a3b8' };
  });

  const timeline: TimelineItem[] = useMemo(() => {
    const fromExpenses: TimelineItem[] = monthExpenses.map((e) => ({
      key: `e-${e.id}`,
      id: e.id,
      kind: 'expense',
      description: e.description,
      amount: e.amount,
      categoryId: e.categoryId,
      date: e.date,
      badge: e.paymentMethod === 'pix' ? 'Pix' : e.paymentMethod === 'debito' ? 'Débito' : 'Dinheiro',
      paymentMethod: e.paymentMethod,
      isCardless: false,
      isMultiInstallment: false,
    }));
    const fromCards: TimelineItem[] = monthCardOccurrences.map((o) => {
      const card = cards.find((c) => c.id === o.purchase.cardId);
      const label = card?.name ?? 'Fiado';
      return {
        key: `c-${o.purchase.id}`,
        id: o.purchase.id,
        kind: 'card',
        description: o.purchase.description,
        amount: o.value,
        categoryId: o.purchase.categoryId,
        date: o.purchase.purchaseDate,
        badge: o.purchase.totalInstallments > 1 ? `${label} · ${o.installmentNumber}/${o.purchase.totalInstallments}` : label,
        isCardless: !card,
        isMultiInstallment: o.purchase.totalInstallments > 1,
      };
    });
    return [...fromExpenses, ...fromCards].sort((a, b) => (a.date < b.date ? 1 : -1));
  }, [monthExpenses, monthCardOccurrences, cards]);

  const [pendingDelete, setPendingDelete] = useState<{ id: string; kind: 'expense' | 'card'; multi: boolean } | null>(
    null,
  );

  function confirmDelete() {
    if (!pendingDelete) return;
    if (pendingDelete.kind === 'expense') removeExpense(pendingDelete.id);
    else removeCardPurchase(pendingDelete.id);
    showToast('Lançamento removido');
    setPendingDelete(null);
  }

  return (
    <div className="flex flex-col gap-5 pb-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-[var(--color-ink)]">Dashboard</h1>
        <MonthSwitcher value={month} onChange={setMonth} />
      </div>

      {!hasSetup && (
        <Panel className="border border-[var(--color-brand-100)] bg-[var(--color-brand-50)]">
          <p className="text-sm font-medium text-[var(--color-brand-700)]">
            Bem-vindo! Comece cadastrando sua renda em Configurações para ver seu dashboard completo.
          </p>
        </Panel>
      )}

      <Panel className="bg-[var(--color-ink)] text-white" padded>
        <p className="text-sm text-white/60">Saldo do mês</p>
        <p className={`mt-1 text-3xl font-bold ${balance < 0 ? 'text-red-400' : 'text-white'}`}>
          {formatCurrency(balance)}
        </p>
        {overdraftDeduction > 0 && (
          <p className="mt-1 text-xs text-white/60">
            Receita de {formatCurrency(rawIncome)} já com desconto de {formatCurrency(overdraftDeduction)} do cheque especial
          </p>
        )}
        {overdraftUsedThisMonth > 0 && (
          <p className="mt-1 flex items-center gap-1.5 text-xs text-amber-300">
            <Landmark className="h-3.5 w-3.5 shrink-0" />
            {formatCurrency(overdraftUsedThisMonth)} em Pix/Débito entraram no cheque especial este mês — será descontado da renda do mês que vem
          </p>
        )}
        <div className="mt-4 grid grid-cols-2 gap-4">
          <div>
            <div className="flex items-center gap-1.5 text-xs text-white/60">
              <TrendingUp className="h-3.5 w-3.5" /> Receita
            </div>
            <p className="mt-0.5 text-[15px] font-semibold">{formatCurrency(income)}</p>
          </div>
          <div>
            <div className="flex items-center gap-1.5 text-xs text-white/60">
              <TrendingDown className="h-3.5 w-3.5" /> Gastos
            </div>
            <p className="mt-0.5 text-[15px] font-semibold">{formatCurrency(totalSpent)}</p>
          </div>
        </div>
        <button
          onClick={openAddExtraBalance}
          className="mt-4 flex w-full items-center justify-center gap-1.5 rounded-xl bg-white/10 py-2 text-sm font-medium text-white hover:bg-white/15"
        >
          <Plus className="h-4 w-4" /> Adicionar saldo
        </button>
      </Panel>

      {monthExtraBalances.length > 0 && (
        <Panel padded={false} className="divide-y divide-slate-100">
          {monthExtraBalances.map((inc) => (
            <div key={inc.id} className="flex items-center gap-3 px-4 py-3">
              <div className="min-w-0 flex-1">
                <p className="break-words text-sm font-medium leading-snug text-[var(--color-ink)]">{inc.description}</p>
                <p className="text-xs text-[var(--color-ink-faint)]">Saldo extra</p>
              </div>
              <p className="shrink-0 text-sm font-semibold text-[var(--color-brand-600)]">{formatCurrency(inc.amount)}</p>
              <div className="flex shrink-0 items-center gap-1">
                <button
                  onClick={() => openEditExtraBalance(inc)}
                  className="flex h-8 w-8 items-center justify-center rounded-full text-[var(--color-ink-faint)] hover:bg-slate-100"
                  aria-label="Editar saldo"
                >
                  <Pencil className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setPendingIncomeDelete(inc)}
                  className="flex h-8 w-8 items-center justify-center rounded-full text-[var(--color-ink-faint)] hover:bg-red-50 hover:text-[var(--color-danger-500)]"
                  aria-label="Remover saldo"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </Panel>
      )}

      <Panel>
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium text-[var(--color-ink-soft)]">Orçamento utilizado</p>
          <p className="text-sm font-semibold text-[var(--color-ink)]">{formatPercent(percentUsed)}</p>
        </div>
        <div className="mt-2">
          <ProgressBar
            value={percentUsed}
            colorClass={
              alertLevel === 'danger'
                ? 'bg-[var(--color-danger-500)]'
                : alertLevel === 'warn'
                  ? 'bg-[var(--color-warn-500)]'
                  : 'bg-[var(--color-brand-500)]'
            }
          />
        </div>
        {alertLevel !== 'ok' && (
          <div
            className={`mt-3 flex items-start gap-2 rounded-xl p-3 text-sm ${
              alertLevel === 'danger' ? 'bg-[var(--color-danger-50)] text-[var(--color-danger-500)]' : 'bg-[var(--color-warn-50)] text-[var(--color-warn-500)]'
            }`}
          >
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
            <span>
              {alertLevel === 'danger'
                ? 'Você já ultrapassou a sua receita do mês.'
                : 'Atenção: seus gastos já estão próximos da sua receita do mês.'}
            </span>
          </div>
        )}
        {alertLevel === 'ok' && income > 0 && (
          <div className="mt-3 flex items-center gap-2 text-sm text-[var(--color-brand-600)]">
            <CheckCircle2 className="h-4 w-4" />
            Seus gastos estão sob controle este mês.
          </div>
        )}
      </Panel>

      {upcomingForecast.some((f) => f.cardCommitted + f.recurringBills > 0) && (
        <Panel>
          <p className="mb-3 text-sm font-medium text-[var(--color-ink-soft)]">Previsão dos próximos meses</p>
          <div className="flex flex-col divide-y divide-slate-100">
            {upcomingForecast.map((f, i) => (
              <button
                key={i}
                onClick={() => navigate(`/contas?month=${f.monthKey.month}&year=${f.monthKey.year}`)}
                className="flex items-center justify-between py-2.5 text-left first:pt-0 last:pb-0"
              >
                <div>
                  <p className="text-sm font-medium text-[var(--color-ink)]">{formatMonthLabel(f.monthKey)}</p>
                  <p className="text-xs text-[var(--color-ink-faint)]">Parcelas + contas fixas</p>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-sm font-semibold text-[var(--color-ink)]">
                    {formatCurrency(f.cardCommitted + f.recurringBills)}
                  </span>
                  <ChevronRight className="h-4 w-4 shrink-0 text-[var(--color-ink-faint)]" />
                </div>
              </button>
            ))}
          </div>
          <button
            onClick={() => navigate('/previsao')}
            className="mt-1 w-full rounded-xl bg-slate-50 py-2 text-center text-xs font-medium text-[var(--color-brand-600)] hover:bg-slate-100"
          >
            Ver previsão completa
          </button>
        </Panel>
      )}

      {categoryData.length > 0 && (
        <Panel>
          <p className="mb-3 text-sm font-medium text-[var(--color-ink-soft)]">Onde você mais gastou</p>
          <div className="flex flex-col items-center gap-4 sm:flex-row">
            <div className="h-44 w-44 shrink-0">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={categoryData} dataKey="value" nameKey="name" innerRadius={48} outerRadius={72} paddingAngle={2}>
                    {categoryData.map((entry, i) => (
                      <Cell key={i} fill={entry.color} stroke="none" />
                    ))}
                  </Pie>
                  <Tooltip formatter={(v) => formatCurrency(Number(v))} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex w-full flex-col gap-2">
              {categoryData.slice(0, 6).map((c, i) => (
                <div key={i} className="flex items-center gap-2 text-sm">
                  <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: c.color }} />
                  <span className="flex-1 truncate text-[var(--color-ink-soft)]">{c.name}</span>
                  <span className="font-medium text-[var(--color-ink)]">{formatCurrency(c.value)}</span>
                </div>
              ))}
            </div>
          </div>
        </Panel>
      )}

      <div>
        <p className="mb-2 text-sm font-medium text-[var(--color-ink-soft)]">Lançamentos do mês</p>
        {timeline.length === 0 ? (
          <EmptyState
            icon={Wallet}
            title="Nenhum gasto registrado"
            description="Toque no botão + para lançar seu primeiro gasto deste mês."
          />
        ) : (
          <Panel padded={false} className="divide-y divide-slate-100">
            {timeline.map((item) => (
              <TimelineRow
                key={item.key}
                item={item}
                onDelete={() => setPendingDelete({ id: item.id, kind: item.kind, multi: item.isMultiInstallment })}
              />
            ))}
          </Panel>
        )}
      </div>

      <ConfirmDialog
        open={!!pendingDelete}
        title="Remover lançamento?"
        description={
          pendingDelete?.multi
            ? 'Essa compra é parcelada. Remover vai excluir todas as parcelas (passadas e futuras).'
            : 'Essa ação não pode ser desfeita.'
        }
        confirmLabel="Remover"
        onConfirm={confirmDelete}
        onCancel={() => setPendingDelete(null)}
      />

      <ConfirmDialog
        open={!!pendingIncomeDelete}
        title="Remover saldo?"
        description="Essa ação não pode ser desfeita."
        confirmLabel="Remover"
        onConfirm={() => {
          if (pendingIncomeDelete) removeIncome(pendingIncomeDelete.id);
          showToast('Saldo removido');
          setPendingIncomeDelete(null);
        }}
        onCancel={() => setPendingIncomeDelete(null)}
      />

      <Sheet
        open={extraBalanceOpen}
        onClose={() => setExtraBalanceOpen(false)}
        title={editingIncomeId ? 'Editar saldo' : `Adicionar saldo · ${formatMonthLabel(month)}`}
      >
        <form onSubmit={handleSaveExtraBalance} className="flex flex-col gap-4">
          <p className="text-sm text-[var(--color-ink-faint)]">
            Dinheiro que você recebeu fora do salário — um freela, um presente, um reembolso — e que entra como saldo deste mês.
          </p>
          <TextField
            label="Descrição"
            placeholder="Ex: Freela do site, Presente do meu pai..."
            value={extraBalanceForm.description}
            onChange={(e) => setExtraBalanceForm({ ...extraBalanceForm, description: e.target.value })}
            autoFocus
            required
          />
          <MoneyInput
            label="Valor"
            value={extraBalanceForm.amount}
            onValueChange={(v) => setExtraBalanceForm({ ...extraBalanceForm, amount: v })}
            required
          />
          <Button type="submit" size="lg" full disabled={!extraBalanceForm.description.trim() || !extraBalanceForm.amount}>
            {editingIncomeId ? 'Salvar alterações' : 'Adicionar'}
          </Button>
        </form>
      </Sheet>
    </div>
  );
}

function TimelineRow({ item, onDelete }: { item: TimelineItem; onDelete: () => void }) {
  const category = useStore((s) => s.categories.find((c) => c.id === item.categoryId));
  const Icon = getCategoryIcon(category?.icon ?? '');
  const PaymentIcon =
    item.paymentMethod === 'pix'
      ? QrCode
      : item.paymentMethod === 'debito'
        ? Landmark
        : item.paymentMethod === 'dinheiro'
          ? Banknote
          : item.isCardless
            ? HandCoins
            : CreditCardIcon;

  return (
    <div className="flex items-start gap-3 px-4 py-3">
      <div
        className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-full"
        style={{ backgroundColor: `${category?.color ?? '#94a3b8'}1A` }}
      >
        <Icon className="h-[18px] w-[18px]" style={{ color: category?.color ?? '#94a3b8' }} />
      </div>
      <div className="min-w-0 flex-1">
        <p className="break-words text-[14.5px] font-medium leading-snug text-[var(--color-ink)]">{item.description}</p>
        <div className="mt-0.5 flex flex-wrap items-center gap-x-1 gap-y-0.5 text-xs text-[var(--color-ink-faint)]">
          <PaymentIcon className="h-3 w-3 shrink-0" />
          <span>{item.badge}</span>
          <span>·</span>
          <span>{formatDateBR(item.date)}</span>
        </div>
      </div>
      <div className="flex shrink-0 flex-col items-end gap-2">
        <p className="text-[14.5px] font-semibold text-[var(--color-ink)]">{formatCurrency(item.amount)}</p>
        <button
          onClick={onDelete}
          className="flex h-7 w-7 items-center justify-center rounded-full text-[var(--color-ink-faint)] hover:bg-red-50 hover:text-[var(--color-danger-500)]"
          aria-label="Remover"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
