const express = require("express");
const router = express.Router();

const pool = require("../config/database");
const {
  MINING_DURATION,
  MINING_POWER,
} = require("../config/mining");

// The economy is unchanged from 92c29f4: MINING_DURATION (5 h) and the
// reward per pickaxe level in config/mining.js.
// What changed is enforcement:
//   - the caller is the verified Telegram user (never a body telegramId)
//   - a reward is paid only after the full MINING_DURATION has passed
//   - exactly one claim per session (row lock + reset in one transaction)

const DURATION_MS = MINING_DURATION * 1000;

function sessionView(user, now) {
  const mining = user.mining === true;
  const startTime = mining ? Number(user.mining_start) : 0;
  const elapsedMs = mining ? now - startTime : 0;
  const level = Number(user.pickaxe_level) || 1;

  return {
    mining,
    startTime,
    duration: MINING_DURATION,
    timeLeft: mining
      ? Math.max(0, Math.ceil((DURATION_MS - elapsedMs) / 1000))
      : 0,
    canClaim: mining && elapsedMs >= DURATION_MS,
    pickaxeLevel: level,
    reward: MINING_POWER[level] ? MINING_POWER[level].reward : null,
    serverTime: now,
  };
}

// =======================
// Start Mining
// =======================
router.post("/start", async (req, res) => {
  try {
    const telegramId = req.telegramId;
    const now = Date.now();

    // One atomic statement: only a user who is not mining can start
    const started = await pool.query(
      `
      UPDATE users
      SET
        mining = true,
        mining_start = $1,
        can_claim = false
      WHERE telegram_id = $2
        AND mining IS NOT TRUE
      RETURNING mining_start
      `,
      [now, telegramId]
    );

    if (started.rows.length === 0) {
      const exists = await pool.query(
        "SELECT 1 FROM users WHERE telegram_id = $1",
        [telegramId]
      );

      return res.json({
        success: false,
        message: exists.rows.length === 0 ? "User not found" : "Already mining",
      });
    }

    res.json({
      success: true,
      startTime: now,
      duration: MINING_DURATION,
    });
  } catch (err) {
    console.error(err);

    res.status(500).json({
      success: false,
      message: "Database error",
    });
  }
});

// =======================
// Mining Status (read-only)
// =======================
// Replaces the /mine/sync call the frontend made to a route that never
// existed on the deployed server. It never changes a balance.
router.get("/status", async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT * FROM users WHERE telegram_id = $1",
      [req.telegramId]
    );

    if (result.rows.length === 0) {
      return res.json({
        success: false,
        message: "User not found",
      });
    }

    const user = result.rows[0];

    res.json({
      success: true,
      ...sessionView(user, Date.now()),
      balance: Number(user.balance),
    });
  } catch (err) {
    console.error(err);

    res.status(500).json({
      success: false,
      message: "Database error",
    });
  }
});

// =======================
// Claim Reward
// =======================
router.post("/claim", async (req, res) => {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const result = await client.query(
      "SELECT * FROM users WHERE telegram_id = $1 FOR UPDATE",
      [req.telegramId]
    );

    if (result.rows.length === 0) {
      await client.query("ROLLBACK");
      return res.json({
        success: false,
        message: "User not found",
      });
    }

    const user = result.rows[0];
    const view = sessionView(user, Date.now());

    if (!view.mining) {
      await client.query("ROLLBACK");
      return res.json({
        success: false,
        message: "No active mining session",
      });
    }

    if (!view.canClaim) {
      await client.query("ROLLBACK");
      return res.json({
        success: false,
        message: "Mining session not finished",
        timeLeft: view.timeLeft,
      });
    }

    if (view.reward === null) {
      await client.query("ROLLBACK");
      console.error("Unknown pickaxe level", user.pickaxe_level);
      return res.status(500).json({
        success: false,
        message: "Invalid pickaxe level",
      });
    }

    // Reward for the level at claim time, as before. Added in SQL so a
    // concurrent change to the balance is never overwritten.
    const updated = await client.query(
      `
      UPDATE users
      SET
        balance = COALESCE(balance, 0) + $1,
        mining = false,
        mining_start = 0,
        can_claim = false
      WHERE telegram_id = $2
      RETURNING balance
      `,
      [view.reward, req.telegramId]
    );

    await client.query("COMMIT");

    res.json({
      success: true,
      reward: view.reward,
      balance: Number(updated.rows[0].balance),
    });
  } catch (err) {
    await client.query("ROLLBACK").catch(() => {});
    console.error(err);

    res.status(500).json({
      success: false,
      message: "Database error",
    });
  } finally {
    client.release();
  }
});

module.exports = router;
