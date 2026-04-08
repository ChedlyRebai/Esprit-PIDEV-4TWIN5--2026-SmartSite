import { PLANNING_API_URL } from "../lib/planning-api-url";

const getAuthToken = () => {
  return localStorage.getItem("access_token") || "";
};

export interface GanttTask {
  id: string;
  text: string;
  start: Date;
  end: Date;
  progress: number;
  parent?: string | number;
  open?: boolean;
  type?: "task" | "summary" | "project";
  priority?: string;
  assignedUsers?: string;
  description?: string;
}

export interface GanttLink {
  id: string;
  source: string;
  target: string;
  type: string;
}

/**
 * Récupère les tâches pour le Gantt depuis le backend
 */
export const fetchGanttTasks = async (
  projectId: string,
): Promise<GanttTask[]> => {
  const token = getAuthToken();
  const response = await fetch(`${PLANNING_API_URL}/task/gantt/${projectId}`, {
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch Gantt tasks: ${response.statusText}`);
  }

  const data = await response.json();

  // Convertir les strings de dates en Date objects pour le Gantt
  return data.map((task: any) => ({
    ...task,
    start: new Date(task.start),
    end: new Date(task.end),
  }));
};

/**
 * Met à jour les dates d'une tâche (drag & drop dans le Gantt)
 */
export const updateTaskDates = async (
  taskId: string,
  startDate: Date,
  endDate: Date,
): Promise<any> => {
  const token = getAuthToken();
  const response = await fetch(`${PLANNING_API_URL}/task/${taskId}/dates`, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
    }),
  });

  if (!response.ok) {
    throw new Error(`Failed to update task dates: ${response.statusText}`);
  }

  return response.json();
};

/**
 * Met à jour une tâche (titre, description, etc.)
 */
export const updateTask = async (taskId: string, data: any): Promise<any> => {
  const token = getAuthToken();
  const response = await fetch(`${PLANNING_API_URL}/task/${taskId}`, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    throw new Error(`Failed to update task: ${response.statusText}`);
  }

  return response.json();
};

/**
 * Crée une nouvelle tâche
 */
export const createTask = async (
  milestoneId: string,
  taskStageId: string,
  data: any,
): Promise<any> => {
  const token = getAuthToken();
  const response = await fetch(
    `${PLANNING_API_URL}/task/milestone/${milestoneId}/task-stage/${taskStageId}`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    },
  );

  if (!response.ok) {
    throw new Error(`Failed to create task: ${response.statusText}`);
  }

  return response.json();
};

/**
 * Supprime une tâche
 */
export const deleteTask = async (taskId: string): Promise<void> => {
  const token = getAuthToken();
  const response = await fetch(`${PLANNING_API_URL}/task/${taskId}`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to delete task: ${response.statusText}`);
  }
};
