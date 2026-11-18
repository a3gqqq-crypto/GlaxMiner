// Phase 0 (v2) tests: security fixes on top of the original 92c29f4 economy.
// Runs the real Express app against an embedded PostgreSQL.
const { describe, it, before, after } = require("node:test");
const assert = require("node:assert/strict");
const { execFileSync } = require("node:child_process");
const fs = require("node:fs");
const path = require("node:path");

const h = require("./helpers");

const HOUR_MS = 3600 * 1000;
const REWARDS = [100, 125, 155, 190, 230, 280, 340, 420, 520, 650];
const COSTS = [0, 500, 1200, 2500, 5000, 10000, 18000, 30000, 50000, 80000];

let pool;
let server;
let call;
let initDatabase;
let createApp;

async function login(id) {
  const r = await call("POST", "/user/login", { userId: id });
  assert.equal(r.status, 200);
  assert.equal(r.body.success, true);
  return r.body.user;
}

async function setUser(id, fields) {
  const keys = Object.keys(fields);
  const sets = keys.map((k, i) => `${k} = $${i + 2}`).join(", ");
  await pool.query(
    `UPDATE users SET ${sets} WHERE telegram_id = $1`,
    [id, ...keys.map((k) => fields[k])]
  );
}

async function getUser(id) {
  const r = await pool.query("SELECT * FROM users WHERE telegram_id = $1", [id]);
  return r.rows[0];
}

before(async () => {
  await h.startDatabase();
  pool = require("../config/database");
  ({ initDatabase } = require("../db/init"));
  ({ createApp } = require("../app"));
  await initDatabase();

  // generous limits for the functional tests; rate limiting is tested separately
  const app = createApp({
    rateLimits: {
      perIp: { windowMs: 60_000, max: 100_000 },
      perUser: { windowMs: 60_000, max: 100_000 },
      actions: { windowMs: 60_000, max: 100_000 },
    },
  });
  const started = await h.startServer(app);
  server = started.server;
  call = h.client(started.base);
});

after(async () => {
  server?.close();
  await pool?.end();
  await h.stopDatabase();
});

// ------------------------------------------------------------------
describe("economy is the original 92c29f4 configuration", () => {
  it("server/config/mining.js is byte-identical to 92c29f4", () => {
    const original = execFileSync(
      "git",
      ["show", "92c29f4:server/config/mining.js"],
      { cwd: path.join(__dirname, ".."), encoding: "utf8" }
    );
    const current = fs.readFileSync(
      path.join(__dirname, "..", "config", "mining.js"),
      "utf8"
    );
    assert.equal(current.replace(/\r\n/g, "\n"), original.replace(/\r\n/g, "\n"));
  });

  it("5 h duration, level rewards and upgrade costs", () => {
    const { MINING_DURATION, MINING_POWER } = require("../config/mining");
    assert.equal(MINING_DURATION, 5 * 60 * 60);
    for (let level = 1; level <= 10; level++) {
      assert.equal(MINING_POWER[level].reward, REWARDS[level - 1], `reward L${level}`);
      assert.equal(MINING_POWER[level].upgradeCost, COSTS[level - 1], `cost L${level}`);
    }
    assert.equal(MINING_POWER[11], undefined);
  });

  it("the frontend's displayed table matches the server", () => {
    const src = fs.readFileSync(
      path.join(__dirname, "..", "..", "app", "src", "data", "economy.js"),
      "utf8"
    );
    assert.match(src, /MINING_DURATION = 5 \* 60 \* 60/);
    const rewards = [...src.matchAll(/reward:\s*(\d+)/g)].map((m) => Number(m[1]));
    const costs = [...src.matchAll(/upgradeCost:\s*(\d+)/g)].map((m) => Number(m[1]));
    assert.deepEqual(rewards, REWARDS);
    assert.deepEqual(costs, COSTS);
  });

  it("no 8 h / 5 GLX configuration anywhere in server or app source", () => {
    const files = execFileSync("git", ["ls-files", "server", "app/src"], {
      cwd: path.join(__dirname, "..", ".."),
      encoding: "utf8",
    })
      .split("\n")
      .filter((f) => /\.(js|jsx)$/.test(f) && !f.includes("/test/"));
    for (const f of files) {
      const text = fs.readFileSync(path.join(__dirname, "..", "..", f), "utf8");
      assert.doesNotMatch(text, /8 \* 60 \* 60/, f);
      assert.doesNotMatch(text, /MINING_REWARD = 5\b/, f);
    }
  });
});

// ------------------------------------------------------------------
describe("authentication", () => {
  const routes = [
    ["POST", "/user/login"],
    ["GET", "/user/me"],
    ["GET", "/user/leaderboard"],
    ["GET", "/user/1"],
    ["POST", "/mine/start"],
    ["GET", "/mine/status"],
    ["POST", "/mine/claim"],
    ["POST", "/upgrade/pickaxe"],
  ];

  for (const [method, url] of routes) {
    it(`${method} ${url} without initData -> 401`, async () => {
      const r = await call(method, url, { body: method === "POST" ? { telegramId: 1 } : undefined });
      assert.equal(r.status, 401);
    });
  }

  it("forged signature -> 401", async () => {
    const forged = h.makeInitData(7001, { botToken: "999:not-the-real-token" });
    const r = await call("POST", "/user/login", { initData: forged });
    assert.equal(r.status, 401);
  });

  it("tampered user id -> 401", async () => {
    const good = new URLSearchParams(h.makeInitData(7002));
    good.set("user", JSON.stringify({ id: 1, first_name: "x" }));
    const r = await call("POST", "/user/login", { initData: good.toString() });
    assert.equal(r.status, 401);
  });

  it("expired initData (older than 24 h) -> 401", async () => {
    const old = h.makeInitData(7003, { authDate: Math.floor(Date.now() / 1000) - 90_000 });
    const r = await call("GET", "/user/me", { initData: old });
    assert.equal(r.status, 401);
  });

  it("health check stays public", async () => {
    const r = await fetch(server.address() && `http://127.0.0.1:${server.address().port}/`);
    assert.equal(r.status, 200);
  });
});

// ------------------------------------------------------------------
describe("identity and removed endpoints", () => {
  it("login ignores a telegramId in the body", async () => {
    const r = await call("POST", "/user/login", { userId: 8001, body: { telegramId: 8999 } });
    assert.equal(String(r.body.user.telegram_id), "8001");
    assert.equal(await getUser(8999), undefined);
  });

  it("login never modifies an existing account", async () => {
    await login(8002);
    await setUser(8002, { balance: 4321, pickaxe_level: 4, username: "kept" });
    const r = await call("POST", "/user/login", { userId: 8002 });
    assert.equal(Number(r.body.user.balance), 4321);
    assert.equal(r.body.user.pickaxe_level, 4);
    assert.equal(r.body.user.username, "kept");
  });

  it("concurrent first logins create exactly one row", async () => {
    await Promise.all(Array.from({ length: 20 }, () => call("POST", "/user/login", { userId: 8003 })));
    const r = await pool.query("SELECT count(*)::int AS n FROM users WHERE telegram_id = 8003");
    assert.equal(r.rows[0].n, 1);
  });

  it("reading another user's record -> 403", async () => {
    await login(8004);
    await login(8005);
    const r = await call("GET", "/user/8005", { userId: 8004 });
    assert.equal(r.status, 403);
    const own = await call("GET", "/user/8004", { userId: 8004 });
    assert.equal(own.status, 200);
  });

  it("POST /user/addBalance no longer exists", async () => {
    await login(8006);
    const r = await call("POST", "/user/addBalance", {
      userId: 8006,
      body: { telegramId: 8006, amount: 1_000_000 },
    });
    assert.equal(r.status, 404);
    assert.equal(Number((await getUser(8006)).balance), 0);
  });

  it("leaderboard exposes no Telegram IDs", async () => {
    const r = await call("GET", "/user/leaderboard", { userId: 8006 });
    assert.equal(r.status, 200);
    assert.ok(r.body.users.length > 0);
    for (const u of r.body.users) {
      assert.deepEqual(Object.keys(u).sort(), ["balance", "pickaxe_level", "username"]);
    }
  });
});

// ------------------------------------------------------------------
describe("mining: 5 h enforced server-side, one claim per session", () => {
  it("claim right after start is refused; balance unchanged", async () => {
    await login(9001);
    const s = await call("POST", "/mine/start", { userId: 9001 });
    assert.equal(s.body.success, true);
    assert.equal(s.body.duration, 18000);
    const c = await call("POST", "/mine/claim", { userId: 9001 });
    assert.equal(c.body.success, false);
    assert.equal(c.body.message, "Mining session not finished");
    assert.ok(c.body.timeLeft > 17990);
    assert.equal(Number((await getUser(9001)).balance), 0);
  });

  it("claim without a session is refused", async () => {
    await login(9002);
    const c = await call("POST", "/mine/claim", { userId: 9002 });
    assert.equal(c.body.message, "No active mining session");
  });

  it("refused 5 s before the end, paid just after it", async () => {
    await login(9003);
    await setUser(9003, { mining: true, mining_start: Date.now() - 5 * HOUR_MS + 5000 });
    const early = await call("POST", "/mine/claim", { userId: 9003 });
    assert.equal(early.body.success, false);

    await setUser(9003, { mining_start: Date.now() - 5 * HOUR_MS - 1000 });
    const ok = await call("POST", "/mine/claim", { userId: 9003 });
    assert.equal(ok.body.success, true);
    assert.equal(ok.body.reward, 100);
    assert.equal(ok.body.balance, 100);
    const u = await getUser(9003);
    assert.equal(u.mining, false);
    assert.equal(Number(u.mining_start), 0);
  });

  it("reward depends on pickaxe level (all 10 levels)", async () => {
    await login(9004);
    let expected = 0;
    for (let level = 1; level <= 10; level++) {
      await setUser(9004, {
        pickaxe_level: level,
        mining: true,
        mining_start: Date.now() - 5 * HOUR_MS - 1000,
      });
      const c = await call("POST", "/mine/claim", { userId: 9004 });
      expected += REWARDS[level - 1];
      assert.equal(c.body.reward, REWARDS[level - 1], `level ${level}`);
      assert.equal(c.body.balance, expected);
    }
  });

  it("50 parallel claims of one finished session pay exactly once", async () => {
    await login(9005);
    await setUser(9005, {
      balance: 7,
      pickaxe_level: 3,
      mining: true,
      mining_start: Date.now() - 6 * HOUR_MS,
    });
    const results = await Promise.all(
      Array.from({ length: 50 }, () => call("POST", "/mine/claim", { userId: 9005 }))
    );
    assert.equal(results.filter((r) => r.body.success).length, 1);
    assert.equal(Number((await getUser(9005)).balance), 7 + 155);
  });

  it("20 parallel starts: exactly one starts the session", async () => {
    await login(9006);
    const results = await Promise.all(
      Array.from({ length: 20 }, () => call("POST", "/mine/start", { userId: 9006 }))
    );
    assert.equal(results.filter((r) => r.body.success).length, 1);
    assert.equal(results.filter((r) => r.body.message === "Already mining").length, 19);
  });

  it("a new session after claiming needs the full 5 h again", async () => {
    await login(9007);
    await setUser(9007, { mining: true, mining_start: Date.now() - 5 * HOUR_MS - 1000 });
    assert.equal((await call("POST", "/mine/claim", { userId: 9007 })).body.success, true);
    assert.equal((await call("POST", "/mine/start", { userId: 9007 })).body.success, true);
    const again = await call("POST", "/mine/claim", { userId: 9007 });
    assert.equal(again.body.success, false);
    assert.equal(Number((await getUser(9007)).balance), 100);
  });

  it("client-sent reward, startTime or telegramId are ignored", async () => {
    await login(9008);
    await login(9009);
    await call("POST", "/mine/start", {
      userId: 9008,
      body: { telegramId: 9009, startTime: 0, mining_start: 0 },
    });
    const u = await getUser(9008);
    assert.ok(Number(u.mining_start) > Date.now() - 60_000);
    assert.equal((await getUser(9009)).mining, false);
    const c = await call("POST", "/mine/claim", {
      userId: 9008,
      body: { reward: 999999, telegramId: 9009 },
    });
    assert.equal(c.body.success, false);
    assert.equal(Number((await getUser(9008)).balance), 0);
  });

  it("status is read-only and reports server values", async () => {
    await login(9010);
    await setUser(9010, { pickaxe_level: 5, balance: 42 });
    let st = await call("GET", "/mine/status", { userId: 9010 });
    assert.equal(st.body.duration, 18000);
    assert.equal(st.body.reward, 230);
    assert.equal(st.body.mining, false);
    assert.equal(st.body.canClaim, false);

    await setUser(9010, { mining: true, mining_start: Date.now() - 6 * HOUR_MS });
    for (let i = 0; i < 10; i++) {
      st = await call("GET", "/mine/status", { userId: 9010 });
    }
    assert.equal(st.body.canClaim, true);
    assert.equal(st.body.timeLeft, 0);
    assert.equal(Number((await getUser(9010)).balance), 42);
  });

  it("/mine/sync (never deployed) does not credit anything", async () => {
    await login(9011);
    await setUser(9011, { mining: true, mining_start: Date.now() - 6 * HOUR_MS });
    const r = await call("POST", "/mine/sync", { userId: 9011 });
    assert.equal(r.status, 404);
    assert.equal(Number((await getUser(9011)).balance), 0);
  });
});

// ------------------------------------------------------------------
describe("concurrent sync/status traffic during a finished session", () => {
  it("50 simultaneous sync/status calls credit nothing; one claim pays once", async () => {
    await login(9020);
    await setUser(9020, {
      balance: 10,
      pickaxe_level: 2,
      mining: true,
      mining_start: Date.now() - 6 * HOUR_MS,
    });
    const traffic = await Promise.all(
      Array.from({ length: 50 }, (_, i) =>
        i % 2
          ? call("POST", "/mine/sync", { userId: 9020 })
          : call("GET", "/mine/status", { userId: 9020 })
      )
    );
    assert.ok(traffic.every((r) => r.status === 200 || r.status === 404));
    assert.equal(Number((await getUser(9020)).balance), 10);

    const mixed = await Promise.all([
      ...Array.from({ length: 25 }, () => call("POST", "/mine/claim", { userId: 9020 })),
      ...Array.from({ length: 25 }, () => call("GET", "/mine/status", { userId: 9020 })),
    ]);
    const claims = mixed.slice(0, 25);
    assert.equal(claims.filter((r) => r.body.success).length, 1);
    assert.equal(claims.find((r) => r.body.success).body.reward, 125);
    assert.equal(Number((await getUser(9020)).balance), 10 + 125);
  });
});

// ------------------------------------------------------------------
describe("deposits are disabled", () => {
  const depositPaths = [
    ["POST", "/wallet/deposit/usdt"],
    ["POST", "/wallet/deposit/bnb"],
    ["GET", "/wallet/balance/9030"],
    ["POST", "/upgrade/wallet"],
    ["POST", "/upgrade/wallet/deposit"],
    ["POST", "/upgrade/wallet/history"],
    ["POST", "/upgrade/auto-miner/buy"],
  ];

  for (const [method, url] of depositPaths) {
    it(`${method} ${url} -> 503 unavailable (with or without auth)`, async () => {
      for (const userId of [undefined, 9030]) {
        const r = await call(method, url, {
          userId,
          body: method === "POST" ? { txHash: "0x" + "ab".repeat(32), telegramId: 9030 } : undefined,
        });
        assert.equal(r.status, 503);
        assert.equal(r.body.message, "Deposits are unavailable");
      }
    });
  }

  it("the same tx hash replayed across every endpoint and user credits nothing", async () => {
    await login(9031);
    await login(9032);
    const hash = "0x" + "cd".repeat(32);
    await Promise.all(
      [9031, 9032].flatMap((userId) =>
        depositPaths
          .filter(([m]) => m === "POST")
          .flatMap(([, url]) => [hash, hash.toUpperCase().replace("0X", "0x")].map((txHash) =>
            call("POST", url, { userId, body: { txHash, telegramId: 9031 } })
          ))
      )
    );
    for (const id of [9031, 9032]) {
      const u = await getUser(id);
      assert.equal(Number(u.balance), 0);
      assert.equal(u.pickaxe_level, 1);
    }
    const t = await pool.query(
      "SELECT table_name FROM information_schema.tables WHERE table_schema='public'"
    );
    assert.deepEqual(t.rows.map((r) => r.table_name), ["users"]);
  });
});

// ------------------------------------------------------------------
describe("frontend and server routes match", () => {
  it("every apiFetch path in app/src/api exists on the server", async () => {
    const dir = path.join(__dirname, "..", "..", "app", "src", "api");
    const calls = [];
    for (const f of fs.readdirSync(dir)) {
      const src = fs.readFileSync(path.join(dir, f), "utf8");
      for (const m of src.matchAll(/apiFetch\("([^"]+)"(?:,\s*\{\s*method:\s*"(\w+)")?/g)) {
        calls.push([m[2] || "GET", m[1]]);
      }
    }
    assert.ok(calls.length >= 7, `found ${calls.length} calls`);
    await login(9040);
    for (const [method, url] of calls) {
      const r = await call(method, url, { userId: 9040 });
      assert.notEqual(r.status, 404, `${method} ${url}`);
      assert.ok(r.body && typeof r.body.success === "boolean", `${method} ${url}`);
    }
  });

  it("no frontend source calls localhost, addBalance, deposits or a body telegramId", () => {
    const root = path.join(__dirname, "..", "..", "app", "src");
    const files = execFileSync("git", ["ls-files", "app/src"], {
      cwd: path.join(__dirname, "..", ".."),
      encoding: "utf8",
    })
      .split("\n")
      .filter((f) => /\.(js|jsx)$/.test(f));
    // every source file in the shipped app, whatever folder it lives in
    assert.ok(files.length >= 15, `found ${files.length} app files`);
    for (const f of files) {
      const text = fs.readFileSync(path.join(root, "..", "..", f), "utf8");
      assert.doesNotMatch(text, /localhost:\d+/, f);
      assert.doesNotMatch(text, /addBalance/, f);
      assert.doesNotMatch(text, /\/wallet\/|deposit\//i, f);
      assert.doesNotMatch(text, /JSON\.stringify\(\{\s*telegramId/, f);
      assert.doesNotMatch(text, /telegramId\s*=\s*1\b/, f);
    }
  });
});

// ------------------------------------------------------------------
describe("pickaxe upgrade: original costs, authenticated, atomic", () => {
  it("each level costs exactly the original amount", async () => {
    await login(9101);
    for (let level = 1; level < 10; level++) {
      const cost = COSTS[level];
      await setUser(9101, { pickaxe_level: level, balance: cost + 3 });
      const r = await call("POST", "/upgrade/pickaxe", { userId: 9101 });
      assert.equal(r.body.success, true, `level ${level}`);
      assert.equal(r.body.pickaxeLevel, level + 1);
      assert.equal(r.body.balance, 3);
    }
  });

  it("not enough GLX: refused, nothing changes", async () => {
    await login(9102);
    await setUser(9102, { pickaxe_level: 1, balance: 499 });
    const r = await call("POST", "/upgrade/pickaxe", { userId: 9102 });
    assert.equal(r.body.message, "Not enough GLX");
    const u = await getUser(9102);
    assert.equal(u.pickaxe_level, 1);
    assert.equal(Number(u.balance), 499);
  });

  it("level 10 is the maximum", async () => {
    await login(9103);
    await setUser(9103, { pickaxe_level: 10, balance: 1_000_000 });
    const r = await call("POST", "/upgrade/pickaxe", { userId: 9103 });
    assert.equal(r.body.message, "Maximum level reached");
    assert.equal(Number((await getUser(9103)).balance), 1_000_000);
  });

  it("parallel upgrades never double-spend (only one affordable)", async () => {
    await login(9104);
    await setUser(9104, { pickaxe_level: 1, balance: 500 + 1200 - 1 });
    const results = await Promise.all(
      Array.from({ length: 20 }, () => call("POST", "/upgrade/pickaxe", { userId: 9104 }))
    );
    assert.equal(results.filter((r) => r.body.success).length, 1);
    const u = await getUser(9104);
    assert.equal(u.pickaxe_level, 2);
    assert.equal(Number(u.balance), 1199);
  });

  it("parallel upgrades with plenty of GLX charge each level exactly once", async () => {
    await login(9105);
    await setUser(9105, { pickaxe_level: 1, balance: 1_000_000 });
    const results = await Promise.all(
      Array.from({ length: 30 }, () => call("POST", "/upgrade/pickaxe", { userId: 9105 }))
    );
    assert.equal(results.filter((r) => r.body.success).length, 9);
    const u = await getUser(9105);
    assert.equal(u.pickaxe_level, 10);
    const spent = COSTS.slice(1).reduce((a, b) => a + b, 0);
    assert.equal(spent, 197_200);
    assert.equal(Number(u.balance), 1_000_000 - spent);
  });

  it("a body telegramId cannot upgrade someone else", async () => {
    await login(9106);
    await login(9107);
    await setUser(9107, { balance: 10_000 });
    await call("POST", "/upgrade/pickaxe", { userId: 9106, body: { telegramId: 9107 } });
    const victim = await getUser(9107);
    assert.equal(victim.pickaxe_level, 1);
    assert.equal(Number(victim.balance), 10_000);
  });
});

// ------------------------------------------------------------------
describe("existing data is preserved", () => {
  it("re-running the boot schema step changes no rows", async () => {
    const before = (await pool.query("SELECT * FROM users ORDER BY id")).rows;
    await initDatabase();
    const after = (await pool.query("SELECT * FROM users ORDER BY id")).rows;
    assert.deepEqual(after, before);
  });

  it("preflight report is read-only", async () => {
    const before = (await pool.query("SELECT * FROM users ORDER BY id")).rows;
    const lines = [];
    await require("../scripts/preflight-check").run((...a) => lines.push(a.join(" ")));
    assert.ok(lines.some((l) => l.startsWith("Totals:")));
    const after = (await pool.query("SELECT * FROM users ORDER BY id")).rows;
    assert.deepEqual(after, before);
  });

  it("backup tool: snapshot, restore into a fresh Postgres, counts and checksums match", async () => {
    const os = require("node:os");
    const { backup, verify } = require("../scripts/backup-verify");
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), "glx-backup-test-"));
    const before = (await pool.query("SELECT * FROM users ORDER BY id")).rows;

    const manifest = await backup(dir);
    assert.ok(manifest.tables.users.rows > 20);
    const total = (await pool.query("SELECT sum(balance)::text AS t FROM users")).rows[0].t;
    assert.equal(manifest.tables.users.balanceTotal, total);

    const result = await verify(dir);
    assert.deepEqual(result.problems, []);
    assert.equal(result.ok, true);
    assert.equal(result.tables.users.md5, manifest.tables.users.md5);

    // the backup only reads
    assert.deepEqual((await pool.query("SELECT * FROM users ORDER BY id")).rows, before);
  });

  it("works if production's balance column was widened to NUMERIC", async () => {
    // The uncommitted server altered balance to NUMERIC on boot; if it ever
    // ran against production, the column may already be NUMERIC.
    await pool.query("ALTER TABLE users ALTER COLUMN balance TYPE NUMERIC(20,8)");
    await login(9201);
    await setUser(9201, { balance: "12.5", mining: true, mining_start: Date.now() - 6 * HOUR_MS });
    const c = await call("POST", "/mine/claim", { userId: 9201 });
    assert.equal(c.body.balance, 112.5);
    await setUser(9201, { balance: "600.25" });
    const u = await call("POST", "/upgrade/pickaxe", { userId: 9201 });
    assert.equal(u.body.success, true);
    assert.equal(u.body.balance, 100.25);
  });
});

// ------------------------------------------------------------------
describe("rate limiting and CORS", () => {
  it("state-changing requests are limited per user", async () => {
    const app = createApp({
      rateLimits: { actions: { windowMs: 60_000, max: 3 } },
    });
    const { server: s, base } = await h.startServer(app);
    const c = h.client(base);
    try {
      const codes = [];
      for (let i = 0; i < 5; i++) {
        codes.push((await c("POST", "/user/login", { userId: 9301 })).status);
      }
      assert.deepEqual(codes, [200, 200, 200, 429, 429]);
      assert.equal((await c("POST", "/user/login", { userId: 9302 })).status, 200);
      assert.equal((await c("GET", "/user/me", { userId: 9301 })).status, 200);
    } finally {
      s.close();
    }
  });

  it("CORS defaults to the production Mini App origin only", async () => {
    delete process.env.ALLOWED_ORIGINS;
    const { server: s, base } = await h.startServer(createApp());
    try {
      const good = await fetch(base + "/", { headers: { Origin: "https://glax-miner.vercel.app" } });
      assert.equal(good.headers.get("access-control-allow-origin"), "https://glax-miner.vercel.app");
      for (const origin of ["https://evil.example", "https://glax-miner.vercel.app.evil.example", "http://localhost:5173"]) {
        const bad = await fetch(base + "/", { headers: { Origin: origin } });
        assert.equal(bad.headers.get("access-control-allow-origin"), null, origin);
      }
    } finally {
      s.close();
    }
  });

  it("ALLOWED_ORIGINS restricts cross-origin access", async () => {
    process.env.ALLOWED_ORIGINS = "https://glax-miner.vercel.app";
    const { server: s, base } = await h.startServer(createApp());
    delete process.env.ALLOWED_ORIGINS;
    try {
      const good = await fetch(base + "/", { headers: { Origin: "https://glax-miner.vercel.app" } });
      assert.equal(good.headers.get("access-control-allow-origin"), "https://glax-miner.vercel.app");
      const bad = await fetch(base + "/", { headers: { Origin: "https://evil.example" } });
      assert.equal(bad.headers.get("access-control-allow-origin"), null);
    } finally {
      s.close();
    }
  });
});
