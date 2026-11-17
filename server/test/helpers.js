// Test helpers: embedded Postgres and signed Telegram initData.
const crypto = require("crypto");
const os = require("os");
const path = require("path");
const fs = require("fs");

const TEST_BOT_TOKEN = "123456789:TEST_ONLY_TOKEN_not_a_real_bot_token";
const PG_PORT = 54000 + Math.floor(Math.random() * 900);

let pg;

async function startDatabase() {
  const EmbeddedPostgres = require("embedded-postgres").default;

  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "glx-test-pg-"));

  pg = new EmbeddedPostgres({
    databaseDir: dir,
    user: "postgres",
    password: "test",
    port: PG_PORT,
    persistent: false,
    onLog: () => {},
    onError: () => {},
  });

  await pg.initialise();
  await pg.start();
  await pg.createDatabase("glx_test");

  process.env.DATABASE_URL = `postgresql://postgres:test@127.0.0.1:${PG_PORT}/glx_test`;
  process.env.DATABASE_SSL = "false";
  process.env.BOT_TOKEN = TEST_BOT_TOKEN;
}

async function stopDatabase() {
  if (pg) await pg.stop();
}

// Build initData exactly as Telegram does, signed with `botToken`.
function makeInitData(userId, opts = {}) {
  const botToken = opts.botToken || TEST_BOT_TOKEN;
  const authDate = opts.authDate ?? Math.floor(Date.now() / 1000);

  const fields = {
    auth_date: String(authDate),
    query_id: "AAHdF6IQAAAAAN0XohDhrOrc",
    user: JSON.stringify({
      id: userId,
      first_name: "Test",
      username: opts.username || `user${userId}`,
      language_code: "en",
    }),
    ...(opts.extra || {}),
  };

  const dcs = Object.keys(fields)
    .sort()
    .map((k) => `${k}=${fields[k]}`)
    .join("\n");

  const secret = crypto
    .createHmac("sha256", "WebAppData")
    .update(botToken)
    .digest();

  const hash = crypto.createHmac("sha256", secret).update(dcs).digest("hex");

  return new URLSearchParams({ ...fields, hash }).toString();
}

async function startServer(app) {
  return new Promise((resolve) => {
    const server = app.listen(0, "127.0.0.1", () => {
      const { port } = server.address();
      resolve({ server, base: `http://127.0.0.1:${port}` });
    });
  });
}

function client(base) {
  return async function call(method, url, { userId, initData, body, headers = {} } = {}) {
    const h = { ...headers };

    if (initData !== undefined) {
      h.Authorization = `tma ${initData}`;
    } else if (userId !== undefined) {
      h.Authorization = `tma ${makeInitData(userId)}`;
    }

    if (body !== undefined) h["Content-Type"] = "application/json";

    const res = await fetch(base + url, {
      method,
      headers: h,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });

    let json = null;
    try {
      json = await res.json();
    } catch {
      /* non-JSON */
    }

    return { status: res.status, body: json };
  };
}

module.exports = {
  TEST_BOT_TOKEN,
  startDatabase,
  stopDatabase,
  makeInitData,
  startServer,
  client,
};
