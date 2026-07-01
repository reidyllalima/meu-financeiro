import { create } from 'zustand';

interface UiStore {
  quickAddOpen: boolean;
  openQuickAdd: () => void;
  closeQuickAdd: () => void;
  moreSheetOpen: boolean;
  openMoreSheet: () => void;
  closeMoreSheet: () => void;
  toast: string | null;
  showToast: (message: string) => void;
  clearToast: () => void;
}

export const useUiStore = create<UiStore>((set) => ({
  quickAddOpen: false,
  openQuickAdd: () => set({ quickAddOpen: true }),
  closeQuickAdd: () => set({ quickAddOpen: false }),
  moreSheetOpen: false,
  openMoreSheet: () => set({ moreSheetOpen: true }),
  closeMoreSheet: () => set({ moreSheetOpen: false }),
  toast: null,
  showToast: (message) => set({ toast: message }),
  clearToast: () => set({ toast: null }),
}));
