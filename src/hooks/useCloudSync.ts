import { useEffect, useRef } from 'react';
import { doc, onSnapshot, setDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useStore } from '../store/useStore';
import type { AppState } from '../types';

interface CloudDoc extends AppState {
  updatedAt: number;
}

const SYNC_DEBOUNCE_MS = 800;

/** Espelha o AppState do zustand num único documento Firestore (`users/{uid}`), em ambas as direções. */
export function useCloudSync(uid: string) {
  const lastPushedAt = useRef<number | null>(null);
  const hasLoadedRemote = useRef(false);
  const applyingRemote = useRef(false);

  useEffect(() => {
    lastPushedAt.current = null;
    hasLoadedRemote.current = false;
    applyingRemote.current = false;

    const ref = doc(db, 'users', uid);

    const unsubscribeSnapshot = onSnapshot(ref, (snapshot) => {
      const remote = snapshot.data() as CloudDoc | undefined;

      if (!remote) {
        // Documento ainda não existe: primeiro login neste projeto Firebase.
        // Se já houver dados locais (localStorage de uso anterior), sobem para o Firestore.
        if (!hasLoadedRemote.current) {
          hasLoadedRemote.current = true;
          const local = useStore.getState().exportState();
          const hasLocalData =
            local.incomes.length > 0 ||
            local.cards.length > 0 ||
            local.cardPurchases.length > 0 ||
            local.expenses.length > 0 ||
            local.bills.length > 0;
          if (hasLocalData) {
            const updatedAt = Date.now();
            lastPushedAt.current = updatedAt;
            void setDoc(ref, { ...local, updatedAt });
          }
        }
        return;
      }

      hasLoadedRemote.current = true;
      if (remote.updatedAt === lastPushedAt.current) return; // eco da própria escrita

      const data: AppState = {
        categories: remote.categories,
        incomes: remote.incomes,
        cards: remote.cards,
        cardPurchases: remote.cardPurchases,
        expenses: remote.expenses,
        bills: remote.bills,
        settings: remote.settings,
      };
      applyingRemote.current = true;
      useStore.getState().importState(data);
    });

    let timeout: ReturnType<typeof setTimeout> | undefined;
    const unsubscribeStore = useStore.subscribe(() => {
      if (applyingRemote.current) {
        applyingRemote.current = false;
        return;
      }
      if (!hasLoadedRemote.current) return;

      if (timeout) clearTimeout(timeout);
      timeout = setTimeout(() => {
        const updatedAt = Date.now();
        lastPushedAt.current = updatedAt;
        void setDoc(ref, { ...useStore.getState().exportState(), updatedAt });
      }, SYNC_DEBOUNCE_MS);
    });

    return () => {
      unsubscribeSnapshot();
      unsubscribeStore();
      if (timeout) clearTimeout(timeout);
    };
  }, [uid]);
}
