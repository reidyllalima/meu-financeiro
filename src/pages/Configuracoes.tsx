import { useState } from 'react';
import { IncomesSection } from './configuracoes/IncomesSection';
import { CardsSection } from './configuracoes/CardsSection';
import { InstallmentsSection } from './configuracoes/InstallmentsSection';
import { BillsSection } from './configuracoes/BillsSection';
import { CategoriesSection } from './configuracoes/CategoriesSection';
import { BackupSection } from './configuracoes/BackupSection';

const TABS = [
  { id: 'receitas', label: 'Receitas' },
  { id: 'cartoes', label: 'Cartões' },
  { id: 'parcelamentos', label: 'Parcelamentos' },
  { id: 'contas', label: 'Contas' },
  { id: 'categorias', label: 'Categorias' },
  { id: 'backup', label: 'Backup' },
] as const;

type TabId = (typeof TABS)[number]['id'];

export function Configuracoes() {
  const [tab, setTab] = useState<TabId>('receitas');

  return (
    <div className="flex flex-col gap-5 pb-4">
      <h1 className="text-xl font-bold text-[var(--color-ink)]">Configurações</h1>

      <div className="-mx-4 flex gap-1 overflow-x-auto px-4 no-scrollbar sm:mx-0 sm:px-0">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`shrink-0 rounded-full px-4 py-2 text-sm font-medium transition-colors ${
              tab === t.id ? 'bg-[var(--color-ink)] text-white' : 'bg-slate-100 text-[var(--color-ink-soft)]'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'receitas' && <IncomesSection />}
      {tab === 'cartoes' && <CardsSection />}
      {tab === 'parcelamentos' && <InstallmentsSection />}
      {tab === 'contas' && <BillsSection />}
      {tab === 'categorias' && <CategoriesSection />}
      {tab === 'backup' && <BackupSection />}
    </div>
  );
}
