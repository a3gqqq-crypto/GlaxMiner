import { apiFetch } from "./api";

export function upgradePickaxe() {
  return apiFetch("/upgrade/pickaxe", { method: "POST" });
}
