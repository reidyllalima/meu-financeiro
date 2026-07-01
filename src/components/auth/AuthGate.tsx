import type { ReactNode } from 'react';
import { Wallet, ShieldAlert } from 'lucide-react';
import { useAuthStore } from '../../store/useAuthStore';
import { useCloudSync } from '../../hooks/useCloudSync';
import { useAccessControl } from '../../hooks/useAccessControl';
import { Button } from '../ui/Button';
import { Panel } from '../ui/Panel';

function FullScreenSpinner() {
  return (
    <div className="flex h-dvh items-center justify-center bg-[var(--color-bg)]">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-slate-200 border-t-[var(--color-brand-500)]" />
    </div>
  );
}

function LoginScreen() {
  const signInWithGoogle = useAuthStore((s) => s.signInWithGoogle);
  const error = useAuthStore((s) => s.error);

  return (
    <div className="flex h-dvh items-center justify-center bg-[var(--color-bg)] p-4">
      <Panel className="flex w-full max-w-sm flex-col items-center gap-4 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--color-brand-500)] text-white">
          <Wallet className="h-6 w-6" />
        </div>
        <div>
          <h1 className="text-lg font-semibold text-[var(--color-ink)]">Meu Financeiro</h1>
          <p className="text-sm text-[var(--color-ink-faint)]">
            Entre com sua conta Google para acessar seus dados na nuvem, sincronizados entre seus dispositivos.
          </p>
        </div>
        <Button full onClick={() => void signInWithGoogle()}>
          Entrar com Google
        </Button>
        {error && <p className="text-xs text-[var(--color-danger-500)]">{error}</p>}
      </Panel>
    </div>
  );
}

function AccessDeniedScreen() {
  const logOut = useAuthStore((s) => s.logOut);

  return (
    <div className="flex h-dvh items-center justify-center bg-[var(--color-bg)] p-4">
      <Panel className="flex w-full max-w-sm flex-col items-center gap-4 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--color-danger-50)] text-[var(--color-danger-500)]">
          <ShieldAlert className="h-6 w-6" />
        </div>
        <div>
          <h1 className="text-lg font-semibold text-[var(--color-ink)]">Acesso não liberado</h1>
          <p className="text-sm text-[var(--color-ink-faint)]">
            Este app já atingiu o limite de contas permitidas. Fale com o dono do app se você acha que deveria ter acesso.
          </p>
        </div>
        <Button full variant="secondary" onClick={() => void logOut()}>
          Sair
        </Button>
      </Panel>
    </div>
  );
}

function SyncedApp({ uid, children }: { uid: string; children: ReactNode }) {
  useCloudSync(uid);
  return <>{children}</>;
}

function SignedIn({ uid, children }: { uid: string; children: ReactNode }) {
  const access = useAccessControl(uid);

  if (access === 'checking') return <FullScreenSpinner />;
  if (access === 'denied') return <AccessDeniedScreen />;

  return <SyncedApp uid={uid}>{children}</SyncedApp>;
}

export function AuthGate({ children }: { children: ReactNode }) {
  const status = useAuthStore((s) => s.status);
  const user = useAuthStore((s) => s.user);

  if (status === 'loading') return <FullScreenSpinner />;
  if (status === 'signed-out' || !user) return <LoginScreen />;

  return <SignedIn uid={user.uid}>{children}</SignedIn>;
}
