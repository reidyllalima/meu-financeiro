import { lazy, Suspense } from 'react';
import { HashRouter, Routes, Route } from 'react-router-dom';
import { AppShell } from './components/layout/AppShell';

const Dashboard = lazy(() => import('./pages/Dashboard').then((m) => ({ default: m.Dashboard })));
const Contas = lazy(() => import('./pages/Contas').then((m) => ({ default: m.Contas })));
const Cartoes = lazy(() => import('./pages/Cartoes').then((m) => ({ default: m.Cartoes })));
const Parcelamentos = lazy(() => import('./pages/Parcelamentos').then((m) => ({ default: m.Parcelamentos })));
const Previsao = lazy(() => import('./pages/Previsao').then((m) => ({ default: m.Previsao })));
const Relatorios = lazy(() => import('./pages/Relatorios').then((m) => ({ default: m.Relatorios })));
const Configuracoes = lazy(() => import('./pages/Configuracoes').then((m) => ({ default: m.Configuracoes })));

function PageFallback() {
  return (
    <div className="flex h-64 items-center justify-center">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-slate-200 border-t-[var(--color-brand-500)]" />
    </div>
  );
}

function App() {
  return (
    <HashRouter>
      <Suspense fallback={<PageFallback />}>
        <Routes>
          <Route element={<AppShell />}>
            <Route index element={<Dashboard />} />
            <Route path="contas" element={<Contas />} />
            <Route path="cartoes" element={<Cartoes />} />
            <Route path="parcelamentos" element={<Parcelamentos />} />
            <Route path="previsao" element={<Previsao />} />
            <Route path="relatorios" element={<Relatorios />} />
            <Route path="configuracoes" element={<Configuracoes />} />
          </Route>
        </Routes>
      </Suspense>
    </HashRouter>
  );
}

export default App;
