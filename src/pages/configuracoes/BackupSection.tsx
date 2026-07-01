import { useRef, useState } from 'react';
import { Download, Upload, AlertTriangle } from 'lucide-react';
import { Panel } from '../../components/ui/Panel';
import { Button } from '../../components/ui/Button';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog';
import { useStore } from '../../store/useStore';
import { useUiStore } from '../../store/useUiStore';
import { downloadBackup, parseBackupFile, readFileAsText } from '../../lib/backup';

export function BackupSection() {
  const exportState = useStore((s) => s.exportState);
  const importState = useStore((s) => s.importState);
  const resetAllData = useStore((s) => s.resetAllData);
  const showToast = useUiStore((s) => s.showToast);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [importError, setImportError] = useState<string | null>(null);
  const [confirmReset, setConfirmReset] = useState(false);

  function handleExport() {
    downloadBackup(exportState());
    showToast('Backup exportado');
  }

  async function handleImportFile(file: File) {
    setImportError(null);
    try {
      const text = await readFileAsText(file);
      const data = parseBackupFile(text);
      importState(data);
      showToast('Backup importado com sucesso');
    } catch {
      setImportError('Não foi possível ler este arquivo. Verifique se é um backup válido do Meu Financeiro.');
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <div>
        <h2 className="font-semibold text-[var(--color-ink)]">Backup dos dados</h2>
        <p className="text-xs text-[var(--color-ink-faint)]">Seus dados ficam só neste dispositivo — faça backup com frequência</p>
      </div>

      <Panel className="flex flex-col gap-3">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-sm font-medium text-[var(--color-ink)]">Exportar backup</p>
            <p className="text-xs text-[var(--color-ink-faint)]">Baixa um arquivo .json com todos os seus dados</p>
          </div>
          <Button size="sm" variant="secondary" onClick={handleExport}>
            <Download className="h-4 w-4" /> Exportar
          </Button>
        </div>
        <div className="flex items-center justify-between gap-3 border-t border-slate-100 pt-3">
          <div>
            <p className="text-sm font-medium text-[var(--color-ink)]">Importar backup</p>
            <p className="text-xs text-[var(--color-ink-faint)]">Restaura dados de um arquivo exportado</p>
          </div>
          <Button size="sm" variant="secondary" onClick={() => fileInputRef.current?.click()}>
            <Upload className="h-4 w-4" /> Importar
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            accept="application/json"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleImportFile(file);
              e.target.value = '';
            }}
          />
        </div>
        {importError && <p className="text-xs text-[var(--color-danger-500)]">{importError}</p>}
      </Panel>

      <Panel className="border border-red-100">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-sm font-medium text-[var(--color-danger-500)]">Apagar todos os dados</p>
            <p className="text-xs text-[var(--color-ink-faint)]">Remove tudo permanentemente deste dispositivo</p>
          </div>
          <Button size="sm" variant="danger" onClick={() => setConfirmReset(true)}>
            <AlertTriangle className="h-4 w-4" /> Apagar
          </Button>
        </div>
      </Panel>

      <ConfirmDialog
        open={confirmReset}
        title="Apagar todos os dados?"
        description="Essa ação é irreversível. Recomendamos exportar um backup antes de continuar."
        confirmLabel="Apagar tudo"
        onConfirm={() => {
          resetAllData();
          showToast('Todos os dados foram apagados');
          setConfirmReset(false);
        }}
        onCancel={() => setConfirmReset(false)}
      />
    </div>
  );
}
