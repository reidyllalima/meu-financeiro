import {
  UtensilsCrossed,
  ShoppingCart,
  Car,
  Home,
  HeartPulse,
  GraduationCap,
  PartyPopper,
  ShoppingBag,
  ReceiptText,
  RefreshCcw,
  PawPrint,
  Plane,
  TrendingUp,
  CircleEllipsis,
  type LucideIcon,
} from 'lucide-react';

export const CATEGORY_ICONS: Record<string, LucideIcon> = {
  UtensilsCrossed,
  ShoppingCart,
  Car,
  Home,
  HeartPulse,
  GraduationCap,
  PartyPopper,
  ShoppingBag,
  ReceiptText,
  RefreshCcw,
  PawPrint,
  Plane,
  TrendingUp,
  CircleEllipsis,
};

export function getCategoryIcon(name: string): LucideIcon {
  return CATEGORY_ICONS[name] ?? CircleEllipsis;
}
