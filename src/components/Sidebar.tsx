import {
  BarChart3,
  CheckSquare,
  ClipboardList,
  DatabaseBackup,
  LayoutDashboard,
  ListTodo,
  Map,
  Scale,
  Settings,
  StickyNote,
} from 'lucide-react';
import type { ViewId } from '../types';
import { cn } from './ui';

interface NavItem {
  id: ViewId;
  label: string;
  icon: React.ReactNode;
}

const NAV_ITEMS: NavItem[] = [
  { id: 'overview', label: 'Visão geral', icon: <LayoutDashboard size={17} /> },
  { id: 'roadmap', label: 'Roadmap', icon: <Map size={17} /> },
  { id: 'checklist', label: 'Checklist de tarefas', icon: <CheckSquare size={17} /> },
  { id: 'pendencias', label: 'Pendências', icon: <ListTodo size={17} /> },
  { id: 'notas', label: 'Notas do projeto', icon: <StickyNote size={17} /> },
  { id: 'relatorios', label: 'Relatórios', icon: <BarChart3 size={17} /> },
  { id: 'backup', label: 'Backup e restauração', icon: <DatabaseBackup size={17} /> },
  { id: 'configuracoes', label: 'Configurações', icon: <Settings size={17} /> },
];

export function Sidebar({
  view,
  onNavigate,
  open,
  onClose,
  footer,
}: {
  view: ViewId;
  onNavigate: (view: ViewId) => void;
  open: boolean;
  onClose: () => void;
  footer?: React.ReactNode;
}) {
  return (
    <>
      {/* Overlay mobile */}
      {open && (
        <div
          className="fixed inset-0 z-30 bg-slate-950/50 backdrop-blur-sm lg:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-40 flex w-72 flex-col bg-navy-950 text-slate-300 transition-transform duration-200 lg:static lg:translate-x-0',
          open ? 'translate-x-0' : '-translate-x-full',
        )}
        aria-label="Navegação principal"
      >
        <div className="flex items-center gap-3 border-b border-white/5 px-5 py-5">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 text-white shadow-lg shadow-blue-600/25">
            <Scale size={20} />
          </div>
          <div className="min-w-0">
            <p className="truncate text-base font-bold leading-tight text-white">JurisSuite</p>
            <p className="truncate text-xs text-slate-400">Dashboard de desenvolvimento</p>
          </div>
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
          <p className="px-3 pb-2 text-[11px] font-semibold uppercase tracking-wider text-slate-500">Navegação</p>
          {NAV_ITEMS.map((item) => {
            const active = view === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  onNavigate(item.id);
                  onClose();
                }}
                aria-current={active ? 'page' : undefined}
                className={cn(
                  'flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                  active
                    ? 'bg-blue-600 text-white shadow-sm shadow-blue-600/25'
                    : 'text-slate-300 hover:bg-white/5 hover:text-white',
                )}
              >
                <span className={cn(active ? 'text-white' : 'text-slate-400')}>{item.icon}</span>
                <span className="truncate">{item.label}</span>
              </button>
            );
          })}
        </nav>

        <div className="border-t border-white/5 px-4 py-4">
          <div className="mb-3 flex items-start gap-2 rounded-lg bg-white/5 p-3 text-[11px] leading-relaxed text-slate-400">
            <ClipboardList size={14} className="mt-0.5 shrink-0" />
            <span>
              Os dados ficam salvos <strong className="text-slate-200">neste navegador</strong>. Exporte backups
              regularmente.
            </span>
          </div>
          {footer}
        </div>
      </aside>
    </>
  );
}