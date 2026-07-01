/**
 * Modelo de dados do app. Tudo é serializável em JSON (persistido em localStorage).
 */

export type PaymentMethod = 'dinheiro' | 'pix';

export interface Category {
  id: string;
  name: string;
  icon: string; // nome do ícone lucide-react
  color: string; // classe tailwind ou hex
  isCustom: boolean;
}

export interface Income {
  id: string;
  description: string;
  amount: number;
  /** Receita recorrente (ex: salário) repete todo mês. Se false, é pontual e vale só para month/year. */
  recurring: boolean;
  month?: number; // 0-11, obrigatório se !recurring
  year?: number;
  createdAt: string;
}

export interface CreditCard {
  id: string;
  name: string;
  limit: number;
  /** Dia do mês em que a fatura fecha (1-31) */
  closingDay: number;
  /** Dia do mês em que a fatura vence (1-31) */
  dueDay: number;
  color: string;
  createdAt: string;
}

/**
 * Toda compra no cartão de crédito — à vista (totalInstallments = 1) ou parcelada.
 * A data de cada parcela é derivada (não armazenada) a partir de anchorMonth/anchorYear
 * e do ciclo de fechamento/vencimento do cartão, via lib/calc.ts.
 */
export interface CardPurchase {
  id: string;
  description: string;
  categoryId: string;
  cardId: string;
  totalAmount: number;
  installmentValue: number;
  totalInstallments: number;
  /** Número da parcela (1-based) que cai na fatura de anchorMonth/anchorYear */
  anchorInstallmentNumber: number;
  anchorMonth: number; // 0-11
  anchorYear: number;
  purchaseDate: string; // ISO yyyy-mm-dd, referência/exibição
  createdAt: string;
}

/** Gasto à vista em dinheiro ou Pix — impacta o mês da própria data. */
export interface Expense {
  id: string;
  description: string;
  amount: number;
  categoryId: string;
  paymentMethod: PaymentMethod;
  date: string; // ISO yyyy-mm-dd
  createdAt: string;
}

/** Conta fixa recorrente (aluguel, internet, assinaturas) usada na Previsão. */
export interface RecurringBill {
  id: string;
  description: string;
  amount: number;
  categoryId: string;
  dueDay: number;
  active: boolean;
  createdAt: string;
}

export interface AppSettings {
  currency: 'BRL';
  onboardingDismissed: boolean;
}

export interface AppState {
  categories: Category[];
  incomes: Income[];
  cards: CreditCard[];
  cardPurchases: CardPurchase[];
  expenses: Expense[];
  recurringBills: RecurringBill[];
  settings: AppSettings;
}

export interface MonthKey {
  month: number; // 0-11
  year: number;
}
