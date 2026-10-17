import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import type { Step, TaskStatus } from '../types';
import { stepStats } from '../utils/calculations';
import { CHART_COLORS, STATUS_LABELS } from '../utils/labels';
import { useProject } from '../context/ProjectContext';

/* ---------------- Anel de progresso ---------------- */

export function ProgressRing({
  percent,
  size = 168,
  strokeWidth = 14,
  label = 'concluído',
}: {
  percent: number;
  size?: number;
  strokeWidth?: number;
  label?: string;
}) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (Math.max(0, Math.min(100, percent)) / 100) * circumference;

  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90" role="img" aria-label={`Progresso geral: ${percent}%`}>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          strokeWidth={strokeWidth}
          className="stroke-slate-200 dark:stroke-slate-800"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          stroke="#2563eb"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          style={{ transition: 'stroke-dashoffset 600ms ease' }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-3xl font-bold tabular-nums text-slate-900 dark:text-slate-50">{percent}%</span>
        <span className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">{label}</span>
      </div>
    </div>
  );
}

/* ---------------- Barras horizontais por etapa ---------------- */

export function StepsBarChart({ steps, height = 520 }: { steps: Step[]; height?: number }) {
  const { state } = useProject();
  const isDark = state.theme === 'dark';

  const data = steps.map((step) => {
    const stats = stepStats(step);
    return {
      name: `${step.number}. ${step.name.length > 24 ? step.name.slice(0, 23) + '…' : step.name}`,
      fullName: step.name,
      percent: stats.percent,
      done: stats.done,
      total: stats.total,
    };
  });

  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} layout="vertical" margin={{ top: 8, right: 40, bottom: 8, left: 8 }}>
        <CartesianGrid horizontal={false} strokeDasharray="3 3" stroke={isDark ? '#1e293b' : '#e2e8f0'} />
        <XAxis
          type="number"
          domain={[0, 100]}
          tickFormatter={(v: number) => `${v}%`}
          tick={{ fontSize: 11, fill: isDark ? '#94a3b8' : '#64748b' }}
        />
        <YAxis
          type="category"
          dataKey="name"
          width={190}
          tick={{ fontSize: 11, fill: isDark ? '#cbd5e1' : '#334155' }}
        />
        <Tooltip
          formatter={(value: number, _name, item) => {
            const payload = item?.payload as { done: number; total: number } | undefined;
            return [`${value}% (${payload?.done ?? 0}/${payload?.total ?? 0} tarefas)`, 'Progresso'];
          }}
          labelFormatter={(_label, payload) => {
            const p = payload?.[0]?.payload as { fullName?: string } | undefined;
            return p?.fullName ?? '';
          }}
          contentStyle={{
            borderRadius: 10,
            border: `1px solid ${isDark ? '#334155' : '#e2e8f0'}`,
            background: isDark ? '#0f172a' : '#ffffff',
            color: isDark ? '#e2e8f0' : '#0f172a',
            fontSize: 12,
          }}
        />
        <Bar dataKey="percent" fill="#2563eb" radius={[0, 4, 4, 0]} barSize={14} />
      </BarChart>
    </ResponsiveContainer>
  );
}

/* ---------------- Rosca de distribuição ---------------- */

export function TaskDonut({ counts, height = 280 }: { counts: Record<TaskStatus, number>; height?: number }) {
  const { state } = useProject();
  const isDark = state.theme === 'dark';

  const data = (Object.keys(counts) as TaskStatus[])
    .map((key) => ({
      key,
      name: STATUS_LABELS[key],
      value: counts[key],
      color: CHART_COLORS[key],
    }))
    .filter((d) => d.value > 0);

  if (data.length === 0) {
    return (
      <div className="flex h-[280px] items-center justify-center text-sm text-slate-500 dark:text-slate-400">
        Nenhuma tarefa cadastrada.
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={height}>
      <PieChart>
        <Pie
          data={data}
          dataKey="value"
          nameKey="name"
          innerRadius="55%"
          outerRadius="82%"
          paddingAngle={2}
          stroke="none"
        >
          {data.map((entry) => (
            <Cell key={entry.key} fill={entry.color} />
          ))}
        </Pie>
        <Tooltip
          formatter={(value: number, name: string) => [`${value} tarefa(s)`, name]}
          contentStyle={{
            borderRadius: 10,
            border: `1px solid ${isDark ? '#334155' : '#e2e8f0'}`,
            background: isDark ? '#0f172a' : '#ffffff',
            color: isDark ? '#e2e8f0' : '#0f172a',
            fontSize: 12,
          }}
        />
        <Legend
          verticalAlign="bottom"
          iconType="circle"
          formatter={(value) => (
            <span style={{ color: isDark ? '#cbd5e1' : '#334155', fontSize: 12 }}>{value}</span>
          )}
        />
      </PieChart>
    </ResponsiveContainer>
  );
}