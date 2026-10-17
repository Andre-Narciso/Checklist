export type TaskStatus = 'nao_iniciada' | 'em_andamento' | 'concluida' | 'bloqueada';
export type Priority = 'baixa' | 'media' | 'alta' | 'critica';
export type Theme = 'light' | 'dark';

export type ViewId =
  | 'overview'
  | 'roadmap'
  | 'checklist'
  | 'pendencias'
  | 'notas'
  | 'relatorios'
  | 'backup'
  | 'configuracoes';

export interface Task {
  id: string;
  title: string;
  status: TaskStatus;
  priority: Priority;
  notes: string;
  /** Data no formato YYYY-MM-DD */
  dueDate: string | null;
  /** ISO completo */
  completedAt: string | null;
  createdAt: string;
  custom: boolean;
}

export interface Step {
  id: string;
  number: number;
  name: string;
  description: string;
  notes: string;
  startDate: string | null;
  dueDate: string | null;
  priority: Priority;
  tasks: Task[];
}

export interface ProjectNote {
  id: string;
  title: string;
  content: string;
  createdAt: string;
  updatedAt: string;
}

export interface HistoryEntry {
  id: string;
  at: string;
  message: string;
}

export interface ProjectState {
  version: number;
  steps: Step[];
  notes: ProjectNote[];
  history: HistoryEntry[];
  theme: Theme;
  updatedAt: string;
}

export type SaveStatus = 'idle' | 'saving' | 'saved' | 'error';