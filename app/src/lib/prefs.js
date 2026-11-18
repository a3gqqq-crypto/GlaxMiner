// Per-device display preferences. Not game state: nothing here affects
// balances or mining, and losing it (private mode, cleared storage) is harmless.
const KEY = "glx.prefs.v1";
const listeners = new Set();

function read() {
  try {
    return JSON.parse(localStorage.getItem(KEY) || "{}") || {};
  } catch {
    return {};
  }
}

let cache = read();

export function getPref(name) {
  return cache[name];
}

export function setPref(name, value) {
  cache = { ...cache, [name]: value };
  try {
    localStorage.setItem(KEY, JSON.stringify(cache));
  } catch {
    /* storage unavailable: keep it for this visit only */
  }
  listeners.forEach((l) => l(cache));
}

export function subscribePrefs(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

export function prefersReducedMotion() {
  if (getPref("motion") === "reduced") return true;
  if (getPref("motion") === "full") return false;
  try {
    return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  } catch {
    return false;
  }
}
