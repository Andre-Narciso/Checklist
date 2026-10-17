import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import type { HistoryEntry, Priority, ProjectNote, ProjectState, SaveStatus, Step, Task, Theme } from '../types';
import { createInitialState } from '../data/initialData';
import { clearState, loadState, saveState } from '../db/storage';
import { normalizeStoredState } from '../utils/validation';

const HISTORY_LIMIT = 300;

type Action =
  | { type: 'HYDRATE'; payload: ProjectState }
  | { type: 'TOGGLE_TASK'; stepId: string; taskId: string }
  | { type: 'UPDATE_TASK'; stepId: string; taskId: string; patch: Partial<Task>; log?: string }
  | { type: 'ADD_TASK'; stepId: string; title: string }
  | { type: 'DELETE_TASK'; stepId: string; taskId: string }
  | {
      type: 'UPDATE_STEP';
      stepId: string;
      patch: Partial<Pick<Step, 'notes' | 'startDate' | 'dueDate' | 'priority' | 'name' | 'description'>>;
      log?: string;
    }
  | { type: 'ADD_NOTE'; note: ProjectNote }
  | { type: 'UPDATE_NOTE'; id: string; patch: Partial<ProjectNote> }
  | { type: 'DELETE_NOTE'; id: string }
  | { type: 'SET_THEME'; theme: Theme }
  | { type: 'IMPORT'; payload: ProjectState }
  | { type: 'RESET' }
  | { type: 'CLEAR_HISTORY' }
  | { type: 'SET_STEP_TASKS_STATUS'; stepId: string; status: Task['status'] };

let uidCounter = 0;
function uid(prefix: string): string {
  uidCounter += 1;
  return `${prefix}-${Date.now().toString(36)}-${uidCounter.toString(36)}`;
}

function logEntry(message: string): HistoryEntry {
  return { id: uid('h'), at: new Date().toISOString(), message };
}

function withHistory(state: ProjectState, message: string): ProjectState {
  const history = [logEntry(message), ...state.history].slice(0, HISTORY_LIMIT);
  return { ...state, history, updatedAt: new Date().toISOString() };
}

function replaceTask(step: Step, taskId: string, updater: (t: Task) => Task): Step {
  return { ...step, tasks: step.tasks.map((t) => (t.id === taskId ? updater(t) : t)) };
}

function reducer(state: ProjectState, action: Action): ProjectState {
  switch (action.type) {
    case 'HYDRATE':
      return action.payload;

    case 'TOGGLE_TASK': {
      const step = state.steps.find((s) => s.id === action.stepId);
      const task = step?.tasks.find((t) => t.id === action.taskId);
      if (!step || !task) return state;

      const nowDone = task.status !== 'concluida';
      const nextSteps = state.steps.map((s) =>
        s.id !== action.stepId
          ? s
          : replaceTask(s, action.taskId, (t) => ({
              ...t,
              status: nowDone ? 'concluida' : 'nao_iniciada',
              completedAt: nowDone ? new Date().toISOString() : null,
            })),
      );

      return withHistory(
        { ...state, steps: nextSteps, updatedAt: new Date().toISOString() },
        `${nowDone ? 'Concluída' : 'Reaberta'}: "${task.title}" (Etapa ${step.number})`,
      );
    }

    case 'UPDATE_TASK': {
      const step = state.steps.find((s) => s.id === action.stepId);
      const task = step?.tasks.find((t) => t.id === action.taskId);
      if (!step || !task) return state;

      const nextSteps = state.steps.map((s) =>
        s.id !== action.stepId
          ? s
          : replaceTask(s, action.taskId, (t) => {
              const merged = { ...t, ...action.patch };
              if (action.patch.status !== undefined) {
                if (action.patch.status === 'concluida' && t.status !== 'concluida') {
                  merged.completedAt = new Date().toISOString();
                }
                if (action.patch.status !== 'concluida' && t.status === 'concluida') {
                  merged.completedAt = null;
                }
              }
              return merged;
            }),
      );

      const base = { ...state, steps: nextSteps, updatedAt: new Date().toISOString() };
      return action.log ? withHistory(base, action.log) : base;
    }

    case 'ADD_TASK': {
      const step = state.steps.find((s) => s.id === action.stepId);
      if (!step) return state;
      const title = action.title.trim();
      if (!title) return state;

      const newTask: Task = {
        id: uid('task'),
        title,
        status: 'nao_iniciada',
        priority: 'media',
        notes: '',
        dueDate: null,
        completedAt: null,
        createdAt: new Date().toISOString(),
        custom: true,
      };

      const nextSteps = state.steps.map((s) =>
        s.id === action.stepId ? { ...s, tasks: [...s.tasks, newTask] } : s,
      );

      return withHistory(
        { ...state, steps: nextSteps, updatedAt: new Date().toISOString() },
        `Tarefa adicionada na Etapa ${step.number}: "${title}"`,
      );
    }

    case 'DELETE_TASK': {
      const step = state.steps.find((s) => s.id === action.stepId);
      const task = step?.tasks.find((t) => t.id === action.taskId);
      if (!step || !task) return state;

      const nextSteps = state.steps.map((s) =>
        s.id === action.stepId ? { ...s, tasks: s.tasks.filter((t) => t.id !== action.taskId) } : s,
      );

      return withHistory(
        { ...state, steps: nextSteps, updatedAt: new Date().toISOString() },
        `Tarefa removida da Etapa ${step.number}: "${task.title}"`,
      );
    }

    case 'UPDATE_STEP': {
      const step = state.steps.find((s) => s.id === action.stepId);
      if (!step) return state;

      const nextSteps = state.steps.map((s) => (s.id === action.stepId ? { ...s, ...action.patch } : s));
      const base = { ...state, steps: nextSteps, updatedAt: new Date().toISOString() };
      return action.log ? withHistory(base, action.log) : base;
    }

    case 'SET_STEP_TASKS_STATUS': {
      const step = state.steps.find((s) => s.id === action.stepId);
      if (!step) return state;
      const now = new Date().toISOString();
      const nextSteps = state.steps.map((s) =>
        s.id !== action.stepId
          ? s
          : {
              ...s,
              tasks: s.tasks.map((t) => ({
                ...t,
                status: action.status,
                completedAt: action.status === 'concluida' ? now : null,
              })),
            },
      );
      return withHistory(
        { ...state, steps: nextSteps, updatedAt: now },
        `Etapa ${step.number}: todas as tarefas marcadas como "${action.status}".`,
      );
    }

    case 'ADD_NOTE': {
      return withHistory(
        { ...state, notes: [action.note, ...state.notes], updatedAt: new Date().toISOString() },
        `Nota criada: "${action.note.title}"`,
      );
    }

    case 'UPDATE_NOTE': {
      const nextNotes = state.notes.map((n) =>
        n.id === action.id ? { ...n, ...action.patch, updatedAt: new Date().toISOString() } : n,
      );
      return { ...state, notes: nextNotes, updatedAt: new Date().toISOString() };
    }

    case 'DELETE_NOTE': {
      const note = state.notes.find((n) => n.id === action.id);
      return withHistory(
        { ...state, notes: state.notes.filter((n) => n.id !== action.id), updatedAt: new Date().toISOString() },
        `Nota removida: "${note?.title ?? action.id}"`,
      );
    }

    case 'SET_THEME':
      return { ...state, theme: action.theme, updatedAt: new Date().toISOString() };

    case 'IMPORT':
      return withHistory(
        { ...action.payload, updatedAt: new Date().toISOString() },
        'Backup importado e dados substituídos.',
      );

    case 'RESET':
      return createInitialState();

    case 'CLEAR_HISTORY':
      return { ...state, history: [], updatedAt: new Date().toISOString() };

    default:
      return state;
  }
}

interface ProjectContextValue {
  state: ProjectState;
  ready: boolean;
  loadError: string | null;
  saveStatus: SaveStatus;
  lastSavedAt: string | null;
  dispatch: React.Dispatch<Action>;
  importState: (next: ProjectState) => void;
  resetToInitial: () => Promise<void>;
  clearHistory: () => void;
  setTheme: (theme: Theme) => void;
}

const ProjectContext = createContext<ProjectContextValue | null>(null);

export function ProjectProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, undefined, createInitialState);
  const [ready, setReady] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle');
  const [lastSavedAt, setLastSavedAt] = useState<string | null>(null);

  const hydratedRef = useRef(false);
  const saveTimerRef = useRef<number | null>(null);

  /* ---------- Carga inicial ---------- */
  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const { state: stored } = await loadState();
        if (cancelled) return;

        if (stored) {
          const normalized = normalizeStoredState(stored);
          if (normalized.steps.length === 0) {
            setLoadError('Os dados salvos estavam corrompidos. O projeto foi reiniciado.');
            dispatch({ type: 'HYDRATE', payload: createInitialState() });
          } else {
            dispatch({ type: 'HYDRATE', payload: normalized });
          }
        } else {
          dispatch({ type: 'HYDRATE', payload: createInitialState() });
        }
      } catch (error) {
        if (cancelled) return;
        console.error('[ProjectProvider] Falha ao carregar dados:', error);
        setLoadError('Não foi possível ler os dados salvos. Um projeto novo foi iniciado.');
        dispatch({ type: 'HYDRATE', payload: createInitialState() });
      } finally {
        if (!cancelled) {
          hydratedRef.current = true;
          setReady(true);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  /* ---------- Salvamento automático (debounce) ---------- */
  useEffect(() => {
    if (!ready || !hydratedRef.current) return;

    setSaveStatus('saving');
    if (saveTimerRef.current !== null) {
      window.clearTimeout(saveTimerRef.current);
    }

    saveTimerRef.current = window.setTimeout(async () => {
      try {
        await saveState(state);
        setSaveStatus('saved');
        setLastSavedAt(new Date().toISOString());
      } catch (error) {
        console.error('[ProjectProvider] Falha ao salvar:', error);
        setSaveStatus('error');
      }
    }, 350);

    return () => {
      if (saveTimerRef.current !== null) {
        window.clearTimeout(saveTimerRef.current);
      }
    };
  }, [state, ready]);

  /* ---------- Tema ---------- */
  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle('dark', state.theme === 'dark');
  }, [state.theme]);

  const importState = useCallback((next: ProjectState) => {
    dispatch({ type: 'IMPORT', payload: next });
  }, []);

  const resetToInitial = useCallback(async () => {
    await clearState();
    dispatch({ type: 'RESET' });
  }, []);

  const clearHistory = useCallback(() => dispatch({ type: 'CLEAR_HISTORY' }), []);
  const setTheme = useCallback((theme: Theme) => dispatch({ type: 'SET_THEME', theme }), []);

  const value = useMemo<ProjectContextValue>(
    () => ({
      state,
      ready,
      loadError,
      saveStatus,
      lastSavedAt,
      dispatch,
      importState,
      resetToInitial,
      clearHistory,
      setTheme,
    }),
    [state, ready, loadError, saveStatus, lastSavedAt, importState, resetToInitial, clearHistory, setTheme],
  );

  return <ProjectContext.Provider value={value}>{children}</ProjectContext.Provider>;
}

export function useProject(): ProjectContextValue {
  const ctx = useContext(ProjectContext);
  if (!ctx) throw new Error('useProject deve ser usado dentro de <ProjectProvider>.');
  return ctx;
}

export type { Action as ProjectAction };
export type { Priority };