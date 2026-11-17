const API =
  import.meta.env.VITE_API_URL ||
  "https://glaxminer-production.up.railway.app";

// Signed Telegram WebApp initData. The server verifies it and derives the
// user from it; the client never sends its own Telegram ID.
//
// Local development only: outside Telegram you may set VITE_DEV_INIT_DATA in
// app/.env.local to a real initData string from a test bot. The server still
// verifies its signature. Production builds drop this branch entirely.
export function getInitData() {
  const fromTelegram = window.Telegram?.WebApp?.initData;
  if (fromTelegram) return fromTelegram;

  if (import.meta.env.DEV) {
    return import.meta.env.VITE_DEV_INIT_DATA || "";
  }

  return "";
}

export async function apiFetch(path, { method = "GET", body } = {}) {
  const headers = {};

  const initData = getInitData();
  if (initData) {
    headers.Authorization = `tma ${initData}`;
  }

  if (body !== undefined) {
    headers["Content-Type"] = "application/json";
  }

  const res = await fetch(`${API}${path}`, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  try {
    return await res.json();
  } catch {
    return {
      success: false,
      status: res.status,
      message: `Request failed (${res.status})`,
    };
  }
}

export default API;
