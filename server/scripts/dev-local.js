// LOCAL DEVELOPMENT HARNESS. Never used in production.
//
// Runs the real API (app.js, same routes, auth and economy) against a
// throwaway embedded PostgreSQL, signed with a FAKE test bot token, so the
// frontend can be exercised end to end in a normal browser:
//
//   npm run dev:local            (in server/)
//
// It prints a signed initData for a test player. Put it in app/.env.local:
//   VITE_API_URL=http://127.0.0.1:5050
//   VITE_DEV_INIT_DATA=<printed value>
//
// A separate control port (127.0.0.1:5051, this process only) lets you jump
// the test player's state while designing screens:
//   /finish   - move the current session's start back 5 h so it can be claimed
//   /balance?v=1234.5   - set the test player's balance
//   /level?v=4          - set the pickaxe level
//   /reset              - back to a fresh player
// The database is deleted when the process exits. Production is never touched.
const http = require("http");
const os = require("os");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const TEST_BOT_TOKEN = "123456789:DEV_LOCAL_ONLY_not_a_real_bot_token_x";
const API_PORT = Number(process.env.DEV_API_PORT || 5050);
const CONTROL_PORT = API_PORT + 1;
const PG_PORT = 55432;
const PLAYER = { id: 700000001, first_name: "Rui", username: "dev_prospector" };

function makeInitData(user) {
  const fields = {
    auth_date: String(Math.floor(Date.now() / 1000)),
    query_id: "DEVLOCAL",
    user: JSON.stringify({ ...user, language_code: "en" }),
  };
  const dcs = Object.keys(fields).sort().map((k) => `${k}=${fields[k]}`).join("\n");
  const secret = crypto.createHmac("sha256", "WebAppData").update(TEST_BOT_TOKEN).digest();
  const hash = crypto.createHmac("sha256", secret).update(dcs).digest("hex");
  return new URLSearchParams({ ...fields, hash }).toString();
}

async function main() {
  const EmbeddedPostgres = require("embedded-postgres").default;
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "glx-dev-pg-"));
  const pg = new EmbeddedPostgres({
    databaseDir: dir, user: "postgres", password: "devlocal", port: PG_PORT,
    persistent: false, onLog: () => {}, onError: () => {},
  });
  await pg.initialise();
  await pg.start();
  await pg.createDatabase("glx_dev");

  process.env.DATABASE_URL = `postgresql://postgres:devlocal@127.0.0.1:${PG_PORT}/glx_dev`;
  process.env.DATABASE_SSL = "false";
  process.env.BOT_TOKEN = TEST_BOT_TOKEN;
  process.env.ALLOWED_ORIGINS = [5173, 5174, 5175, 4173]
    .flatMap((p) => [`http://localhost:${p}`, `http://127.0.0.1:${p}`])
    .join(",");

  const pool = require("../config/database");
  const { initDatabase } = require("../db/init");
  await initDatabase();
  // Match the production column type (numeric(20,8)) and add a few
  // leaderboard neighbours so the Ranks screen has realistic shape.
  await pool.query("ALTER TABLE users ALTER COLUMN balance TYPE numeric(20,8)");
  const seed = [["orion", 18450, 8], ["vexa", 12890.5, 7], ["nadir", 9120, 6], ["astra_77", 5400, 5],
    ["halcyon", 2310, 4], ["drillbit", 1290, 3], ["quarry", 640, 2], ["", 300, 1]];
  for (const [i, [u, b, l]] of seed.entries()) {
    await pool.query("INSERT INTO users (telegram_id, username, balance, pickaxe_level) VALUES ($1,$2,$3,$4)", [800000000 + i, u, b, l]);
  }

  const { createApp } = require("../app");
  createApp().listen(API_PORT, "127.0.0.1", () => {
    console.log(`\nDEV API (fake token, throwaway DB): http://127.0.0.1:${API_PORT}`);
    console.log(`Control: http://127.0.0.1:${CONTROL_PORT}/finish | /balance?v= | /level?v= | /reset`);
    console.log(`\nVITE_API_URL=http://127.0.0.1:${API_PORT}`);
    console.log(`VITE_DEV_INIT_DATA=${makeInitData(PLAYER)}\n`);
  });

  http.createServer(async (req, res) => {
    const u = new URL(req.url, "http://x");
    const v = u.searchParams.get("v");
    let sql = null, args = [PLAYER.id];
    if (u.pathname === "/finish") sql = "UPDATE users SET mining_start = mining_start - 18000000 WHERE telegram_id=$1 AND mining";
    if (u.pathname === "/balance") { sql = "UPDATE users SET balance=$2 WHERE telegram_id=$1"; args.push(Number(v)); }
    if (u.pathname === "/level") { sql = "UPDATE users SET pickaxe_level=$2 WHERE telegram_id=$1"; args.push(Number(v)); }
    if (u.pathname === "/reset") sql = "UPDATE users SET balance=0, pickaxe_level=1, mining=false, mining_start=0 WHERE telegram_id=$1";
    res.setHeader("Access-Control-Allow-Origin", "*");
    if (!sql) { res.statusCode = 404; return res.end("unknown"); }
    const r = await pool.query(sql, args);
    res.end(JSON.stringify({ ok: true, rows: r.rowCount }));
  }).listen(CONTROL_PORT, "127.0.0.1");

  const stop = async () => { await pg.stop().catch(() => {}); process.exit(0); };
  process.on("SIGINT", stop);
  process.on("SIGTERM", stop);
}

main().catch((e) => { console.error(e); process.exit(1); });
