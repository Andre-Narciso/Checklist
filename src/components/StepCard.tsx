import { CheckCheck, ChevronDown, Plus, RotateCcw } from 'lucide-react';
import { useState } from 'react';
import { useProject } from '../context/ProjectContext';
import type { Priority, Step, Task } from '../types';
import { stepState, stepStats } from '../utils/calculations';
import { formatBR } from '../utils/date';
import { PRIORITY_LABELS, PRIORITY_TONES, STATUS_LABELS, STATUS_TONES } from '../utils/labels';
import { Badge, ConfirmDialog, ProgressBar, cn } from './ui';
import { TaskItem } from './TaskItem';

const PRIORITY_OPTIONS: Priority[] = ['baixa', 'media', 'alta', 'critica'];

export function StepCard({
  step,
  defaultOpen = false,
  highlightedTaskId,
}: {
  step: Step;
  defaultOpen?: boolean;
  highlightedTaskId?: string | null;
}) {
  const { dispatch } = useProject();
  const [open, setOpen] = useState(defaultOpen || Boolean(highlightedTaskId));
  const [newTask, setNewTask] = useState('');
  const [taskToDelete, setTaskToDelete] = useState<Task | null>(null);
  const [confirmCompleteAll, setConfirmCompleteAll] = useState(false);

  const stats = stepStats(step);
  const status = stepState(step);

  const handleAddTask = () => {
    const title = newTask.trim();
    if (!title) return;
    dispatch({ type: 'ADD_TASK', stepId: step.id, title });
    setNewTask('');
  };

  return (
    <div className="card overflow-hidden">
      <div className="flex flex-wrap items-start gap-3 p-4">
        <span
          className={cn(
            'flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-sm font-bold',
            status === 'concluida'
              ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300'
              : 'bg-slate-900 text-white dark:bg-slate-700',
          )}
        >
          {step.number}
        </span>

        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="min-w-0 flex-1 text-left"
          aria-expanded={open}
        >
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-50">{step.name}</h3>
            <Badge className={STATUS_TONES[status]}>{STATUS_LABELS[status]}</Badge>
            <Badge className={PRIORITY_TONES[step.priority]}>{PRIORITY_LABELS[step.priority]}</Badge>
          </div>
          <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">{step.description}</p>
        </button>

        <div className="flex items-center gap-3">
          <div className="hidden text-right sm:block">
            <p className="text-sm font-bold tabular-nums text-slate-800 dark:text-slate-100">{stats.percent}%</p>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {stats.done}/{stats.total} tarefas
            </p>
          </div>
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            className="btn-ghost p-1.5"
            aria-label={open ? 'Recolher etapa' : 'Expandir etapa'}
          >
            <ChevronDown size={18} className={cn('transition-transform', open && 'rotate-180')} />
          </button>
        </div>

        <div className="w-full">
          <ProgressBar
            value={stats.percent}
            tone={status === 'concluida' ? 'green' : status === 'bloqueada' ? 'red' : 'blue'}
            ariaLabel={`Progresso da etapa ${step.number}`}
          />
        </div>
      </div>

      {open && (
        <div className="space-y-4 border-t border-slate-200 bg-slate-50/60 p-4 dark:border-slate-800 dark:bg-slate-950/30">
          {/* Metadados da etapa */}
          <div className="grid gap-3 sm:grid-cols-3">
            <div>
              <label className="label" htmlFor={`step-start-${step.id}`}>
                Início
              </label>
              <input
                id={`step-start-${step.id}`}
                type="date"
                className="input"
                value={step.startDate ?? ''}
                onChange={(e) =>
                  dispatch({ type: 'UPDATE_STEP', stepId: step.id, patch: { startDate: e.target.value || null } })
                }
              />
            </div>
            <div>
              <label className="label" htmlFor={`step-due-${step.id}`}>
                Prazo
              </label>
              <input
                id={`step-due-${step.id}`}
                type="date"
                className="input"
                value={step.dueDate ?? ''}
                onChange={(e) =>
                  dispatch({ type: 'UPDATE_STEP', stepId: step.id, patch: { dueDate: e.target.value || null } })
                }
              />
            </div>
            <div>
              <label className="label" htmlFor={`step-priority-${step.id}`}>
                Prioridade da etapa
              </label>
              <select
                id={`step-priority-${step.id}`}
                className="select"
                value={step.priority}
                onChange={(e) =>
                  dispatch({
                    type: 'UPDATE_STEP',
                    stepId: step.id,
                    patch: { priority: e.target.value as Priority },
                    log: `Etapa ${step.number}: prioridade → ${PRIORITY_LABELS[e.target.value as Priority]}`,
                  })
                }
              >
                {PRIORITY_OPTIONS.map((p) => (
                  <option key={p} value={p}>
                    {PRIORITY_LABELS[p]}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="label" htmlFor={`step-notes-${step.id}`}>
              Observações da etapa
            </label>
            <textarea
              id={`step-notes-${step.id}`}
              rows={2}
              className="input resize-y"
              placeholder="Decisões, bloqueios, referências…"
              value={step.notes}
              onChange={(e) => dispatch({ type: 'UPDATE_STEP', stepId: step.id, patch: { notes: e.target.value } })}
            />
          </div>

          {/* Ações em massa */}
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              className="btn-outline"
              onClick={() => setConfirmCompleteAll(true)}
              disabled={stats.total === 0 || stats.done === stats.total}
            >
              <CheckCheck size={14} /> Concluir todas as tarefas
            </button>
            <button
              type="button"
              className="btn-outline"
              onClick={() =>
                dispatch({
                  type: 'SET_STEP_TASKS_STATUS',
                  stepId: step.id,
                  status: 'nao_iniciada',
                })
              }
              disabled={stats.done === 0 && stats.inProgress === 0 && stats.blocked === 0}
            >
              <RotateCcw size={14} /> Reabrir todas
            </button>
          </div>

          {/* Tarefas */}
          <div className="space-y-2">
            {step.tasks.length === 0 && (
              <p className="py-4 text-center text-sm text-slate-500 dark:text-slate-400">
                Nenhuma tarefa nesta etapa.
              </p>
            )}
            {step.tasks.map((task) => (
              <TaskItem key={task.id} stepId={step.id} task={task} onRequestDelete={setTaskToDelete} />
            ))}
          </div>

          {/* Adicionar tarefa */}
          <div className="flex gap-2">
            <input
              type="text"
              className="input"
              placeholder="Adicionar tarefa personalizada…"
              value={newTask}
              onChange={(e) => setNewTask(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleAddTask();
              }}
              aria-label={`Nova tarefa na etapa ${step.number}`}
            />
            <button type="button" className="btn-primary shrink-0" onClick={handleAddTask} disabled={!newTask.trim()}>
              <Plus size={15} /> Adicionar
            </button>
          </div>

          <p className="text-xs text-slate-500 dark:text-slate-400">
            Datas exibidas no padrão DD/MM/AAAA. {step.startDate ? `Início: ${formatBR(step.startDate)}.` : ''}
          </p>
        </div>
      )}

      <ConfirmDialog
        open={taskToDelete !== null}
        title="Excluir tarefa"
        message={
          <>
            Deseja realmente excluir a tarefa <strong>“{taskToDelete?.title}”</strong>? Esta ação não pode ser desfeita.
          </>
        }
        confirmLabel="Excluir"
        destructive
        onCancel={() => setTaskToDelete(null)}
        onConfirm={() => {
          if (taskToDelete) {
            dispatch({ type: 'DELETE_TASK', stepId: step.id, taskId: taskToDelete.id });
          }
          setTaskToDelete(null);
        }}
      />

      <ConfirmDialog
        open={confirmCompleteAll}
        title="Concluir todas as tarefas"
        message={
          <>
            Marcar <strong>todas as {stats.total} tarefas</strong> da etapa “{step.name}” como concluídas?
          </>
        }
        confirmLabel="Concluir todas"
        onCancel={() => setConfirmCompleteAll(false)}
        onConfirm={() => {
          dispatch({ type: 'SET_STEP_TASKS_STATUS', stepId: step.id, status: 'concluida' });
          setConfirmCompleteAll(false);
        }}
      />
    </div>
  );
}