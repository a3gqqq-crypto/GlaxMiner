import API from "./api";

export async function startMining(telegramId) {
  const res = await fetch(`${API}/mine/start`, {
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

export async function claimMining(telegramId) {
  const res = await fetch(`${API}/mine/claim`, {
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