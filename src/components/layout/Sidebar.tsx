import { NavLink } from 'react-router-dom';
import { Plus, Wallet } from 'lucide-react';
import { NAV_ITEMS } from './nav';
import { useUiStore } from '../../store/useUiStore';

export function Sidebar() {
  const openQuickAdd = useUiStore((s) => s.openQuickAdd);

  return (
    <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col border-r border-slate-200 bg-[var(--color-surface)] px-4 py-6 md:flex">
      <NavLink to="/" className="mb-8 flex items-center gap-2 px-2">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[var(--color-brand-500)]">
          <Wallet className="h-5 w-5 text-white" />
        </div>
        <span className="text-[16px] font-semibold text-[var(--color-ink)]">Meu Financeiro</span>
      </NavLink>

      <button
        onClick={openQuickAdd}
        className="mb-6 flex items-center justify-center gap-2 rounded-xl bg-[var(--color-brand-500)] px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-[var(--color-brand-600)]"
      >
        <Plus className="h-4 w-4" />
        Novo gasto
      </button>

      <nav className="flex flex-1 flex-col gap-1">
        {NAV_ITEMS.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-xl px-3 py-2.5 text-[14px] font-medium transition-colors ${
                isActive
                  ? 'bg-[var(--color-brand-50)] text-[var(--color-brand-700)]'
                  : 'text-[var(--color-ink-soft)] hover:bg-slate-100'
              }`
            }
          >
            <Icon className="h-[18px] w-[18px]" />
            {label}
          </NavLink>
        ))}
      </nav>

      <p className="px-2 text-[11px] text-[var(--color-ink-faint)]">
        Seus dados ficam salvos na nuvem, sincronizados com a sua conta.
      </p>
    </aside>
  );
}
