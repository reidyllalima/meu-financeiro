import { addMonths, differenceInCalendarMonths, format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import type { Bill, CardPurchase, CreditCard, Expense, Income, MonthKey } from '../types';

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

/** Chave "YYYY-MM" usada para marcar períodos (faturas/contas/parcelas) como pagos. */
export function periodKey(monthKey: MonthKey): string {
  return `${monthKey.year}-${String(monthKey.month + 1).padStart(2, '0')}`;
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

/** Compras parceladas/financiamentos sem cartão vinculado (ex: celular financiado, dívida pessoal). */
export function cardlessOccurrencesForMonth(purchases: CardPurchase[], monthKey: MonthKey): CardOccurrence[] {
  return cardOccurrencesForMonth(
    purchases.filter((p) => !p.cardId),
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

// ---------- Contas (Bill) ----------

/** Se esta conta se aplica ao mês informado (recorrente ativa, ou única daquele mês/ano). */
export function billAppliesToMonth(bill: Bill, monthKey: MonthKey): boolean {
  if (bill.recurring) return bill.active;
  return bill.month === monthKey.month && bill.year === monthKey.year;
}

export function billsForMonth(bills: Bill[], monthKey: MonthKey): Bill[] {
  return bills.filter((b) => billAppliesToMonth(b, monthKey));
}

export function isBillPaidForMonth(bill: Bill, monthKey: MonthKey): boolean {
  return bill.paidPeriods.includes(periodKey(monthKey));
}

export function isCardPurchasePaidForMonth(purchase: CardPurchase, monthKey: MonthKey): boolean {
  return purchase.paidPeriods.includes(periodKey(monthKey));
}

export function isCardInvoicePaidForMonth(card: CreditCard, monthKey: MonthKey): boolean {
  return card.paidInvoicePeriods.includes(periodKey(monthKey));
}

// ---------- Cartões: limite ----------

export function cardUsedLimit(purchases: CardPurchase[], cardId: string, today: MonthKey = todayMonthKey()): number {
  return purchases
    .filter((p) => p.cardId === cardId)
    .reduce((sum, p) => sum + outstandingAmount(p, today), 0);
}

// ---------- Cartões: alerta de valor da fatura ----------

export const DEFAULT_INVOICE_ALERT_THRESHOLD = 2000;

/** Fator sobre o limite de alerta a partir do qual o alerta vira "vermelho" (bem acima do limite). */
const DANGER_MULTIPLIER = 1.2;

export type InvoiceAlertLevel = 'normal' | 'warning' | 'danger';

/**
 * Nível de alerta da fatura em relação ao limite configurado no cartão:
 * abaixo do limite = normal; a partir do limite = laranja (warning);
 * bem acima do limite (20%+) = vermelho (danger).
 */
export function invoiceAlertLevel(total: number, alertThreshold: number = DEFAULT_INVOICE_ALERT_THRESHOLD): InvoiceAlertLevel {
  if (alertThreshold <= 0) return 'normal';
  if (total >= alertThreshold * DANGER_MULTIPLIER) return 'danger';
  if (total >= alertThreshold) return 'warning';
  return 'normal';
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
  bills: Bill[],
  monthsAhead: number,
  startMonth: MonthKey = todayMonthKey(),
): MonthForecast[] {
  const result: MonthForecast[] = [];
  for (let i = 0; i < monthsAhead; i++) {
    const monthKey = addMonthsToKey(startMonth, i);
    const income = totalIncomeForMonth(incomes, monthKey);
    const cardCommitted = cardOccurrencesForMonth(cardPurchases, monthKey).reduce((s, o) => s + o.value, 0);
    const billsTotal = billsForMonth(bills, monthKey).reduce((s, b) => s + b.amount, 0);
    const balance = income - cardCommitted - billsTotal;
    result.push({ monthKey, income, cardCommitted, recurringBills: billsTotal, balance });
  }
  return result;
}

// ---------- Contas do Mês (checklist unificado) ----------

export type ChecklistItemKind = 'bill' | 'purchase' | 'invoice';

export interface ChecklistItem {
  key: string; // chave estável usada para marcar pago/pendente
  kind: ChecklistItemKind;
  description: string;
  badge?: string; // ex: "3/12"
  amount: number;
  categoryId?: string;
  paid: boolean;
  refId: string; // id da bill/compra/cartão de origem
}

export function buildMonthlyChecklist(
  bills: Bill[],
  cardPurchases: CardPurchase[],
  cards: CreditCard[],
  monthKey: MonthKey,
): ChecklistItem[] {
  const items: ChecklistItem[] = [];

  for (const bill of billsForMonth(bills, monthKey)) {
    items.push({
      key: `bill:${bill.id}`,
      kind: 'bill',
      description: bill.description,
      amount: bill.amount,
      categoryId: bill.categoryId,
      paid: isBillPaidForMonth(bill, monthKey),
      refId: bill.id,
    });
  }

  for (const occ of cardlessOccurrencesForMonth(cardPurchases, monthKey)) {
    items.push({
      key: `purchase:${occ.purchase.id}`,
      kind: 'purchase',
      description: occ.purchase.description,
      badge: occ.purchase.totalInstallments > 1 ? `${occ.installmentNumber}/${occ.purchase.totalInstallments}` : undefined,
      amount: occ.value,
      categoryId: occ.purchase.categoryId,
      paid: isCardPurchasePaidForMonth(occ.purchase, monthKey),
      refId: occ.purchase.id,
    });
  }

  for (const card of cards) {
    const total = cardOccurrencesForCardInMonth(cardPurchases, card.id, monthKey).reduce((s, o) => s + o.value, 0);
    if (total <= 0) continue;
    items.push({
      key: `invoice:${card.id}`,
      kind: 'invoice',
      description: `Fatura ${card.name}`,
      amount: total,
      paid: isCardInvoicePaidForMonth(card, monthKey),
      refId: card.id,
    });
  }

  return items;
}

// ---------- Parcelamento: cálculo do valor de cada parcela ----------

export function roundCurrency(value: number): number {
  return Math.round(value * 100) / 100;
}

export function computeInstallmentValue(totalAmount: number, count: number): number {
  return roundCurrency(totalAmount / count);
}
