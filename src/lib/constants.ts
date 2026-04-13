export const API_URL = process.env.NEXT_PUBLIC_API_URL || "https://api.koovis.ai";
export const API_BASE = `${API_URL}/api`;

export const STORAGE_KEYS = {
  TOKEN: "koovis_pa_token",
  SESSION_ID: "koovis_pa_session_id",
  THEME: "koovis_pa_theme",
} as const;

export const ROUTES = {
  HOME: "/",
  LOGIN: "/login",
  CHAT: "/chat",
} as const;
