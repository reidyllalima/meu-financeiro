import { useMemo, useState, type FormEvent, type ReactNode } from 'react';
import { Banknote, HandCoins, QrCode, CreditCard as CreditCardIcon } from 'lucide-react';
import { Sheet } from './ui/Sheet';
import { Button } from './ui/Button';
import { MoneyInput, SelectField, TextField } from './ui/fields';
import { Toggle } from './ui/Toggle';
import { useStore } from '../store/useStore';
import { useUiStore } from '../store/useUiStore';
import {
  computeInstallmentValue,
  dateToMonthKey,
  formatCurrency,
  invoiceMonthForPurchase,
  parseISODate,
  todayISODate,
} from '../lib/calc';

type PaymentSelection = 'dinheiro' | 'pix' | 'fiado' | { cardId: string };

export function QuickAddModal() {
  const open = useUiStore((s) => s.quickAddOpen);
  const close = useUiStore((s) => s.closeQuickAdd);
  const showToast = useUiStore((s) => s.showToast);

  const categories = useStore((s) => s.categories);
  const cards = useStore((s) => s.cards);
  const addExpense = useStore((s) => s.addExpense);
  const addCardPurchase = useStore((s) => s.addCardPurchase);

  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState<number | ''>('');
  const [categoryId, setCategoryId] = useState(categories[0]?.id ?? '');
  const [payment, setPayment] = useState<PaymentSelection>('dinheiro');
  const [date, setDate] = useState(todayISODate());
  const [isInstallment, setIsInstallment] = useState(false);
  const [installments, setInstallments] = useState<number | ''>('');

  const selectedCard = typeof payment === 'object' ? cards.find((c) => c.id === payment.cardId) : undefined;
  const showInstallmentOption = selectedCard !== undefined || payment === 'fiado';

  const installmentPreview = useMemo(() => {
    if (!amount || !isInstallment || !installments || installments < 2) return null;
    return computeInstallmentValue(amount, installments);
  }, [amount, isInstallment, installments]);

  function resetForm() {
    setDescription('');
    setAmount('');
    setCategoryId(categories[0]?.id ?? '');
    setPayment('dinheiro');
    setDate(todayISODate());
    setIsInstallment(false);
    setInstallments('');
  }

  function handleClose() {
    resetForm();
    close();
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!amount || amount <= 0 || !description.trim()) return;
    if (showInstallmentOption && isInstallment && !installments) return;

    if (payment === 'dinheiro' || payment === 'pix') {
      addExpense({ description: description.trim(), amount, categoryId, paymentMethod: payment, date });
    } else if (selectedCard || payment === 'fiado') {
      const total = isInstallment ? Math.max(2, Number(installments) || 2) : 1;
      const installmentValue = total > 1 ? computeInstallmentValue(amount, total) : amount;
      const anchorMonthKey = selectedCard
        ? invoiceMonthForPurchase(date, selectedCard.closingDay, selectedCard.dueDay)
        : dateToMonthKey(parseISODate(date));
      addCardPurchase({
        description: description.trim(),
        categoryId,
        cardId: selectedCard?.id,
        totalAmount: amount,
        installmentValue,
        totalInstallments: total,
        anchorInstallmentNumber: 1,
        anchorMonth: anchorMonthKey.month,
        anchorYear: anchorMonthKey.year,
        purchaseDate: date,
      });
    }

    showToast('Gasto registrado com sucesso');
    handleClose();
  }

  return (
    <Sheet open={open} onClose={handleClose} title="Novo gasto">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <TextField
          label="Descrição"
          placeholder="Ex: Almoço, Uber, Farmácia..."
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          autoFocus
          required
        />

        <div className="grid grid-cols-2 gap-3">
          <MoneyInput label="Valor" value={amount} onValueChange={setAmount} required />
          <TextField label="Data" type="date" value={date} onChange={(e) => setDate(e.target.value)} required />
        </div>

        <SelectField label="Categoria" value={categoryId} onChange={(e) => setCategoryId(e.target.value)}>
          {categories.map((cat) => (
            <option key={cat.id} value={cat.id}>
              {cat.name}
            </option>
          ))}
        </SelectField>

        <div>
          <span className="mb-1.5 block text-[13px] font-medium text-[var(--color-ink-soft)]">
            Forma de pagamento
          </span>
          <div className="flex flex-wrap gap-2">
            <PaymentPill
              active={payment === 'dinheiro'}
              onClick={() => setPayment('dinheiro')}
              icon={<Banknote className="h-4 w-4" />}
              label="Dinheiro"
            />
            <PaymentPill
              active={payment === 'pix'}
              onClick={() => setPayment('pix')}
              icon={<QrCode className="h-4 w-4" />}
              label="Pix"
            />
            <PaymentPill
              active={payment === 'fiado'}
              onClick={() => setPayment('fiado')}
              icon={<HandCoins className="h-4 w-4" />}
              label="Fiado"
            />
            {cards.map((card) => (
              <PaymentPill
                key={card.id}
                active={typeof payment === 'object' && payment.cardId === card.id}
                onClick={() => setPayment({ cardId: card.id })}
                icon={<CreditCardIcon className="h-4 w-4" />}
                label={card.name}
                color={card.color}
              />
            ))}
          </div>
          {cards.length === 0 && (
            <p className="mt-2 text-xs text-[var(--color-ink-faint)]">
              Cadastre um cartão em Configurações para lançar gastos parcelados.
            </p>
          )}
        </div>

        {payment === 'fiado' && (
          <p className="-mt-1 text-xs text-[var(--color-ink-faint)]">
            Fiado: você levou agora e vai pagar depois. Fica registrado como uma pendência a pagar, à vista ou parcelada.
          </p>
        )}

        {showInstallmentOption && (
          <div className="rounded-xl bg-slate-50 p-3.5">
            <Toggle checked={isInstallment} onChange={setIsInstallment} label="Compra parcelada?" />
            {isInstallment && (
              <div className="mt-3 flex items-center gap-3">
                <TextField
                  type="number"
                  min={2}
                  max={48}
                  placeholder="Ex: 3"
                  value={installments}
                  onChange={(e) => setInstallments(e.target.value === '' ? '' : parseInt(e.target.value))}
                  className="w-24"
                />
                <span className="text-sm text-[var(--color-ink-soft)]">vezes</span>
                {installmentPreview !== null && (
                  <span className="ml-auto text-sm font-medium text-[var(--color-ink)]">
                    {installments}x de {formatCurrency(installmentPreview)}
                  </span>
                )}
              </div>
            )}
          </div>
        )}

        <Button
          type="submit"
          size="lg"
          full
          disabled={!amount || !description.trim() || (showInstallmentOption && isInstallment && !installments)}
        >
          Salvar gasto
        </Button>
      </form>
    </Sheet>
  );
}

function PaymentPill({
  active,
  onClick,
  icon,
  label,
  color,
}: {
  active: boolean;
  onClick: () => void;
  icon: ReactNode;
  label: string;
  color?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex items-center gap-1.5 rounded-full px-3.5 py-2 text-sm font-medium transition-colors ${
        active ? 'bg-[var(--color-ink)] text-white' : 'bg-slate-100 text-[var(--color-ink-soft)] hover:bg-slate-200'
      }`}
    >
      {color && active && <span className="h-2 w-2 rounded-full" style={{ backgroundColor: color }} />}
      {icon}
      {label}
    </button>
  );
}
