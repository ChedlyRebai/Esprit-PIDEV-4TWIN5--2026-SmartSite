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
      <Card className="border-primary/20 bg-primary/[0.03]">
        <CardHeader className="pb-2">
          <div className="flex items-start gap-3">
            <Info className="h-5 w-5 text-primary shrink-0 mt-0.5" />
            <div>
              <CardTitle className="text-base">How to read these metrics</CardTitle>
              <CardDescription className="text-sm leading-relaxed mt-1">
                Recommendations use your site, planning, and team data. When you <strong>approve</strong> a
                recommendation, a <strong>baseline snapshot</strong> is stored (budget spent, tasks, overdue work,
                completion rate). When you mark it <strong>implemented</strong>, a second snapshot unlocks{' '}
                <strong>before/after</strong> bars and curves for the same site.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
      </Card>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Recommendations</CardTitle>
            <ClipboardList className="h-5 w-5 text-blue-600" />
          </CardHeader>
          <CardContent className="bg-blue-50/80 p-4 rounded-lg -m-4 mt-2">
            <div className="text-2xl font-bold text-blue-700">{analytics.totalRecommendations}</div>
            <p className="text-xs text-blue-900/70 mt-1">Generated for this site</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Approved</CardTitle>
            <CheckCircle2 className="h-5 w-5 text-amber-600" />
          </CardHeader>
          <CardContent className="bg-amber-50/80 p-4 rounded-lg -m-4 mt-2">
            <div className="text-2xl font-bold text-amber-800">{analytics.approvedRecommendations}</div>
            <p className="text-xs text-amber-900/70 mt-1">Baseline snapshot stored</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Implemented</CardTitle>
            <CheckCircle2 className="h-5 w-5 text-green-600" />
          </CardHeader>
          <CardContent className="bg-green-50/80 p-4 rounded-lg -m-4 mt-2">
            <div className="text-2xl font-bold text-green-800">{analytics.implementedRecommendations}</div>
            <p className="text-xs text-green-900/70 mt-1">Tracked through second snapshot</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Implementation rate</CardTitle>
            <TrendingUp className="h-5 w-5 text-violet-600" />
          </CardHeader>
          <CardContent className="bg-violet-50/80 p-4 rounded-lg -m-4 mt-2">
            <div className="text-2xl font-bold text-violet-800">{conversionPct}%</div>
            <p className="text-xs text-violet-900/70 mt-1">Implemented / total</p>
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
