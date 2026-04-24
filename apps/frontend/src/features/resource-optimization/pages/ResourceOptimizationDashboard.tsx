import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useSearchParams } from 'react-router';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { SiteRecommendationCard } from '../components/SiteRecommendationCard';
import { RecommendationAnalytics } from '../components/RecommendationAnalytics';
import {
  useResourceOptimization,
  useSites,
  useIncidentsBySite,
  useProjects,
  useProjectById,
  useProjectSites,
  useRecommendationsByProject,
  useProjectSummary,
  useGenerateRecommendationsForProject,
  useIncidentsByProject,
} from '../hooks/useResourceApi';
import { RecommendationsList } from '../components/RecommendationsList';
import { AlertsList } from '../components/AlertsList';
import { SummaryStats, SavingsChart, CO2ImpactChart, RecommendationStatusChart } from '../components/DashboardCharts';
import {
  Zap, Lightbulb, AlertTriangle, BarChart3, ChevronRight, TrendingUp,
  DollarSign, Loader2, X, Sparkles, ArrowLeft, Target, Users,
  ShieldAlert, Clock, Star, Briefcase, Building2,
} from 'lucide-react';
import { getSiteId, getProjectId } from '../types';
import type { Incident } from '../types';

type SubPage = 'overview' | 'resource-analysis' | 'recommendations' | 'analytics' | 'alerts' | 'reporting';
type ViewMode = 'site' | 'project';

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
  const [selectedProjectId, setSelectedProjectId] = useState<string>('');
  const [viewMode, setViewMode] = useState<ViewMode>('site');
  const [previewSite, setPreviewSite] = useState<any | null>(null);

  // Fetch sites for selector
  const { data: sites, isLoading: sitesLoading } = useSites();
  const { data: projects, isLoading: projectsLoading } = useProjects();

  const activeSites = sites?.filter(s => s.isActif) || [];

  // Sync selectedSiteId with URL changes
  useEffect(() => {
    if (siteIdFromUrl && isValidSiteId(siteIdFromUrl)) {
      setSelectedSiteId(siteIdFromUrl);
    } else if (siteId && isValidSiteId(siteId)) {
      setSelectedSiteId(siteId);
    }
  }, [siteIdFromUrl, siteId]);

  // Determine effective siteId with proper validation
  let effectiveSiteId = '';
  if (selectedSiteId && isValidSiteId(selectedSiteId) && selectedSiteId !== '__project__') {
    effectiveSiteId = selectedSiteId;
  } else if (siteIdParam && isValidSiteId(siteIdParam)) {
    effectiveSiteId = siteIdParam;
  }

  // In project mode with a project selected, show the project dashboard
  const isProjectMode = viewMode === 'project' && !!selectedProjectId;

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

  const { data: incidents = [] } = useIncidentsBySite(effectiveSiteId);
  const openIncidents = incidents.filter((i: Incident) => i.status === 'open' || i.status === 'investigating');
  const criticalIncidents = incidents.filter((i: Incident) => i.severity === 'critical' || i.severity === 'high');

  // ── Project mode hooks ──────────────────────────────────────────────────
  const { data: selectedProject } = useProjectById(selectedProjectId);
  const { data: projectSites = [] } = useProjectSites(selectedProjectId);
  const { data: projectRecs = [], isLoading: projectRecsLoading } = useRecommendationsByProject(selectedProjectId);
  const { data: projectSummary } = useProjectSummary(selectedProjectId);
  const { data: projectIncidents = [] } = useIncidentsByProject(selectedProjectId);
  const generateProjectRecs = useGenerateRecommendationsForProject(selectedProjectId);

  const openProjectIncidents = projectIncidents.filter((i: Incident) => i.status === 'open' || i.status === 'investigating');
  const criticalProjectIncidents = projectIncidents.filter((i: Incident) => i.severity === 'critical' || i.severity === 'high');

  const handleGenerateProjectRecommendations = async () => {
    setIsGenerating(true);
    try {
      await generateProjectRecs.mutateAsync();
    } finally {
      setIsGenerating(false);
    }
  };

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
        { name: 'Budget & Materials', value: 0 },
        { name: 'Teams & Execution', value: 0 },
        { name: 'Planning & Deadlines', value: 0 },
      ];
    }
    const mat = Math.round(realized * 0.42);
    const equ = Math.round(realized * 0.35);
    const plan = Math.max(0, realized - mat - equ);
    return [
      { name: 'Budget & Materials', value: mat },
      { name: 'Teams & Execution', value: equ },
      { name: 'Planning & Deadlines', value: plan },
    ];
  }, [dashboard]);

  const navItems = [
    { id: 'overview', label: 'Overview', icon: BarChart3 },
    { id: 'resource-analysis', label: 'Analysis', icon: TrendingUp },
    { id: 'recommendations', label: 'Recommendations', icon: Lightbulb },
    { id: 'analytics', label: 'Analytics', icon: BarChart3 },
    { id: 'alerts', label: 'Alerts', icon: AlertTriangle },
    { id: 'reporting', label: 'Reports', icon: DollarSign },
  ] as const;

  // No site selected - Show global view of all sites or projects
  if (!isValidSiteId(effectiveSiteId) && !isProjectMode && !sitesLoading) {
    return (
      <div className="relative p-6">
        <div className={`space-y-6 transition-all duration-300 ${previewSite ? 'blur-[4px] scale-[0.995]' : ''}`}>
          {/* Enhanced Header */}
          <div className="rounded-3xl border-2 border-border/60 bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 px-8 py-6 shadow-xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-72 h-72 bg-gradient-to-br from-indigo-300 to-purple-300 rounded-full -mr-36 -mt-36 opacity-20" />
            <div className="absolute bottom-0 left-0 w-56 h-56 bg-gradient-to-tr from-blue-300 to-indigo-300 rounded-full -ml-28 -mb-28 opacity-20" />
            
            <div className="relative z-10 flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
              <div className="flex items-start gap-5">
                <div className="p-4 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl shadow-xl">
                  <BarChart3 className="h-10 w-10 text-white" />
                </div>
                <div>
                  <h1 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent mb-2">
                    Optimisation des Ressources
                  </h1>
                  <p className="text-muted-foreground max-w-2xl leading-relaxed">
                    {viewMode === 'site'
                      ? 'Vue globale par site — sélectionnez un site pour accéder aux recommandations IA détaillées.'
                      : 'Vue globale par projet — sélectionnez un projet pour générer des recommandations basées sur tâches, équipes et incidents.'}
                  </p>
                </div>
              </div>

              {/* View mode toggle — visible dès la page d'accueil */}
              <div className="flex rounded-xl border-2 border-indigo-200 overflow-hidden bg-white shadow-sm self-start">
                <button
                  onClick={() => setViewMode('site')}
                  className={`flex items-center gap-2 px-5 py-2.5 text-sm font-semibold transition-colors ${
                    viewMode === 'site' ? 'bg-indigo-600 text-white' : 'text-indigo-600 hover:bg-indigo-50'
                  }`}
                >
                  <Building2 className="h-4 w-4" />
                  Par Site
                </button>
                <button
                  onClick={() => setViewMode('project')}
                  className={`flex items-center gap-2 px-5 py-2.5 text-sm font-semibold transition-colors ${
                    viewMode === 'project' ? 'bg-indigo-600 text-white' : 'text-indigo-600 hover:bg-indigo-50'
                  }`}
                >
                  <Briefcase className="h-4 w-4" />
                  Par Projet
                </button>
              </div>
            </div>
          </div>

          {/* Global Statistics - Improved Design */}
          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
            <Card className="group border-2 border-blue-200/70 bg-gradient-to-br from-blue-50 via-white to-blue-100/40 shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden relative">
              <div className="absolute top-0 right-0 w-32 h-32 bg-blue-300 rounded-full -mr-16 -mt-16 opacity-20 group-hover:scale-125 transition-transform duration-500" />
              <CardContent className="pt-6 pb-5 relative z-10">
                <div className="flex items-start justify-between mb-3">
                  <div className="p-3 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-lg">
                    <BarChart3 className="h-6 w-6 text-white" />
                  </div>
                </div>
                <div className="text-4xl font-bold text-blue-700 mb-1">{activeSites.length}</div>
                <div className="text-sm font-medium text-blue-900/70">Active Sites</div>
                <div className="mt-3 pt-3 border-t border-blue-200">
                  <p className="text-xs text-blue-600">Construction projects</p>
                </div>
              </CardContent>
            </Card>

            <Card className="group border-2 border-emerald-200/70 bg-gradient-to-br from-emerald-50 via-white to-emerald-100/40 shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden relative">
              <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-300 rounded-full -mr-16 -mt-16 opacity-20 group-hover:scale-125 transition-transform duration-500" />
              <CardContent className="pt-6 pb-5 relative z-10">
                <div className="flex items-start justify-between mb-3">
                  <div className="p-3 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl shadow-lg">
                    <DollarSign className="h-6 w-6 text-white" />
                  </div>
                </div>
                <div className="text-4xl font-bold text-emerald-700 mb-1">
                  {activeSites.reduce((sum, site) => sum + (site.budget || 0), 0).toLocaleString()} TND
                </div>
                <div className="text-sm font-medium text-emerald-900/70">Total Budget</div>
                <div className="mt-3 pt-3 border-t border-emerald-200">
                  <p className="text-xs text-emerald-600">Combined allocation</p>
                </div>
              </CardContent>
            </Card>

            <Card className="group border-2 border-violet-200/70 bg-gradient-to-br from-violet-50 via-white to-violet-100/40 shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden relative">
              <div className="absolute top-0 right-0 w-32 h-32 bg-violet-300 rounded-full -mr-16 -mt-16 opacity-20 group-hover:scale-125 transition-transform duration-500" />
              <CardContent className="pt-6 pb-5 relative z-10">
                <div className="flex items-start justify-between mb-3">
                  <div className="p-3 bg-gradient-to-br from-violet-500 to-violet-600 rounded-xl shadow-lg">
                    <Users className="h-6 w-6 text-white" />
                  </div>
                </div>
                <div className="text-4xl font-bold text-violet-700 mb-1">
                  {activeSites.reduce((sum, site) => sum + (siteTeams?.length || 0), 0)}
                </div>
                <div className="text-sm font-medium text-violet-900/70">Total Teams</div>
                <div className="mt-3 pt-3 border-t border-violet-200">
                  <p className="text-xs text-violet-600">Workforce members</p>
                </div>
              </CardContent>
            </Card>

            <Card className="group border-2 border-amber-200/70 bg-gradient-to-br from-amber-50 via-white to-amber-100/40 shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden relative">
              <div className="absolute top-0 right-0 w-32 h-32 bg-amber-300 rounded-full -mr-16 -mt-16 opacity-20 group-hover:scale-125 transition-transform duration-500" />
              <CardContent className="pt-6 pb-5 relative z-10">
                <div className="flex items-start justify-between mb-3">
                  <div className="p-3 bg-gradient-to-br from-amber-500 to-amber-600 rounded-xl shadow-lg">
                    <Target className="h-6 w-6 text-white" />
                  </div>
                </div>
                <div className="text-4xl font-bold text-amber-700 mb-1">
                  {activeSites.reduce((sum, site) => sum + (tasks?.length || 0), 0)}
                </div>
                <div className="text-sm font-medium text-amber-900/70">Total Tasks</div>
                <div className="mt-3 pt-3 border-t border-amber-200">
                  <p className="text-xs text-amber-600">Active assignments</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sites with Recommendations - Improved Design */}
          <Card className="shadow-xl border-2 border-border/50 bg-gradient-to-br from-white to-gray-50/30">
            <CardHeader className="border-b border-border/50 bg-gradient-to-r from-indigo-50/50 to-purple-50/50">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg">
                  <Sparkles className="h-5 w-5 text-white" />
                </div>
                <div>
                  <CardTitle className="text-xl">
                    {viewMode === 'site' ? 'Sites actifs & Recommandations IA' : 'Projets & Recommandations IA'}
                  </CardTitle>
                  <CardDescription className="mt-1.5">
                    {viewMode === 'site'
                      ? 'Cliquez sur un site pour accéder aux recommandations détaillées.'
                      : 'Sélectionnez un projet pour générer des recommandations basées sur ses tâches, équipes et incidents.'}
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-6">
              {viewMode === 'site' ? (
                sitesLoading ? (
                  <div className="flex flex-col items-center justify-center p-12">
                    <Loader2 className="h-12 w-12 animate-spin text-indigo-600 mb-4" />
                    <p className="text-gray-600">Chargement des sites...</p>
                  </div>
                ) : activeSites.length === 0 ? (
                  <div className="flex flex-col items-center justify-center p-12 text-center">
                    <Building2 className="h-12 w-12 text-gray-400 mb-4" />
                    <p className="text-gray-600 font-medium mb-2">Aucun site actif</p>
                    <p className="text-sm text-gray-500">Créez un site pour commencer l'optimisation</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {activeSites.map((site, index) => {
                      const id = getSiteId(site);
                      return (
                        <SiteRecommendationCard
                          key={id || `site-${index}`}
                          site={site}
                          siteId={id}
                          onSelect={() => setPreviewSite({ ...site, __siteId: id })}
                        />
                      );
                    })}
                  </div>
                )
              ) : (
                /* ── Project mode list ── */
                projectsLoading ? (
                  <div className="flex flex-col items-center justify-center p-12">
                    <Loader2 className="h-12 w-12 animate-spin text-indigo-600 mb-4" />
                    <p className="text-gray-600">Chargement des projets...</p>
                  </div>
                ) : !projects || projects.length === 0 ? (
                  <div className="flex flex-col items-center justify-center p-12 text-center">
                    <Briefcase className="h-12 w-12 text-gray-400 mb-4" />
                    <p className="text-gray-600 font-medium mb-2">Aucun projet trouvé</p>
                    <p className="text-sm text-gray-500">Créez un projet pour commencer</p>
                  </div>
                ) : (
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {projects.map((project) => {
                      const pid = getProjectId(project);
                      const statusColors: Record<string, string> = {
                        in_progress: 'bg-green-100 text-green-800',
                        en_cours:    'bg-green-100 text-green-800',
                        planning:    'bg-blue-100 text-blue-800',
                        completed:   'bg-gray-100 text-gray-800',
                        terminé:     'bg-gray-100 text-gray-800',
                        en_retard:   'bg-red-100 text-red-800',
                      };
                      return (
                        <Card
                          key={pid}
                          className="group cursor-pointer hover:shadow-xl transition-all duration-300 border-2 hover:border-purple-300 bg-gradient-to-br from-purple-50 to-white overflow-hidden relative"
                          onClick={() => {
                            setSelectedProjectId(pid);
                            setViewMode('project');
                            // Switch to site-detail view with project selected
                            setSelectedSiteId('__project__');
                          }}
                        >
                          <div className="absolute top-0 right-0 w-24 h-24 bg-purple-100 rounded-full -mr-12 -mt-12 opacity-50 group-hover:scale-110 transition-transform duration-300" />
                          <CardContent className="pt-5 pb-4 relative z-10 space-y-3">
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex items-center gap-2">
                                <div className="p-2 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-lg">
                                  <Briefcase className="h-4 w-4 text-white" />
                                </div>
                                <h3 className="font-bold text-gray-800 text-sm leading-tight">{project.name}</h3>
                              </div>
                              <span className={`text-xs px-2 py-0.5 rounded-full font-medium shrink-0 ${statusColors[project.status] || 'bg-gray-100 text-gray-700'}`}>
                                {project.status === 'in_progress' || project.status === 'en_cours' ? '🚧 En cours'
                                  : project.status === 'planning' ? '📋 Planification'
                                  : project.status === 'completed' || project.status === 'terminé' ? '✅ Terminé'
                                  : project.status}
                              </span>
                            </div>

                            {/* Progress bar */}
                            <div>
                              <div className="flex justify-between text-xs text-gray-500 mb-1">
                                <span>Progression</span>
                                <span className="font-semibold">{project.progress}%</span>
                              </div>
                              <div className="w-full bg-gray-200 rounded-full h-1.5">
                                <div
                                  className="bg-gradient-to-r from-purple-500 to-indigo-500 h-1.5 rounded-full transition-all"
                                  style={{ width: `${project.progress}%` }}
                                />
                              </div>
                            </div>

                            <div className="flex items-center justify-between text-xs text-gray-500">
                              <span className="flex items-center gap-1">
                                <DollarSign className="h-3 w-3" />
                                {(project.budget || 0).toLocaleString()} TND
                              </span>
                              <span className="flex items-center gap-1">
                                <Building2 className="h-3 w-3" />
                                {project.siteCount || 0} site(s)
                              </span>
                              <ChevronRight className="h-4 w-4 text-purple-400 group-hover:translate-x-1 transition-transform" />
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                )
              )}
            </CardContent>
          </Card>
        </div>

        {/* Focused site preview with blurred background - Improved Design */}
        {previewSite && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-md px-4 animate-in fade-in duration-200">
            <div className="w-full max-w-4xl rounded-3xl border-2 border-border bg-white shadow-2xl animate-in zoom-in-95 duration-300 overflow-hidden">
              {/* Header with gradient */}
              <div className="flex items-center justify-between border-b-2 border-border bg-gradient-to-r from-indigo-50 via-purple-50 to-pink-50 px-8 py-5">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl shadow-lg">
                    <BarChart3 className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-wider text-indigo-600 font-semibold mb-1">
                      Selected Site
                    </p>
                    <h3 className="text-2xl font-bold text-gray-800">{previewSite.nom}</h3>
                  </div>
                </div>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={() => setPreviewSite(null)} 
                  className="hover:bg-white/80 rounded-full"
                  aria-label="Close site preview"
                >
                  <X className="h-5 w-5" />
                </Button>
              </div>

              {/* Content */}
              <div className="p-8 space-y-6">
                {/* Location Card */}
                <div className="rounded-2xl border-2 border-blue-200/60 bg-gradient-to-br from-blue-50 to-indigo-50 p-5 shadow-sm">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="p-1.5 bg-blue-500 rounded-lg">
                      <svg className="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                    </div>
                    <p className="text-sm font-semibold text-blue-900">Location</p>
                  </div>
                  <p className="text-lg font-bold text-blue-800">{previewSite.localisation || '—'}</p>
                </div>

                {/* Stats Grid */}
                <div className="grid gap-4 md:grid-cols-3">
                  <div className="rounded-xl border-2 border-emerald-200 bg-gradient-to-br from-emerald-50 to-white p-4 shadow-sm">
                    <div className="flex items-center gap-2 mb-2">
                      <DollarSign className="h-5 w-5 text-emerald-600" />
                      <p className="text-xs font-semibold text-emerald-900">Budget</p>
                    </div>
                    <p className="text-2xl font-bold text-emerald-700">{(previewSite.budget || 0).toLocaleString()} TND</p>
                  </div>
                  <div className="rounded-xl border-2 border-purple-200 bg-gradient-to-br from-purple-50 to-white p-4 shadow-sm">
                    <div className="flex items-center gap-2 mb-2">
                      <svg className="h-5 w-5 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <p className="text-xs font-semibold text-purple-900">Status</p>
                    </div>
                    <p className="text-2xl font-bold text-purple-700 capitalize">{previewSite.status || '—'}</p>
                  </div>
                  <div className="rounded-xl border-2 border-amber-200 bg-gradient-to-br from-amber-50 to-white p-4 shadow-sm">
                    <div className="flex items-center gap-2 mb-2">
                      <svg className="h-5 w-5 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
                      </svg>
                      <p className="text-xs font-semibold text-amber-900">Area</p>
                    </div>
                    <p className="text-2xl font-bold text-amber-700">{previewSite.surface ? `${previewSite.surface} m²` : 'N/A'}</p>
                  </div>
                </div>

                {/* Info Banner */}
                <div className="rounded-2xl border-2 border-indigo-200/50 bg-gradient-to-r from-indigo-50 via-purple-50 to-pink-50 p-5 shadow-sm">
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg shadow-md">
                      <Sparkles className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-indigo-900 mb-1">AI-Powered Optimization</h4>
                      <p className="text-sm text-indigo-800 leading-relaxed">
                        Open this site to access intelligent recommendations, real-time performance alerts, and comprehensive before/after analytics to track your optimization impact.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex justify-end gap-3 pt-2">
                  <Button 
                    variant="outline" 
                    onClick={() => setPreviewSite(null)}
                    className="px-6 border-2 hover:bg-gray-50"
                  >
                    Cancel
                  </Button>
                  <Button
                    className="gap-2 px-6 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 shadow-lg hover:shadow-xl transition-all duration-300"
                    onClick={() => {
                      const id = previewSite.__siteId as string;
                      setPreviewSite(null);
                      handleSiteChange(id);
                    }}
                  >
                    Open Site Details
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
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

  // ── Project mode dashboard ──────────────────────────────────────────────
  if (isProjectMode) {
    return (
      <div className="space-y-6 p-6">
        <Button
          variant="ghost"
          onClick={() => { setSelectedProjectId(''); setSelectedSiteId(''); }}
          className="gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Retour à tous les projets
        </Button>

        {/* Project header */}
        <div className="rounded-2xl border-2 border-purple-200 bg-gradient-to-br from-purple-50 via-white to-indigo-50 px-8 py-6 shadow-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-48 h-48 bg-purple-200 rounded-full -mr-24 -mt-24 opacity-20" />
          <div className="relative z-10 flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-2xl shadow-lg">
                <Briefcase className="h-8 w-8 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-purple-900">
                  {selectedProject?.name || 'Projet'}
                </h1>
                <div className="flex items-center gap-4 text-sm text-purple-700 mt-1 flex-wrap">
                  <span>Budget: {(selectedProject?.budget || 0).toLocaleString()} TND</span>
                  <span>•</span>
                  <span>{projectSites.length} site(s)</span>
                  <span>•</span>
                  <span>Progression: {selectedProject?.progress || 0}%</span>
                  {openProjectIncidents.length > 0 && (
                    <>
                      <span>•</span>
                      <span className="text-orange-600 font-semibold">
                        ⚠️ {openProjectIncidents.length} incident(s) ouvert(s)
                      </span>
                    </>
                  )}
                </div>
              </div>
            </div>
            <Button
              size="lg"
              className="gap-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 shadow-lg"
              onClick={handleGenerateProjectRecommendations}
              disabled={isGenerating}
            >
              <Zap className={`h-5 w-5 ${isGenerating ? 'animate-spin' : ''}`} />
              {isGenerating ? 'Génération...' : 'Générer les insights IA'}
            </Button>
          </div>
        </div>

        {/* Summary cards */}
        {projectSummary && (
          <div className="grid gap-4 md:grid-cols-4">
            <Card className="border-2 border-emerald-200 bg-gradient-to-br from-emerald-50 to-white">
              <CardContent className="pt-4 flex items-center gap-3">
                <DollarSign className="h-8 w-8 text-emerald-500" />
                <div>
                  <p className="text-xs text-gray-500">Économies potentielles</p>
                  <p className="text-xl font-bold">{projectSummary.totalPotentialSavings} TND</p>
                </div>
              </CardContent>
            </Card>
            <Card className="border-2 border-blue-200 bg-gradient-to-br from-blue-50 to-white">
              <CardContent className="pt-4 flex items-center gap-3">
                <TrendingUp className="h-8 w-8 text-blue-500" />
                <div>
                  <p className="text-xs text-gray-500">Approuvées</p>
                  <p className="text-xl font-bold">{projectSummary.approvedSavings} TND</p>
                </div>
              </CardContent>
            </Card>
            <Card className="border-2 border-green-200 bg-gradient-to-br from-green-50 to-white">
              <CardContent className="pt-4 flex items-center gap-3">
                <Sparkles className="h-8 w-8 text-green-500" />
                <div>
                  <p className="text-xs text-gray-500">Réalisées</p>
                  <p className="text-xl font-bold">{projectSummary.realizedSavings} TND</p>
                </div>
              </CardContent>
            </Card>
            <Card className="border-2 border-orange-200 bg-gradient-to-br from-orange-50 to-white">
              <CardContent className="pt-4 flex items-center gap-3">
                <AlertTriangle className="h-8 w-8 text-orange-500" />
                <div>
                  <p className="text-xs text-gray-500">Incidents ouverts</p>
                  <p className="text-xl font-bold">{openProjectIncidents.length}</p>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Incident banner */}
        {openProjectIncidents.length > 0 && (
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-orange-500 mt-0.5 shrink-0" />
            <div>
              <p className="font-semibold text-orange-800">
                {openProjectIncidents.length} incident(s) ouvert(s) sur ce projet
              </p>
              <p className="text-sm text-orange-600 mt-0.5">
                {criticalProjectIncidents.length} critique(s)/élevé(s) · Des recommandations ont été générées pour réduire leur impact sur le budget et les délais.
              </p>
            </div>
          </div>
        )}

        {/* Recommendations */}
        <Tabs defaultValue="all" className="space-y-3">
          <TabsList className="flex-wrap h-auto gap-1">
            <TabsTrigger value="all">Toutes ({projectRecs.length})</TabsTrigger>
            <TabsTrigger value="budget">Budget ({projectRecs.filter(r => r.type === 'budget').length})</TabsTrigger>
            <TabsTrigger value="timeline">Délais ({projectRecs.filter(r => r.type === 'timeline').length})</TabsTrigger>
            <TabsTrigger value="task_distribution">Tâches ({projectRecs.filter(r => r.type === 'task_distribution').length})</TabsTrigger>
            <TabsTrigger value="resource_allocation">Ressources ({projectRecs.filter(r => r.type === 'resource_allocation').length})</TabsTrigger>
            <TabsTrigger value="incidents">
              Incidents
              {openProjectIncidents.length > 0 && (
                <Badge className="bg-orange-500 text-white text-xs px-1.5 py-0 ml-1">{openProjectIncidents.length}</Badge>
              )}
            </TabsTrigger>
          </TabsList>

          {['all', 'budget', 'timeline', 'task_distribution', 'resource_allocation'].map(type => (
            <TabsContent key={type} value={type}>
              <Card>
                <CardHeader>
                  <CardTitle className="capitalize">{type === 'all' ? 'Toutes les recommandations' : type.replace('_', ' ')}</CardTitle>
                </CardHeader>
                <CardContent>
                  <RecommendationsList
                    recommendations={projectRecs}
                    onApprove={handleApprove}
                    onReject={handleReject}
                    onImplement={handleImplement}
                    loading={projectRecsLoading}
                    filter={type === 'all' ? undefined : type}
                  />
                </CardContent>
              </Card>
            </TabsContent>
          ))}

          <TabsContent value="incidents">
            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5 text-orange-500" />
                    Recommandations liées aux incidents
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <RecommendationsList
                    recommendations={projectRecs.filter(r => r.type === 'budget' || r.type === 'timeline' || r.type === 'resource_allocation')}
                    onApprove={handleApprove}
                    onReject={handleReject}
                    onImplement={handleImplement}
                    loading={projectRecsLoading}
                  />
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <ShieldAlert className="h-5 w-5 text-red-500" />
                    Incidents du projet ({projectIncidents.length})
                    {openProjectIncidents.length > 0 && (
                      <Badge className="bg-orange-100 text-orange-800 ml-2">{openProjectIncidents.length} ouverts</Badge>
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {projectIncidents.length === 0 ? (
                    <p className="text-center text-gray-500 py-6">Aucun incident pour ce projet</p>
                  ) : (
                    <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                      {projectIncidents.map((incident: Incident) => {
                        const sevConfig: Record<string, { color: string; label: string }> = {
                          critical: { color: 'bg-red-100 text-red-800', label: '🔴 Critique' },
                          high:     { color: 'bg-orange-100 text-orange-800', label: '🟠 Élevé' },
                          medium:   { color: 'bg-yellow-100 text-yellow-800', label: '🟡 Moyen' },
                          low:      { color: 'bg-green-100 text-green-800', label: '🟢 Faible' },
                        };
                        const sev = sevConfig[incident.severity] || sevConfig.low;
                        const isOpen = incident.status === 'open' || incident.status === 'investigating';
                        return (
                          <Card key={incident._id} className={`border ${isOpen ? 'border-orange-200' : 'border-gray-200'}`}>
                            <CardContent className="pt-4 space-y-2">
                              <div className="flex items-start justify-between gap-2">
                                <span className="font-semibold text-sm">{incident.title}</span>
                                <Badge className={sev.color}>{sev.label}</Badge>
                              </div>
                              {incident.description && <p className="text-xs text-gray-500">{incident.description}</p>}
                              <div className="flex items-center gap-2 text-xs text-gray-400">
                                <span className="capitalize">{incident.type}</span>
                                <span>•</span>
                                <span className={isOpen ? 'text-orange-600 font-medium' : 'text-green-600'}>
                                  {incident.status === 'open' ? 'Ouvert' : incident.status === 'investigating' ? 'En investigation' : incident.status === 'resolved' ? 'Résolu' : 'Fermé'}
                                </span>
                              </div>
                            </CardContent>
                          </Card>
                        );
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    );
  }

  if (currentPage !== 'overview') {
    return (
      <div className="space-y-4 p-6">
        <div className="flex items-center gap-2 p-4 rounded-xl border border-border bg-muted/30">
          <Button variant="ghost" size="sm" onClick={() => setCurrentPage('overview')} className="gap-1">
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
          <span className="text-gray-400">/</span>
          <span className="font-medium capitalize">{currentPage.replace('-', ' ')}</span>
        </div>

        {currentPage === 'resource-analysis' && (
          <Card className="shadow-sm">
            <CardContent className="pt-6">
              <h3 className="text-lg font-semibold">Site Resource Analysis</h3>
              <p className="text-gray-600">
                Connection to equipment usage, workload and cost indicators per site — module in development.
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
          <Card className="shadow-sm">
            <CardContent className="pt-6">
              <h3 className="text-lg font-semibold">Reports</h3>
              <p className="text-gray-600">Feature in development</p>
            </CardContent>
          </Card>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {effectiveSiteId && (
        <Button 
          variant="ghost" 
          onClick={() => {
            setSelectedSiteId('');
            setSearchParams({});
          }} 
          className="mb-2 gap-2 hover:bg-gray-100"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to All Sites
        </Button>
      )}
      
      <div className="rounded-2xl border-2 border-border/60 bg-gradient-to-br from-indigo-50 via-white to-purple-50 px-8 py-6 shadow-xl relative overflow-hidden">
        {/* Decorative elements */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-indigo-200 to-purple-200 rounded-full -mr-32 -mt-32 opacity-20" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-gradient-to-tr from-blue-200 to-indigo-200 rounded-full -ml-24 -mb-24 opacity-20" />
        
        <div className="relative z-10 flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl shadow-lg">
              <BarChart3 className="h-8 w-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                Site Resources
              </h1>
              <p className="text-muted-foreground mt-2 max-w-4xl leading-relaxed">
                {site
                  ? `${site.nom} — Optimize budget, tasks, and teams with AI-powered recommendations and real-time analytics.`
                  : 'Select a site to unlock intelligent resource optimization and performance tracking.'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            {/* View mode toggle */}
            <div className="flex rounded-lg border-2 border-indigo-200 overflow-hidden bg-white shadow-sm">
              <button
                onClick={() => setViewMode('site')}
                className={`flex items-center gap-1.5 px-4 py-2 text-sm font-medium transition-colors ${
                  viewMode === 'site'
                    ? 'bg-indigo-600 text-white'
                    : 'text-indigo-600 hover:bg-indigo-50'
                }`}
              >
                <Building2 className="h-4 w-4" />
                Par Site
              </button>
              <button
                onClick={() => setViewMode('project')}
                className={`flex items-center gap-1.5 px-4 py-2 text-sm font-medium transition-colors ${
                  viewMode === 'project'
                    ? 'bg-indigo-600 text-white'
                    : 'text-indigo-600 hover:bg-indigo-50'
                }`}
              >
                <Briefcase className="h-4 w-4" />
                Par Projet
              </button>
            </div>

            {/* Site Selector */}
            {viewMode === 'site' && (
              <Select value={effectiveSiteId} onValueChange={handleSiteChange}>
                <SelectTrigger className="w-72 bg-white border-2 border-indigo-200 hover:border-indigo-300 transition-colors shadow-sm">
                  <SelectValue placeholder="🏗️ Sélectionner un site" />
                </SelectTrigger>
                <SelectContent>
                  {activeSites.map((s) => {
                    const siteId = getSiteId(s);
                    return (
                      <SelectItem key={siteId} value={siteId}>
                        <div className="flex items-center gap-2">
                          <span className="text-lg">🏗️</span>
                          <span>{s.nom}</span>
                        </div>
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            )}

            {/* Project Selector */}
            {viewMode === 'project' && (
              <Select value={selectedProjectId} onValueChange={setSelectedProjectId}>
                <SelectTrigger className="w-72 bg-white border-2 border-indigo-200 hover:border-indigo-300 transition-colors shadow-sm">
                  <SelectValue placeholder="📁 Sélectionner un projet" />
                </SelectTrigger>
                <SelectContent>
                  {(projects || []).map((p) => {
                    const pid = getProjectId(p);
                    return (
                      <SelectItem key={pid} value={pid}>
                        <div className="flex items-center gap-2">
                          <span className="text-lg">📁</span>
                          <span>{p.name}</span>
                        </div>
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            )}

            <Button
              size="lg"
              className="gap-2 shadow-lg bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 transition-all duration-300 hover:shadow-xl hover:scale-105"
              onClick={viewMode === 'project' ? handleGenerateProjectRecommendations : handleGenerateRecommendations}
              disabled={isGenerating || (viewMode === 'project' ? !selectedProjectId : !effectiveSiteId)}
            >
              <Zap className={`h-5 w-5 ${isGenerating ? 'animate-spin' : ''}`} />
              {isGenerating ? 'Génération...' : 'Générer les insights IA'}
            </Button>
          </div>
        </div>
      </div>

      {/* Site Info Bar */}
      {site && (
        <Card className="border-2 border-blue-200/70 bg-gradient-to-br from-blue-50 via-white to-indigo-50 shadow-lg overflow-hidden relative group">
          <div className="absolute top-0 right-0 w-40 h-40 bg-blue-200 rounded-full -mr-20 -mt-20 opacity-20 group-hover:scale-110 transition-transform duration-500" />
          <CardContent className="pt-5 pb-5 relative z-10">
            <div className="flex items-center justify-between gap-6 flex-wrap">
              <div className="flex items-center gap-6">
                <div className="flex items-center gap-3 px-4 py-2 bg-white rounded-xl shadow-sm border border-blue-100">
                  <DollarSign className="h-5 w-5 text-blue-600" />
                  <div>
                    <p className="text-xs text-gray-500 font-medium">Budget</p>
                    <p className="text-lg font-bold text-blue-700">{site.budget.toLocaleString()} TND</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 px-4 py-2 bg-white rounded-xl shadow-sm border border-purple-100">
                  <Users className="h-5 w-5 text-purple-600" />
                  <div>
                    <p className="text-xs text-gray-500 font-medium">Team</p>
                    <p className="text-lg font-bold text-purple-700">{siteTeams?.length || 0} members</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 px-4 py-2 bg-white rounded-xl shadow-sm border border-amber-100">
                  <Target className="h-5 w-5 text-amber-600" />
                  <div>
                    <p className="text-xs text-gray-500 font-medium">Tasks</p>
                    <p className="text-lg font-bold text-amber-700">{tasks?.length || 0} active</p>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className={`px-4 py-2 rounded-full text-sm font-semibold shadow-sm ${
                  site.status === 'in_progress' ? 'bg-gradient-to-r from-green-100 to-emerald-100 text-green-800 border border-green-200' :
                  site.status === 'planning' ? 'bg-gradient-to-r from-blue-100 to-indigo-100 text-blue-800 border border-blue-200' :
                  site.status === 'completed' ? 'bg-gradient-to-r from-gray-100 to-slate-100 text-gray-800 border border-gray-200' :
                  'bg-gradient-to-r from-red-100 to-rose-100 text-red-800 border border-red-200'
                }`}>
                  {site.status === 'in_progress' ? '🚧 In Progress' :
                   site.status === 'planning' ? '📋 Planning' :
                   site.status === 'completed' ? '✅ Completed' :
                   '⚠️ ' + site.status}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Quick Access Cards - Improved Design (Only 2 cards) */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card 
          className="group cursor-pointer hover:shadow-xl transition-all duration-300 border-2 hover:border-amber-300 bg-gradient-to-br from-amber-50 to-white overflow-hidden relative" 
          onClick={() => setCurrentPage('recommendations')}
        >
          <div className="absolute top-0 right-0 w-32 h-32 bg-amber-100 rounded-full -mr-16 -mt-16 opacity-50 group-hover:scale-110 transition-transform duration-300" />
          <CardContent className="pt-6 pb-4 relative z-10">
            <div className="flex items-start justify-between mb-3">
              <div className="p-3 bg-gradient-to-br from-amber-500 to-amber-600 rounded-xl shadow-lg group-hover:scale-110 transition-transform duration-300">
                <Lightbulb className="h-6 w-6 text-white" />
              </div>
              <ChevronRight className="h-5 w-5 text-amber-400 group-hover:translate-x-1 transition-transform duration-300" />
            </div>
            <h3 className="text-lg font-bold text-gray-800 mb-1">Recommendations</h3>
            <p className="text-sm text-gray-600">
              <span className="inline-flex items-center justify-center px-2 py-1 text-xs font-bold text-amber-800 bg-amber-200 rounded-full">
                {recommendations.length}
              </span>
              <span className="ml-2">AI suggestions</span>
            </p>
          </CardContent>
        </Card>

        <Card 
          className="group cursor-pointer hover:shadow-xl transition-all duration-300 border-2 hover:border-red-300 bg-gradient-to-br from-red-50 to-white overflow-hidden relative" 
          onClick={() => setCurrentPage('alerts')}
        >
          <div className="absolute top-0 right-0 w-32 h-32 bg-red-100 rounded-full -mr-16 -mt-16 opacity-50 group-hover:scale-110 transition-transform duration-300" />
          <CardContent className="pt-6 pb-4 relative z-10">
            <div className="flex items-start justify-between mb-3">
              <div className="p-3 bg-gradient-to-br from-red-500 to-red-600 rounded-xl shadow-lg group-hover:scale-110 transition-transform duration-300 relative">
                <AlertTriangle className="h-6 w-6 text-white" />
                {unreadAlertsCount > 0 && (
                  <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-white text-xs font-bold text-red-600 shadow-md">
                    {unreadAlertsCount}
                  </span>
                )}
              </div>
              <ChevronRight className="h-5 w-5 text-red-400 group-hover:translate-x-1 transition-transform duration-300" />
            </div>
            <h3 className="text-lg font-bold text-gray-800 mb-1">Alerts</h3>
            <p className="text-sm text-gray-600">
              {unreadAlertsCount > 0 ? (
                <span className="text-red-600 font-semibold">{unreadAlertsCount} unread alerts</span>
              ) : (
                <span className="text-green-600">All clear ✓</span>
              )}
            </p>
          </CardContent>
        </Card>
      </div>

      <SummaryStats dashboard={dashboard || null} />

      <Tabs defaultValue="recommendations" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="recommendations" className="gap-2">
            <Lightbulb className="h-4 w-4" />
            Recommendations ({viewMode === 'site' ? recommendations.length : projectRecs.length})
            {(viewMode === 'site' ? openIncidents : openProjectIncidents).length > 0 && (
              <Badge className="bg-orange-500 text-white text-xs px-1.5 py-0 ml-1">
                {(viewMode === 'site' ? openIncidents : openProjectIncidents).length} incidents
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="alerts" className="gap-2">
            <AlertTriangle className="h-4 w-4" />
            Alerts ({unreadAlertsCount})
          </TabsTrigger>
          <TabsTrigger value="analytics" className="gap-2">
            <BarChart3 className="h-4 w-4" />
            Analytics & Charts
          </TabsTrigger>
        </TabsList>

        <TabsContent value="recommendations" className="space-y-4">
          {/* Incident alert banner */}
          {(viewMode === 'site' ? openIncidents : openProjectIncidents).length > 0 && (
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-orange-500 mt-0.5 shrink-0" />
              <div>
                <p className="font-semibold text-orange-800">
                  {(viewMode === 'site' ? openIncidents : openProjectIncidents).length} incident(s) ouvert(s) — impact sur budget et délais
                </p>
                <p className="text-sm text-orange-600 mt-0.5">
                  {(viewMode === 'site' ? criticalIncidents : criticalProjectIncidents).length} critique(s)/élevé(s) · Des recommandations ont été générées pour réduire leur impact.
                </p>
              </div>
            </div>
          )}

          {/* Project info banner */}
          {viewMode === 'project' && selectedProject && (
            <Card className="border-2 border-purple-200 bg-gradient-to-br from-purple-50 to-white">
              <CardContent className="pt-4 flex items-center gap-4">
                <Briefcase className="h-8 w-8 text-purple-600" />
                <div className="flex-1">
                  <h3 className="font-bold text-lg text-purple-900">{selectedProject.name}</h3>
                  <div className="flex items-center gap-4 text-sm text-purple-700 mt-1">
                    <span>Budget: {(selectedProject.budget || 0).toLocaleString()} TND</span>
                    <span>•</span>
                    <span>{projectSites.length} site(s)</span>
                    <span>•</span>
                    <span className="capitalize">{selectedProject.status}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Recommendations tabs by type */}
          <Tabs defaultValue="all" className="space-y-3">
            <TabsList className="flex-wrap h-auto gap-1">
              <TabsTrigger value="all">
                Toutes ({viewMode === 'site' ? recommendations.length : projectRecs.length})
              </TabsTrigger>
              <TabsTrigger value="budget">
                Budget ({(viewMode === 'site' ? recommendations : projectRecs).filter(r => r.type === 'budget').length})
              </TabsTrigger>
              <TabsTrigger value="timeline">
                Délais ({(viewMode === 'site' ? recommendations : projectRecs).filter(r => r.type === 'timeline').length})
              </TabsTrigger>
              <TabsTrigger value="task_distribution">
                Tâches ({(viewMode === 'site' ? recommendations : projectRecs).filter(r => r.type === 'task_distribution').length})
              </TabsTrigger>
              <TabsTrigger value="resource_allocation">
                Ressources ({(viewMode === 'site' ? recommendations : projectRecs).filter(r => r.type === 'resource_allocation').length})
              </TabsTrigger>
              <TabsTrigger value="incidents">
                <span className="flex items-center gap-1">
                  Incidents
                  {(viewMode === 'site' ? openIncidents : openProjectIncidents).length > 0 && (
                    <Badge className="bg-orange-500 text-white text-xs px-1.5 py-0 ml-1">
                      {(viewMode === 'site' ? openIncidents : openProjectIncidents).length}
                    </Badge>
                  )}
                </span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="all">
              <Card>
                <CardHeader>
                  <CardTitle>Toutes les recommandations</CardTitle>
                  <CardDescription>
                    {(viewMode === 'site' ? recommendations : projectRecs).length} proposition(s) — approuvez pour figer une lecture ; implémentez pour comparer dans Analytics.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <RecommendationsList
                    recommendations={viewMode === 'site' ? recommendations : projectRecs}
                    onApprove={handleApprove}
                    onReject={handleReject}
                    onImplement={handleImplement}
                    loading={viewMode === 'site' ? recommendationsLoading : projectRecsLoading}
                  />
                </CardContent>
              </Card>
            </TabsContent>

            {['budget', 'timeline', 'task_distribution', 'resource_allocation'].map(type => (
              <TabsContent key={type} value={type}>
                <Card>
                  <CardHeader>
                    <CardTitle className="capitalize">{type.replace('_', ' ')}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <RecommendationsList
                      recommendations={viewMode === 'site' ? recommendations : projectRecs}
                      onApprove={handleApprove}
                      onReject={handleReject}
                      onImplement={handleImplement}
                      loading={viewMode === 'site' ? recommendationsLoading : projectRecsLoading}
                      filter={type}
                    />
                  </CardContent>
                </Card>
              </TabsContent>
            ))}

            <TabsContent value="incidents">
              <div className="space-y-4">
                {/* Incident-driven recommendations */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <AlertTriangle className="h-5 w-5 text-orange-500" />
                      Recommandations liées aux incidents
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <RecommendationsList
                      recommendations={(viewMode === 'site' ? recommendations : projectRecs).filter(r =>
                        r.type === 'budget' || r.type === 'timeline' || r.type === 'resource_allocation'
                      )}
                      onApprove={handleApprove}
                      onReject={handleReject}
                      onImplement={handleImplement}
                      loading={viewMode === 'site' ? recommendationsLoading : projectRecsLoading}
                    />
                  </CardContent>
                </Card>

                {/* Incidents list */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <ShieldAlert className="h-5 w-5 text-red-500" />
                      Incidents {viewMode === 'project' ? 'du projet' : 'du site'} ({(viewMode === 'site' ? incidents : projectIncidents).length})
                      {(viewMode === 'site' ? openIncidents : openProjectIncidents).length > 0 && (
                        <Badge className="bg-orange-100 text-orange-800 ml-2">
                          {(viewMode === 'site' ? openIncidents : openProjectIncidents).length} ouverts
                        </Badge>
                      )}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {(viewMode === 'site' ? incidents : projectIncidents).length === 0 ? (
                      <p className="text-center text-gray-500 py-6">Aucun incident</p>
                    ) : (
                      <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                        {(viewMode === 'site' ? incidents : projectIncidents).map((incident: Incident) => {
                          const sevConfig: Record<string, { color: string; label: string }> = {
                            critical: { color: 'bg-red-100 text-red-800', label: '🔴 Critique' },
                            high:     { color: 'bg-orange-100 text-orange-800', label: '🟠 Élevé' },
                            medium:   { color: 'bg-yellow-100 text-yellow-800', label: '🟡 Moyen' },
                            low:      { color: 'bg-green-100 text-green-800', label: '🟢 Faible' },
                          };
                          const sev = sevConfig[incident.severity] || sevConfig.low;
                          const isOpen = incident.status === 'open' || incident.status === 'investigating';
                          const typeIcon: Record<string, React.ReactNode> = {
                            safety:  <ShieldAlert className="h-4 w-4 text-red-500" />,
                            quality: <Star className="h-4 w-4 text-yellow-500" />,
                            delay:   <Clock className="h-4 w-4 text-orange-500" />,
                            other:   <AlertTriangle className="h-4 w-4 text-gray-500" />,
                          };
                          return (
                            <Card key={incident._id} className={`border ${isOpen ? 'border-orange-200' : 'border-gray-200'}`}>
                              <CardContent className="pt-4 space-y-2">
                                <div className="flex items-start justify-between gap-2">
                                  <div className="flex items-center gap-2">
                                    {typeIcon[incident.type]}
                                    <span className="font-semibold text-sm">{incident.title}</span>
                                  </div>
                                  <Badge className={sev.color}>{sev.label}</Badge>
                                </div>
                                {incident.description && (
                                  <p className="text-xs text-gray-500">{incident.description}</p>
                                )}
                                <div className="flex items-center gap-2 text-xs text-gray-400">
                                  <span className="capitalize">{incident.type}</span>
                                  <span>•</span>
                                  <span className={isOpen ? 'text-orange-600 font-medium' : 'text-green-600'}>
                                    {incident.status === 'open' ? 'Ouvert'
                                      : incident.status === 'investigating' ? 'En investigation'
                                      : incident.status === 'resolved' ? 'Résolu' : 'Fermé'}
                                  </span>
                                </div>
                              </CardContent>
                            </Card>
                          );
                        })}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
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
