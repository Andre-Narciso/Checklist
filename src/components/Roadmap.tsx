import { CheckCircle2, CircleDashed, Loader, Lock } from 'lucide-react';
import { useProject } from '../context/ProjectContext';
import { stepState, stepStats } from '../utils/calculations';
import { PRIORITY_LABELS, STATUS_LABELS, STATUS_TONES } from '../utils/labels';
import { formatBR } from '../utils/date';
import type { TaskStatus, ViewId } from '../types';
import { Badge, Card, ProgressBar, SectionTitle, cn } from './ui';

const STATE_ICON: Record<TaskStatus, React.ReactNode> = {
  concluida: <CheckCircle2 size={16} className="text-emerald-500" />,
  em_andamento: <Loader size={16} className="text-blue-500" />,
  bloqueada: <Lock size={16} className="text-red-500" />,
  nao_iniciada: <CircleDashed size={16} className="text-slate-400" />,
};

export function Roadmap({ onOpenStep }: { onOpenStep: (stepId: string) => void }) {
  const { state } = useProject();

  return (
    <div className="space-y-6">
      <Card className="p-5">
        <SectionTitle
          title="Roadmap do JurisSuite"
          subtitle="18 etapas do MVP, com estado e percentual calculados a partir das tarefas"
        />
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {state.steps.map((step) => {
            const status = stepState(step);
            const stats = stepStats(step);
            return (
              <button
                key={step.id}
                type="button"
                onClick={() => onOpenStep(step.id)}
                className={cn(
                  'group rounded-xl border p-4 text-left transition-all hover:-translate-y-0.5 hover:shadow-md',
                  status === 'concluida'
                    ? 'border-emerald-200 bg-emerald-50/40 dark:border-emerald-900/60 dark:bg-emerald-950/20'
                    : status === 'bloqueada'
                      ? 'border-red-200 bg-red-50/40 dark:border-red-900/60 dark:bg-red-950/20'
                      : 'border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900',
                )}
              >
                <div className="mb-2 flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-slate-900 text-xs font-bold text-white dark:bg-slate-700">
                      {step.number}
                    </span>
                    {STATE_ICON[status]}
                  </div>
                  <span className="text-sm font-bold tabular-nums text-slate-700 dark:text-slate-200">
                    {stats.percent}%
                  </span>
                </div>

                <p className="mb-1 line-clamp-2 text-sm font-semibold text-slate-900 dark:text-slate-50">{step.name}</p>
                <p className="mb-3 line-clamp-2 text-xs text-slate-500 dark:text-slate-400">{step.description}</p>

                <ProgressBar
                  value={stats.percent}
                  tone={status === 'concluida' ? 'green' : status === 'bloqueada' ? 'red' : 'blue'}
                  ariaLabel={`Progresso da etapa ${step.number}`}
                />

                <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                  <Badge className={STATUS_TONES[status]}>{STATUS_LABELS[status]}</Badge>
                  <span>
                    {stats.done}/{stats.total} tarefas
                  </span>
                  <span>·</span>
                  <span>{PRIORITY_LABELS[step.priority]}</span>
                </div>

                {(step.startDate || step.dueDate) && (
                  <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                    {step.startDate ? `Início ${formatBR(step.startDate)}` : ''}
                    {step.startDate && step.dueDate ? ' · ' : ''}
                    {step.dueDate ? `Prazo ${formatBR(step.dueDate)}` : ''}
                  </p>
                )}
              </button>
            );
          })}
        </div>
      </Card>
    </div>
  );
}