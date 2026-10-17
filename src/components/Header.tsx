import { DatabaseBackup, Menu, Moon, Save, Sun, TriangleAlert, Check } from 'lucide-react';
import { useEffect, useRef } from 'react';
import { useProject } from '../context/ProjectContext';
import { overallStats } from '../utils/calculations';
import type { ViewId } from '../types';
import { cn } from './ui';

export const VIEW_TITLES: Record<ViewId, string> = {
  overview: 'Visão geral',
  roadmap: 'Roadmap',
  checklist: 'Checklist de tarefas',
  pendencias: 'Pendências',
  notas: 'Notas do projeto',
  relatorios: 'Relatórios',
  backup: 'Backup e restauração',
  configuracoes: 'Configurações',
};

function SaveIndicator() {
  const { saveStatus, lastSavedAt } = useProject();

  const config = {
    idle: { icon: <Save size={13} />, text: 'Aguardando', className: 'text-slate-500 dark:text-slate-400' },
    saving: { icon: <Save size={13} className="animate-pulse" />, text: 'Salvando…', className: 'text-blue-600 dark:text-blue-400' },
    saved: { icon: <Check size={13} />, text: 'Salvo', className: 'text-emerald-600 dark:text-emerald-400' },
    error: { icon: <TriangleAlert size={13} />, text: 'Erro ao salvar', className: 'text-red-600 dark:text-red-400' },
  }[saveStatus];

  return (
    <div
      className={cn('flex items-center gap-1.5 rounded-lg bg-slate-100 px-2.5 py-1.5 text-xs font-medium dark:bg-slate-800', config.className)}
      role="status"
      aria-live="polite"
      title={lastSavedAt ? `Último salvamento: ${new Date(lastSavedAt).toLocaleTimeString('pt-BR')}` : undefined}
    >
      {config.icon}
      <span className="hidden sm:inline">{config.text}</span>
    </div>
  );
}

export function Header({
  view,
  search,
  onSearchChange,
  onOpenSidebar,
  onOpenBackup,
}: {
  view: ViewId;
  search: string;
  onSearchChange: (value: string) => void;
  onOpenSidebar: () => void;
  onOpenBackup: () => void;
}) {
  const { state, setTheme } = useProject();
  const stats = overallStats(state.steps);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        inputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  return (
    <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/85 backdrop-blur dark:border-slate-800 dark:bg-slate-900/85">
      <div className="flex flex-wrap items-center gap-3 px-4 py-3 sm:px-6">
        <button type="button" className="btn-ghost p-2 lg:hidden" onClick={onOpenSidebar} aria-label="Abrir menu">
          <Menu size={18} />
        </button>

        <div className="min-w-0 flex-1">
          <h1 className="truncate text-lg font-semibold text-slate-900 dark:text-slate-50">{VIEW_TITLES[view]}</h1>
          <p className="hidden text-xs text-slate-500 dark:text-slate-400 sm:block">
            {stats.doneTasks} de {stats.totalTasks} tarefas concluídas · {stats.percent}% do projeto
          </p>
        </div>

        <div className="order-last w-full sm:order-none sm:w-72">
          <label className="sr-only" htmlFor="global-search">
            Buscar tarefas
          </label>
          <input
            id="global-search"
            ref={inputRef}
            type="search"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Buscar tarefas…  (Ctrl+K)"
            className="input py-1.5"
          />
        </div>

        <div className="flex items-center gap-2">
          <SaveIndicator />
          <button
            type="button"
            className="btn-ghost p-2"
            onClick={() => setTheme(state.theme === 'dark' ? 'light' : 'dark')}
            aria-label={state.theme === 'dark' ? 'Ativar tema claro' : 'Ativar tema escuro'}
          >
            {state.theme === 'dark' ? <Sun size={17} /> : <Moon size={17} />}
          </button>
          <button type="button" className="btn-primary" onClick={onOpenBackup}>
            <DatabaseBackup size={15} />
            <span className="hidden sm:inline">Backup</span>
          </button>
        </div>
      </div>
    </header>
  );
}