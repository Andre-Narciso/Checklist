/** Retorna YYYY-MM-DD no fuso local. */
export function toISODate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function todayISO(): string {
  return toISODate(new Date());
}

/** Converte YYYY-MM-DD em DD/MM/AAAA. */
export function formatBR(iso?: string | null): string {
  if (!iso) return '—';
  const datePart = iso.length > 10 ? iso.slice(0, 10) : iso;
  const [y, m, d] = datePart.split('-');
  if (!y || !m || !d) return '—';
  return `${d}/${m}/${y}`;
}

export function formatDateTimeBR(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function isOverdue(dueDate: string | null, status: string): boolean {
  if (!dueDate || status === 'concluida') return false;
  return dueDate < todayISO();
}

export function daysUntil(dueDate: string): number {
  const now = new Date(todayISO() + 'T00:00:00');
  const target = new Date(dueDate + 'T00:00:00');
  return Math.round((target.getTime() - now.getTime()) / 86_400_000);
}