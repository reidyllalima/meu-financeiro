import { useState, type FormEvent } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { Panel } from '../../components/ui/Panel';
import { Button } from '../../components/ui/Button';
import { Sheet } from '../../components/ui/Sheet';
import { TextField } from '../../components/ui/fields';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog';
import { useStore } from '../../store/useStore';
import { useUiStore } from '../../store/useUiStore';
import { CATEGORY_ICONS, getCategoryIcon } from '../../lib/icons';
import { CARD_COLORS } from '../../lib/categories';

export function CategoriesSection() {
  const categories = useStore((s) => s.categories);
  const addCategory = useStore((s) => s.addCategory);
  const removeCategory = useStore((s) => s.removeCategory);
  const showToast = useUiStore((s) => s.showToast);

  const [sheetOpen, setSheetOpen] = useState(false);
  const [name, setName] = useState('');
  const [icon, setIcon] = useState(Object.keys(CATEGORY_ICONS)[0]);
  const [color, setColor] = useState(CARD_COLORS[0]);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);

  function openCreate() {
    setName('');
    setIcon(Object.keys(CATEGORY_ICONS)[0]);
    setColor(CARD_COLORS[0]);
    setSheetOpen(true);
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    addCategory({ name: name.trim(), icon, color });
    showToast('Categoria criada');
    setSheetOpen(false);
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-semibold text-[var(--color-ink)]">Categorias</h2>
          <p className="text-xs text-[var(--color-ink-faint)]">Organize seus gastos por tipo</p>
        </div>
        <Button size="sm" variant="secondary" onClick={openCreate}>
          <Plus className="h-4 w-4" /> Nova
        </Button>
      </div>

      <Panel padded={false} className="grid grid-cols-2 divide-x divide-y divide-slate-100 sm:grid-cols-3">
        {categories.map((cat) => {
          const Icon = getCategoryIcon(cat.icon);
          return (
            <div key={cat.id} className="flex items-center gap-2 px-3 py-3">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full" style={{ backgroundColor: `${cat.color}1A` }}>
                <Icon className="h-4 w-4" style={{ color: cat.color }} />
              </div>
              <span className="min-w-0 flex-1 truncate text-sm text-[var(--color-ink)]">{cat.name}</span>
              {cat.isCustom && (
                <button onClick={() => setPendingDeleteId(cat.id)} className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[var(--color-ink-faint)] hover:bg-red-50 hover:text-[var(--color-danger-500)]">
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          );
        })}
      </Panel>

      <Sheet open={sheetOpen} onClose={() => setSheetOpen(false)} title="Nova categoria">
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <TextField label="Nome" placeholder="Ex: Filhos, Carro, Home office..." value={name} onChange={(e) => setName(e.target.value)} required />
          <div>
            <span className="mb-1.5 block text-[13px] font-medium text-[var(--color-ink-soft)]">Ícone</span>
            <div className="grid grid-cols-7 gap-2">
              {Object.entries(CATEGORY_ICONS).map(([key, Icon]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setIcon(key)}
                  className={`flex h-9 w-9 items-center justify-center rounded-full transition-colors ${icon === key ? 'bg-[var(--color-ink)] text-white' : 'bg-slate-100 text-[var(--color-ink-soft)]'}`}
                >
                  <Icon className="h-4 w-4" />
                </button>
              ))}
            </div>
          </div>
          <div>
            <span className="mb-1.5 block text-[13px] font-medium text-[var(--color-ink-soft)]">Cor</span>
            <div className="flex flex-wrap gap-2">
              {CARD_COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  className={`h-8 w-8 rounded-full ring-2 ring-offset-2 transition-all ${color === c ? 'ring-[var(--color-ink)]' : 'ring-transparent'}`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>
          <Button type="submit" size="lg" full>
            Criar categoria
          </Button>
        </form>
      </Sheet>

      <ConfirmDialog
        open={!!pendingDeleteId}
        title="Remover categoria?"
        description="Gastos já lançados nessa categoria não serão apagados."
        confirmLabel="Remover"
        onConfirm={() => {
          if (pendingDeleteId) removeCategory(pendingDeleteId);
          showToast('Categoria removida');
          setPendingDeleteId(null);
        }}
        onCancel={() => setPendingDeleteId(null)}
      />
    </div>
  );
}
