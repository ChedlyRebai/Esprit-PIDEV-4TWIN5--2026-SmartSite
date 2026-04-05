import React from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export const RECOMMENDATION_TYPE_LABELS: Record<string, string> = {
  energy: 'Energy & consumption',
  equipment: 'Equipment & plant',
  workforce: 'Workforce',
  scheduling: 'Scheduling & deadlines',
  environmental: 'Environment & waste',
  budget: 'Site budget',
  task_distribution: 'Task distribution',
  timeline: 'Milestones & schedule',
  resource_allocation: 'Resource allocation',
  individual_task_management: 'Individual task follow-up',
};

function metricsFromSnapshot(s: Record<string, unknown> | null | undefined) {
  if (!s || typeof s !== 'object') return null;
  const b = s.budget as Record<string, number> | undefined;
  const t = s.tasks as Record<string, number> | undefined;
  const e = s.efficiency as Record<string, number> | undefined;
  return {
    budgetSpent: Number(b?.spent) || 0,
    tasksCompleted: Number(t?.completed) || 0,
    tasksOverdue: Number(t?.overdue) || 0,
    taskCompletionRate: Number(e?.taskCompletionRate) || 0,
    budgetUtilization: Number(e?.budgetUtilization) || 0,
  };
}

export function buildComparisonBarRows(
  before: Record<string, unknown>,
  after: Record<string, unknown>,
): { label: string; refApprobation: number; apresMiseEnOeuvre: number }[] {
  const b = metricsFromSnapshot(before);
  const a = metricsFromSnapshot(after);
  if (!b || !a) return [];
  return [
    { label: 'Budget spent (TND)', refApprobation: b.budgetSpent, apresMiseEnOeuvre: a.budgetSpent },
    { label: 'Tasks completed', refApprobation: b.tasksCompleted, apresMiseEnOeuvre: a.tasksCompleted },
    { label: 'Overdue tasks', refApprobation: b.tasksOverdue, apresMiseEnOeuvre: a.tasksOverdue },
    { label: 'Completion rate (%)', refApprobation: b.taskCompletionRate, apresMiseEnOeuvre: a.taskCompletionRate },
    {
      label: 'Budget utilization (%)',
      refApprobation: b.budgetUtilization,
      apresMiseEnOeuvre: a.budgetUtilization,
    },
  ];
}

export function buildPercentEvolutionLineData(
  before: Record<string, unknown>,
  after: Record<string, unknown>,
) {
  const b = metricsFromSnapshot(before);
  const a = metricsFromSnapshot(after);
  if (!b || !a) return [];
  return [
    {
      phase: 'At approval',
      completionPct: b.taskCompletionRate,
      budgetUtilPct: b.budgetUtilization,
    },
    {
      phase: 'After implementation',
      completionPct: a.taskCompletionRate,
      budgetUtilPct: a.budgetUtilization,
    },
  ];
}

export function buildAggregateBarRows(
  comparisons: { before: Record<string, unknown>; after: Record<string, unknown> }[],
) {
  if (!comparisons.length) return [];
  const rows = comparisons.map((c) => buildComparisonBarRows(c.before, c.after)).filter((r) => r.length);
  if (!rows.length) return [];
  const keys = rows[0].map((r) => r.label);
  return keys.map((label) => {
    let sumA = 0;
    let sumP = 0;
    let n = 0;
    for (const r of rows) {
      const row = r.find((x) => x.label === label);
      if (row) {
        sumA += row.refApprobation;
        sumP += row.apresMiseEnOeuvre;
        n += 1;
      }
    }
    return {
      label,
      refApprobation: n ? sumA / n : 0,
      apresMiseEnOeuvre: n ? sumP / n : 0,
    };
  });
}

interface BeforeAfterPairProps {
  title: string;
  typeKey: string;
  before: Record<string, unknown>;
  after: Record<string, unknown>;
}

export const BeforeAfterPairCharts: React.FC<BeforeAfterPairProps> = ({
  title,
  typeKey,
  before,
  after,
}) => {
  const barData = buildComparisonBarRows(before, after);
  const lineData = buildPercentEvolutionLineData(before, after);
  const typeLabel = RECOMMENDATION_TYPE_LABELS[typeKey] || typeKey;

  if (!barData.length) {
    return (
      <p className="text-sm text-muted-foreground py-4">
        Site metrics are incomplete for this recommendation.
      </p>
    );
  }

  return (
    <div className="space-y-6 border rounded-lg p-4 bg-card">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-lg font-semibold text-foreground">{title}</h3>
        <span className="text-xs font-medium px-2 py-1 rounded-md bg-muted text-muted-foreground">
          {typeLabel}
        </span>
      </div>
      <p className="text-sm text-muted-foreground">
        Comparison of metrics captured at approval (baseline) and after implementation is confirmed on site.
      </p>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="shadow-none border border-border/80">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Key KPIs — bars</CardTitle>
            <CardDescription>Orange: at approval · Green: after implementation</CardDescription>
          </CardHeader>
          <CardContent className="h-[300px] pt-0">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={barData} margin={{ top: 8, right: 8, left: 8, bottom: 48 }}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="label" tick={{ fontSize: 10 }} interval={0} angle={-25} textAnchor="end" height={70} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip
                  formatter={(value: number) => (Number.isFinite(value) ? value.toLocaleString('en-US') : '—')}
                  labelStyle={{ fontWeight: 600 }}
                />
                <Legend />
                <Bar dataKey="refApprobation" name="At approval" fill="#ea580c" radius={[4, 4, 0, 0]} />
                <Bar dataKey="apresMiseEnOeuvre" name="After implementation" fill="#16a34a" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="shadow-none border border-border/80">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Percentage curves</CardTitle>
            <CardDescription>Completion rate and budget utilization between the two milestones</CardDescription>
          </CardHeader>
          <CardContent className="h-[300px] pt-0">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={lineData} margin={{ top: 12, right: 12, left: 8, bottom: 8 }}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="phase" tick={{ fontSize: 11 }} />
                <YAxis domain={[0, 'auto']} tick={{ fontSize: 11 }} unit=" %" />
                <Tooltip formatter={(v: number) => `${Number(v).toFixed(1)} %`} />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="completionPct"
                  name="Completion rate (%)"
                  stroke="#2563eb"
                  strokeWidth={2}
                  dot={{ r: 5 }}
                  activeDot={{ r: 7 }}
                />
                <Line
                  type="monotone"
                  dataKey="budgetUtilPct"
                  name="Budget utilization (%)"
                  stroke="#7c3aed"
                  strokeWidth={2}
                  dot={{ r: 5 }}
                  activeDot={{ r: 7 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

interface AggregateChartProps {
  comparisons: { before: Record<string, unknown>; after: Record<string, unknown> }[];
}

interface BaselineOnlyProps {
  title: string;
  typeKey: string;
  baseline: Record<string, unknown>;
}

/** Recommandation approuvée mais pas encore implémentée : uniquement le snapshot à l’approbation */
export const BaselineAtApprovalCard: React.FC<BaselineOnlyProps> = ({ title, typeKey, baseline }) => {
  const m = metricsFromSnapshot(baseline);
  const typeLabel = RECOMMENDATION_TYPE_LABELS[typeKey] || typeKey;
  const barData = m
    ? [
        { label: 'Budget spent (TND)', valeur: m.budgetSpent },
        { label: 'Tasks completed', valeur: m.tasksCompleted },
        { label: 'Overdue tasks', valeur: m.tasksOverdue },
        { label: 'Completion rate (%)', valeur: m.taskCompletionRate },
        { label: 'Budget utilization (%)', valeur: m.budgetUtilization },
      ]
    : [];

  return (
    <div className="border rounded-lg p-4 space-y-3 bg-muted/20">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="font-semibold">{title}</h3>
        <span className="text-xs px-2 py-1 rounded-md bg-muted">{typeLabel}</span>
      </div>
      <p className="text-sm text-muted-foreground">
        Baseline saved at approval. Full before/after curves will appear once the recommendation is marked implemented on
        site.
      </p>
      {barData.length > 0 ? (
        <div className="h-[220px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={barData} margin={{ top: 8, right: 8, left: 8, bottom: 40 }}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis dataKey="label" tick={{ fontSize: 9 }} interval={0} angle={-20} textAnchor="end" height={58} />
              <YAxis tick={{ fontSize: 10 }} />
              <Tooltip formatter={(v: number) => (Number.isFinite(v) ? Number(v).toLocaleString('en-US') : '—')} />
              <Bar dataKey="valeur" name="At approval" fill="#ea580c" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      ) : null}
    </div>
  );
};

export const SiteAggregateBeforeAfterChart: React.FC<AggregateChartProps> = ({ comparisons }) => {
  const data = buildAggregateBarRows(comparisons);
  if (!data.length) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Site overview (averages)</CardTitle>
        <CardDescription>
          Average KPIs across all recommendations tracked through implementation (same scale per metric)
        </CardDescription>
      </CardHeader>
      <CardContent className="h-[340px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 8, right: 8, left: 8, bottom: 48 }}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis dataKey="label" tick={{ fontSize: 10 }} interval={0} angle={-22} textAnchor="end" height={72} />
            <YAxis tick={{ fontSize: 11 }} />
            <Tooltip formatter={(value: number) => (Number.isFinite(value) ? Number(value).toFixed(1) : '—')} />
            <Legend />
            <Bar dataKey="refApprobation" name="At approval (avg.)" fill="#ea580c" radius={[4, 4, 0, 0]} />
            <Bar dataKey="apresMiseEnOeuvre" name="After implementation (avg.)" fill="#16a34a" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};
