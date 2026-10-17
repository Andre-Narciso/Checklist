import { Download, FileJson, FileSpreadsheet } from 'lucide-react';
import { useProject } from '../context/ProjectContext';
import { overallStats, stepState, stepStats } from '../utils/calculations';
import { formatDateTimeBR } from '../utils/date';
import { PRIORITY_LABELS, STATUS_LABELS, STATUS_TONES } from '../utils/labels';
import { downloadFile, stateToJSON, stepsToCSV, tasksToCSV } from '../utils/exporters';
import { StepsBarChart, TaskDonut } from './Charts';
import { Badge, Card, ProgressBar, SectionTitle, StatCard } from './ui';

export function Relatorios() {
  const { state } = useProject();
  const stats = overallStats(state.steps);

  const donutCounts = {
    concluida: stats.doneTasks,
    em_andamento: stats.inProgressTasks,
    nao_iniciada: stats.notStartedTasks,
    bloqueada: stats.blockedTasks,
  };

  const today = new Date().toISOString().slice(0, 10);

  const exportTasksCSV = () =>
    downloadFile(`jurissuite-tarefas-${today}.csv`, tasksToCSV(state.steps), 'text/csv;charset=utf-8');
  const exportStepsCSV = () =>
    downloadFile(`jurissuite-etapas-${today}.csv`, stepsToCSV(state.steps), 'text/csv;charset=utf-8');
  const exportJSON = () =>
    downloadFile(`jurissuite-relatorio-${today}.json`, stateToJSON(state), 'application/json');

  const history = state.history.slice(0, 25);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Progresso geral" value={`${stats.percent}%`} tone="blue" />
        <StatCard label="Tarefas concluídas" value={`${stats.doneTasks}/${stats.totalTasks}`} tone="green" />
        <StatCard label="Etapas concluídas" value={`${stats.completedSteps}/${stats.totalSteps}`} tone="slate" />
        <StatCard label="Tarefas vencidas" value={stats.overdueTasks} tone={stats.overdueTasks ? 'red' : 'slate'} />
      </div>

      <Card className="p-5">
        <SectionTitle
          title="Exportação de relatórios"
          subtitle="Gere arquivos locais com o estado atual do projeto"
        />
        <div className="flex flex-wrap gap-2">
          <button type="button" className="btn-outline" onClick={exportTasksCSV}>
            <FileSpreadsheet size={15} /> Tarefas (CSV)
          </button>
          <button type="button" className="btn-outline" onClick={exportStepsCSV}>
            <FileSpreadsheet size={15} /> Etapas (CSV)
          </button>
          <button type="button" className="btn-primary" onClick={exportJSON}>
            <FileJson size={15} /> Relatório completo (JSON)
          </button>
        </div>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="p-5">
          <SectionTitle title="Distribuição das tarefas" />
          <TaskDonut counts={donutCounts} />
        </Card>
        <Card className="p-5">
          <SectionTitle title="Resumo por etapa" />
          <div className="max-h-[320px] overflow-y-auto">
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-white dark:bg-slate-900">
                <tr className="border-b border-slate-200 text-left text-xs uppercase tracking-wide text-slate-500 dark:border-slate-800 dark:text-slate-400">
                  <th className="py-2 pr-2 font-semibold">#</th>
                  <th className="py-2 pr-2 font-semibold">Etapa</th>
                  <th className="py-2 pr-2 font-semibold">Estado</th>
                  <th className="py-2 pr-2 text-right font-semibold">Tarefas</th>
                  <th className="py-2 text-right font-semibold">%</th>
                </tr>
              </thead>
              <tbody>
                {state.steps.map((step) => {
                  const s = stepStats(step);
                  const st = stepState(step);
                  return (
                    <tr key={step.id} className="border-b border-slate-100 dark:border-slate-800">
                      <td className="py-2 pr-2 tabular-nums text-slate-500">{step.number}</td>
                      <td className="py-2 pr-2 text-slate-800 dark:text-slate-100">{step.name}</td>
                      <td className="py-2 pr-2">
                        <Badge className={STATUS_TONES[st]}>{STATUS_LABELS[st]}</Badge>
                      </td>
                      <td className="py-2 pr-2 text-right tabular-nums text-slate-600 dark:text-slate-300">
                        {s.done}/{s.total}
                      </td>
                      <td className="py-2 text-right font-semibold tabular-nums text-slate-800 dark:text-slate-100">
                        {s.percent}%
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      </div>

      <Card className="p-5">
        <SectionTitle title="Progresso por etapa" />
        <StepsBarChart steps={state.steps} height={520} />
      </Card>

      <Card className="p-5">
        <SectionTitle
          title="Histórico de alterações"
          subtitle="Últimos 25 eventos registrados automaticamente"
          action={
            history.length > 0 ? (
              <span className="text-xs text-slate-500 dark:text-slate-400">
                {state.history.length} evento(s) no total
              </span>
            ) : undefined
          }
        />
        {history.length === 0 ? (
          <p className="py-6 text-center text-sm text-slate-500 dark:text-slate-400">
            Nenhuma alteração registrada ainda.
          </p>
        ) : (
          <ul className="max-h-96 space-y-2 overflow-y-auto">
            {history.map((entry) => (
              <li
                key={entry.id}
                className="flex flex-wrap items-center gap-2 rounded-lg bg-slate-50 px-3 py-2 text-sm dark:bg-slate-800/50"
              >
                <span className="text-xs tabular-nums text-slate-500 dark:text-slate-400">
                  {formatDateTimeBR(entry.at)}
                </span>
                <span className="text-slate-700 dark:text-slate-200">{entry.message}</span>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <Card className="p-5">
        <SectionTitle title="Indicadores de prioridade" />
        <div className="grid gap-3 sm:grid-cols-4">
          {(['critica', 'alta', 'media', 'baixa'] as const).map((p) => {
            const total = state.steps.reduce(
              (acc, s) => acc + s.tasks.filter((t) => t.priority === p).length,
              0,
            );
            const done = state.steps.reduce(
              (acc, s) => acc + s.tasks.filter((t) => t.priority === p && t.status === 'concluida').length,
              0,
            );
            const pct = total ? Math.round((done / total) * 100) : 0;
            return (
              <div key={p}>
                <div className="mb-1.5 flex items-center justify-between">
                  <span className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                    {PRIORITY_LABELS[p]}
                  </span>
                  <span className="text-xs tabular-nums text-slate-500 dark:text-slate-400">
                    {done}/{total}
                  </span>
                </div>
                <ProgressBar value={pct} tone={p === 'critica' ? 'red' : p === 'alta' ? 'amber' : 'blue'} />
              </div>
            );
          })}
        </div>
      </Card>
    </div>
  );
}