import API from "./api";

// ===============================
// START MINING
// ===============================
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

// ===============================
// SYNC MINING
// ===============================
export async function syncMining(telegramId) {
  const res = await fetch(`${API}/mine/sync`, {
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

// ===============================
// CLAIM
// ===============================
// Kept for compatibility with old frontend code.
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