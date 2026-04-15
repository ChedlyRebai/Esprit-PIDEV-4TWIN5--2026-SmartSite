import React, { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  TrendingUp,
  DollarSign,
  Users,
  CheckCircle2,
  BarChart3,
  ClipboardList,
  Info,
} from 'lucide-react';
import {
  BaselineAtApprovalCard,
  BeforeAfterPairCharts,
  SiteAggregateBeforeAfterChart,
} from './BeforeAfterAnalyticsCharts';
import {
  BudgetInfluenceApprovalChart,
  type BudgetInfluencePoint,
} from './BudgetInfluenceApprovalChart';

const RESOURCE_OPT_API =
  (import.meta.env.VITE_RESOURCE_OPTIMIZATION_URL &&
    String(import.meta.env.VITE_RESOURCE_OPTIMIZATION_URL).replace(/\/$/, '')) ||
  '/api';

interface AnalyticsProps {
  siteId: string;
}

interface BeforeAfterData {
  recommendationId: string;
  type: string;
  title: string;
  before: Record<string, unknown>;
  after: Record<string, unknown>;
  improvement: Record<string, unknown> | null;
}

interface PendingSnapshot {
  recommendationId: string;
  type: string;
  title: string;
  baselineAtApproval: Record<string, unknown>;
}

interface AnalyticsData {
  totalRecommendations: number;
  approvedRecommendations: number;
  implementedRecommendations: number;
  pendingImplementationSnapshots?: PendingSnapshot[];
  budgetInfluenceOnApprovals?: BudgetInfluencePoint[];
  totalImprovements: {
    budgetSavings: number;
    taskCompletionImprovement: number;
    efficiencyGains: number;
  };
  beforeAfterComparisons: BeforeAfterData[];
}

export const RecommendationAnalytics: React.FC<AnalyticsProps> = ({ siteId }) => {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await fetch(
          `${RESOURCE_OPT_API}/recommendations/site/${siteId}/analytics`,
        );
        if (response.ok) {
          const data = await response.json();
          setAnalytics(data);
        } else {
          setError('Failed to load analytics');
        }
      } catch {
        setError('Could not reach the server');
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();
  }, [siteId]);

  if (loading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-center p-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
            <span className="ml-2">Loading site analytics…</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center text-red-600 p-8">{error}</div>
        </CardContent>
      </Card>
    );
  }

  if (!analytics) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center text-gray-500 p-8">No analytics available</div>
        </CardContent>
      </Card>
    );
  }

  const formatCurrency = (value: number) => `${value.toLocaleString('en-US')} TND`;
  const formatPercentage = (value: number) => `${value.toFixed(1)}%`;

  const pending = analytics.pendingImplementationSnapshots ?? [];
  const comparisons = analytics.beforeAfterComparisons ?? [];
  const conversionPct =
    analytics.totalRecommendations > 0
      ? Math.round((analytics.implementedRecommendations / analytics.totalRecommendations) * 100)
      : 0;

  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <BarChart3 className="h-6 w-6 text-blue-600" />
            📊 Analyse & Courbes
          </h2>
          <p className="text-foreground/60 mt-2">
            Visualisez l'impact réel de vos recommandations à travers des données concrètes
          </p>
        </div>
      </div>

      <Card className="border-2 border-blue-200 bg-gradient-to-br from-blue-50 to-blue-50/50 shadow-lg">
        <CardHeader className="pb-3">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Info className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <CardTitle className="text-lg">📖 Comment lire ces indicateurs?</CardTitle>
              <CardDescription className="text-sm leading-relaxed mt-2">
                🔍 <strong>Flux complet:</strong> Soumettez une recommandation → Approuvez-la (snapshot baseline) → Implémentez-la (2ème snapshot) → Visualisez les courbes avant/après.<br/>
                <br/>
                📊 <strong>Indicateurs clés:</strong> Budget dépensé, Tâches complétées, Tâches en retard, Taux de complétude, Utilisation du budget<br/>
                <br/>
                📈 <strong>Courbes:</strong> Orange = à l'approbation | Vert = après mise en œuvre | Bleu/Violet = Taux de complétude & Budget
              </CardDescription>
            </div>
          </div>
        </CardHeader>
      </Card>

      <div className="grid gap-4 md:grid-cols-4">
        <Card className="border-2 border-blue-200 shadow-md hover:shadow-lg transition-shadow bg-gradient-to-br from-blue-50 to-transparent">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Recommandations</CardTitle>
            <ClipboardList className="h-5 w-5 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-700">{analytics.totalRecommendations}</div>
            <p className="text-xs text-blue-900/70 mt-2">Propositions pour ce chantier</p>
            <div className="mt-2 p-2 bg-blue-100/50 rounded text-xs text-blue-900">
              Nombre total de recommandations générées automatiquement
            </div>
          </CardContent>
        </Card>

        <Card className="border-2 border-amber-200 shadow-md hover:shadow-lg transition-shadow bg-gradient-to-br from-amber-50 to-transparent">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Approuvées</CardTitle>
            <CheckCircle2 className="h-5 w-5 text-amber-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-amber-800">{analytics.approvedRecommendations}</div>
            <p className="text-xs text-amber-900/70 mt-2">Snapshot baseline capturé</p>
            <div className="mt-2 p-2 bg-amber-100/50 rounded text-xs text-amber-900">
              Données de référence enregistrées avant implémentation
            </div>
          </CardContent>
        </Card>

        <Card className="border-2 border-green-200 shadow-md hover:shadow-lg transition-shadow bg-gradient-to-br from-green-50 to-transparent">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Implémentées</CardTitle>
            <CheckCircle2 className="h-5 w-5 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-800">{analytics.implementedRecommendations}</div>
            <p className="text-xs text-green-900/70 mt-2">Suivi complété (2 snapshots)</p>
            <div className="mt-2 p-2 bg-green-100/50 rounded text-xs text-green-900">
              Avec avant/après pour comparaison complète
            </div>
          </CardContent>
        </Card>

        <Card className="border-2 border-violet-200 shadow-md hover:shadow-lg transition-shadow bg-gradient-to-br from-violet-50 to-transparent">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Taux Implémentation</CardTitle>
            <TrendingUp className="h-5 w-5 text-violet-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-violet-800">{conversionPct}%</div>
            <p className="text-xs text-violet-900/70 mt-2">Implémentées / Total</p>
            <div className="mt-2 p-2 bg-violet-100/50 rounded text-xs text-violet-900">
              Efficacité de conversion : approuvées → implémentées
            </div>
          </CardContent>
        </Card>
      </div>

      <BudgetInfluenceApprovalChart data={analytics.budgetInfluenceOnApprovals ?? []} />

      <Card>
        <CardHeader>
          <CardTitle>Cumulative impact (recommendations implemented)</CardTitle>
          <CardDescription>
            Estimates from follow-up records — useful for site budget and schedule control
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            <div className="text-center rounded-lg border bg-card p-4">
              <div className="text-2xl font-bold text-green-700">
                {formatCurrency(analytics.totalImprovements.budgetSavings)}
              </div>
              <div className="text-sm text-muted-foreground">Estimated budget savings</div>
            </div>
            <div className="text-center rounded-lg border bg-card p-4">
              <div className="text-2xl font-bold text-blue-700">
                {formatPercentage(analytics.totalImprovements.taskCompletionImprovement)}
              </div>
              <div className="text-sm text-muted-foreground">Completion rate change (cumulative)</div>
            </div>
            <div className="text-center rounded-lg border bg-card p-4">
              <div className="text-2xl font-bold text-violet-700">
                {formatPercentage(analytics.totalImprovements.efficiencyGains)}
              </div>
              <div className="text-sm text-muted-foreground">Operational efficiency gains (cumulative)</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {comparisons.length > 1 ? (
        <SiteAggregateBeforeAfterChart
          comparisons={comparisons.map((c) => ({ before: c.before, after: c.after }))}
        />
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle>Before / after charts (post-implementation)</CardTitle>
          <CardDescription>
            For each <strong>implemented</strong> recommendation: grouped bars for key KPIs and lines for percentage
            metrics (completion, budget utilization).
          </CardDescription>
        </CardHeader>
        <CardContent>
          {comparisons.length === 0 ? (
            <div className="text-center text-muted-foreground p-8 space-y-2">
              <BarChart3 className="h-10 w-10 mx-auto opacity-40" />
              <p>
                No recommendation has been tracked through <strong>implementation</strong> with two site snapshots yet.
              </p>
              <p className="text-sm">
                Approve a recommendation from the Recommendations tab, then mark it implemented once actions are done on
                site.
              </p>
            </div>
          ) : (
            <div className="space-y-10">
              {comparisons.map((comparison) => (
                <div key={comparison.recommendationId} className="space-y-4">
                  <BeforeAfterPairCharts
                    title={comparison.title}
                    typeKey={comparison.type}
                    before={comparison.before}
                    after={comparison.after}
                  />

                  {comparison.improvement && (
                    <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                      {typeof comparison.improvement.budgetSavings === 'number' &&
                        comparison.improvement.budgetSavings !== 0 && (
                          <div className="bg-green-50 border border-green-100 p-3 rounded-lg">
                            <div className="flex items-center gap-2">
                              <DollarSign className="h-4 w-4 text-green-600" />
                              <span className="text-green-800 font-medium">
                                {formatCurrency(comparison.improvement.budgetSavings as number)}
                              </span>
                            </div>
                            <div className="text-xs text-green-700 mt-1">Observed budget delta</div>
                          </div>
                        )}

                      {typeof comparison.improvement.completionRateImprovement === 'number' && (
                        <div className="bg-blue-50 border border-blue-100 p-3 rounded-lg">
                          <div className="flex items-center gap-2">
                            <TrendingUp className="h-4 w-4 text-blue-600" />
                            <span className="text-blue-800 font-medium">
                              {formatPercentage(comparison.improvement.completionRateImprovement as number)}
                            </span>
                          </div>
                          <div className="text-xs text-blue-700 mt-1">Completion rate change</div>
                        </div>
                      )}

                      {typeof comparison.improvement.workloadBalanceImprovement === 'number' && (
                        <div className="bg-violet-50 border border-violet-100 p-3 rounded-lg">
                          <div className="flex items-center gap-2">
                            <Users className="h-4 w-4 text-violet-600" />
                            <span className="text-violet-800 font-medium">
                              {(comparison.improvement.workloadBalanceImprovement as number).toFixed(1)} tasks / member
                            </span>
                          </div>
                          <div className="text-xs text-violet-700 mt-1">Team workload balance</div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {pending.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>Approved — pending implementation</CardTitle>
            <CardDescription>
              Baseline at approval. Full before/after curves appear after you mark the recommendation implemented.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {pending.map((snap) => (
              <BaselineAtApprovalCard
                key={snap.recommendationId}
                title={snap.title}
                typeKey={snap.type}
                baseline={snap.baselineAtApproval}
              />
            ))}
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
};
