import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type {
  AppSettings,
  AppState,
  CardPurchase,
  Category,
  CreditCard,
  Expense,
  Income,
  RecurringBill,
} from '../types';
import { DEFAULT_CATEGORIES } from '../lib/categories';

function uid(): string {
  return crypto.randomUUID();
}

const initialState: AppState = {
  categories: DEFAULT_CATEGORIES,
  incomes: [],
  cards: [],
  cardPurchases: [],
  expenses: [],
  recurringBills: [],
  settings: {
    currency: 'BRL',
    onboardingDismissed: false,
  },
};

interface StoreActions {
  // Receitas
  addIncome: (data: Omit<Income, 'id' | 'createdAt'>) => void;
  updateIncome: (id: string, data: Partial<Omit<Income, 'id' | 'createdAt'>>) => void;
  removeIncome: (id: string) => void;

  // Cartões
  addCard: (data: Omit<CreditCard, 'id' | 'createdAt'>) => string;
  updateCard: (id: string, data: Partial<Omit<CreditCard, 'id' | 'createdAt'>>) => void;
  removeCard: (id: string) => void;

  // Compras no cartão (à vista ou parceladas)
  addCardPurchase: (data: Omit<CardPurchase, 'id' | 'createdAt'>) => void;
  updateCardPurchase: (id: string, data: Partial<Omit<CardPurchase, 'id' | 'createdAt'>>) => void;
  removeCardPurchase: (id: string) => void;

  // Gastos em dinheiro/pix
  addExpense: (data: Omit<Expense, 'id' | 'createdAt'>) => void;
  updateExpense: (id: string, data: Partial<Omit<Expense, 'id' | 'createdAt'>>) => void;
  removeExpense: (id: string) => void;

  // Contas recorrentes
  addRecurringBill: (data: Omit<RecurringBill, 'id' | 'createdAt'>) => void;
  updateRecurringBill: (id: string, data: Partial<Omit<RecurringBill, 'id' | 'createdAt'>>) => void;
  removeRecurringBill: (id: string) => void;

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
        set((s) => ({ cards: [...s.cards, { ...data, id, createdAt: new Date().toISOString() }] }));
        return id;
      },
      updateCard: (id, data) => set((s) => ({ cards: s.cards.map((c) => (c.id === id ? { ...c, ...data } : c)) })),
      removeCard: (id) =>
        set((s) => ({
          cards: s.cards.filter((c) => c.id !== id),
          cardPurchases: s.cardPurchases.filter((p) => p.cardId !== id),
        })),

      addCardPurchase: (data) =>
        set((s) => ({
          cardPurchases: [...s.cardPurchases, { ...data, id: uid(), createdAt: new Date().toISOString() }],
        })),
      updateCardPurchase: (id, data) =>
        set((s) => ({ cardPurchases: s.cardPurchases.map((p) => (p.id === id ? { ...p, ...data } : p)) })),
      removeCardPurchase: (id) => set((s) => ({ cardPurchases: s.cardPurchases.filter((p) => p.id !== id) })),

      addExpense: (data) =>
        set((s) => ({ expenses: [...s.expenses, { ...data, id: uid(), createdAt: new Date().toISOString() }] })),
      updateExpense: (id, data) =>
        set((s) => ({ expenses: s.expenses.map((e) => (e.id === id ? { ...e, ...data } : e)) })),
      removeExpense: (id) => set((s) => ({ expenses: s.expenses.filter((e) => e.id !== id) })),

      addRecurringBill: (data) =>
        set((s) => ({
          recurringBills: [...s.recurringBills, { ...data, id: uid(), createdAt: new Date().toISOString() }],
        })),
      updateRecurringBill: (id, data) =>
        set((s) => ({ recurringBills: s.recurringBills.map((b) => (b.id === id ? { ...b, ...data } : b)) })),
      removeRecurringBill: (id) => set((s) => ({ recurringBills: s.recurringBills.filter((b) => b.id !== id) })),

      addCategory: (data) =>
        set((s) => ({ categories: [...s.categories, { ...data, id: uid(), isCustom: true }] })),
      removeCategory: (id) => set((s) => ({ categories: s.categories.filter((c) => c.id !== id) })),

      updateSettings: (data) => set((s) => ({ settings: { ...s.settings, ...data } })),

      exportState: () => {
        const { categories, incomes, cards, cardPurchases, expenses, recurringBills, settings } = get();
        return { categories, incomes, cards, cardPurchases, expenses, recurringBills, settings };
      },
      importState: (data) => set(() => ({ ...data })),
      resetAllData: () => set(() => ({ ...initialState, categories: DEFAULT_CATEGORIES })),
    }),
    {
      name: 'gtp-faturas-storage',
      version: 1,
      storage: createJSONStorage(() => localStorage),
    },
  ),
);
