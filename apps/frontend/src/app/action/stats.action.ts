import axios from "axios";
import { AUTH_API_URL } from "@/lib/auth-api-url";

const api = axios.create({
  baseURL: AUTH_API_URL,
});

// Récupérer le token depuis le localStorage
function getAuthToken(): string | null {
  const directToken = localStorage.getItem("access_token");
  if (directToken) return directToken;
  const persisted = localStorage.getItem("smartsite-auth");
  if (!persisted) return null;
  try {
    const parsed = JSON.parse(persisted);
    return parsed?.state?.user?.access_token || null;
  } catch {
    return null;
  }
}

// Ajouter le token d'authentification à toutes les requêtes
api.interceptors.request.use((config) => {
  const token = getAuthToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Types pour les statistiques
export interface GlobalStats {
  totalProjects: number;
  activeProjects: number;
  completedProjects: number;
  totalSites: number;
  activeSites: number;
  totalUsers: number;
  activeUsers: number;
  totalBudget: number;
  spentBudget: number;
  criticalIncidents: number;
  resolvedIncidents: number;
  safetyScore: number;
  onTimeDelivery: number;
  monthlyBudgetData: MonthlyBudgetData[];
  projectStatusData: ProjectStatusData[];
  recentProjects: RecentProject[];
  recentIncidents: RecentIncident[];
}

export interface MonthlyBudgetData {
  month: string;
  budget: number;
  spent: number;
}

export interface ProjectStatusData {
  name: string;
  value: number;
  color: string;
}

export interface RecentProject {
  _id: string;
  name: string;
  code: string;
  status: string;
  progress: number;
  budget: number;
  createdAt: string;
  updatedAt: string;
}

export interface RecentIncident {
  _id: string;
  type: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  status: 'resolved' | 'open' | 'investigating';
  description: string;
  createdAt: string;
  updatedAt: string;
}

// API pour les statistiques globales
export const getGlobalStats = async (): Promise<GlobalStats> => {
  try {
    const response = await api.get("/stats/global");
    return response.data;
  } catch (error) {
    console.error("Error fetching global stats:", error);
    throw error;
  }
};

export const getRecentProjects = async (limit: number = 5): Promise<RecentProject[]> => {
  try {
    const response = await api.get(`/projects/recent?limit=${limit}`);
    return response.data;
  } catch (error) {
    console.error("Error fetching recent projects:", error);
    throw error;
  }
};

export const getRecentIncidents = async (limit: number = 5): Promise<RecentIncident[]> => {
  try {
    const response = await api.get(`/incidents/recent?limit=${limit}`);
    return response.data;
  } catch (error) {
    console.error("Error fetching recent incidents:", error);
    throw error;
  }
};

export const getMonthlyBudgetData = async (): Promise<MonthlyBudgetData[]> => {
  try {
    const response = await api.get("/stats/budget/monthly");
    return response.data;
  } catch (error) {
    console.error("Error fetching monthly budget data:", error);
    throw error;
  }
};

export const getProjectStatusData = async (): Promise<ProjectStatusData[]> => {
  try {
    const response = await api.get("/stats/projects/status");
    return response.data;
  } catch (error) {
    console.error("Error fetching project status data:", error);
    throw error;
  }
};
