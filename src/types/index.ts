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
  /** Faturas marcadas como pagas, formato "YYYY-MM" */
  paidInvoicePeriods: string[];
  createdAt: string;
}

/**
 * Toda compra no cartão de crédito — à vista (totalInstallments = 1) ou parcelada.
 * A data de cada parcela é derivada (não armazenada) a partir de anchorMonth/anchorYear
 * e do ciclo de fechamento/vencimento do cartão, via lib/calc.ts.
 *
 * `cardId` é opcional: quando ausente, representa um financiamento/parcelamento direto
 * (ex: celular financiado, dívida parcelada com alguém) que não passa por fatura de cartão.
 */
export interface CardPurchase {
  id: string;
  description: string;
  categoryId: string;
  cardId?: string;
  totalAmount: number;
  installmentValue: number;
  totalInstallments: number;
  /** Número da parcela (1-based) que cai na fatura de anchorMonth/anchorYear */
  anchorInstallmentNumber: number;
  anchorMonth: number; // 0-11
  anchorYear: number;
  purchaseDate: string; // ISO yyyy-mm-dd, referência/exibição
  /** Parcelas marcadas como pagas manualmente, formato "YYYY-MM" (usado por compras sem cartão) */
  paidPeriods: string[];
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

/**
 * Conta do mês (aluguel, internet, assinaturas, pagamentos avulsos...) usada no
 * checklist "Contas do Mês" e na Previsão financeira.
 *
 * Recorrente: repete todo mês enquanto `active` for true.
 * Única: vale só para o mês/ano informado (ex: um pagamento avulso deste mês).
 */
export interface Bill {
  id: string;
  description: string;
  amount: number;
  categoryId: string;
  recurring: boolean;
  active: boolean; // relevante apenas quando recurring = true
  month?: number; // 0-11, obrigatório se !recurring
  year?: number;
  /** Períodos em que essa conta foi marcada como paga, formato "YYYY-MM" */
  paidPeriods: string[];
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
  bills: Bill[];
  settings: AppSettings;
}

export interface MonthKey {
  month: number; // 0-11
  year: number;
}
