import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import type {
  Site,
  Project,
  User,
  Task,
  Milestone,
  Incident,
  ResourceAnalysis,
  IdleEquipment,
  PeakConsumptionPeriod,
  WorkerProductivity,
  Recommendation,
  RecommendationType,
  RecommendationStatus,
  Alert,
  AlertSummary,
  DashboardData,
  RecommendationsSummary,
} from '../types';

// ============ EXTERNAL MICROSERVICE CONFIG ============

const GESTION_SITE_URL = import.meta.env.VITE_GESTION_SITE_URL || 'http://localhost:3001/api';
const GESTION_PROJECTS_URL = import.meta.env.VITE_GESTION_PROJECTS_URL || 'http://localhost:3010';
const AUTH_API_URL = import.meta.env.VITE_AUTH_API_URL || 'http://localhost:3000';
const PLANNING_URL = 'http://localhost:3002';
const INCIDENT_URL = import.meta.env.VITE_INCIDENT_URL || 'http://localhost:3003';
const RO_RAW = import.meta.env.VITE_RESOURCE_OPTIMIZATION_URL;
const API_BASE_URL = (RO_RAW && String(RO_RAW).replace(/\/$/, '')) || '/api';

// ============ PROJECTS HOOKS (gestion-projects:3007) ============

export const useProjects = () => {
  return useQuery({
    queryKey: ['projects'],
    queryFn: async () => {
      const response = await axios.get<{ projects: Project[] }>(
        `${GESTION_PROJECTS_URL}/projects?limit=100&page=1`
      );
      return response.data.projects || [];
    },
  });
};

export const useProjectById = (projectId: string) => {
  return useQuery({
    queryKey: ['project', projectId],
    queryFn: async () => {
      const response = await axios.get<Project>(
        `${GESTION_PROJECTS_URL}/projects/${projectId}`
      );
      return response.data;
    },
    enabled: !!projectId && projectId !== 'undefined' && projectId !== '',
  });
};

export const useProjectSites = (projectId: string) => {
  return useQuery({
    queryKey: ['project-sites', projectId],
    queryFn: async () => {
      const response = await axios.get<{ data: Site[] }>(
        `${GESTION_SITE_URL}/gestion-sites?projectId=${projectId}&limit=200`
      );
      return response.data?.data || [];
    },
    enabled: !!projectId && projectId !== 'undefined' && projectId !== '',
  });
};

export const useRecommendationsByProject = (projectId: string) => {
  return useQuery({
    queryKey: ['recommendations', 'project', projectId],
    queryFn: async () => {
      const response = await axios.get<Recommendation[]>(
        `${API_BASE_URL}/recommendations?projectId=${projectId}&scope=project`
      );
      return response.data || [];
    },
    enabled: !!projectId && projectId !== 'undefined' && projectId !== '',
  });
};

export const useProjectSummary = (projectId: string) => {
  return useQuery({
    queryKey: ['recommendations', 'project-summary', projectId],
    queryFn: async () => {
      const response = await axios.get<RecommendationsSummary>(
        `${API_BASE_URL}/recommendations/project/${projectId}/summary`
      );
      return response.data;
    },
    enabled: !!projectId && projectId !== 'undefined' && projectId !== '',
  });
};

export const useGenerateRecommendationsForProject = (projectId: string, siteId?: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const body: any = { projectId };
      if (siteId) body.siteId = siteId;
      const response = await axios.post<{ recommendations?: Recommendation[] }>(
        `${API_BASE_URL}/recommendations/generate`,
        body,
      );
      return response.data?.recommendations ?? [];
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recommendations'], exact: false });
    },
  });
};

// ============ SITES HOOKS (gestion-site:3001) ============

export const useSites = () => {
  return useQuery({
    queryKey: ['sites'],
    queryFn: async () => {
      const response = await axios.get<{ data: Site[] }>(`${GESTION_SITE_URL}/gestion-sites?limit=100`);
      return response.data.data;
    },
  });
};

export const useSiteById = (id: string) => {
  return useQuery({
    queryKey: ['site', id],
    queryFn: async () => {
      const response = await axios.get<Site>(`${GESTION_SITE_URL}/gestion-sites/${id}`);
      return response.data;
    },
    enabled: !!id && id !== 'undefined' && id !== '',
  });
};

export const useSiteTeams = (siteId: string) => {
  return useQuery({
    queryKey: ['site-teams', siteId],
    queryFn: async () => {
      const response = await axios.get<User[]>(`${GESTION_SITE_URL}/gestion-sites/${siteId}/teams`);
      return response.data;
    },
    enabled: !!siteId && siteId !== 'undefined' && siteId !== '',
  });
};

// ============ USERS/WORKERS HOOKS (user-authentication:3000) ============

export const useUsers = () => {
  return useQuery({
    queryKey: ['users'],
    queryFn: async () => {
      const response = await axios.get<User[]>(`${AUTH_API_URL}/users`);
      return response.data;
    },
  });
};

export const useUsersBySite = (siteId: string) => {
  return useQuery({
    queryKey: ['users', 'site', siteId],
    queryFn: async () => {
      // Get all users and filter by siteId
      const response = await axios.get<User[]>(`${AUTH_API_URL}/users`);
      return response.data.filter(u => u.siteIds?.includes(siteId));
    },
    enabled: !!siteId,
  });
};

export const useUserById = (id: string) => {
  return useQuery({
    queryKey: ['user', id],
    queryFn: async () => {
      const response = await axios.get<User>(`${AUTH_API_URL}/users/${id}`);
      return response.data;
    },
    enabled: !!id,
  });
};

// ============ TASKS HOOKS (gestion-planing:3002) ============

export const useTasks = () => {
  return useQuery({
    queryKey: ['tasks'],
    queryFn: async () => {
      const response = await axios.get<Task[]>(`${PLANNING_URL}/task`);
      return response.data;
    },
  });
};

export const useTasksBySite = (siteId: string) => {
  return useQuery({
    queryKey: ['tasks', 'site', siteId],
    queryFn: async () => {
      // Tasks are linked to milestones — fetch via external-data service
      const response = await axios.get<Task[]>(`${API_BASE_URL}/external-data/tasks/${siteId}`);
      return response.data || [];
    },
    enabled: !!siteId && siteId !== 'undefined' && siteId !== '',
  });
};

export const useMilestonesBySite = (siteId: string) => {
  return useQuery({
    queryKey: ['milestones', 'site', siteId],
    queryFn: async () => {
      const response = await axios.get<Milestone[]>(`${API_BASE_URL}/external-data/milestones/${siteId}`);
      return response.data || [];
    },
    enabled: !!siteId && siteId !== 'undefined' && siteId !== '',
  });
};

// ============ INCIDENTS HOOKS (incident-management:3005) ============

export const useIncidentsBySite = (siteId: string) => {
  return useQuery({
    queryKey: ['incidents', 'site', siteId],
    queryFn: async () => {
      const response = await axios.get<Incident[]>(`${INCIDENT_URL}/incidents/by-site/${siteId}`);
      return response.data || [];
    },
    enabled: !!siteId && siteId !== 'undefined' && siteId !== '',
  });
};

export const useIncidentsByProject = (projectId: string) => {
  return useQuery({
    queryKey: ['incidents', 'project', projectId],
    queryFn: async () => {
      const response = await axios.get<Incident[]>(`${INCIDENT_URL}/incidents/by-project/${projectId}`);
      return response.data || [];
    },
    enabled: !!projectId && projectId !== 'undefined' && projectId !== '',
  });
};

// ============ RESOURCE OPTIMIZATION HOOKS (port 3007) ============

export const useIdleEquipment = (siteId: string) => {
  const isValid = !!siteId && siteId !== 'undefined' && siteId !== '';
  return useQuery({
    queryKey: ['resource-analysis', 'idle-equipment', siteId],
    queryFn: async () => {
      const response = await axios.get<IdleEquipment[]>(
        `${API_BASE_URL}/resource-analysis/idle-equipment/${siteId}`
      );
      return response.data;
    },
    enabled: isValid,
  });
};

export const useEnergyAnalysis = (siteId: string) => {
  const isValid = !!siteId && siteId !== 'undefined' && siteId !== '';
  return useQuery({
    queryKey: ['resource-analysis', 'energy-consumption', siteId],
    queryFn: async () => {
      const response = await axios.get(
        `${API_BASE_URL}/resource-analysis/energy-consumption/${siteId}`
      );
      return response.data;
    },
    enabled: isValid,
  });
};

export const useWorkerProductivity = (siteId: string) => {
  const isValid = !!siteId && siteId !== 'undefined' && siteId !== '';
  return useQuery({
    queryKey: ['resource-analysis', 'worker-productivity', siteId],
    queryFn: async () => {
      const response = await axios.get<WorkerProductivity[]>(
        `${API_BASE_URL}/resource-analysis/worker-productivity/${siteId}`
      );
      return response.data;
    },
    enabled: isValid,
  });
};

export const useResourceCosts = (siteId: string) => {
  const isValid = !!siteId && siteId !== 'undefined' && siteId !== '';
  return useQuery({
    queryKey: ['resource-analysis', 'resource-costs', siteId],
    queryFn: async () => {
      const response = await axios.get(`${API_BASE_URL}/resource-analysis/resource-costs/${siteId}`);
      return response.data;
    },
    enabled: isValid,
  });
};

export const useFullAnalysis = (siteId: string) => {
  const isValid = !!siteId && siteId !== 'undefined' && siteId !== '';
  return useQuery({
    queryKey: ['resource-analysis', 'full', siteId],
    queryFn: async () => {
      const response = await axios.get<ResourceAnalysis>(
        `${API_BASE_URL}/resource-analysis/full-analysis/${siteId}`
      );
      return response.data;
    },
    enabled: isValid,
  });
};

// ============ RECOMMENDATIONS HOOKS ============

export const useRecommendations = (siteId: string, status?: RecommendationStatus) => {
  const isValid = !!siteId && siteId !== 'undefined' && siteId !== '';
  return useQuery({
    queryKey: ['recommendations', siteId, status],
    queryFn: async () => {
      const params = new URLSearchParams({ siteId });
      if (status) params.set('status', status);
      const response = await axios.get<Recommendation[]>(
        `${API_BASE_URL}/recommendations?${params.toString()}`,
      );
      return response.data;
    },
    enabled: isValid,
  });
};

export const useGenerateRecommendations = (siteId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const response = await axios.post<{ recommendations?: Recommendation[] }>(
        `${API_BASE_URL}/recommendations/generate/${siteId}`,
      );
      return response.data?.recommendations ?? [];
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recommendations'], exact: false });
    },
  });
};

export const useUpdateRecommendationStatus = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: RecommendationStatus }) => {
      const response = await axios.put<Recommendation>(
        `${API_BASE_URL}/recommendations/${id}/status`,
        { status }
      );
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recommendations'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
};

export const useRecommendationsSummary = (siteId: string) => {
  return useQuery({
    queryKey: ['recommendations', 'summary', siteId],
    queryFn: async () => {
      const response = await axios.get<RecommendationsSummary>(
        `${API_BASE_URL}/recommendations/site/${siteId}/summary`,
      );
      return response.data;
    },
    enabled: !!siteId,
  });
};

// ============ ALERTS HOOKS ============

export const useAlerts = (siteId: string) => {
  const isValid = !!siteId && siteId !== 'undefined' && siteId !== '';
  return useQuery({
    queryKey: ['alerts', siteId],
    queryFn: async () => {
      const response = await axios.get<Alert[]>(`${API_BASE_URL}/alerts/${siteId}`);
      return response.data;
    },
    enabled: isValid,
  });
};

export const useUnreadAlerts = (siteId: string) => {
  const isValid = !!siteId && siteId !== 'undefined' && siteId !== '';
  return useQuery({
    queryKey: ['alerts', 'unread', siteId],
    queryFn: async () => {
      const response = await axios.get<Alert[]>(`${API_BASE_URL}/alerts/unread/${siteId}`);
      return response.data;
    },
    enabled: isValid,
  });
};

export const useCriticalAlerts = (siteId: string) => {
  const isValid = !!siteId && siteId !== 'undefined' && siteId !== '';
  return useQuery({
    queryKey: ['alerts', 'critical', siteId],
    queryFn: async () => {
      const response = await axios.get<Alert[]>(`${API_BASE_URL}/alerts/critical/${siteId}`);
      return response.data;
    },
    enabled: isValid,
  });
};

export const useAlertsSummary = (siteId: string) => {
  const isValid = !!siteId && siteId !== 'undefined' && siteId !== '';
  return useQuery({
    queryKey: ['alerts', 'summary', siteId],
    queryFn: async () => {
      const response = await axios.get<AlertSummary>(`${API_BASE_URL}/alerts/${siteId}/summary`);
      return response.data;
    },
    enabled: isValid,
  });
};

export const useGenerateAlerts = (siteId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const response = await axios.post<Alert[]>(`${API_BASE_URL}/alerts/generate/${siteId}`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['alerts', siteId] });
    },
  });
};

export const useMarkAlertAsRead = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await axios.put(`${API_BASE_URL}/alerts/${id}/read`);
      return id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['alerts'] });
    },
  });
};

export const useMarkAlertAsResolved = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await axios.put(`${API_BASE_URL}/alerts/${id}/resolve`);
      return id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['alerts'] });
    },
  });
};

// ============ REPORTING HOOKS ============

export const usePerformanceReport = (siteId: string) => {
  const isValid = !!siteId && siteId !== 'undefined' && siteId !== '';
  return useQuery({
    queryKey: ['reports', 'performance', siteId],
    queryFn: async () => {
      const response = await axios.get(`${API_BASE_URL}/reports/performance/${siteId}`);
      return response.data;
    },
    enabled: isValid,
  });
};

export const useEnvironmentalReport = (siteId: string) => {
  const isValid = !!siteId && siteId !== 'undefined' && siteId !== '';
  return useQuery({
    queryKey: ['reports', 'environmental', siteId],
    queryFn: async () => {
      const response = await axios.get(`${API_BASE_URL}/reports/environmental/${siteId}`);
      return response.data;
    },
    enabled: isValid,
  });
};

export const useFinancialReport = (siteId: string) => {
  const isValid = !!siteId && siteId !== 'undefined' && siteId !== '';
  return useQuery({
    queryKey: ['reports', 'financial', siteId],
    queryFn: async () => {
      const response = await axios.get(`${API_BASE_URL}/reports/financial/${siteId}`);
      return response.data;
    },
    enabled: isValid,
  });
};

export const useDashboard = (siteId: string) => {
  const isValid = !!siteId && siteId !== 'undefined' && siteId !== '';
  return useQuery({
    queryKey: ['reports', 'dashboard', siteId],
    queryFn: async () => {
      const response = await axios.get<DashboardData>(`${API_BASE_URL}/reports/dashboard/${siteId}`);
      return response.data;
    },
    enabled: isValid,
  });
};

// ============ COMBINED HOOKS ============

export const useResourceOptimization = (siteId: string) => {
  const hasValidSiteId = !!siteId && siteId !== 'undefined' && siteId !== '';
  
  const recommendations = useRecommendations(hasValidSiteId ? siteId : '');
  const alerts = useAlerts(hasValidSiteId ? siteId : '');
  const dashboard = useDashboard(hasValidSiteId ? siteId : '');
  const fullAnalysis = useFullAnalysis(hasValidSiteId ? siteId : '');

  const site = useSiteById(hasValidSiteId ? siteId : '');
  const siteTeams = useSiteTeams(hasValidSiteId ? siteId : '');
  const tasks = useTasksBySite(hasValidSiteId ? siteId : '');
  const incidents = useIncidentsBySite(hasValidSiteId ? siteId : '');

  return {
    recommendations: recommendations.data || [],
    recommendationsLoading: recommendations.isLoading,
    alerts: alerts.data || [],
    alertsLoading: alerts.isLoading,
    dashboard: dashboard.data,
    dashboardLoading: dashboard.isLoading,
    fullAnalysis: fullAnalysis.data,
    fullAnalysisLoading: fullAnalysis.isLoading,
    site: site.data,
    siteLoading: site.isLoading,
    siteTeams: siteTeams.data || [],
    siteTeamsLoading: siteTeams.isLoading,
    tasks: tasks.data || [],
    tasksLoading: tasks.isLoading,
    incidents: incidents.data || [],
    incidentsLoading: incidents.isLoading,
    generateRecommendations: useGenerateRecommendations(hasValidSiteId ? siteId : ''),
    generateAlerts: useGenerateAlerts(hasValidSiteId ? siteId : ''),
    updateRecommendationStatus: useUpdateRecommendationStatus(),
    markAlertAsRead: useMarkAlertAsRead(),
    markAlertAsResolved: useMarkAlertAsResolved(),
  };
};
