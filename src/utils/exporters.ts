import type { ProjectState, Step } from '../types';
import { PRIORITY_LABELS, STATUS_LABELS } from './labels';

export function downloadFile(filename: string, content: string, mime: string) {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1500);
}

export function stateToJSON(state: ProjectState): string {
  return JSON.stringify(state, null, 2);
}

function csvCell(value: string): string {
  const v = (value ?? '').replace(/"/g, '""');
  return `"${v}"`;
}

/** CSV com separador ";" (compatível com Excel pt-BR) e BOM. */
export function tasksToCSV(steps: Step[]): string {
  const header = [
    'Etapa',
    'Numero',
    'Tarefa',
    'Status',
    'Prioridade',
    'Prazo',
    'Concluida em',
    'Personalizada',
    'Observacoes',
  ];
  const rows: string[] = [header.map(csvCell).join(';')];

  for (const step of steps) {
    for (const task of step.tasks) {
      rows.push(
        [
          step.name,
          String(step.number),
          task.title,
          STATUS_LABELS[task.status],
          PRIORITY_LABELS[task.priority],
          task.dueDate ?? '',
          task.completedAt ? task.completedAt.slice(0, 10) : '',
          task.custom ? 'Sim' : 'Nao',
          task.notes ?? '',
        ]
          .map(csvCell)
          .join(';'),
      );
    }
  }
  return '\uFEFF' + rows.join('\r\n');
}

export function stepsToCSV(steps: Step[]): string {
  const header = ['Numero', 'Etapa', 'Tarefas', 'Concluidas', 'Percentual', 'Estado'];
  const rows: string[] = [header.map(csvCell).join(';')];
  for (const step of steps) {
    const total = step.tasks.length;
    const done = step.tasks.filter((t) => t.status === 'concluida').length;
    const pct = total ? Math.round((done / total) * 100) : 0;
    const state =
      total && done === total ? 'Concluida' : done > 0 ? 'Em andamento' : 'Nao iniciada';
    rows.push(
      [String(step.number), step.name, String(total), String(done), `${pct}%`, state]
        .map(csvCell)
        .join(';'),
    );
  }
  return '\uFEFF' + rows.join('\r\n');
}