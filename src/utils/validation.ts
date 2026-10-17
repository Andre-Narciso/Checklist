import type { Priority, ProjectNote, ProjectState, Step, Task, TaskStatus } from '../types';

const VALID_STATUS: TaskStatus[] = ['nao_iniciada', 'em_andamento', 'concluida', 'bloqueada'];
const VALID_PRIORITY: Priority[] = ['baixa', 'media', 'alta', 'critica'];

function asStatus(value: unknown): TaskStatus {
  return VALID_STATUS.includes(value as TaskStatus) ? (value as TaskStatus) : 'nao_iniciada';
}

function asPriority(value: unknown): Priority {
  return VALID_PRIORITY.includes(value as Priority) ? (value as Priority) : 'media';
}

function asString(value: unknown, fallback = ''): string {
  return typeof value === 'string' ? value : fallback;
}

function asNullableString(value: unknown): string | null {
  return typeof value === 'string' && value.length > 0 ? value : null;
}

function normalizeTask(raw: unknown, index: number): Task {
  const t = (raw ?? {}) as Record<string, unknown>;
  return {
    id: asString(t.id, `task-${index}`),
    title: asString(t.title, `Tarefa ${index + 1}`),
    status: asStatus(t.status),
    priority: asPriority(t.priority),
    notes: asString(t.notes),
    dueDate: asNullableString(t.dueDate),
    completedAt: asNullableString(t.completedAt),
    createdAt: asString(t.createdAt, new Date().toISOString()),
    custom: Boolean(t.custom),
  };
}

function normalizeStep(raw: unknown, index: number): Step {
  const s = (raw ?? {}) as Record<string, unknown>;
  const rawTasks = Array.isArray(s.tasks) ? s.tasks : [];
  return {
    id: asString(s.id, `step-${index + 1}`),
    number: typeof s.number === 'number' ? s.number : index + 1,
    name: asString(s.name, `Etapa ${index + 1}`),
    description: asString(s.description),
    notes: asString(s.notes),
    startDate: asNullableString(s.startDate),
    dueDate: asNullableString(s.dueDate),
    priority: asPriority(s.priority),
    tasks: rawTasks.map((t, i) => normalizeTask(t, i)),
  };
}

function normalizeNote(raw: unknown, index: number): ProjectNote {
  const n = (raw ?? {}) as Record<string, unknown>;
  const now = new Date().toISOString();
  return {
    id: asString(n.id, `note-${index}`),
    title: asString(n.title, 'Sem título'),
    content: asString(n.content),
    createdAt: asString(n.createdAt, now),
    updatedAt: asString(n.updatedAt, now),
  };
}

export type ValidationResult =
  | { ok: true; state: ProjectState }
  | { ok: false; error: string };

export function validateAndNormalize(input: unknown): ValidationResult {
  if (typeof input !== 'object' || input === null) {
    return { ok: false, error: 'O arquivo não contém um objeto JSON válido.' };
  }
  const data = input as Record<string, unknown>;

  if (!Array.isArray(data.steps) || data.steps.length === 0) {
    return { ok: false, error: 'O arquivo não possui uma lista de etapas válida.' };
  }

  const steps = data.steps.map((s, i) => normalizeStep(s, i));
  const totalTasks = steps.reduce((acc, s) => acc + s.tasks.length, 0);
  if (totalTasks === 0) {
    return { ok: false, error: 'Nenhuma tarefa encontrada no arquivo importado.' };
  }

  const state: ProjectState = {
    version: typeof data.version === 'number' ? data.version : 1,
    steps,
    notes: Array.isArray(data.notes) ? data.notes.map((n, i) => normalizeNote(n, i)) : [],
    history: Array.isArray(data.history)
      ? (data.history as ProjectState['history']).filter(
          (h) => h && typeof h.message === 'string' && typeof h.at === 'string',
        )
      : [],
    theme: data.theme === 'dark' ? 'dark' : 'light',
    updatedAt: asString(data.updatedAt, new Date().toISOString()),
  };

  return { ok: true, state };
}

/** Garante que um estado carregado do banco tenha todos os campos esperados. */
export function normalizeStoredState(input: unknown): ProjectState {
  const result = validateAndNormalize(input);
  if (result.ok) return result.state;
  // Estado corrompido: devolve estrutura mínima vazia, o chamador decide o fallback.
  return {
    version: 1,
    steps: [],
    notes: [],
    history: [],
    theme: 'light',
    updatedAt: new Date().toISOString(),
  };
}