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
import { TrendingUp, TrendingDown, Zap, AlertCircle } from 'lucide-react';

export const RECOMMENDATION_TYPE_LABELS: Record<string, string> = {
  energy: '⚡ Énergie & Consommation',
  equipment: '🏗️ Équipements & Matériel',
  workforce: '👥 Main d\'œuvre',
  scheduling: '📅 Planning & Délais',
  environmental: '♻️ Environnement & Déchets',
  budget: '💰 Budget Chantier',
  task_distribution: '🎯 Distribution des Tâches',
  timeline: '⏱️ Jalons & Planning',
  resource_allocation: '📊 Allocation Ressources',
  individual_task_management: '✓ Suivi Tâche Individuelle',
};

export const METRIC_DESCRIPTIONS: Record<string, { fr: string; en: string; icon: string }> = {
  'Budget spent (TND)': {
    fr: 'Montant dépensé en TND. Réduction = meilleure maîtrise des coûts',
    en: 'Amount spent in TND. Reduction = better cost control',
    icon: '💵'
  },
  'Tasks completed': {
    fr: 'Nombre de tâches finalisées. Augmentation = plus de productivité',
    en: 'Number of completed tasks. Increase = better productivity',
    icon: '✅'
  },
  'Overdue tasks': {
    fr: 'Nombre de tâches en retard. Réduction = meilleur respect des délais',
    en: 'Number of overdue tasks. Reduction = better schedule adherence',
    icon: '⚠️'
  },
  'Completion rate (%)': {
    fr: 'Pourcentage de tâches complétées. Plus élevé = meilleur avancement',
    en: 'Percentage of completed tasks. Higher = better progress',
    icon: '📈'
  },
  'Budget utilization (%)': {
    fr: 'Pourcentage du budget utilisé. Optimisé = allocation efficace',
    en: 'Percentage of budget used. Optimized = efficient allocation',
    icon: '⚙️'
  }
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
    <div className="space-y-6 border rounded-lg p-6 bg-gradient-to-br from-card to-card/80 shadow-lg hover:shadow-xl transition-shadow">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex-1">
          <h3 className="text-lg font-bold text-foreground flex items-center gap-2">{title}</h3>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold px-3 py-1 rounded-full bg-gradient-to-r from-primary/20 to-primary/10 text-primary border border-primary/20">
            {typeLabel}
          </span>
        </div>
      </div>
      
      <div className="bg-muted/40 border border-muted p-3 rounded-lg">
        <p className="text-sm text-foreground/80 leading-relaxed">
          📊 <strong>Comparaison avant/après implémentation:</strong> Cette section affiche les métriques clés capturées à l'approbation de la recommandation (baseline en orange) et après sa mise en œuvre sur le terrain (résultats en vert). Les courbes en ligne pointage le taux de complétude et l'utilisation du budget.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="shadow-none border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-gradient-to-br from-orange-400/20 to-orange-500/20 rounded-lg">
                <TrendingUp className="h-4 w-4 text-orange-600" />
              </div>
              <div>
                <CardTitle className="text-base">📊 Indicateurs Clés (Barres)</CardTitle>
                <CardDescription className="text-xs">Orange: à l'approbation · Vert: après mise en œuvre</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="h-[320px] pt-0">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={barData} margin={{ top: 8, right: 8, left: 8, bottom: 60 }}>
                <defs>
                  <linearGradient id="colorBefore" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#ea580c" stopOpacity={0.9}/>
                    <stop offset="100%" stopColor="#ea580c" stopOpacity={0.6}/>
                  </linearGradient>
                  <linearGradient id="colorAfter" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#16a34a" stopOpacity={0.9}/>
                    <stop offset="100%" stopColor="#16a34a" stopOpacity={0.6}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" vertical={false} />
                <XAxis dataKey="label" tick={{ fontSize: 10 }} interval={0} angle={-30} textAnchor="end" height={80} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip 
                  formatter={(value: number) => {
                    if (!Number.isFinite(value)) return '—';
                    return value > 100 ? value.toLocaleString('fr-FR') : value.toFixed(1);
                  }}
                  labelStyle={{ fontWeight: 600, color: '#000' }}
                  contentStyle={{ borderRadius: '8px', border: '2px solid #e5e7eb' }}
                />
                <Legend wrapperStyle={{ paddingTop: '16px' }} />
                <Bar dataKey="refApprobation" name="À l'approbation" fill="url(#colorBefore)" radius={[6, 6, 0, 0]} />
                <Bar dataKey="apresMiseEnOeuvre" name="Après mise en œuvre" fill="url(#colorAfter)" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
            <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
              {barData.map((d, i) => (
                <div key={i} className="p-2 bg-muted/40 rounded">
                  <p className="font-semibold text-foreground/90">{d.label}</p>
                  <p className="text-foreground/60">{METRIC_DESCRIPTIONS[d.label]?.fr || ''}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-none border-2 border-blue-500/20 bg-gradient-to-br from-blue-500/5 to-transparent">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-gradient-to-br from-blue-400/20 to-purple-500/20 rounded-lg">
                <Zap className="h-4 w-4 text-blue-600" />
              </div>
              <div>
                <CardTitle className="text-base">📈 Courbes de Taux (%)</CardTitle>
                <CardDescription className="text-xs">Bleu: taux de complétude · Violet: utilisation budget</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="h-[320px] pt-0">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={lineData} margin={{ top: 12, right: 12, left: 8, bottom: 8 }}>
                <defs>
                  <linearGradient id="lineCompletion" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#2563eb" stopOpacity={0.8}/>
                    <stop offset="100%" stopColor="#2563eb" stopOpacity={0.2}/>
                  </linearGradient>
                  <linearGradient id="lineBudget" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#7c3aed" stopOpacity={0.8}/>
                    <stop offset="100%" stopColor="#7c3aed" stopOpacity={0.2}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="phase" tick={{ fontSize: 11 }} />
                <YAxis domain={[0, 'auto']} tick={{ fontSize: 11 }} unit=" %" />
                <Tooltip formatter={(v: number) => `${Number(v).toFixed(1)} %`} contentStyle={{ borderRadius: '8px', border: '2px solid #e5e7eb' }} />
                <Legend wrapperStyle={{ paddingTop: '16px' }} />
                <Line
                  type="monotone"
                  dataKey="completionPct"
                  name="Taux de complétude (%)"
                  stroke="#2563eb"
                  strokeWidth={3}
                  dot={{ r: 6, fill: '#2563eb', strokeWidth: 2, stroke: '#fff' }}
                  activeDot={{ r: 8 }}
                  isAnimationActive={true}
                />
                <Line
                  type="monotone"
                  dataKey="budgetUtilPct"
                  name="Utilisation budget (%)"
                  stroke="#7c3aed"
                  strokeWidth={3}
                  dot={{ r: 6, fill: '#7c3aed', strokeWidth: 2, stroke: '#fff' }}
                  activeDot={{ r: 8 }}
                  isAnimationActive={true}
                />
              </LineChart>
            </ResponsiveContainer>
            <div className="mt-3 p-2 bg-blue-50 border border-blue-200 rounded text-xs text-blue-900">
              <p className="font-semibold">💡 Interprétation:</p>
              <p>Une augmentation indique une amélioration. Une diminution peut signaler un défi à adresser.</p>
            </div>
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
    <Card className="border-2 border-green-200 shadow-lg">
      <CardHeader>
        <div className="flex items-start gap-3">
          <div className="p-2 bg-gradient-to-br from-green-400/20 to-emerald-500/20 rounded-lg">
            <TrendingUp className="h-5 w-5 text-green-600" />
          </div>
          <div className="flex-1">
            <CardTitle className="text-lg">🏢 Vue d'Ensemble du Chantier (Moyennes)</CardTitle>
            <CardDescription className="mt-1">
              Moyennes des KPIs pour toutes les recommandations implémentées. Compare les résultats avant approbation et après mise en œuvre.
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="h-[380px] pt-0">
        <div className="bg-green-50/30 border border-green-200/50 p-3 rounded-lg mb-4 text-xs text-foreground/80">
          <p><strong>📊 Analyse agrégée:</strong> Cette courbe synthétise l'évolution moyenne de tous vos indicateurs après implémentation des recommandations approuvées.</p>
        </div>
        <ResponsiveContainer width="100%" height="calc(100% - 60px)">
          <BarChart data={data} margin={{ top: 8, right: 8, left: 8, bottom: 60 }}>
            <defs>
              <linearGradient id="aggBefore" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#ea580c" stopOpacity={0.85}/>
                <stop offset="100%" stopColor="#ea580c" stopOpacity={0.6}/>
              </linearGradient>
              <linearGradient id="aggAfter" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#16a34a" stopOpacity={0.85}/>
                <stop offset="100%" stopColor="#16a34a" stopOpacity={0.6}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" vertical={false} />
            <XAxis dataKey="label" tick={{ fontSize: 10 }} interval={0} angle={-22} textAnchor="end" height={80} />
            <YAxis tick={{ fontSize: 11 }} />
            <Tooltip 
              formatter={(value: number) => (Number.isFinite(value) ? Number(value).toFixed(1) : '—')} 
              contentStyle={{ borderRadius: '8px', border: '2px solid #e5e7eb' }}
            />
            <Legend wrapperStyle={{ paddingTop: '12px' }} />
            <Bar dataKey="refApprobation" name="À l'approbation (moy.)" fill="url(#aggBefore)" radius={[6, 6, 0, 0]} />
            <Bar dataKey="apresMiseEnOeuvre" name="Après mise en œuvre (moy.)" fill="url(#aggAfter)" radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};
