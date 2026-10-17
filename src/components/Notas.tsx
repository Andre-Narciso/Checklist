import { Pencil, Plus, StickyNote, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { useProject } from '../context/ProjectContext';
import type { ProjectNote } from '../types';
import { formatDateTimeBR } from '../utils/date';
import { Card, ConfirmDialog, EmptyState, Modal, SectionTitle } from './ui';

function uid() {
  return `note-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
}

export function Notas() {
  const { state, dispatch } = useProject();
  const [editing, setEditing] = useState<ProjectNote | null>(null);
  const [creating, setCreating] = useState(false);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [toDelete, setToDelete] = useState<ProjectNote | null>(null);

  const openCreate = () => {
    setTitle('');
    setContent('');
    setCreating(true);
  };

  const openEdit = (note: ProjectNote) => {
    setTitle(note.title);
    setContent(note.content);
    setEditing(note);
  };

  const close = () => {
    setCreating(false);
    setEditing(null);
  };

  const save = () => {
    const now = new Date().toISOString();
    if (editing) {
      dispatch({ type: 'UPDATE_NOTE', id: editing.id, patch: { title: title.trim() || 'Sem título', content } });
    } else {
      dispatch({
        type: 'ADD_NOTE',
        note: {
          id: uid(),
          title: title.trim() || 'Sem título',
          content,
          createdAt: now,
          updatedAt: now,
        },
      });
    }
    close();
  };

  const sorted = [...state.notes].sort((a, b) => (a.updatedAt < b.updatedAt ? 1 : -1));

  return (
    <div className="space-y-4">
      <Card className="p-5">
        <SectionTitle
          title="Notas do projeto"
          subtitle="Registre decisões, ideias e lembretes relevantes para o JurisSuite"
          action={
            <button type="button" className="btn-primary" onClick={openCreate}>
              <Plus size={15} /> Nova nota
            </button>
          }
        />

        {sorted.length === 0 ? (
          <EmptyState
            icon={<StickyNote size={32} />}
            title="Nenhuma nota registrada"
            description="Crie notas para documentar decisões e contexto do projeto."
            action={
              <button type="button" className="btn-primary" onClick={openCreate}>
                <Plus size={15} /> Criar primeira nota
              </button>
            }
          />
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {sorted.map((note) => (
              <div
                key={note.id}
                className="flex flex-col rounded-xl border border-slate-200 bg-amber-50/40 p-4 dark:border-slate-800 dark:bg-amber-950/10"
              >
                <h3 className="mb-1 font-semibold text-slate-900 dark:text-slate-50">{note.title}</h3>
                <p className="mb-3 flex-1 whitespace-pre-wrap text-sm text-slate-600 dark:text-slate-300">
                  {note.content || <span className="italic text-slate-400">Sem conteúdo</span>}
                </p>
                <div className="flex items-center justify-between border-t border-slate-200 pt-2 text-xs text-slate-500 dark:border-slate-800 dark:text-slate-400">
                  <span>Atualizada em {formatDateTimeBR(note.updatedAt)}</span>
                  <div className="flex gap-1">
                    <button type="button" className="btn-ghost p-1.5" onClick={() => openEdit(note)} aria-label={`Editar nota ${note.title}`}>
                      <Pencil size={14} />
                    </button>
                    <button
                      type="button"
                      className="btn-ghost p-1.5 text-red-600 dark:text-red-400"
                      onClick={() => setToDelete(note)}
                      aria-label={`Excluir nota ${note.title}`}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      <Modal
        open={creating || editing !== null}
        title={editing ? 'Editar nota' : 'Nova nota'}
        onClose={close}
        footer={
          <>
            <button type="button" className="btn-outline" onClick={close}>
              Cancelar
            </button>
            <button type="button" className="btn-primary" onClick={save}>
              Salvar
            </button>
          </>
        }
      >
        <div className="space-y-3">
          <div>
            <label className="label" htmlFor="note-title">
              Título
            </label>
            <input
              id="note-title"
              className="input"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ex.: Decisão sobre arquitetura"
              autoFocus
            />
          </div>
          <div>
            <label className="label" htmlFor="note-content">
              Conteúdo
            </label>
            <textarea
              id="note-content"
              className="input resize-y"
              rows={6}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Descreva o contexto, a decisão e os próximos passos…"
            />
          </div>
        </div>
      </Modal>

      <ConfirmDialog
        open={toDelete !== null}
        title="Excluir nota"
        message={<>Deseja excluir a nota <strong>“{toDelete?.title}”</strong>?</>}
        confirmLabel="Excluir"
        destructive
        onCancel={() => setToDelete(null)}
        onConfirm={() => {
          if (toDelete) dispatch({ type: 'DELETE_NOTE', id: toDelete.id });
          setToDelete(null);
        }}
      />
    </div>
  );
}