const PRODUCTION_API = "https://glaxminer-production.up.railway.app";
const PRODUCTION_HOST = "glax-miner.vercel.app";

// Where the API lives:
// - VITE_API_URL when set (local development)
// - production app: the Railway API directly (its CORS allows only this origin)
// - Vercel preview builds: "/api" on the same site, which vercel.json proxies
//   to the same Railway API, so previews work without widening production CORS
function apiBase() {
  if (import.meta.env.VITE_API_URL) return import.meta.env.VITE_API_URL;
  const host = typeof location !== "undefined" ? location.hostname : "";
  if (host.endsWith(".vercel.app") && host !== PRODUCTION_HOST) return "/api";
  return PRODUCTION_API;
}

const API = apiBase();

// Signed Telegram WebApp initData. The server verifies it and derives the
// user from it; the client never sends its own Telegram ID.
//
// Local development only: outside Telegram you may set VITE_DEV_INIT_DATA in
// app/.env.local (see server/scripts/dev-local.js). The server still verifies
// its signature. Production builds drop this branch entirely.
export function getInitData() {
  const fromTelegram = window.Telegram?.WebApp?.initData;
  if (fromTelegram) return fromTelegram;

  if (import.meta.env.DEV) {
    return import.meta.env.VITE_DEV_INIT_DATA || "";
  }

  return "";
}

export class ApiError extends Error {
  constructor(message, status) {
    super(message);
    this.status = status;
  }
}

// Returns the JSON body. Network failures throw ApiError(status 0) so the UI
// can tell "offline" apart from a rule the server refused.
export async function apiFetch(path, { method = "GET", body } = {}) {
  const headers = {};

  const initData = getInitData();
  if (initData) {
    headers.Authorization = `tma ${initData}`;
  }

  if (body !== undefined) {
    headers["Content-Type"] = "application/json";
  }

  let res;
  try {
    res = await fetch(`${API}${path}`, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new ApiError("Can't reach the GlaxMiner servers. Check your connection.", 0);
  }

  let data;
  try {
    data = await res.json();
  } catch {
    data = { success: false, message: `Request failed (${res.status})` };
  }
  if (res.status === 429) {
    data = { success: false, message: "Too many requests. Give it a few seconds." };
  }
  return { status: res.status, ...data };
}

export default API;
