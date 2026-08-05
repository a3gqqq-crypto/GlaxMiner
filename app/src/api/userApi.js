import API from "./api";

export async function login(telegramId, username) {
  const res = await fetch(`${API}/user/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      telegramId,
      username,
    }),
  });

  return res.json();
}

export async function loadUser(telegramId) {
  const res = await fetch(`${API}/user/${telegramId}`);
  return res.json();
}

export async function addBalance(telegramId, amount) {
  const res = await fetch(`${API}/user/addBalance`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      telegramId,
      amount,
    }),
  });

  return res.json();
}