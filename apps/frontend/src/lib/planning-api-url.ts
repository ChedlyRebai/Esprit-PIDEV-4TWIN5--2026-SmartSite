/**
 * Base URL du microservice **gestion-planing** (Nest, sans préfixe global).
 * Défaut : PORT 3002 → http://localhost:3002
 */
export const PLANNING_API_URL =
  import.meta.env.VITE_PLANNING_URL ?? "http://localhost:3002";
