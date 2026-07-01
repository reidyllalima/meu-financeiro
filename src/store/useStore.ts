import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { AppSettings, AppState, Bill, CardPurchase, Category, CreditCard, Expense, Income, MonthKey } from '../types';
import { DEFAULT_CATEGORIES } from '../lib/categories';
import { DEFAULT_INVOICE_ALERT_THRESHOLD, periodKey } from '../lib/calc';

function uid(): string {
  return crypto.randomUUID();
}

function togglePeriod(periods: string[], key: string): string[] {
  return periods.includes(key) ? periods.filter((p) => p !== key) : [...periods, key];
}

const initialState: AppState = {
  categories: DEFAULT_CATEGORIES,
  incomes: [],
  cards: [],
  cardPurchases: [],
  expenses: [],
  bills: [],
  settings: {
    currency: 'BRL',
    onboardingDismissed: false,
    overdraftBalance: 0,
  },
};

interface StoreActions {
  // Receitas
  addIncome: (data: Omit<Income, 'id' | 'createdAt'>) => void;
  updateIncome: (id: string, data: Partial<Omit<Income, 'id' | 'createdAt'>>) => void;
  removeIncome: (id: string) => void;

  // Cartões
  addCard: (data: Omit<CreditCard, 'id' | 'createdAt' | 'paidInvoicePeriods'>) => string;
  updateCard: (id: string, data: Partial<Omit<CreditCard, 'id' | 'createdAt'>>) => void;
  removeCard: (id: string) => void;
  toggleCardInvoicePaid: (cardId: string, monthKey: MonthKey) => void;

  // Compras no cartão (à vista ou parceladas) e financiamentos sem cartão
  addCardPurchase: (data: Omit<CardPurchase, 'id' | 'createdAt' | 'paidPeriods'>) => void;
  updateCardPurchase: (id: string, data: Partial<Omit<CardPurchase, 'id' | 'createdAt'>>) => void;
  removeCardPurchase: (id: string) => void;
  toggleCardPurchasePaid: (id: string, monthKey: MonthKey) => void;

  // Gastos em dinheiro/pix
  addExpense: (data: Omit<Expense, 'id' | 'createdAt'>) => void;
  updateExpense: (id: string, data: Partial<Omit<Expense, 'id' | 'createdAt'>>) => void;
  removeExpense: (id: string) => void;

  // Contas do mês (recorrentes ou únicas)
  addBill: (data: Omit<Bill, 'id' | 'createdAt' | 'paidPeriods'>) => void;
  updateBill: (id: string, data: Partial<Omit<Bill, 'id' | 'createdAt'>>) => void;
  removeBill: (id: string) => void;
  toggleBillPaid: (id: string, monthKey: MonthKey) => void;

  // Categorias
  addCategory: (data: Omit<Category, 'id' | 'isCustom'>) => void;
  removeCategory: (id: string) => void;

  // Configurações
  updateSettings: (data: Partial<AppSettings>) => void;

  // Backup
  exportState: () => AppState;
  importState: (data: AppState) => void;
  resetAllData: () => void;
}

export type Store = AppState & StoreActions;

export const useStore = create<Store>()(
  persist(
    (set, get) => ({
      ...initialState,

      addIncome: (data) =>
        set((s) => ({ incomes: [...s.incomes, { ...data, id: uid(), createdAt: new Date().toISOString() }] })),
      updateIncome: (id, data) =>
        set((s) => ({ incomes: s.incomes.map((i) => (i.id === id ? { ...i, ...data } : i)) })),
      removeIncome: (id) => set((s) => ({ incomes: s.incomes.filter((i) => i.id !== id) })),

      addCard: (data) => {
        const id = uid();
        set((s) => ({
          cards: [...s.cards, { ...data, id, paidInvoicePeriods: [], createdAt: new Date().toISOString() }],
        }));
        return id;
      },
      updateCard: (id, data) => set((s) => ({ cards: s.cards.map((c) => (c.id === id ? { ...c, ...data } : c)) })),
      removeCard: (id) =>
        set((s) => ({
          cards: s.cards.filter((c) => c.id !== id),
          cardPurchases: s.cardPurchases.filter((p) => p.cardId !== id),
        })),
      toggleCardInvoicePaid: (cardId, monthKey) =>
        set((s) => ({
          cards: s.cards.map((c) =>
            c.id === cardId ? { ...c, paidInvoicePeriods: togglePeriod(c.paidInvoicePeriods, periodKey(monthKey)) } : c,
          ),
        })),

      addCardPurchase: (data) =>
        set((s) => ({
          cardPurchases: [...s.cardPurchases, { ...data, id: uid(), paidPeriods: [], createdAt: new Date().toISOString() }],
        })),
      updateCardPurchase: (id, data) =>
        set((s) => ({ cardPurchases: s.cardPurchases.map((p) => (p.id === id ? { ...p, ...data } : p)) })),
      removeCardPurchase: (id) => set((s) => ({ cardPurchases: s.cardPurchases.filter((p) => p.id !== id) })),
      toggleCardPurchasePaid: (id, monthKey) =>
        set((s) => ({
          cardPurchases: s.cardPurchases.map((p) =>
            p.id === id ? { ...p, paidPeriods: togglePeriod(p.paidPeriods, periodKey(monthKey)) } : p,
          ),
        })),

      addExpense: (data) =>
        set((s) => ({ expenses: [...s.expenses, { ...data, id: uid(), createdAt: new Date().toISOString() }] })),
      updateExpense: (id, data) =>
        set((s) => ({ expenses: s.expenses.map((e) => (e.id === id ? { ...e, ...data } : e)) })),
      removeExpense: (id) => set((s) => ({ expenses: s.expenses.filter((e) => e.id !== id) })),

      addBill: (data) =>
        set((s) => ({ bills: [...s.bills, { ...data, id: uid(), paidPeriods: [], createdAt: new Date().toISOString() }] })),
      updateBill: (id, data) => set((s) => ({ bills: s.bills.map((b) => (b.id === id ? { ...b, ...data } : b)) })),
      removeBill: (id) => set((s) => ({ bills: s.bills.filter((b) => b.id !== id) })),
      toggleBillPaid: (id, monthKey) =>
        set((s) => ({
          bills: s.bills.map((b) =>
            b.id === id ? { ...b, paidPeriods: togglePeriod(b.paidPeriods, periodKey(monthKey)) } : b,
          ),
        })),

      addCategory: (data) =>
        set((s) => ({ categories: [...s.categories, { ...data, id: uid(), isCustom: true }] })),
      removeCategory: (id) => set((s) => ({ categories: s.categories.filter((c) => c.id !== id) })),

      updateSettings: (data) => set((s) => ({ settings: { ...s.settings, ...data } })),

      exportState: () => {
        const { categories, incomes, cards, cardPurchases, expenses, bills, settings } = get();
        return { categories, incomes, cards, cardPurchases, expenses, bills, settings };
      },
      importState: (data) => set(() => ({ ...data })),
      resetAllData: () => set(() => ({ ...initialState, categories: DEFAULT_CATEGORIES })),
    }),
    {
      name: 'gtp-faturas-storage',
      version: 4,
      storage: createJSONStorage(() => localStorage),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      migrate: (persisted: any, version) => {
        if (version < 2) {
          persisted.cards = (persisted.cards ?? []).map((c: Omit<CreditCard, 'paidInvoicePeriods'>) => ({
            paidInvoicePeriods: [],
            ...c,
          }));
          persisted.cardPurchases = (persisted.cardPurchases ?? []).map((p: Omit<CardPurchase, 'paidPeriods'>) => ({
            paidPeriods: [],
            ...p,
          }));
          persisted.bills = (persisted.recurringBills ?? []).map((b: { id: string; description: string; amount: number; categoryId: string; dueDay: number; active: boolean; createdAt: string }) => ({
            id: b.id,
            description: b.description,
            amount: b.amount,
            categoryId: b.categoryId,
            recurring: true,
            active: b.active,
            paidPeriods: [],
            createdAt: b.createdAt,
          }));
          delete persisted.recurringBills;
        }
        if (version < 3) {
          persisted.settings = { overdraftBalance: 0, ...persisted.settings };
        }
        if (version < 4) {
          persisted.cards = (persisted.cards ?? []).map((c: Omit<CreditCard, 'alertThreshold'>) => ({
            alertThreshold: DEFAULT_INVOICE_ALERT_THRESHOLD,
            ...c,
          }));
        }
        return persisted;
      },
    },
  ),
);
