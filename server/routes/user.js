const express = require("express");
const router = express.Router();

const pool = require("../config/database");

// Login / Create User
router.post("/login", async (req, res) => {
  try {
    const { telegramId, username } = req.body;

    if (!telegramId) {
      return res.status(400).json({
        success: false,
        message: "Telegram ID is required",
      });
    }

    const existing = await pool.query(
      "SELECT * FROM users WHERE telegram_id = $1",
      [telegramId]
    );

    if (existing.rows.length > 0) {
      return res.json({
        success: true,
        user: existing.rows[0],
      });
    }

    const created = await pool.query(
      `
      INSERT INTO users
      (telegram_id, username)
      VALUES ($1, $2)
      RETURNING *
      `,
      [telegramId, username || ""]
    );

    res.json({
      success: true,
      user: created.rows[0],
    });

  } catch (err) {
    console.error(err);

    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
});

// Load User
router.get("/:telegramId", async (req, res) => {
  try {
    const { telegramId } = req.params;

    const result = await pool.query(
      "SELECT * FROM users WHERE telegram_id = $1",
      [telegramId]
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
});

module.exports = router;