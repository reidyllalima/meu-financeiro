import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { BottomNav } from './BottomNav';
import { MoreSheet } from './MoreSheet';
import { Toast } from './Toast';
import { QuickAddModal } from '../QuickAddModal';

export function AppShell() {
  return (
    <div className="min-h-dvh bg-[var(--color-bg)]">
      <Sidebar />
      <Toast />
      <main className="pb-32 md:ml-64 md:pb-10">
        <div className="mx-auto max-w-3xl px-4 pt-6 sm:px-6 md:px-8">
          <Outlet />
        </div>
      </main>
      <BottomNav />
      <MoreSheet />
      <QuickAddModal />
    </div>
  );
}
