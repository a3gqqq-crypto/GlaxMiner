const crypto = require("crypto");

// ==========================================
// TELEGRAM WEBAPP initData VERIFICATION
// ==========================================
//
// Spec: https://core.telegram.org/bots/webapps#validating-data-received-via-the-mini-app
//
//   secret_key       = HMAC_SHA256(key = "WebAppData", data = BOT_TOKEN)
//   data_check_string = all received fields except "hash",
//                       sorted by key, joined as "key=value" with "\n"
//   valid            = hex(HMAC_SHA256(key = secret_key, data = data_check_string)) == hash
//
// The authenticated user ID is taken ONLY from the verified "user" field.
// A telegramId sent by the client in the body / URL is never trusted.
// ==========================================

const DEFAULT_MAX_AGE_SECONDS = 24 * 60 * 60;

// Allow small clock differences between Telegram and this server
const FUTURE_SKEW_SECONDS = 60;

class InitDataError extends Error {
  constructor(message) {
    super(message);
    this.name = "InitDataError";
  }
}

function verifyInitData(initData, botToken, options = {}) {
  const maxAgeSeconds =
    options.maxAgeSeconds ?? DEFAULT_MAX_AGE_SECONDS;

  const nowSeconds =
    options.nowSeconds ?? Math.floor(Date.now() / 1000);

  if (!botToken) {
    throw new InitDataError("Server is missing BOT_TOKEN");
  }

  if (typeof initData !== "string" || initData.length === 0) {
    throw new InitDataError("Missing initData");
  }

  if (initData.length > 4096) {
    throw new InitDataError("initData too long");
  }

  const params = new URLSearchParams(initData);

  const hash = params.get("hash");

  if (!hash || !/^[a-f0-9]{64}$/i.test(hash)) {
    throw new InitDataError("Missing or malformed hash");
  }

  const pairs = [];

  for (const [key, value] of params.entries()) {
    if (key === "hash") continue;
    pairs.push(`${key}=${value}`);
  }

  pairs.sort();

  const dataCheckString = pairs.join("\n");

  const secretKey = crypto
    .createHmac("sha256", "WebAppData")
    .update(botToken)
    .digest();

  const expected = crypto
    .createHmac("sha256", secretKey)
    .update(dataCheckString)
    .digest();

  const received = Buffer.from(hash, "hex");

  if (
    received.length !== expected.length ||
    !crypto.timingSafeEqual(received, expected)
  ) {
    throw new InitDataError("Invalid initData signature");
  }

  const authDate = Number(params.get("auth_date"));

  if (!Number.isInteger(authDate) || authDate <= 0) {
    throw new InitDataError("Missing auth_date");
  }

  if (authDate > nowSeconds + FUTURE_SKEW_SECONDS) {
    throw new InitDataError("auth_date is in the future");
  }

  if (nowSeconds - authDate > maxAgeSeconds) {
    throw new InitDataError("initData has expired");
  }

  let user;

  try {
    user = JSON.parse(params.get("user") || "");
  } catch {
    throw new InitDataError("Missing or invalid user");
  }

  if (
    !user ||
    !Number.isSafeInteger(user.id) ||
    user.id <= 0
  ) {
    throw new InitDataError("Invalid user id");
  }

  return {
    telegramId: String(user.id),
    username:
      typeof user.username === "string"
        ? user.username.slice(0, 64)
        : null,
    firstName:
      typeof user.first_name === "string"
        ? user.first_name.slice(0, 64)
        : null,
    authDate,
  };
}

// ==========================================
// EXPRESS MIDDLEWARE
// ==========================================
//
// Client sends:   Authorization: tma <Telegram.WebApp.initData>
// On success:     req.telegramId (string), req.telegramUser
// ==========================================

function requireTelegramAuth(options = {}) {
  return (req, res, next) => {
    const header = req.get("authorization") || "";

    const match = header.match(/^tma\s+(.+)$/i);

    if (!match) {
      return res.status(401).json({
        success: false,
        message: "Telegram authentication required",
      });
    }

    const botToken =
      options.botToken ?? process.env.BOT_TOKEN;

    const maxAgeSeconds =
      options.maxAgeSeconds ??
      (Number(process.env.INITDATA_MAX_AGE_SECONDS) ||
        DEFAULT_MAX_AGE_SECONDS);

    try {
      const verified = verifyInitData(match[1], botToken, {
        maxAgeSeconds,
      });

      req.telegramUser = verified;
      req.telegramId = verified.telegramId;

      return next();
    } catch (err) {
      if (err instanceof InitDataError) {
        if (err.message === "Server is missing BOT_TOKEN") {
          console.error("AUTH CONFIG ERROR: BOT_TOKEN is not set");

          return res.status(500).json({
            success: false,
            message: "Server authentication is not configured",
          });
        }

        return res.status(401).json({
          success: false,
          message: "Invalid Telegram authentication",
        });
      }

      return next(err);
    }
  };
}

// Route helper: a :telegramId URL param must match the authenticated user
function requireSelf(paramName = "telegramId") {
  return (req, res, next) => {
    if (String(req.params[paramName]) !== String(req.telegramId)) {
      return res.status(403).json({
        success: false,
        message: "Forbidden",
      });
    }

    return next();
  };
}

module.exports = {
  verifyInitData,
  requireTelegramAuth,
  requireSelf,
  InitDataError,
  DEFAULT_MAX_AGE_SECONDS,
};
