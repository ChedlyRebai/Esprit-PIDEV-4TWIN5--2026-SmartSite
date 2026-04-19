/**
 * Base URL de l’API **user-authentication** (Nest).
 * Doit correspondre à `PORT` dans le backend (défaut **3000**).
 * Le navigateur charge l’UI sur Vite (**5173**) ; les appels API restent sur ce port.
 */
export const AUTH_API_URL =
  import.meta.env.VITE_AUTH_API_URL ?? "http://localhost:3000";
