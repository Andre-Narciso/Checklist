import type { Priority, TaskStatus } from '../types';

export const STATUS_LABELS: Record<TaskStatus, string> = {
  nao_iniciada: 'Não iniciada',
  em_andamento: 'Em andamento',
  concluida: 'Concluída',
  bloqueada: 'Bloqueada',
};

export const PRIORITY_LABELS: Record<Priority, string> = {
  baixa: 'Baixa',
  media: 'Média',
  alta: 'Alta',
  critica: 'Crítica',
};

export const PRIORITY_ORDER: Record<Priority, number> = {
  critica: 0,
  alta: 1,
  media: 2,
  baixa: 3,
};

export const STATUS_TONES: Record<TaskStatus, string> = {
  nao_iniciada: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300',
  em_andamento: 'bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300',
  concluida: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300',
  bloqueada: 'bg-red-50 text-red-700 dark:bg-red-950/60 dark:text-red-300',
};

export const PRIORITY_TONES: Record<Priority, string> = {
  baixa: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300',
  media: 'bg-sky-50 text-sky-700 dark:bg-sky-950/60 dark:text-sky-300',
  alta: 'bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300',
  critica: 'bg-red-50 text-red-700 dark:bg-red-950/60 dark:text-red-300',
};

export const CHART_COLORS: Record<TaskStatus, string> = {
  concluida: '#10b981',
  em_andamento: '#3b82f6',
  nao_iniciada: '#94a3b8',
  bloqueada: '#ef4444',
};