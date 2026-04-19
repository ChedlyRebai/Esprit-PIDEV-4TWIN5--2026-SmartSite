/**
 * Base URL de l’API **gestion-site** (Nest), avec préfixe `/api`.
 * Défaut backend : PORT=3001 → http://localhost:3001/api
 * (Le port 3002 est utilisé par le service *planning*, pas les chantiers.)
 */
export const GESTION_SITE_API_URL =
  import.meta.env.VITE_GESTION_SITE_URL ?? "http://localhost:3001/api";
