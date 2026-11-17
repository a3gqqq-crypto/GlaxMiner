import { apiFetch } from "./api";

// ==========================================
// START MINING
// ==========================================

export function startMining() {
  return apiFetch("/mine/start", { method: "POST" });
}

// ==========================================
// MINING STATUS (read-only; replaces /mine/sync)
// ==========================================

export function getMiningStatus() {
  return apiFetch("/mine/status");
}

// ==========================================
// CLAIM (only after the full session)
// ==========================================

export function claimMining() {
  return apiFetch("/mine/claim", { method: "POST" });
}
