import { NavLink } from 'react-router-dom';
import { CalendarClock, LineChart, BarChart3, Settings, ChevronRight } from 'lucide-react';
import { Sheet } from '../ui/Sheet';
import { useUiStore } from '../../store/useUiStore';

const items = [
  { to: '/parcelamentos', label: 'Parcelamentos', description: 'Progresso de todas as compras parceladas e financiamentos', icon: CalendarClock },
  { to: '/previsao', label: 'Previsão financeira', description: 'Quanto do seu salário futuro já está comprometido', icon: LineChart },
  { to: '/relatorios', label: 'Relatórios', description: 'Gastos por categoria, cartão e evolução mensal', icon: BarChart3 },
  { to: '/configuracoes', label: 'Configurações', description: 'Receitas, cartões, categorias e backup', icon: Settings },
];

export function MoreSheet() {
  const open = useUiStore((s) => s.moreSheetOpen);
  const close = useUiStore((s) => s.closeMoreSheet);

  return (
    <Sheet open={open} onClose={close} title="Mais opções">
      <div className="flex flex-col gap-1">
        {items.map(({ to, label, description, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            onClick={close}
            className="flex items-center gap-3 rounded-xl px-2 py-3 hover:bg-slate-50"
          >
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-100">
              <Icon className="h-5 w-5 text-[var(--color-ink-soft)]" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[15px] font-medium text-[var(--color-ink)]">{label}</p>
              <p className="truncate text-xs text-[var(--color-ink-faint)]">{description}</p>
            </div>
            <ChevronRight className="h-4 w-4 text-[var(--color-ink-faint)]" />
          </NavLink>
        ))}
      </div>
    </Sheet>
  );
}
