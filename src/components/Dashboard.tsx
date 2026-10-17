import {
  AlertOctagon,
  ArrowRight,
  CalendarClock,
  CheckCircle2,
  CircleDashed,
  Layers,
  ListChecks,
  Loader,
  TrendingUp,
} from 'lucide-react';
import { useProject } from '../context/ProjectContext';
import { nextPriorityTasks, overallStats, stepState, stepStats } from '../utils/calculations';
import { formatBR, isOverdue } from '../utils/date';
import { PRIORITY_LABELS, PRIORITY_TONES, STATUS_LABELS, STATUS_TONES } from '../utils/labels';
import type { Step, Task, ViewId } from '../types';
import { ProgressRing, StepsBarChart, TaskDonut } from './Charts';
import { Badge, Card, EmptyState, ProgressBar, SectionTitle, StatCard } from './ui';

export function Dashboard({ onNavigate }: { onNavigate: (view: ViewId) => void }) {
  const { state } = useProject();
  const stats = overallStats(state.steps);
  const priority = nextPriorityTasks(state.steps, 6);

  const donutCounts = {
    concluida: stats.doneTasks,
    em_andamento: stats.inProgressTasks,
    nao_iniciada: stats.notStartedTasks,
    bloqueada: stats.blockedTasks,
  };

  const topSteps = [...state.steps]
    .map((step) => ({ step, stats: stepStats(step), status: stepState(step) }))
    .filter((item) => item.status !== 'concluida')
    .slice(0, 5);

  return (
    <div className="space-y-6">
      {/* Cards principais */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard
          label="Progresso geral"
          value={`${stats.percent}%`}
          hint={`${stats.doneTasks}/${stats.totalTasks} tarefas`}
          tone="blue"
          icon={<TrendingUp size={18} />}
        />
        <StatCard
          label="Etapas"
          value={`${stats.completedSteps}/${stats.totalSteps}`}
          hint={`${stats.stepsInProgress} em andamento`}
          tone="slate"
          icon={<Layers size={18} />}
        />
        <StatCard
          label="Concluídas"
          value={stats.doneTasks}
          hint={`${stats.pendingTasks} pendentes`}
          tone="green"
          icon={<CheckCircle2 size={18} />}
        />
        <StatCard
          label="Bloqueadas"
          value={stats.blockedTasks}
          hint={`${stats.overdueTasks} tarefa(s) vencida(s)`}
          tone={stats.blockedTasks > 0 ? 'red' : 'slate'}
          icon={<AlertOctagon size={18} />}
        />
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Não iniciadas" value={stats.notStartedTasks} tone="slate" icon={<CircleDashed size={18} />} />
        <StatCard label="Em andamento" value={stats.inProgressTasks} tone="blue" icon={<Loader size={18} />} />
        <StatCard label="Pendentes" value={stats.pendingTasks} tone="amber" icon={<ListChecks size={18} />} />
        <StatCard label="Vencidas" value={stats.overdueTasks} tone={stats.overdueTasks ? 'red' : 'slate'} icon={<CalendarClock size={18} />} />
      </div>

      {/* Progresso geral + distribuição */}
      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="flex flex-col items-center justify-center p-6">
          <ProgressRing percent={stats.percent} />
          <p className="mt-4 text-center text-sm text-slate-500 dark:text-slate-400">
            {stats.doneTasks} de {stats.totalTasks} tarefas concluídas
          </p>
          <div className="mt-4 w-full space-y-2">
            <div className="flex justify-between text-xs text-slate-500 dark:text-slate-400">
              <span>Etapas concluídas</span>
              <span className="font-semibold tabular-nums">
                {stats.completedSteps}/{stats.totalSteps}
              </span>
            </div>
            <ProgressBar
              value={stats.totalSteps ? (stats.completedSteps / stats.totalSteps) * 100 : 0}
              tone="green"
              ariaLabel="Progresso das etapas"
            />
          </div>
        </Card>

        <Card className="p-5 lg:col-span-2">
          <SectionTitle title="Distribuição das tarefas" subtitle="Situação atual de todas as tarefas do projeto" />
          <TaskDonut counts={donutCounts} />
        </Card>
      </div>

      {/* Próximas tarefas prioritárias */}
      <Card className="p-5">
        <SectionTitle
          title="Próximas tarefas prioritárias"
          subtitle="Ordenadas por prioridade e prazo"
          action={
            <button type="button" className="btn-outline" onClick={() => onNavigate('checklist')}>
              Ver checklist <ArrowRight size={14} />
            </button>
          }
        />
        {priority.length === 0 ? (
          <EmptyState
            icon={<CheckCircle2 size={32} />}
            title="Nenhuma tarefa pendente"
            description="Todas as tarefas do projeto estão concluídas."
          />
        ) : (
          <ul className="divide-y divide-slate-100 dark:divide-slate-800">
            {priority.map(({ step, task }) => (
              <PriorityRow key={task.id} step={step} task={task} />
            ))}
          </ul>
        )}
      </Card>

      {/* Etapas em foco */}
      <Card className="p-5">
        <SectionTitle
          title="Etapas em foco"
          subtitle="Etapas ainda não concluídas, na ordem do roadmap"
          action={
            <button type="button" className="btn-outline" onClick={() => onNavigate('roadmap')}>
              Ver roadmap <ArrowRight size={14} />
            </button>
          }
        />
        {topSteps.length === 0 ? (
          <EmptyState icon={<CheckCircle2 size={32} />} title="Todas as etapas concluídas" />
        ) : (
          <div className="space-y-4">
            {topSteps.map(({ step, stats: s, status }) => (
              <div key={step.id}>
                <div className="mb-1.5 flex flex-wrap items-center justify-between gap-2">
                  <div className="flex min-w-0 items-center gap-2">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-slate-100 text-xs font-bold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                      {step.number}
                    </span>
                    <span className="truncate text-sm font-medium text-slate-800 dark:text-slate-100">{step.name}</span>
                    <Badge className={STATUS_TONES[status]}>{STATUS_LABELS[status]}</Badge>
                  </div>
                  <span className="text-xs font-semibold tabular-nums text-slate-500 dark:text-slate-400">
                    {s.done}/{s.total} · {s.percent}%
                  </span>
                </div>
                <ProgressBar value={s.percent} tone={status === 'bloqueada' ? 'red' : 'blue'} ariaLabel={`Progresso da etapa ${step.number}`} />
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Gráfico por etapa */}
      <Card className="p-5">
        <SectionTitle title="Progresso por etapa" subtitle="Percentual concluído em cada uma das 18 etapas" />
        <StepsBarChart steps={state.steps} />
      </Card>
    </div>
  );
}

function PriorityRow({ step, task }: { step: Step; task: Task }) {
  const overdue = isOverdue(task.dueDate, task.status);
  return (
    <li className="flex flex-wrap items-center gap-2 py-3">
      <Badge className={PRIORITY_TONES[task.priority]}>{PRIORITY_LABELS[task.priority]}</Badge>
      <span className="min-w-0 flex-1 truncate text-sm text-slate-800 dark:text-slate-100">{task.title}</span>
      <span className="text-xs text-slate-500 dark:text-slate-400">
        Etapa {step.number} · {step.name}
      </span>
      {task.dueDate && (
        <span
          className={
            overdue
              ? 'rounded-md bg-red-50 px-2 py-0.5 text-xs font-semibold text-red-700 dark:bg-red-950/60 dark:text-red-300'
              : 'rounded-md bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600 dark:bg-slate-800 dark:text-slate-300'
          }
        >
          {overdue ? 'Vencida · ' : ''}
          {formatBR(task.dueDate)}
        </span>
      )}
    </li>
  );
}