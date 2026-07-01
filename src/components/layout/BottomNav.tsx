import { NavLink } from 'react-router-dom';
import { LayoutDashboard, ClipboardList, CreditCard, Plus, MoreHorizontal } from 'lucide-react';
import { useUiStore } from '../../store/useUiStore';

const itemClass = (isActive: boolean) =>
  `flex flex-1 flex-col items-center justify-center gap-0.5 py-2 text-[11px] font-medium transition-colors ${
    isActive ? 'text-[var(--color-brand-600)]' : 'text-[var(--color-ink-faint)]'
  }`;

export function BottomNav() {
  const openQuickAdd = useUiStore((s) => s.openQuickAdd);
  const openMoreSheet = useUiStore((s) => s.openMoreSheet);

  return (
    <nav className="fixed inset-x-0 bottom-0 z-30 flex items-stretch border-t border-slate-200 bg-[var(--color-surface)]/95 backdrop-blur safe-bottom md:hidden">
      <NavLink to="/" end className={({ isActive }) => itemClass(isActive)}>
        <LayoutDashboard className="h-5 w-5" />
        Início
      </NavLink>
      <NavLink to="/cartoes" className={({ isActive }) => itemClass(isActive)}>
        <CreditCard className="h-5 w-5" />
        Cartões
      </NavLink>

      <div className="flex flex-1 items-center justify-center">
        <button
          onClick={openQuickAdd}
          aria-label="Novo gasto"
          className="-mt-6 flex h-14 w-14 items-center justify-center rounded-full bg-[var(--color-brand-500)] text-white shadow-lg shadow-[var(--color-brand-500)]/30 transition-transform active:scale-95"
        >
          <Plus className="h-6 w-6" />
        </button>
      </div>

      <NavLink to="/contas" className={({ isActive }) => itemClass(isActive)}>
        <ClipboardList className="h-5 w-5" />
        Contas
      </NavLink>
      <button onClick={openMoreSheet} className={itemClass(false)}>
        <MoreHorizontal className="h-5 w-5" />
        Mais
      </button>
    </nav>
  );
}
