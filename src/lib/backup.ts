import { DEFAULT_INVOICE_ALERT_THRESHOLD, periodKey, todayMonthKey } from './calc';
import type { AppState } from '../types';

const BACKUP_VERSION = 1;

interface BackupFile {
  app: 'meu-financeiro';
  version: number;
  exportedAt: string;
  data: AppState;
}

export function downloadBackup(state: AppState) {
  const backup: BackupFile = {
    app: 'meu-financeiro',
    version: BACKUP_VERSION,
    exportedAt: new Date().toISOString(),
    data: state,
  };

  const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  const date = new Date().toISOString().slice(0, 10);
  a.href = url;
  a.download = `meu-financeiro-backup-${date}.json`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export function parseBackupFile(text: string): AppState {
  const parsed = JSON.parse(text);
  const data: AppState = parsed?.data ?? parsed;

  if (!data || typeof data !== 'object') {
    throw new Error('Arquivo de backup inválido.');
  }

  const required = ['categories', 'incomes', 'cards', 'cardPurchases', 'expenses', 'bills', 'settings'];
  for (const key of required) {
    if (!(key in data)) {
      throw new Error('Arquivo de backup incompleto ou corrompido.');
    }
  }

  data.settings = {
    ...data.settings,
    overdraftBalance: data.settings.overdraftBalance ?? 0,
    overdraftMonthKey: data.settings.overdraftMonthKey ?? periodKey(todayMonthKey()),
  };
  data.cards = data.cards.map((c) => ({ ...c, alertThreshold: c.alertThreshold ?? DEFAULT_INVOICE_ALERT_THRESHOLD }));

  return data;
}

export function readFileAsText(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error);
    reader.readAsText(file);
  });
}
