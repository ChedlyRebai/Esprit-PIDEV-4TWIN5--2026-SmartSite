/**
 * Base URL du microservice **gestion-projects** (Nest, sans préfixe global).
 * Défaut : PORT 3010 → http://localhost:3010
 */
export const GESTION_PROJECTS_API_URL =
  import.meta.env.VITE_GESTION_PROJECTS_URL ?? "http://localhost:3010";