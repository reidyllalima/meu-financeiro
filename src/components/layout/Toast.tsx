import { AnimatePresence, motion } from 'framer-motion';
import { useEffect } from 'react';
import { CheckCircle2 } from 'lucide-react';
import { useUiStore } from '../../store/useUiStore';

export function Toast() {
  const toast = useUiStore((s) => s.toast);
  const clearToast = useUiStore((s) => s.clearToast);

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(clearToast, 2400);
    return () => clearTimeout(timer);
  }, [toast, clearToast]);

  return (
    <div className="pointer-events-none fixed inset-x-0 top-4 z-[70] flex justify-center px-4 safe-top">
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
            className="flex items-center gap-2 rounded-full bg-[var(--color-ink)] px-4 py-2.5 text-sm font-medium text-white shadow-lg"
          >
            <CheckCircle2 className="h-4 w-4 text-[var(--color-brand-400)]" />
            {toast}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
