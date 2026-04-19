import axios from "axios";
import { GESTION_SITE_API_URL } from "../../lib/gestion-site-api-url";
import { PLANNING_API_URL } from "../../lib/planning-api-url";
import { INCIDENT_API_URL } from "../../lib/incident-api-url";
import { AUTH_API_URL } from "../../lib/auth-api-url";

const sitesApi = axios.create({
  baseURL: GESTION_SITE_API_URL,
});

const projectsApi = axios.create({
  baseURL: PLANNING_API_URL,
});

const incidentsApi = axios.create({
  baseURL: INCIDENT_API_URL,
});

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

[sitesApi, projectsApi, incidentsApi].forEach((api) => {
  api.interceptors.request.use((config) => {
    const token = getAuthToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  });
});

export interface Site {
  _id: string;
  name: string;
  localisation: string;
  status: string;
  budget: number;
  createdAt: string;
  updatedAt: string;
  projectId?: string;
}

export interface Project {
  _id: string;
  name: string;
  description: string;
  status: string;
  progress: number;
  priority: string;
  deadline: string;
  assignedTo: string;
  assignedToName: string;
  assignedToRole: string;
  tasks: unknown[];
  createdAt: string;
  updatedAt: string;
  projectManagerName: string;
  budget?: number;
}

export interface Task {
  _id: string;
  title: string;
  status: string;
  priority: string;
  deadline: string;
  projectId: string;
  createdAt: string;
  updatedAt: string;
}

export interface TeamMember {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string | { name: string; permissions: string[] };
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Incident {
  _id: string;
  type: string;
  severity: "critical" | "high" | "medium" | "low";
  status: "resolved" | "open" | "investigating";
  description: string;
  createdAt: string;
  updatedAt: string;
}

function normalizeSite(raw: Record<string, unknown>): Site {
  const id = raw._id ?? raw.id;
  return {
    _id: String(id ?? ""),
    name: String(raw.nom ?? raw.name ?? ""),
    localisation: String(
      raw.localisation ?? raw.adresse ?? raw.address ?? "",
    ),
    status: String(raw.status ?? (raw.isActif ? "in_progress" : "planning")),
    budget: Number(raw.budget ?? 0),
    createdAt: String(raw.createdAt ?? new Date().toISOString()),
    updatedAt: String(raw.updatedAt ?? new Date().toISOString()),
    projectId: raw.projectId != null ? String(raw.projectId) : undefined,
  };
}

function normalizeIncident(raw: Record<string, unknown>): Incident {
  const id = raw._id ?? raw.id;
  const sev = String(raw.severity ?? "medium").toLowerCase();
  const severity =
    sev === "critical" || sev === "high" || sev === "medium" || sev === "low"
      ? sev
      : "medium";
  const st = String(raw.status ?? "open").toLowerCase();
  const status =
    st === "resolved" || st === "open" || st === "investigating"
      ? st
      : "open";
  return {
    _id: String(id ?? ""),
    type: String(raw.type ?? raw.title ?? "other"),
    severity,
    status,
    description: String(raw.description ?? raw.title ?? ""),
    createdAt: String(raw.createdAt ?? new Date().toISOString()),
    updatedAt: String(raw.updatedAt ?? new Date().toISOString()),
  };
}

function normalizeUser(raw: Record<string, unknown>): TeamMember {
  const id = raw._id ?? raw.id ?? raw.cin;
  const status = String(raw.status ?? "active");
  return {
    _id: String(id ?? ""),
    firstName: String(raw.firstName ?? ""),
    lastName: String(raw.lastName ?? ""),
    email: String(raw.email ?? ""),
    role: raw.role as TeamMember["role"],
    isActive: status === "active" && raw.isActive !== false,
    createdAt: String(raw.createdAt ?? new Date().toISOString()),
    updatedAt: String(raw.updatedAt ?? new Date().toISOString()),
  };
}

export const getSites = async (): Promise<Site[]> => {
  try {
    const response = await sitesApi.get("/gestion-sites?limit=100");
    const payload = response.data?.data ?? response.data;
    const rows = Array.isArray(payload) ? payload : payload?.items ?? [];
    return rows.map((r: Record<string, unknown>) => normalizeSite(r));
  } catch (error) {
    console.error("Error fetching sites:", error);
    return [];
  }
};

export const getProjects = async (): Promise<Project[]> => {
  try {
    const response = await projectsApi.get("/projects/all");
    const data = response.data;
    return Array.isArray(data) ? data : [];
  } catch (error) {
    console.error("Error fetching projects:", error);
    return [];
  }
};

export const getUrgentTasks = async (): Promise<Task[]> => {
  try {
    const response = await projectsApi.get("/tasks/urgent");
    const data = response.data;
    return Array.isArray(data) ? data : [];
  } catch (error) {
    console.error("Error fetching urgent tasks:", error);
    return [];
  }
};

export const getRecentIncidents = async (
  limit: number = 5,
): Promise<Incident[]> => {
  try {
    const response = await incidentsApi.get("/incidents");
    const raw = response.data?.data ?? response.data;
    const list = Array.isArray(raw) ? raw : [];
    return list
      .slice(0, limit)
      .map((r: Record<string, unknown>) => normalizeIncident(r));
  } catch (error) {
    console.error("Error fetching incidents:", error);
    return [];
  }
};

export const getTeamMembers = async (): Promise<TeamMember[]> => {
  try {
    const response = await axios.get(`${AUTH_API_URL}/users`, {
      headers: {
        Authorization: `Bearer ${getAuthToken()}`,
      },
    });
    const raw = response.data?.data ?? response.data;
    const list = Array.isArray(raw) ? raw : [];
    return list.map((u: Record<string, unknown>) => normalizeUser(u));
  } catch (error) {
    console.error("Error fetching team members:", error);
    return [];
  }
};

function isSiteActive(s: Site): boolean {
  return (
    s.status === "in_progress" ||
    s.status === "planning" ||
    s.status === "on_hold"
  );
}

export const getDashboardStats = async () => {
  try {
    const [sites, projects, urgentTasks, incidents, teamMembers] =
      await Promise.allSettled([
        getSites(),
        getProjects(),
        getUrgentTasks(),
        getRecentIncidents(20),
        getTeamMembers(),
      ]);

    const sitesList = sites.status === "fulfilled" ? sites.value : [];
    const projectsList =
      projects.status === "fulfilled" ? projects.value : [];
    const urgentList =
      urgentTasks.status === "fulfilled" ? urgentTasks.value : [];
    const incidentsList =
      incidents.status === "fulfilled" ? incidents.value : [];
    const membersList =
      teamMembers.status === "fulfilled" ? teamMembers.value : [];

    const sitesBudget = sitesList.reduce((sum, s) => sum + (s.budget || 0), 0);
    const projectsBudget = projectsList.reduce(
      (sum, p) => sum + (p.budget || 0),
      0,
    );

    return {
      sites: sitesList,
      projects: projectsList,
      urgentTasks: urgentList,
      incidents: incidentsList,
      teamMembers: membersList,
      stats: {
        totalSites: sitesList.length,
        activeSites: sitesList.filter(isSiteActive).length,
        totalProjects: projectsList.length,
        activeProjects: projectsList.filter((p) => p.status === "en_cours")
          .length,
        urgentTasks: urgentList.length,
        criticalIncidents: incidentsList.filter(
          (i) => i.severity === "critical" || i.severity === "high",
        ).length,
        totalTeamMembers: membersList.length,
        activeTeamMembers: membersList.filter((m) => m.isActive).length,
        totalBudget: sitesBudget + projectsBudget,
        avgProgress:
          projectsList.length > 0
            ? Math.round(
                projectsList.reduce((sum, p) => sum + (p.progress || 0), 0) /
                  projectsList.length,
              )
            : 0,
      },
    };
  } catch (error) {
    console.error("Error fetching dashboard stats:", error);
    return {
      sites: [],
      projects: [],
      urgentTasks: [],
      incidents: [],
      teamMembers: [],
      stats: {
        totalSites: 0,
        activeSites: 0,
        totalProjects: 0,
        activeProjects: 0,
        urgentTasks: 0,
        criticalIncidents: 0,
        totalTeamMembers: 0,
        activeTeamMembers: 0,
        totalBudget: 0,
        avgProgress: 0,
      },
    };
  }
};
