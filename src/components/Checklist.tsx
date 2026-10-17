import { Search, SlidersHorizontal, X } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useProject } from '../context/ProjectContext';
import type { Priority, Step, Task, TaskStatus } from '../types';
import { PRIORITY_LABELS, STATUS_LABELS } from '../utils/labels';
import { isOverdue } from '../utils/date';
import { Card, EmptyState } from './ui';
import { StepCard } from './StepCard';

type DueFilter = 'todas' | 'vencidas' | 'proximas' | 'sem-prazo';
type CompletionFilter = 'todas' | 'pendentes' | 'concluidas';

const STATUS_OPTIONS: Array<TaskStatus | 'todos'> = [
  'todos',
  'nao_iniciada',
  'em_andamento',
  'concluida',
  'bloqueada',
];

const PRIORITY_OPTIONS: Array<Priority | 'todas'> = ['todas', 'critica', 'alta', 'media', 'baixa'];

export function Checklist({
  search,
  onSearchChange,
  focusStepId,
}: {
  search: string;
  onSearchChange: (value: string) => void;
  focusStepId: string | null;
}) {
  const { state } = useProject();
  const [status, setStatus] = useState<TaskStatus | 'todos'>('todos');
  const [priority, setPriority] = useState<Priority | 'todas'>('todas');
  const [due, setDue] = useState<DueFilter>('todas');
  const [completion, setCompletion] = useState<CompletionFilter>('todas');
  const [stepFilter, setStepFilter] = useState<string>('todas');
  const [showFilters, setShowFilters] = useState(false);
  const focusRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (focusStepId && focusRef.current) {
      focusRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [focusStepId]);

  const filteredSteps = useMemo<Step[]>(() => {
    const query = search.trim().toLowerCase();

    return state.steps
      .filter((step) => stepFilter === 'todas' || step.id === stepFilter)
      .map((step) => {
        const tasks = step.tasks.filter((task) => {
          if (query && !`${task.title} ${task.notes}`.toLowerCase().includes(query)) return false;
          if (status !== 'todos' && task.status !== status) return false;
          if (priority !== 'todas' && task.priority !== priority) return false;
          if (completion === 'concluidas' && task.status !== 'concluida') return false;
          if (completion === 'pendentes' && task.status === 'concluida') return false;

          if (due === 'vencidas' && !isOverdue(task.dueDate, task.status)) return false;
          if (due === 'sem-prazo' && task.dueDate) return false;
          if (due === 'proximas') {
            if (!task.dueDate || task.status === 'concluida') return false;
            const diff = (new Date(task.dueDate).getTime() - Date.now()) / 86_400_000;
            if (diff < 0 || diff > 7) return false;
          }
          return true;
        });
        return { ...step, tasks };
      })
      .filter((step) => {
        // mantém a etapa apenas se ela bate no filtro de texto por nome/descrição
        // ou se ainda tem tarefas após o filtro
        if (step.tasks.length > 0) return true;
        if (!query && status === 'todos' && priority === 'todas' && due === 'todas' && completion === 'todas') {
          return true;
        }
        return query.length > 0 && step.name.toLowerCase().includes(query);
      });
  }, [state.steps, search, status, priority, due, completion, stepFilter]);

  const totalShown = filteredSteps.reduce((acc, s) => acc + s.tasks.length, 0);

  const hasFilters =
    status !== 'todos' || priority !== 'todas' || due !== 'todas' || completion !== 'todas' || stepFilter !== 'todas' || search.length > 0;

  const clearFilters = () => {
    setStatus('todos');
    setPriority('todas');
    setDue('todas');
    setCompletion('todas');
    setStepFilter('todas');
    onSearchChange('');
  };

  return (
    <div className="space-y-4">
      <Card className="p-4">
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative min-w-[220px] flex-1">
            <Search size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="search"
              className="input pl-9"
              placeholder="Buscar por tarefa, observação ou etapa…"
              value={search}
              onChange={(e) => onSearchChange(e.target.value)}
              aria-label="Buscar tarefas"
            />
          </div>
          <button
            type="button"
            className="btn-outline"
            onClick={() => setShowFilters((v) => !v)}
            aria-expanded={showFilters}
          >
            <SlidersHorizontal size={15} /> Filtros
          </button>
          {hasFilters && (
            <button type="button" className="btn-ghost" onClick={clearFilters}>
              <X size={15} /> Limpar
            </button>
          )}
          <span className="ml-auto text-xs font-medium text-slate-500 dark:text-slate-400">
            {totalShown} tarefa(s) exibida(s)
          </span>
        </div>

        {showFilters && (
          <div className="mt-4 grid gap-3 border-t border-slate-200 pt-4 dark:border-slate-800 sm:grid-cols-2 lg:grid-cols-5">
            <div>
              <label className="label" htmlFor="filter-step">
                Etapa
              </label>
              <select id="filter-step" className="select" value={stepFilter} onChange={(e) => setStepFilter(e.target.value)}>
                <option value="todas">Todas as etapas</option>
                {state.steps.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.number}. {s.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="label" htmlFor="filter-status">
                Estado
              </label>
              <select
                id="filter-status"
                className="select"
                value={status}
                onChange={(e) => setStatus(e.target.value as TaskStatus | 'todos')}
              >
                {STATUS_OPTIONS.map((s) => (
                  <option key={s} value={s}>
                    {s === 'todos' ? 'Todos os estados' : STATUS_LABELS[s]}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="label" htmlFor="filter-priority">
                Prioridade
              </label>
              <select
                id="filter-priority"
                className="select"
                value={priority}
                onChange={(e) => setPriority(e.target.value as Priority | 'todas')}
              >
                {PRIORITY_OPTIONS.map((p) => (
                  <option key={p} value={p}>
                    {p === 'todas' ? 'Todas as prioridades' : PRIORITY_LABELS[p]}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="label" htmlFor="filter-due">
                Prazo
              </label>
              <select id="filter-due" className="select" value={due} onChange={(e) => setDue(e.target.value as DueFilter)}>
                <option value="todas">Qualquer prazo</option>
                <option value="vencidas">Vencidas</option>
                <option value="proximas">Próximos 7 dias</option>
                <option value="sem-prazo">Sem prazo</option>
              </select>
            </div>
            <div>
              <label className="label" htmlFor="filter-completion">
                Situação
              </label>
              <select
                id="filter-completion"
                className="select"
                value={completion}
                onChange={(e) => setCompletion(e.target.value as CompletionFilter)}
              >
                <option value="todas">Todas</option>
                <option value="pendentes">Pendentes</option>
                <option value="concluidas">Concluídas</option>
              </select>
            </div>
          </div>
        )}
      </Card>

      {filteredSteps.length === 0 ? (
        <EmptyState
          title="Nenhuma tarefa encontrada"
          description="Ajuste os filtros ou limpe a busca para ver mais resultados."
          action={
            <button type="button" className="btn-outline" onClick={clearFilters}>
              Limpar filtros
            </button>
          }
        />
      ) : (
        <div className="space-y-3">
          {filteredSteps.map((step) => (
            <div key={step.id} ref={step.id === focusStepId ? focusRef : undefined}>
              <StepCard
                step={step}
                defaultOpen={step.id === focusStepId}
                highlightedTaskId={null}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export function useFilteredTasks(steps: Step[], query: string): Task[] {
  return useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return steps.flatMap((s) => s.tasks.filter((t) => t.title.toLowerCase().includes(q) || t.notes.toLowerCase().includes(q)));
  }, [steps, query]);
}