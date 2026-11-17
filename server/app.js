const express = require("express");
const cors = require("cors");

const { requireTelegramAuth } = require("./middleware/telegramAuth");
const { rateLimit } = require("./middleware/rateLimit");

const userRoutes = require("./routes/user");
const miningRoutes = require("./routes/mining");
const upgradeRoutes = require("./routes/upgrades");

// options.botToken    - override BOT_TOKEN (tests)
// options.rateLimits  - override limits (tests)
function createApp(options = {}) {
  const app = express();

  // Behind Railway's proxy: use the client IP from X-Forwarded-For
  app.set("trust proxy", 1);

  // CORS: allow all (as before) unless ALLOWED_ORIGINS is set
  const allowed = (process.env.ALLOWED_ORIGINS || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  app.use(cors(allowed.length > 0 ? { origin: allowed } : undefined));

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
