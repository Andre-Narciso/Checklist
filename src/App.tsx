import { useCallback, useEffect, useState } from 'react';
import { CheckSquare, Search, TriangleAlert } from 'lucide-react';
import { useProject } from './context/ProjectContext';
import type { ViewId } from './types';
import { Backup } from './components/Backup';
import { Checklist } from './components/Checklist';
import { Configuracoes } from './components/Configuracoes';
import { Dashboard } from './components/Dashboard';
import { Header } from './components/Header';
import { Notas } from './components/Notas';
import { Pendencias } from './components/Pendencias';
import { Relatorios } from './components/Relatorios';
import { Roadmap } from './components/Roadmap';
import { Sidebar } from './components/Sidebar';
import { Card, EmptyState } from './components/ui';

const VALID_VIEWS: ViewId[] = [
  'overview',
  'roadmap',
  'checklist',
  'pendencias',
  'notas',
  'relatorios',
  'backup',
  'configuracoes',
];

function readHashView(): ViewId {
  const hash = window.location.hash.replace('#', '') as ViewId;
  return VALID_VIEWS.includes(hash) ? hash : 'overview';
}

export default function App() {
  const { state, ready, loadError } = useProject();
  const [view, setView] = useState<ViewId>(readHashView);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [focusStepId, setFocusStepId] = useState<string | null>(null);

  /* Sincroniza view <-> hash */
  useEffect(() => {
    const onHashChange = () => setView(readHashView());
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);

  const navigate = useCallback((next: ViewId) => {
    setView(next);
    window.location.hash = next;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const handleSearchChange = useCallback(
    (value: string) => {
      setSearch(value);
      if (value.trim().length > 0 && view !== 'checklist') {
        setFocusStepId(null);
        navigate('checklist');
      }
    },
    [view, navigate],
  );

  const openStep = useCallback(
    (stepId: string) => {
      setFocusStepId(stepId);
      navigate('checklist');
    },
    [navigate],
  );

  if (!ready) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-100 dark:bg-slate-950">
        <div className="flex flex-col items-center gap-3">
          <div className="h-9 w-9 animate-spin rounded-full border-2 border-slate-300 border-t-blue-600 dark:border-slate-700 dark:border-t-blue-500" />
          <p className="text-sm text-slate-500 dark:text-slate-400">Carregando dados do projeto…</p>
        </div>
      </div>
    );
  }

  const hasSteps = state.steps.length > 0;

  return (
    <div className="flex min-h-screen bg-slate-100 dark:bg-slate-950">
      <Sidebar
        view={view}
        onNavigate={navigate}
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      <div className="flex min-w-0 flex-1 flex-col">
        <Header
          view={view}
          search={search}
          onSearchChange={handleSearchChange}
          onOpenSidebar={() => setSidebarOpen(true)}
          onOpenBackup={() => navigate('backup')}
        />

        <main className="flex-1 px-4 py-5 sm:px-6 sm:py-6">
          {loadError && (
            <div className="mb-4 flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800 dark:border-amber-900/60 dark:bg-amber-950/30 dark:text-amber-300">
              <TriangleAlert size={16} className="mt-0.5 shrink-0" />
              <span>{loadError}</span>
            </div>
          )}

          {!hasSteps ? (
            <Card className="p-6">
              <EmptyState
                icon={<CheckSquare size={36} />}
                title="Nenhuma etapa cadastrada"
                description="Restaure os dados iniciais na página de Backup para recriar as 18 etapas do JurisSuite."
              />
            </Card>
          ) : (
            <div className="mx-auto w-full max-w-[1400px]">
              {view === 'overview' && <Dashboard onNavigate={navigate} />}
              {view === 'roadmap' && <Roadmap onOpenStep={openStep} />}
              {view === 'checklist' && (
                <Checklist
                  search={search}
                  onSearchChange={handleSearchChange}
                  focusStepId={focusStepId}
                />
              )}
              {view === 'pendencias' && <Pendencias />}
              {view === 'notas' && <Notas />}
              {view === 'relatorios' && <Relatorios />}
              {view === 'backup' && <Backup />}
              {view === 'configuracoes' && <Configuracoes />}
            </div>
          )}
        </main>

        <footer className="border-t border-slate-200 px-4 py-4 text-center text-xs text-slate-500 dark:border-slate-800 dark:text-slate-400 sm:px-6">
          <span className="inline-flex items-center gap-1.5">
            <Search size={12} />
            JurisSuite · dashboard local de desenvolvimento · dados salvos apenas neste navegador
          </span>
        </footer>
      </div>
    </div>
  );
}