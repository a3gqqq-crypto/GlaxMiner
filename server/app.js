const express = require("express");
const cors = require("cors");

const { requireTelegramAuth } = require("./middleware/telegramAuth");
const { rateLimit } = require("./middleware/rateLimit");

const userRoutes = require("./routes/user");
const miningRoutes = require("./routes/mining");
const upgradeRoutes = require("./routes/upgrades");

const DEFAULT_ORIGINS = "https://glax-miner.vercel.app";

// Deposits and paid features are disabled in this release: a deposit is not
// yet tied to its sender, so anyone could claim someone else's transaction.
// Every former deposit / Auto Miner path answers 503 and credits nothing.
function depositsUnavailable(req, res) {
  res.status(503).json({
    success: false,
    message: "Deposits are unavailable",
  });
}

// options.botToken    - override BOT_TOKEN (tests)
// options.rateLimits  - override limits (tests)
function createApp(options = {}) {
  const app = express();

  // Behind Railway's proxy: use the client IP from X-Forwarded-For
  app.set("trust proxy", 1);

  // CORS: exact approved origins only. Default is the production Mini App;
  // set ALLOWED_ORIGINS (comma-separated) to change it, e.g. to add
  // http://localhost:5173 for local development.
  const allowed = (process.env.ALLOWED_ORIGINS || DEFAULT_ORIGINS)
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  app.use(cors({ origin: allowed }));

  app.use(express.json({ limit: "16kb" }));

  const limits = {
    perIp: { windowMs: 60_000, max: 120 },
    perUser: { windowMs: 60_000, max: 60 },
    actions: { windowMs: 60_000, max: 10 },
    ...(options.rateLimits || {}),
  };

  // Coarse per-IP limit before auth (protects the HMAC check too)
  app.use(rateLimit({ name: "ip", ...limits.perIp }));

  const auth = requireTelegramAuth({ botToken: options.botToken });
  const perUser = rateLimit({ name: "user", ...limits.perUser });
  const actions = rateLimit({ name: "action", ...limits.actions });

  // Health check (public)
  app.get("/", (req, res) => {
    res.send("🚀 GlaxMiner API Running");
  });

  // Tighter limit on requests that change state (every POST)
  const postActions = (req, res, next) =>
    req.method === "POST" ? actions(req, res, next) : next();

  app.use("/wallet", depositsUnavailable);
  app.use("/upgrade/wallet", depositsUnavailable);
  app.use("/upgrade/auto-miner", depositsUnavailable);

  app.use("/user", auth, perUser, postActions, userRoutes);
  app.use("/mine", auth, perUser, postActions, miningRoutes);
  app.use("/upgrade", auth, perUser, postActions, upgradeRoutes);

  // eslint-disable-next-line no-unused-vars
  app.use((err, req, res, next) => {
    if (err.type === "entity.parse.failed") {
      return res.status(400).json({ success: false, message: "Invalid JSON" });
    }
    console.error("UNHANDLED ERROR:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  });

  return app;
}

module.exports = { createApp };
