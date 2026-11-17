const express = require("express");
const router = express.Router();

const pool = require("../config/database");
const { requireSelf } = require("../middleware/telegramAuth");

// Every route here runs behind requireTelegramAuth (see app.js):
// req.telegramId comes ONLY from verified Telegram initData.

// ===========================
// Login / Create User
// ===========================
router.post("/login", async (req, res) => {
  try {
    const telegramId = req.telegramId;
    const username = req.telegramUser?.username || "";

    // Same behaviour as before: create the user if new, never modify an
    // existing row. ON CONFLICT makes concurrent first logins safe.
    await pool.query(
      `
      INSERT INTO users (telegram_id, username)
      VALUES ($1, $2)
      ON CONFLICT (telegram_id) DO NOTHING
      `,
      [telegramId, username]
    );

    const result = await pool.query(
      "SELECT * FROM users WHERE telegram_id = $1",
      [telegramId]
    );

    res.json({
      success: true,
      user: result.rows[0],
    });
  } catch (err) {
    console.error(err);

    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
});

// ===========================
// Add Balance (DEV): REMOVED
// ===========================
// POST /user/addBalance let any caller credit any amount to any account.
// Balances now change only through /mine/claim and /upgrade/pickaxe.

// ===========================
// Leaderboard
// ===========================
// The frontend called a leaderboard route that did not exist on the
// deployed server. Read-only: display name, balance and level only.
router.get("/leaderboard", async (req, res) => {
  try {
    const result = await pool.query(
      `
      SELECT username, balance, pickaxe_level
      FROM users
      ORDER BY balance DESC NULLS LAST, id ASC
      LIMIT 50
      `
    );

    res.json({
      success: true,
      users: result.rows,
    });
  } catch (err) {
    console.error(err);

    res.status(500).json({
      success: false,
      message: "Database error",
    });
  }
});

async function sendOwnUser(req, res) {
  try {
    const result = await pool.query(
      "SELECT * FROM users WHERE telegram_id = $1",
      [req.telegramId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    res.json({
      success: true,
      user: result.rows[0],
    });
  } catch (err) {
    console.error(err);

    res.status(500).json({
      success: false,
      message: "Database error",
    });
  }
}

// ===========================
// Get Current User
// ===========================
router.get("/me", sendOwnUser);

// ===========================
// Get User (own record only)
// ===========================
router.get("/:telegramId", requireSelf("telegramId"), sendOwnUser);

module.exports = router;
