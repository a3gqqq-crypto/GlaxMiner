import API from "./api";

export async function upgradePickaxe(telegramId) {
  const res = await fetch(`${API}/upgrade/pickaxe`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      telegramId,
    }),
  });

  return res.json();
}