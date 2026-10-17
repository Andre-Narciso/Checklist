import { ChevronDown, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { useProject } from '../context/ProjectContext';
import type { Priority, Task, TaskStatus } from '../types';
import { formatBR, isOverdue } from '../utils/date';
import { PRIORITY_LABELS, PRIORITY_TONES, STATUS_LABELS } from '../utils/labels';
import { Badge, cn } from './ui';

const STATUS_OPTIONS: TaskStatus[] = ['nao_iniciada', 'em_andamento', 'concluida', 'bloqueada'];
const PRIORITY_OPTIONS: Priority[] = ['baixa', 'media', 'alta', 'critica'];

export function TaskItem({
  stepId,
  task,
  onRequestDelete,
}: {
  stepId: string;
  task: Task;
  onRequestDelete: (task: Task) => void;
}) {
  const { dispatch } = useProject();
  const [expanded, setExpanded] = useState(false);
  const done = task.status === 'concluida';
  const overdue = isOverdue(task.dueDate, task.status);

  return (
    <div
      className={cn(
        'rounded-lg border transition-colors',
        done
          ? 'border-emerald-200 bg-emerald-50/40 dark:border-emerald-900/50 dark:bg-emerald-950/10'
          : 'border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900',
      )}
    >
      <div className="flex items-center gap-2 px-3 py-2.5">
        <input
          type="checkbox"
          checked={done}
          onChange={() => dispatch({ type: 'TOGGLE_TASK', stepId, taskId: task.id })}
          aria-label={`Marcar "${task.title}" como ${done ? 'pendente' : 'concluída'}`}
          className="h-4 w-4 shrink-0 cursor-pointer rounded border-slate-300 text-blue-600 focus:ring-2 focus:ring-blue-500/40 dark:border-slate-600 dark:bg-slate-800"
        />

        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="min-w-0 flex-1 text-left"
          aria-expanded={expanded}
        >
          <span
            className={cn(
              'block truncate text-sm',
              done ? 'text-slate-500 line-through dark:text-slate-500' : 'text-slate-800 dark:text-slate-100',
            )}
          >
            {task.title}
          </span>
        </button>

        <div className="hidden items-center gap-2 md:flex">
          {task.custom && <Badge className="bg-violet-50 text-violet-700 dark:bg-violet-950/60 dark:text-violet-300">Personalizada</Badge>}
          <Badge className={PRIORITY_TONES[task.priority]}>{PRIORITY_LABELS[task.priority]}</Badge>
          {task.dueDate && (
            <Badge
              className={
                overdue
                  ? 'bg-red-50 text-red-700 dark:bg-red-950/60 dark:text-red-300'
                  : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300'
              }
            >
              {formatBR(task.dueDate)}
            </Badge>
          )}
        </div>

        <select
          value={task.status}
          onChange={(e) =>
            dispatch({
              type: 'UPDATE_TASK',
              stepId,
              taskId: task.id,
              patch: { status: e.target.value as TaskStatus },
              log: `Status alterado: "${task.title}" → ${STATUS_LABELS[e.target.value as TaskStatus]}`,
            })
          }
          aria-label={`Status de "${task.title}"`}
          className="hidden w-36 shrink-0 rounded-lg border border-slate-300 bg-white px-2 py-1 text-xs dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 sm:block"
        >
          {STATUS_OPTIONS.map((s) => (
            <option key={s} value={s}>
              {STATUS_LABELS[s]}
            </option>
          ))}
        </select>

        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="btn-ghost shrink-0 p-1.5"
          aria-label={expanded ? 'Recolher detalhes' : 'Expandir detalhes'}
        >
          <ChevronDown size={16} className={cn('transition-transform', expanded && 'rotate-180')} />
        </button>
      </div>

      {expanded && (
        <div className="space-y-3 border-t border-slate-200 px-3 py-3 dark:border-slate-800">
          <div className="grid gap-3 sm:grid-cols-3">
            <div>
              <label className="label" htmlFor={`status-${task.id}`}>
                Status
              </label>
              <select
                id={`status-${task.id}`}
                className="select"
                value={task.status}
                onChange={(e) =>
                  dispatch({
                    type: 'UPDATE_TASK',
                    stepId,
                    taskId: task.id,
                    patch: { status: e.target.value as TaskStatus },
                    log: `Status alterado: "${task.title}" → ${STATUS_LABELS[e.target.value as TaskStatus]}`,
                  })
                }
              >
                {STATUS_OPTIONS.map((s) => (
                  <option key={s} value={s}>
                    {STATUS_LABELS[s]}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="label" htmlFor={`priority-${task.id}`}>
                Prioridade
              </label>
              <select
                id={`priority-${task.id}`}
                className="select"
                value={task.priority}
                onChange={(e) =>
                  dispatch({
                    type: 'UPDATE_TASK',
                    stepId,
                    taskId: task.id,
                    patch: { priority: e.target.value as Priority },
                    log: `Prioridade alterada: "${task.title}" → ${PRIORITY_LABELS[e.target.value as Priority]}`,
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

            <div>
              <label className="label" htmlFor={`due-${task.id}`}>
                Prazo
              </label>
              <input
                id={`due-${task.id}`}
                type="date"
                className="input"
                value={task.dueDate ?? ''}
                onChange={(e) =>
                  dispatch({
                    type: 'UPDATE_TASK',
                    stepId,
                    taskId: task.id,
                    patch: { dueDate: e.target.value || null },
                  })
                }
              />
            </div>
          </div>

          <div>
            <label className="label" htmlFor={`notes-${task.id}`}>
              Observações
            </label>
            <textarea
              id={`notes-${task.id}`}
              rows={2}
              className="input resize-y"
              placeholder="Anotações, dependências, links…"
              value={task.notes}
              onChange={(e) =>
                dispatch({
                  type: 'UPDATE_TASK',
                  stepId,
                  taskId: task.id,
                  patch: { notes: e.target.value },
                })
              }
            />
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500 dark:text-slate-400">
            <span>
              Criada em {formatBR(task.createdAt)}
              {task.completedAt ? ` · Concluída em ${formatBR(task.completedAt)}` : ''}
            </span>
            {task.custom && (
              <button type="button" className="btn-ghost text-red-600 dark:text-red-400" onClick={() => onRequestDelete(task)}>
                <Trash2 size={14} /> Excluir tarefa
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}