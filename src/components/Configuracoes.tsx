import { HardDrive, Moon, RotateCcw, Sun, Trash2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useProject } from '../context/ProjectContext';
import { clearState, estimateStorage, storageEngineLabel } from '../db/storage';
import { formatDateTimeBR } from '../utils/date';
import { Card, ConfirmDialog, SectionTitle } from './ui';

function formatBytes(bytes: number | null): string {
  if (bytes === null) return '—';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

export function Configuracoes() {
  const { state, setTheme, resetToInitial, clearHistory, lastSavedAt, saveStatus } = useProject();
  const [estimate, setEstimate] = useState<{ usage: number | null; quota: number | null }>({
    usage: null,
    quota: null,
  });
  const [confirmReset, setConfirmReset] = useState(false);
  const [confirmClearHistory, setConfirmClearHistory] = useState(false);
  const [confirmClearAll, setConfirmClearAll] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    void estimateStorage().then(setEstimate);
  }, [state.updatedAt]);

  const totalTasks = state.steps.reduce((acc, s) => acc + s.tasks.length, 0);

  return (
    <div className="space-y-4">
      <Card className="p-5">
        <SectionTitle title="Aparência" subtitle="Tema visual da interface" />
        <div className="flex gap-2">
          <button
            type="button"
            className={state.theme === 'light' ? 'btn-primary' : 'btn-outline'}
            onClick={() => setTheme('light')}
          >
            <Sun size={15} /> Tema claro
          </button>
          <button
            type="button"
            className={state.theme === 'dark' ? 'btn-primary' : 'btn-outline'}
            onClick={() => setTheme('dark')}
          >
            <Moon size={15} /> Tema escuro
          </button>
        </div>
      </Card>

      <Card className="p-5">
        <SectionTitle title="Armazenamento local" subtitle="Informações sobre a persistência dos dados" />
        <dl className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <dt className="label">Mecanismo</dt>
            <dd className="text-sm text-slate-700 dark:text-slate-200">{storageEngineLabel()}</dd>
          </div>
          <div>
            <dt className="label">Último salvamento</dt>
            <dd className="text-sm text-slate-700 dark:text-slate-200">
              {lastSavedAt ? formatDateTimeBR(lastSavedAt) : '—'}
            </dd>
          </div>
          <div>
            <dt className="label">Uso estimado</dt>
            <dd className="text-sm text-slate-700 dark:text-slate-200">{formatBytes(estimate.usage)}</dd>
          </div>
          <div>
            <dt className="label">Cota disponível</dt>
            <dd className="text-sm text-slate-700 dark:text-slate-200">{formatBytes(estimate.quota)}</dd>
          </div>
        </dl>

        <div className="mt-4 flex items-start gap-2 rounded-lg bg-slate-50 p-3 text-xs text-slate-600 dark:bg-slate-800/50 dark:text-slate-300">
          <HardDrive size={14} className="mt-0.5 shrink-0" />
          <span>
            Os dados vivem exclusivamente neste navegador. Apagar os dados do site, trocar de navegador ou usar modo
            anônimo pode remover o progresso. Exporte backups com frequência.
          </span>
        </div>

        {message && (
          <p className="mt-3 rounded-lg bg-emerald-50 p-3 text-sm text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300">
            {message}
          </p>
        )}
      </Card>

      <Card className="p-5">
        <SectionTitle title="Resumo do projeto" />
        <div className="grid gap-3 text-sm sm:grid-cols-3">
          <p className="text-slate-600 dark:text-slate-300">
            Etapas cadastradas: <strong className="text-slate-900 dark:text-slate-50">{state.steps.length}</strong>
          </p>
          <p className="text-slate-600 dark:text-slate-300">
            Tarefas cadastradas: <strong className="text-slate-900 dark:text-slate-50">{totalTasks}</strong>
          </p>
          <p className="text-slate-600 dark:text-slate-300">
            Notas: <strong className="text-slate-900 dark:text-slate-50">{state.notes.length}</strong>
          </p>
          <p className="text-slate-600 dark:text-slate-300">
            Eventos no histórico: <strong className="text-slate-900 dark:text-slate-50">{state.history.length}</strong>
          </p>
          <p className="text-slate-600 dark:text-slate-300">
            Versão dos dados: <strong className="text-slate-900 dark:text-slate-50">{state.version}</strong>
          </p>
          <p className="text-slate-600 dark:text-slate-300">
            Estado de salvamento: <strong className="text-slate-900 dark:text-slate-50">{saveStatus}</strong>
          </p>
        </div>
      </Card>

      <Card className="p-5">
        <SectionTitle title="Zona de risco" subtitle="Ações destrutivas — exigem confirmação" />
        <div className="flex flex-wrap gap-2">
          <button type="button" className="btn-outline" onClick={() => setConfirmClearHistory(true)}>
            <Trash2 size={15} /> Limpar histórico
          </button>
          <button type="button" className="btn-outline text-amber-600 dark:text-amber-400" onClick={() => setConfirmReset(true)}>
            <RotateCcw size={15} /> Restaurar dados iniciais
          </button>
          <button type="button" className="btn-danger" onClick={() => setConfirmClearAll(true)}>
            <Trash2 size={15} /> Apagar tudo do navegador
          </button>
        </div>
      </Card>

      <ConfirmDialog
        open={confirmClearHistory}
        title="Limpar histórico"
        message="Todo o histórico de alterações será removido. As tarefas e etapas permanecem intactas."
        confirmLabel="Limpar"
        destructive
        onCancel={() => setConfirmClearHistory(false)}
        onConfirm={() => {
          clearHistory();
          setConfirmClearHistory(false);
          setMessage('Histórico limpo.');
        }}
      />

      <ConfirmDialog
        open={confirmReset}
        title="Restaurar dados iniciais"
        message="Todas as alterações serão perdidas e o checklist original será recriado."
        confirmLabel="Restaurar"
        destructive
        onCancel={() => setConfirmReset(false)}
        onConfirm={async () => {
          await resetToInitial();
          setConfirmReset(false);
          setMessage('Dados iniciais restaurados.');
        }}
      />

      <ConfirmDialog
        open={confirmClearAll}
        title="Apagar todos os dados"
        message="O estado será removido do IndexedDB e do localStorage. A aplicação voltará ao checklist inicial na próxima carga."
        confirmLabel="Apagar tudo"
        destructive
        onCancel={() => setConfirmClearAll(false)}
        onConfirm={async () => {
          await clearState();
          await resetToInitial();
          setConfirmClearAll(false);
          setMessage('Armazenamento limpo e projeto reiniciado.');
        }}
      />
    </div>
  );
}