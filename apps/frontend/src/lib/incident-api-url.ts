/**
 * Base URL du microservice **incident-management** (Nest).
 * Défaut : PORT 3003 → http://localhost:3003
 */
export const INCIDENT_API_URL =
  import.meta.env.VITE_INCIDENT_URL ?? "http://localhost:3003";
