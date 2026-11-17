import { apiFetch } from "./api";

// The server identifies the user from the signed initData header.
export function login() {
  return apiFetch("/user/login", { method: "POST" });
}

export function loadUser() {
  return apiFetch("/user/me");
}

export function loadLeaderboard() {
  return apiFetch("/user/leaderboard");
}
