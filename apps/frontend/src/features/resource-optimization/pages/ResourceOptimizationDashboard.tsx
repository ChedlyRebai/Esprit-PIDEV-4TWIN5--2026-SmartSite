import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useSearchParams } from 'react-router';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { SiteRecommendationCard } from '../components/SiteRecommendationCard';
import { RecommendationAnalytics } from '../components/RecommendationAnalytics';
import { useResourceOptimization, useSites } from '../hooks/useResourceApi';
import { RecommendationsList } from '../components/RecommendationsList';
import { AlertsList } from '../components/AlertsList';
import { SummaryStats, SavingsChart, CO2ImpactChart, RecommendationStatusChart } from '../components/DashboardCharts';
import { Database, Zap, Lightbulb, AlertTriangle, BarChart3, Settings, ChevronRight, Package, Users, Fuel, TrendingUp, DollarSign, Leaf, Loader2 } from 'lucide-react';

type SubPage = 'overview' | 'resource-analysis' | 'recommendations' | 'analytics' | 'alerts' | 'reporting';

export const ResourceOptimizationDashboard: React.FC = () => {
  const { siteId } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const siteIdFromUrl = searchParams.get('siteId');

  // More robust check: ensure siteId is not 'undefined', 'null', or empty
  const isValidSiteId = (id: string) => id && id !== 'undefined' && id !== 'null' && id !== '';

  const siteIdParam = isValidSiteId(siteIdFromUrl || '') ? (siteIdFromUrl || '') : (isValidSiteId(siteId || '') ? siteId : '');

  const [currentPage, setCurrentPage] = useState<SubPage>('overview');
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedSiteId, setSelectedSiteId] = useState<string>('');

  // Fetch sites for selector
  const { data: sites, isLoading: sitesLoading } = useSites();

  const activeSites = sites?.filter(s => s.isActif) || [];

  // Sync selectedSiteId with URL changes
  useEffect(() => {
    console.log('Debug - siteIdFromUrl:', siteIdFromUrl);
    console.log('Debug - siteId:', siteId);
    console.log('Debug - selectedSiteId:', selectedSiteId);
    console.log('Debug - activeSites:', activeSites);
    console.log('Debug - first site ID:', activeSites[0]?._id);
    console.log('Debug - first site:', activeSites[0]);
    console.log('Debug - all keys of first site:', activeSites[0] ? Object.keys(activeSites[0]) : 'no site');

    if (siteIdFromUrl && isValidSiteId(siteIdFromUrl)) {
      setSelectedSiteId(siteIdFromUrl);
    } else if (siteId && isValidSiteId(siteId)) {
      setSelectedSiteId(siteId);
    }
    // Remove auto-selection - only select when user explicitly clicks
  }, [siteIdFromUrl, siteId, activeSites]);

  // Determine effective siteId with proper validation
  let effectiveSiteId = '';
  if (selectedSiteId && isValidSiteId(selectedSiteId)) {
    effectiveSiteId = selectedSiteId;
  } else if (siteIdParam && isValidSiteId(siteIdParam)) {
    effectiveSiteId = siteIdParam;
  }
  // Remove auto-selection - only use explicitly selected siteId

  const {
    recommendations,
    recommendationsLoading,
    alerts,
    alertsLoading,
    dashboard,
    dashboardLoading,
    site,
    siteTeams,
    tasks,
    generateRecommendations,
    generateAlerts,
    updateRecommendationStatus,
    markAlertAsRead,
    markAlertAsResolved,
  } = useResourceOptimization(effectiveSiteId);

  // Transform alerts to match expected interface
  const transformedAlerts = alerts?.map(alert => ({
    ...alert,
    createdAt: alert.createdAt instanceof Date ? alert.createdAt.toISOString() : alert.createdAt,
    type: alert.type === 'equipment' ? 'equipment' : alert.type === 'energy' ? 'energy' : alert.type,
  })) || [];

  const handleSiteChange = (newSiteId: string) => {
    if (isValidSiteId(newSiteId)) {
      setSelectedSiteId(newSiteId);
      setSearchParams({ siteId: newSiteId });
    }
  };

  const handleGenerateRecommendations = async () => {
    setIsGenerating(true);
    try {
      await generateRecommendations.mutateAsync();
      await generateAlerts.mutateAsync();
    } finally {
      setIsGenerating(false);
    }
  };

  const handleApprove = async (id: string) => {
    await updateRecommendationStatus.mutateAsync({ id, status: 'approved' });
  };

  const handleReject = async (id: string) => {
    await updateRecommendationStatus.mutateAsync({ id, status: 'rejected' });
  };

  const handleImplement = async (id: string) => {
    await updateRecommendationStatus.mutateAsync({ id, status: 'implemented' });
  };

  const unreadAlertsCount = alerts.filter((a: any) => !a.isRead).length;
  const criticalAlertsCount = alerts.filter((a: any) => a.severity === 'critical').length;

  const savingsData = useMemo(() => {
    const realized = Number(dashboard?.financial?.realizedSavings) || 0;
    if (!realized || !Number.isFinite(realized)) {
      return [
        { name: 'Budget & matériaux', value: 0 },
        { name: 'Équipes & exécution', value: 0 },
        { name: 'Planning & délais', value: 0 },
      ];
    }
    const mat = Math.round(realized * 0.42);
    const equ = Math.round(realized * 0.35);
    const plan = Math.max(0, realized - mat - equ);
    return [
      { name: 'Budget & matériaux', value: mat },
      { name: 'Équipes & exécution', value: equ },
      { name: 'Planning & délais', value: plan },
    ];
  }, [dashboard]);

  const navItems = [
    { id: 'overview', label: 'Vue Globale', icon: BarChart3 },
    { id: 'resource-analysis', label: 'Analyse', icon: TrendingUp },
    { id: 'recommendations', label: 'Recommandations', icon: Lightbulb },
    { id: 'analytics', label: 'Analytics', icon: BarChart3 },
    { id: 'alerts', label: 'Alertes', icon: AlertTriangle },
    { id: 'reporting', label: 'Rapports', icon: DollarSign },
  ] as const;

  // No site selected - Show global view of all sites
  if (!isValidSiteId(effectiveSiteId) && !sitesLoading) {
    return (
      <div className="space-y-6 p-6">
        <div>
          <h1 className="text-3xl font-bold">Pilotage des ressources — tous les chantiers</h1>
          <p className="text-gray-600 mt-1">
            Vue transversale : budgets sites, recommandations IA liées au planning et aux équipes. Sélectionnez un site
            pour le détail et les courbes avant / après mise en œuvre.
          </p>
        </div>

        {/* Global Statistics */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card className="bg-blue-50 border-blue-200">
            <CardContent className="pt-4">
              <div className="text-2xl font-bold text-blue-600">{activeSites.length}</div>
              <div className="text-sm text-blue-800">Sites actifs</div>
            </CardContent>
          </Card>
          <Card className="bg-green-50 border-green-200">
            <CardContent className="pt-4">
              <div className="text-2xl font-bold text-green-600">
                {activeSites.reduce((sum, site) => sum + (site.budget || 0), 0).toLocaleString()} TND
              </div>
              <div className="text-sm text-green-800">Budget total</div>
            </CardContent>
          </Card>
          <Card className="bg-purple-50 border-purple-200">
            <CardContent className="pt-4">
              <div className="text-2xl font-bold text-purple-600">
                {activeSites.reduce((sum, site) => sum + (siteTeams?.length || 0), 0)}
              </div>
              <div className="text-sm text-purple-800">Équipes totales</div>
            </CardContent>
          </Card>
          <Card className="bg-orange-50 border-orange-200">
            <CardContent className="pt-4">
              <div className="text-2xl font-bold text-orange-600">
                {activeSites.reduce((sum, site) => sum + (tasks?.length || 0), 0)}
              </div>
              <div className="text-sm text-orange-800">Tâches totales</div>
            </CardContent>
          </Card>
        </div>

        {/* Sites with Recommendations */}
        <Card>
          <CardHeader>
            <CardTitle>Sites actifs et recommandations</CardTitle>
            <CardDescription>
              Chaque carte résume le site (gestion des sites). Ouvrez un chantier pour approuver les reco. et suivre
              l’impact dans l’onglet Analytique.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {sitesLoading ? (
              <div className="flex items-center justify-center p-8">
                <Loader2 className="h-8 w-8 animate-spin" />
              </div>
            ) : activeSites.length === 0 ? (
              <p className="text-gray-500 text-center p-8">Aucun site disponible</p>
            ) : (
              <div className="space-y-6">
                {activeSites.map((site, index) => {
                  const siteId = site._id || (site as any).id || `site-${index}`;
                  return (
                    <SiteRecommendationCard
                      key={siteId}
                      site={site}
                      siteId={siteId}
                      onSelect={() => handleSiteChange(siteId)}
                    />
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  if (sitesLoading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (currentPage !== 'overview') {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2 p-4 bg-gray-50 border-b">
          <Button variant="ghost" size="sm" onClick={() => setCurrentPage('overview')}>
            ← Retour
          </Button>
          <span className="text-gray-400">/</span>
          <span className="font-medium capitalize">{currentPage.replace('-', ' ')}</span>
        </div>

        {currentPage === 'resource-analysis' && (
          <Card>
            <CardContent className="pt-6">
              <h3 className="text-lg font-semibold">Analyse des ressources chantier</h3>
              <p className="text-gray-600">
                Connexion aux indicateurs d’utilisation des équipements, de la charge et des coûts par site — module en
                extension.
              </p>
            </CardContent>
          </Card>
        )}
        {currentPage === 'recommendations' && (
          <RecommendationsList
            recommendations={recommendations}
            onApprove={handleApprove}
            onReject={handleReject}
            onImplement={handleImplement}
            loading={recommendationsLoading}
          />
        )}
        {currentPage === 'analytics' && (
          <RecommendationAnalytics siteId={effectiveSiteId} />
        )}
        {currentPage === 'alerts' && (
          <AlertsList
            alerts={transformedAlerts}
            onMarkAsRead={(id) => markAlertAsRead.mutate(id)}
            onMarkAsResolved={(id) => markAlertAsResolved.mutate(id)}
            loading={alertsLoading}
          />
        )}
        {currentPage === 'reporting' && (
          <Card>
            <CardContent className="pt-6">
              <h3 className="text-lg font-semibold">Rapports</h3>
              <p className="text-gray-600">Fonctionnalité en développement</p>
            </CardContent>
          </Card>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Ressources du chantier</h1>
          <p className="text-gray-600 mt-1">
            {site
              ? `${site.nom} — budget, tâches (planning) et équipes ; recommandations IA et suivi avant / après validation.`
              : 'Sélectionnez un site pour analyser budget, planning et recommandations.'}
          </p>
        </div>
        <div className="flex items-center gap-4">
          {/* Site Selector */}
          <Select value={effectiveSiteId} onValueChange={handleSiteChange}>
            <SelectTrigger className="w-64">
              <SelectValue placeholder="Sélectionner un site" />
            </SelectTrigger>
            <SelectContent>
              {activeSites.map((s) => (
                <SelectItem key={s._id} value={s._id}>
                  {s.nom}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button size="lg" className="gap-2" onClick={handleGenerateRecommendations} disabled={isGenerating}>
            <Zap className={`h-4 w-4 ${isGenerating ? 'animate-spin' : ''}`} />
            {isGenerating ? 'Génération...' : 'Générer Tout'}
          </Button>
        </div>
      </div>

      {/* Site Info Bar */}
      {site && (
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="pt-4 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div>
                <p className="text-sm text-gray-600">Budget</p>
                <p className="font-semibold">{site.budget} TND</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Équipe</p>
                <p className="font-semibold">{siteTeams?.length || 0} membres</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Tâches</p>
                <p className="font-semibold">{tasks?.length || 0} tâches</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className={`px-3 py-1 rounded-full text-sm ${site.status === 'in_progress' ? 'bg-green-100 text-green-800' :
                site.status === 'planning' ? 'bg-blue-100 text-blue-800' :
                  site.status === 'completed' ? 'bg-gray-100 text-gray-800' :
                    'bg-red-100 text-red-800'
                }`}>
                {site.status}
              </span>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 md:grid-cols-5">
        <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setCurrentPage('resource-analysis')}>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <TrendingUp className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Analyse</p>
                <p className="font-medium">Voir insights</p>
              </div>
              <ChevronRight className="h-4 w-4 ml-auto text-gray-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setCurrentPage('recommendations')}>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <Lightbulb className="h-5 w-5 text-yellow-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Recommandations</p>
                <p className="font-medium">{recommendations.length} suggestions</p>
              </div>
              <ChevronRight className="h-4 w-4 ml-auto text-gray-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setCurrentPage('alerts')}>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-100 rounded-lg">
                <AlertTriangle className="h-5 w-5 text-red-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Alertes</p>
                <p className="font-medium">{unreadAlertsCount} non lues</p>
              </div>
              <ChevronRight className="h-4 w-4 ml-auto text-gray-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setCurrentPage('reporting')}>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <DollarSign className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Rapports</p>
                <p className="font-medium">Tableaux de bord</p>
              </div>
              <ChevronRight className="h-4 w-4 ml-auto text-gray-400" />
            </div>
          </CardContent>
        </Card>
      </div>

      <SummaryStats dashboard={dashboard || null} />

      <Tabs defaultValue="recommendations" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="recommendations" className="gap-2">
            <Lightbulb className="h-4 w-4" />
            Recommandations ({recommendations.length})
          </TabsTrigger>
          <TabsTrigger value="alerts" className="gap-2">
            <AlertTriangle className="h-4 w-4" />
            Alertes ({unreadAlertsCount})
          </TabsTrigger>
          <TabsTrigger value="analytics" className="gap-2">
            <BarChart3 className="h-4 w-4" />
            Analytique & courbes
          </TabsTrigger>
        </TabsList>

        <TabsContent value="recommendations" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Recommandations pour ce chantier</CardTitle>
                  <CardDescription>
                    {recommendations.length} proposition(s) — approuvez pour figer un relevé ; mettez en œuvre pour
                    comparer les indicateurs dans Analytique.
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <RecommendationsList
                recommendations={recommendations}
                onApprove={handleApprove}
                onReject={handleReject}
                onImplement={handleImplement}
                loading={recommendationsLoading}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="alerts" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Alertes en temps réel</CardTitle>
                  <CardDescription>
                    {unreadAlertsCount} alertes non lues, {criticalAlertsCount} critiques
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <AlertsList
                alerts={transformedAlerts}
                onMarkAsRead={(id) => markAlertAsRead.mutate(id)}
                onMarkAsResolved={(id) => markAlertAsResolved.mutate(id)}
                loading={alertsLoading}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <SavingsChart data={savingsData} />
            <CO2ImpactChart
              current={Number(dashboard?.environmental?.totalCO2Emissions) || 1000}
              potential={Number(dashboard?.environmental?.potentialCO2Reduction) || 500}
              realized={Number(dashboard?.environmental?.actualCO2Reduction) || 150}
            />
          </div>
          <RecommendationStatusChart
            pending={dashboard?.recommendations?.pending || 0}
            approved={dashboard?.recommendations?.approved || 0}
            implemented={dashboard?.recommendations?.implemented || 0}
          />
          <RecommendationAnalytics siteId={effectiveSiteId} />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ResourceOptimizationDashboard;
