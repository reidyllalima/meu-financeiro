import { create } from 'zustand';
import { onAuthStateChanged, signInWithPopup, signOut, type User } from 'firebase/auth';
import { auth, googleProvider } from '../lib/firebase';

type AuthStatus = 'loading' | 'signed-out' | 'signed-in';

interface AuthStore {
  status: AuthStatus;
  user: User | null;
  error: string | null;
  signInWithGoogle: () => Promise<void>;
  logOut: () => Promise<void>;
}

export const useAuthStore = create<AuthStore>((set) => ({
  status: 'loading',
  user: null,
  error: null,
  signInWithGoogle: async () => {
    set({ error: null });
    try {
      await signInWithPopup(auth, googleProvider);
    } catch {
      set({ error: 'Não foi possível entrar com o Google. Tente novamente.' });
    }
  },
  logOut: async () => {
    await signOut(auth);
  },
}));

onAuthStateChanged(auth, (user) => {
  useAuthStore.setState({ user, status: user ? 'signed-in' : 'signed-out' });
});
