import type { Category } from '../types';

export const DEFAULT_CATEGORIES: Category[] = [
  { id: 'alimentacao', name: 'Alimentação', icon: 'UtensilsCrossed', color: '#f97316', isCustom: false },
  { id: 'mercado', name: 'Mercado', icon: 'ShoppingCart', color: '#22c55e', isCustom: false },
  { id: 'transporte', name: 'Transporte', icon: 'Car', color: '#3b82f6', isCustom: false },
  { id: 'moradia', name: 'Moradia', icon: 'Home', color: '#a855f7', isCustom: false },
  { id: 'saude', name: 'Saúde', icon: 'HeartPulse', color: '#ef4444', isCustom: false },
  { id: 'educacao', name: 'Educação', icon: 'GraduationCap', color: '#0ea5e9', isCustom: false },
  { id: 'lazer', name: 'Lazer', icon: 'PartyPopper', color: '#ec4899', isCustom: false },
  { id: 'compras', name: 'Compras', icon: 'ShoppingBag', color: '#f59e0b', isCustom: false },
  { id: 'contas', name: 'Contas e Serviços', icon: 'ReceiptText', color: '#64748b', isCustom: false },
  { id: 'assinaturas', name: 'Assinaturas', icon: 'RefreshCcw', color: '#6366f1', isCustom: false },
  { id: 'pets', name: 'Pets', icon: 'PawPrint', color: '#84cc16', isCustom: false },
  { id: 'viagem', name: 'Viagem', icon: 'Plane', color: '#14b8a6', isCustom: false },
  { id: 'investimentos', name: 'Investimentos', icon: 'TrendingUp', color: '#059669', isCustom: false },
  { id: 'outros', name: 'Outros', icon: 'CircleEllipsis', color: '#78716c', isCustom: false },
];

export const CARD_COLORS = [
  '#0f172a',
  '#7c3aed',
  '#0ea5e9',
  '#16a673',
  '#e11d48',
  '#f59e0b',
  '#334155',
  '#9333ea',
];
