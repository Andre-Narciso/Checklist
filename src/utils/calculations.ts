import type { Priority, Step, Task, TaskStatus } from '../types';
import { PRIORITY_ORDER } from './labels';

export interface StepStats {
  total: number;
  done: number;
  pending: number;
  inProgress: number;
  blocked: number;
  percent: number;
}

export function stepStats(step: Step): StepStats {
  const total = step.tasks.length;
  const done = step.tasks.filter((t) => t.status === 'concluida').length;
  const blocked = step.tasks.filter((t) => t.status === 'bloqueada').length;
  const inProgress = step.tasks.filter((t) => t.status === 'em_andamento').length;
  return {
    total,
    done,
    blocked,
    inProgress,
    pending: total - done,
    percent: total === 0 ? 0 : Math.round((done / total) * 100),
  };
}

/** Estado derivado da etapa, a partir das tarefas. */
export function stepState(step: Step): TaskStatus {
  const { total, done } = stepStats(step);
  if (total === 0) return 'nao_iniciada';
  if (done === total) return 'concluida';
  if (step.tasks.some((t) => t.status === 'bloqueada')) return 'bloqueada';
  if (done > 0 || step.tasks.some((t) => t.status === 'em_andamento')) return 'em_andamento';
  return 'nao_iniciada';
}

export interface OverallStats {
  totalTasks: number;
  doneTasks: number;
  pendingTasks: number;
  inProgressTasks: number;
  blockedTasks: number;
  notStartedTasks: number;
  percent: number;
  totalSteps: number;
  completedSteps: number;
  stepsInProgress: number;
  stepsBlocked: number;
  overdueTasks: number;
}

export function overallStats(steps: Step[]): OverallStats {
  const all: Task[] = steps.flatMap((s) => s.tasks);
  const totalTasks = all.length;
  const doneTasks = all.filter((t) => t.status === 'concluida').length;
  const blockedTasks = all.filter((t) => t.status === 'bloqueada').length;
  const inProgressTasks = all.filter((t) => t.status === 'em_andamento').length;
  const notStartedTasks = all.filter((t) => t.status === 'nao_iniciada').length;
  const today = new Date().toISOString().slice(0, 10);
  const overdueTasks = all.filter(
    (t) => t.dueDate && t.status !== 'concluida' && t.dueDate < today,
  ).length;

  const states = steps.map(stepState);
  return {
    totalTasks,
    doneTasks,
    pendingTasks: totalTasks - doneTasks,
    inProgressTasks,
    blockedTasks,
    notStartedTasks,
    percent: totalTasks === 0 ? 0 : Math.round((doneTasks / totalTasks) * 100),
    totalSteps: steps.length,
    completedSteps: states.filter((s) => s === 'concluida').length,
    stepsInProgress: states.filter((s) => s === 'em_andamento').length,
    stepsBlocked: states.filter((s) => s === 'bloqueada').length,
    overdueTasks,
  };
}

/** Próximas tarefas prioritárias: pendentes, ordenadas por prioridade e prazo. */
export function nextPriorityTasks(steps: Step[], limit = 8): Array<{ step: Step; task: Task }> {
  return steps
    .flatMap((step) => step.tasks.filter((t) => t.status !== 'concluida').map((task) => ({ step, task })))
    .sort((a, b) => {
      const pa = PRIORITY_ORDER[a.task.priority];
      const pb = PRIORITY_ORDER[b.task.priority];
      if (pa !== pb) return pa - pb;
      const da = a.task.dueDate ?? '9999-12-31';
      const db = b.task.dueDate ?? '9999-12-31';
      if (da !== db) return da < db ? -1 : 1;
      return a.task.title.localeCompare(b.task.title, 'pt-BR');
    })
    .slice(0, limit);
}

export function priorityRank(p: Priority): number {
  return PRIORITY_ORDER[p];
}