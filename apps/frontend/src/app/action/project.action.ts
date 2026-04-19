import axios from "axios";

const api = axios.create({
  baseURL: "http://localhost:3002", // Port pour le service de gestion des projets
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

// Types pour les projets
export interface Project {
  _id: string;
  name: string;
  description: string;
  status: 'en_cours' | 'terminé' | 'en_retard';
  progress: number;
  priority: 'urgent' | 'high' | 'medium' | 'low';
  deadline: string;
  assignedTo: string;
  assignedToName: string;
  assignedToRole: string;
  tasks: Task[];
  createdAt: string;
  projectManagerName: string;
  updatedAt: string;
}

export interface Task {
  _id: string;
  title: string;
  status: 'en_cours' | 'terminé' | 'en_retard';
  priority: 'urgent' | 'high' | 'medium' | 'low';
  deadline: string;
  projectId: string;
  createdAt: string;
  updatedAt: string;
}

export interface ProjectStats {
  total: number;
  en_cours: number;
  terminé: number;
  en_retard: number;
  urgent_tasks: number;
}

// API Projects
export const getAllProjects = async (): Promise<Project[]> => {
  try {
    const response = await api.get("/projects");
    return response.data;
  } catch (error) {
    console.error("Error fetching projects:", error);
    throw error;
  }
};

export const getProjectById = async (id: string): Promise<Project> => {
  try {
    const response = await api.get(`/projects/${id}`);
    return response.data;
  } catch (error) {
    console.error("Error fetching project:", error);
    throw error;
  }
};

export const getProjectsByManager = async (managerId: string): Promise<Project[]> => {
  try {
    const response = await api.get(`/projects/manager/${managerId}`);
    return response.data;
  } catch (error) {
    console.error("Error fetching projects by manager:", error);
    throw error;
  }
};

export const getAllProjectsForSuperAdmin = async (): Promise<Project[]> => {
  try {
    const response = await api.get("/projects/all"); // Endpoint spécial pour super admin
    return response.data;
  } catch (error) {
    console.error("Error fetching all projects for super admin:", error);
    throw error;
  }
};

export const getProjectStats = async (): Promise<ProjectStats> => {
  try {
    const response = await api.get("/projects/stats");
    return response.data;
  } catch (error) {
    console.error("Error fetching project stats:", error);
    throw error;
  }
};

export const getUrgentTasks = async (): Promise<Task[]> => {
  try {
    const response = await api.get("/tasks/urgent");
    return response.data;
  } catch (error) {
    console.error("Error fetching urgent tasks:", error);
    throw error;
  }
};

export const createProject = async (projectData: Partial<Project>): Promise<Project> => {
  try {
    const response = await api.post("/projects", projectData);
    return response.data;
  } catch (error) {
    console.error("Error creating project:", error);
    throw error;
  }
};

export const updateProject = async (id: string, projectData: Partial<Project>): Promise<Project> => {
  try {
    const response = await api.put(`/projects/${id}`, projectData);
    return response.data;
  } catch (error) {
    console.error("Error updating project:", error);
    throw error;
  }
};

export const deleteProject = async (id: string): Promise<void> => {
  try {
    await api.delete(`/projects/${id}`);
  } catch (error) {
    console.error("Error deleting project:", error);
    throw error;
  }
};
