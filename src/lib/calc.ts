import { addMonths, differenceInCalendarMonths, format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import type { CardPurchase, CreditCard, Expense, Income, MonthKey, RecurringBill } from '../types';

// ---------- MonthKey helpers ----------

export function monthKeyToDate(k: MonthKey): Date {
  return new Date(k.year, k.month, 1);
}

export function dateToMonthKey(d: Date): MonthKey {
  return { month: d.getMonth(), year: d.getFullYear() };
}

export function addMonthsToKey(k: MonthKey, n: number): MonthKey {
  return dateToMonthKey(addMonths(monthKeyToDate(k), n));
}

/** a - b, em número de meses */
export function monthKeyDiff(a: MonthKey, b: MonthKey): number {
  return differenceInCalendarMonths(monthKeyToDate(a), monthKeyToDate(b));
}

export function sameMonthKey(a: MonthKey, b: MonthKey): boolean {
  return a.month === b.month && a.year === b.year;
}

export function todayMonthKey(): MonthKey {
  return dateToMonthKey(new Date());
}

export function parseISODate(iso: string): Date {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d);
}

export function toISODate(d: Date): string {
  return format(d, 'yyyy-MM-dd');
}

export function todayISODate(): string {
  return toISODate(new Date());
}

export function formatMonthLabel(k: MonthKey): string {
  const label = format(monthKeyToDate(k), 'MMMM yyyy', { locale: ptBR });
  return label.charAt(0).toUpperCase() + label.slice(1);
}

export function formatMonthShort(k: MonthKey): string {
  const label = format(monthKeyToDate(k), 'MMM/yy', { locale: ptBR });
  return label.charAt(0).toUpperCase() + label.slice(1);
}

export function formatDateBR(iso: string): string {
  return format(parseISODate(iso), 'dd/MM/yyyy');
}

// ---------- Formatação monetária ----------

const currencyFormatter = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
});

export function formatCurrency(value: number): string {
  return currencyFormatter.format(value || 0);
}

export function formatPercent(value: number): string {
  return `${Math.round(value)}%`;
}

// ---------- Motor de faturas de cartão ----------

/**
 * Dado o dia de fechamento e vencimento de um cartão, determina em qual mês/ano
 * uma compra feita em `purchaseDateISO` será cobrada (mês de vencimento da fatura).
 *
 * Regra: se o dia da compra é depois do fechamento, ela cai na fatura do ciclo seguinte.
 * O vencimento da fatura é no mesmo mês do fechamento se dueDay > closingDay,
 * ou no mês seguinte ao fechamento se dueDay <= closingDay (caso mais comum:
 * ex. fecha dia 25, vence dia 5 do mês seguinte).
 */
export function invoiceMonthForPurchase(purchaseDateISO: string, closingDay: number, dueDay: number): MonthKey {
  const d = parseISODate(purchaseDateISO);
  const day = d.getDate();

  let closing: MonthKey = { month: d.getMonth(), year: d.getFullYear() };
  if (day > closingDay) {
    closing = addMonthsToKey(closing, 1);
  }

  return dueDay <= closingDay ? addMonthsToKey(closing, 1) : closing;
}

/** Mês/ano em que a parcela `installmentNumber` (1-based) desta compra vence. */
export function installmentOccurrenceMonth(purchase: CardPurchase, installmentNumber: number): MonthKey {
  const anchor: MonthKey = { month: purchase.anchorMonth, year: purchase.anchorYear };
  return addMonthsToKey(anchor, installmentNumber - purchase.anchorInstallmentNumber);
}

/**
 * Se `monthKey` corresponde à fatura de alguma parcela desta compra, retorna o número
 * dela (1-based). Caso contrário, retorna null.
 */
export function installmentNumberInMonth(purchase: CardPurchase, monthKey: MonthKey): number | null {
  const diff = monthKeyDiff(monthKey, { month: purchase.anchorMonth, year: purchase.anchorYear });
  const n = purchase.anchorInstallmentNumber + diff;
  return n >= 1 && n <= purchase.totalInstallments ? n : null;
}

/**
 * Número "corrente" da parcela relativo a hoje: 0 = ainda não começou a faturar,
 * 1..totalInstallments = parcela em curso, totalInstallments+1 = já quitada.
 */
export function currentInstallmentNumber(purchase: CardPurchase, today: MonthKey = todayMonthKey()): number {
  const diff = monthKeyDiff(today, { month: purchase.anchorMonth, year: purchase.anchorYear });
  const n = purchase.anchorInstallmentNumber + diff;
  return Math.min(Math.max(n, 0), purchase.totalInstallments + 1);
}

export function isPurchaseFinished(purchase: CardPurchase, today: MonthKey = todayMonthKey()): boolean {
  return currentInstallmentNumber(purchase, today) > purchase.totalInstallments;
}

export function finalInstallmentMonth(purchase: CardPurchase): MonthKey {
  return installmentOccurrenceMonth(purchase, purchase.totalInstallments);
}

/** Quanto do valor total da compra ainda está comprometido (não "quitado") em relação a hoje. */
export function outstandingAmount(purchase: CardPurchase, today: MonthKey = todayMonthKey()): number {
  const cur = currentInstallmentNumber(purchase, today);
  const paidCount = Math.min(Math.max(cur - 1, 0), purchase.totalInstallments);
  return (purchase.totalInstallments - paidCount) * purchase.installmentValue;
}

export interface CardOccurrence {
  purchase: CardPurchase;
  installmentNumber: number;
  value: number;
}

export function cardOccurrencesForMonth(purchases: CardPurchase[], monthKey: MonthKey): CardOccurrence[] {
  const result: CardOccurrence[] = [];
  for (const p of purchases) {
    const n = installmentNumberInMonth(p, monthKey);
    if (n !== null) result.push({ purchase: p, installmentNumber: n, value: p.installmentValue });
  }
  return result;
}

export function cardOccurrencesForCardInMonth(
  purchases: CardPurchase[],
  cardId: string,
  monthKey: MonthKey,
): CardOccurrence[] {
  return cardOccurrencesForMonth(
    purchases.filter((p) => p.cardId === cardId),
    monthKey,
  );
}

// ---------- Receitas ----------

export function totalIncomeForMonth(incomes: Income[], monthKey: MonthKey): number {
  return incomes.reduce((sum, inc) => {
    if (inc.recurring) return sum + inc.amount;
    if (inc.month === monthKey.month && inc.year === monthKey.year) return sum + inc.amount;
    return sum;
  }, 0);
}

// ---------- Gastos avulsos (dinheiro/pix) ----------

export function expensesForMonth(expenses: Expense[], monthKey: MonthKey): Expense[] {
  return expenses.filter((e) => {
    const d = parseISODate(e.date);
    return d.getMonth() === monthKey.month && d.getFullYear() === monthKey.year;
  });
}

// ---------- Agregações do mês (usadas no Dashboard) ----------

export function totalExpenseForMonth(expenses: Expense[], cardPurchases: CardPurchase[], monthKey: MonthKey): number {
  const cash = expensesForMonth(expenses, monthKey).reduce((s, e) => s + e.amount, 0);
  const card = cardOccurrencesForMonth(cardPurchases, monthKey).reduce((s, o) => s + o.value, 0);
  return cash + card;
}

export interface CategoryTotal {
  categoryId: string;
  total: number;
}

export function categoryTotalsForMonth(
  expenses: Expense[],
  cardPurchases: CardPurchase[],
  monthKey: MonthKey,
): CategoryTotal[] {
  const map = new Map<string, number>();

  for (const e of expensesForMonth(expenses, monthKey)) {
    map.set(e.categoryId, (map.get(e.categoryId) ?? 0) + e.amount);
  }
  for (const occ of cardOccurrencesForMonth(cardPurchases, monthKey)) {
    map.set(occ.purchase.categoryId, (map.get(occ.purchase.categoryId) ?? 0) + occ.value);
  }

  return Array.from(map.entries())
    .map(([categoryId, total]) => ({ categoryId, total }))
    .sort((a, b) => b.total - a.total);
}

export function cardTotalsForMonth(cardPurchases: CardPurchase[], cards: CreditCard[], monthKey: MonthKey) {
  return cards.map((card) => {
    const occurrences = cardOccurrencesForCardInMonth(cardPurchases, card.id, monthKey);
    const total = occurrences.reduce((s, o) => s + o.value, 0);
    return { card, total, occurrences };
  });
}

// ---------- Cartões: limite ----------

export function cardUsedLimit(purchases: CardPurchase[], cardId: string, today: MonthKey = todayMonthKey()): number {
  return purchases
    .filter((p) => p.cardId === cardId)
    .reduce((sum, p) => sum + outstandingAmount(p, today), 0);
}

// ---------- Previsão financeira ----------

export interface MonthForecast {
  monthKey: MonthKey;
  income: number;
  cardCommitted: number;
  recurringBills: number;
  balance: number;
}

export function buildForecast(
  incomes: Income[],
  cardPurchases: CardPurchase[],
  recurringBills: RecurringBill[],
  monthsAhead: number,
  startMonth: MonthKey = todayMonthKey(),
): MonthForecast[] {
  const activeBills = recurringBills.filter((b) => b.active);
  const billsTotal = activeBills.reduce((s, b) => s + b.amount, 0);

  const result: MonthForecast[] = [];
  for (let i = 0; i < monthsAhead; i++) {
    const monthKey = addMonthsToKey(startMonth, i);
    const income = totalIncomeForMonth(incomes, monthKey);
    const cardCommitted = cardOccurrencesForMonth(cardPurchases, monthKey).reduce((s, o) => s + o.value, 0);
    const balance = income - cardCommitted - billsTotal;
    result.push({ monthKey, income, cardCommitted, recurringBills: billsTotal, balance });
  }
  return result;
}

// ---------- Parcelamento: cálculo do valor de cada parcela ----------

export function roundCurrency(value: number): number {
  return Math.round(value * 100) / 100;
}

export function computeInstallmentValue(totalAmount: number, count: number): number {
  return roundCurrency(totalAmount / count);
}
