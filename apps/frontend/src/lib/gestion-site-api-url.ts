/**
 * Base URL de l'API **gestion-site**.
 * - Direct Render : https://smartsite-gestion-site.onrender.com/api
 * - Via API Gateway : https://smartsite-api-gateway.onrender.com/sites
 * - Local dev : http://localhost:3001/api
 *
 * site.action.ts appends /gestion-sites to this base URL.
 */
export const GESTION_SITE_API_URL =
  (import.meta.env.VITE_GESTION_SITE_URL as string | undefined)?.trim() ??
  'https://smartsite-gestion-site.onrender.com/api';
