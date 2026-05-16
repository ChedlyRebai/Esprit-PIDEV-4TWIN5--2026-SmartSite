/**
 * Base URL du microservice *gestion-projects*.
 * - Direct Render : https://smartsite-gestion-projects-latest.onrender.com/projects
 * - Via API Gateway : https://smartsite-api-gateway.onrender.com/projects
 * - Local dev : http://localhost:9001/projects
 */
const raw =
  (import.meta.env.VITE_GESTION_PROJECTS_URL as string | undefined)?.trim() ??
  'https://smartsite-gestion-projects-latest.onrender.com/projects';

// Strip trailing /api if present (gateway doesn't need it)
export const GESTION_PROJECTS_API_URL = raw.replace(/\/api\/?$/, '');
