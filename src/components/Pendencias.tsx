import { AlertTriangle, CalendarClock, CircleSlash, Flame } from 'lucide-react';
import { useProject } from '../context/ProjectContext';
import { formatBR, isOverdue } from '../utils/date';
import { PRIORITY_LABELS, PRIORITY_TONES, STATUS_LABELS, STATUS_TONES } from '../utils/labels';
import type { Step, Task } from '../types';
import { Badge, Card, EmptyState, SectionTitle } from './ui';

interface Row {
  step: Step;
  task: Task;
}

function TaskRow({ step, task, accent }: { step: Step; task: Task; accent?: 'red' | 'amber' }) {
  return (
    <li className="flex flex-wrap items-center gap-2 py-2.5">
      <span className="text-xs font-semibold tabular-nums text-slate-400">#{step.number}</span>
      <span className="min-w-0 flex-1 truncate text-sm text-slate-800 dark:text-slate-100">{task.title}</span>
      <Badge className={STATUS_TONES[task.status]}>{STATUS_LABELS[task.status]}</Badge>
      <Badge className={PRIORITY_TONES[task.priority]}>{PRIORITY_LABELS[task.priority]}</Badge>
      {task.dueDate && (
        <span
          className={
            accent === 'red'
              ? 'rounded-md bg-red-50 px-2 py-0.5 text-xs font-semibold text-red-700 dark:bg-red-950/60 dark:text-red-300'
              : 'rounded-md bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600 dark:bg-slate-800 dark:text-slate-300'
          }
        >
          {formatBR(task.dueDate)}
        </span>
      )}
    </li>
  );
}

function Group({
  title,
  subtitle,
  icon,
  rows,
  emptyLabel,
}: {
  title: string;
  subtitle: string;
  icon: React.ReactNode;
  rows: Row[];
  emptyLabel: string;
}) {
  return (
    <Card className="p-5">
      <SectionTitle title={title} subtitle={subtitle} />
      <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-200">
        {icon}
        <span>{rows.length} item(ns)</span>
      </div>
      {rows.length === 0 ? (
        <EmptyState title={emptyLabel} />
      ) : (
        <ul className="divide-y divide-slate-100 dark:divide-slate-800">
          {rows.map(({ step, task }) => (
            <TaskRow key={task.id} step={step} task={task} accent={title.includes('Vencidas') || title.includes('Bloqueadas') ? 'red' : 'amber'} />
          ))}
        </ul>
      )}
    </Card>
  );
}

export function Pendencias() {
  const { state } = useProject();

  const all: Row[] = state.steps.flatMap((step) => step.tasks.map((task) => ({ step, task })));

  const overdue = all.filter(({ task }) => isOverdue(task.dueDate, task.status));
  const blocked = all.filter(({ task }) => task.status === 'bloqueada');
  const critical = all.filter(
    ({ task }) => task.status !== 'concluida' && (task.priority === 'critica' || task.priority === 'alta'),
  );
  const noDue = all.filter(({ task }) => task.status !== 'concluida' && !task.dueDate);

  return (
    <div className="space-y-4">
      <Group
        title="Tarefas vencidas"
        subtitle="Prazo já ultrapassado e ainda não concluídas"
        icon={<CalendarClock size={16} className="text-red-500" />}
        rows={overdue}
        emptyLabel="Nenhuma tarefa vencida. Excelente!"
      />
      <Group
        title="Tarefas bloqueadas"
        subtitle="Itens impedidos de avançar"
        icon={<CircleSlash size={16} className="text-red-500" />}
        rows={blocked}
        emptyLabel="Nenhuma tarefa bloqueada."
      />
      <Group
        title="Alta prioridade pendente"
        subtitle="Prioridade alta ou crítica ainda não concluída"
        icon={<Flame size={16} className="text-amber-500" />}
        rows={critical}
        emptyLabel="Nenhuma tarefa de alta prioridade pendente."
      />
      <Group
        title="Sem prazo definido"
        subtitle="Tarefas pendentes que ainda não têm data limite"
        icon={<AlertTriangle size={16} className="text-amber-500" />}
        rows={noDue}
        emptyLabel="Todas as tarefas pendentes possuem prazo."
      />
    </div>
  );
}