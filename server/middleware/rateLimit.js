// Small in-memory fixed-window rate limiter (single API instance).
// Keyed by the verified Telegram ID when present, otherwise by IP.
// If the API is ever scaled to more than one instance, move this state
// to a shared store.

function rateLimit({ windowMs, max, name = "default" }) {
  const hits = new Map();

  const sweep = setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of hits) {
      if (entry.resetAt <= now) hits.delete(key);
    }
  }, windowMs);
  sweep.unref();

  return function rateLimitMiddleware(req, res, next) {
    const who = req.telegramId ? `tg:${req.telegramId}` : `ip:${req.ip}`;
    const key = `${name}:${who}`;
    const now = Date.now();

    let entry = hits.get(key);
    if (!entry || entry.resetAt <= now) {
      entry = { count: 0, resetAt: now + windowMs };
      hits.set(key, entry);
    }

    entry.count += 1;

    if (entry.count > max) {
      res.set("Retry-After", String(Math.ceil((entry.resetAt - now) / 1000)));
      return res.status(429).json({
        success: false,
        message: "Too many requests",
      });
    }

    return next();
  };
}

module.exports = { rateLimit };
