import { useEffect, useState } from 'react';
import { arrayUnion, doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';

const MAX_USERS = 5;

export type AccessStatus = 'checking' | 'granted' | 'denied';

/**
 * Registra o uid num documento compartilhado (`meta/registry`) na primeira vez que
 * ele aparece, até um teto de MAX_USERS contas distintas. A regra de segurança do
 * Firestore reforça esse limite no servidor — este hook só decide o que mostrar na tela.
 */
export function useAccessControl(uid: string): AccessStatus {
  const [status, setStatus] = useState<AccessStatus>('checking');

  useEffect(() => {
    let cancelled = false;
    setStatus('checking');

    async function check() {
      const registryRef = doc(db, 'meta', 'registry');
      try {
        const snapshot = await getDoc(registryRef);
        const uids: string[] = snapshot.data()?.uids ?? [];

        if (uids.includes(uid)) {
          if (!cancelled) setStatus('granted');
          return;
        }

        if (uids.length >= MAX_USERS) {
          if (!cancelled) setStatus('denied');
          return;
        }

        await updateDoc(registryRef, { uids: arrayUnion(uid) });
        if (!cancelled) setStatus('granted');
      } catch {
        if (!cancelled) setStatus('denied');
      }
    }

    void check();
    return () => {
      cancelled = true;
    };
  }, [uid]);

  return status;
}
