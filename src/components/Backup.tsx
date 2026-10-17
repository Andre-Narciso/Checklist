import { AlertTriangle, Download, RotateCcw, Upload } from 'lucide-react';
import { useRef, useState } from 'react';
import { useProject } from '../context/ProjectContext';
import { downloadFile, stateToJSON } from '../utils/exporters';
import { validateAndNormalize } from '../utils/validation';
import { Card, ConfirmDialog, SectionTitle } from './ui';

export function Backup() {
  const { state, importState, resetToInitial } = useProject();
  const fileRef = useRef<HTMLInputElement>(null);
  const [pending, setPending] = useState<{ json: string; summary: string } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [confirmReset, setConfirmReset] = useState(false);

  const today = new Date().toISOString().slice(0, 10);

  const exportBackup = () => {
    downloadFile(`jurissuite-backup-${today}.json`, stateToJSON(state), 'application/json');
    setSuccess('Backup exportado com sucesso.');
    setError(null);
  };

  const handleFile = async (file: File) => {
    setError(null);
    setSuccess(null);
    try {
      const text = await file.text();
      const parsed: unknown = JSON.parse(text);
      const result = validateAndNormalize(parsed);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      const totalTasks = result.state.steps.reduce((acc, s) => acc + s.tasks.length, 0);
      setPending({
        json: JSON.stringify(result.state),
        summary: `${result.state.steps.length} etapas · ${totalTasks} tarefas · exportado em ${
          result.state.updatedAt ? new Date(result.state.updatedAt).toLocaleString('pt-BR') : 'data desconhecida'
        }`,
      });
    } catch {
      setError('Não foi possível ler o arquivo. Verifique se é um JSON válido gerado por esta aplicação.');
    } finally {
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  const confirmImport = () => {
    if (!pending) return;
    try {
      const parsed: unknown = JSON.parse(pending.json);
      const result = validateAndNormalize(parsed);
      if (!result.ok) {
        setError(result.error);
        setPending(null);
        return;
      }
      importState(result.state);
      setSuccess('Backup importado. Todos os dados anteriores foram substituídos.');
      setPending(null);
    } catch {
      setError('Falha ao aplicar o backup.');
      setPending(null);
    }
  };

  return (
    <div className="space-y-4">
      <Card className="p-5">
        <SectionTitle
          title="Exportar backup"
          subtitle="Baixe um arquivo JSON com todas as etapas, tarefas, notas e histórico"
        />
        <button type="button" className="btn-primary" onClick={exportBackup}>
          <Download size={15} /> Exportar backup (.json)
        </button>
      </Card>

      <Card className="p-5">
        <SectionTitle
          title="Importar backup"
          subtitle="O arquivo é validado antes de qualquer alteração nos dados atuais"
        />
        <input
          ref={fileRef}
          type="file"
          accept="application/json,.json"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) void handleFile(file);
          }}
        />
        <button type="button" className="btn-outline" onClick={() => fileRef.current?.click()}>
          <Upload size={15} /> Selecionar arquivo JSON
        </button>

        {error && (
          <div className="mt-4 flex items-start gap-2 rounded-lg bg-red-50 p-3 text-sm text-red-700 dark:bg-red-950/40 dark:text-red-300">
            <AlertTriangle size={16} className="mt-0.5 shrink-0" />
            <span>{error}</span>
          </div>
        )}
        {success && (
          <div className="mt-4 rounded-lg bg-emerald-50 p-3 text-sm text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300">
            {success}
          </div>
        )}
      </Card>

      <Card className="p-5">
        <SectionTitle
          title="Restaurar dados iniciais"
          subtitle="Volta ao checklist original com as 18 etapas e todas as tarefas pendentes"
        />
        <button type="button" className="btn-danger" onClick={() => setConfirmReset(true)}>
          <RotateCcw size={15} /> Restaurar dados iniciais
        </button>
      </Card>

      <Card className="p-5">
        <SectionTitle title="Sobre o armazenamento" />
        <ul className="list-disc space-y-2 pl-5 text-sm text-slate-600 dark:text-slate-300">
          <li>
            Os dados são gravados no <strong>IndexedDB</strong> deste navegador, com um espelho em{' '}
            <strong>localStorage</strong> como redundância.
          </li>
          <li>
            O armazenamento é <strong>local ao navegador e à origem da aplicação</strong> (protocolo + domínio + porta).
          </li>
          <li>
            Limpar os dados do site, usar outro navegador, outro computador ou modo anônimo pode{' '}
            <strong>apagar ou ocultar</strong> o progresso salvo.
          </li>
          <li>Por isso, exporte backups regularmente e guarde os arquivos em local seguro.</li>
        </ul>
      </Card>

      <ConfirmDialog
        open={pending !== null}
        title="Confirmar importação"
        message={
          <>
            <p className="mb-2">
              O backup selecionado contém: <strong>{pending?.summary}</strong>.
            </p>
            <p>
              Todos os dados atuais serão <strong>substituídos</strong> por esses dados. Esta operação não pode ser
              desfeita.
            </p>
          </>
        }
        confirmLabel="Substituir dados"
        destructive
        onCancel={() => setPending(null)}
        onConfirm={confirmImport}
      />

      <ConfirmDialog
        open={confirmReset}
        title="Restaurar dados iniciais"
        message={
          <>
            Todos os dados atuais serão <strong>apagados</strong> e o checklist original com as 18 etapas e 138 tarefas
            será recriado. Deseja continuar?
          </>
        }
        confirmLabel="Restaurar"
        destructive
        onCancel={() => setConfirmReset(false)}
        onConfirm={async () => {
          await resetToInitial();
          setConfirmReset(false);
          setSuccess('Dados iniciais restaurados.');
          setError(null);
        }}
      />
    </div>
  );
}