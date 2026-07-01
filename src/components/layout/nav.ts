import { LayoutDashboard, CreditCard, CalendarClock, LineChart, BarChart3, Settings } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

export interface NavItem {
  to: string;
  label: string;
  icon: LucideIcon;
}

export const NAV_ITEMS: NavItem[] = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/cartoes', label: 'Cartões', icon: CreditCard },
  { to: '/parcelamentos', label: 'Parcelamentos', icon: CalendarClock },
  { to: '/previsao', label: 'Previsão', icon: LineChart },
  { to: '/relatorios', label: 'Relatórios', icon: BarChart3 },
  { to: '/configuracoes', label: 'Configurações', icon: Settings },
];
