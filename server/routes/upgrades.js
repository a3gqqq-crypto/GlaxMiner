const express = require("express");
const router = express.Router();

const pool = require("../config/database");
const { MINING_POWER } = require("../config/mining");

// Costs are unchanged from 92c29f4 (config/mining.js upgradeCost).
// Now: verified caller only, and the check and the debit happen under a
// row lock in one transaction, so parallel requests cannot double-spend
// or skip a level.

const MAX_LEVEL = 10;

router.post("/pickaxe", async (req, res) => {
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
    const level = Number(user.pickaxe_level) || 1;

    if (level >= MAX_LEVEL) {
      await client.query("ROLLBACK");
      return res.json({
        success: false,
        message: "Maximum level reached",
      });
    }

    const nextLevel = level + 1;
    const cost = MINING_POWER[nextLevel].upgradeCost;

    if (Number(user.balance || 0) < cost) {
      await client.query("ROLLBACK");
      return res.json({
        success: false,
        message: "Not enough GLX",
      });
    }

    const updated = await client.query(
      `
      UPDATE users
      SET balance = balance - $1,
          pickaxe_level = $2
      WHERE telegram_id = $3
      RETURNING balance, pickaxe_level
      `,
      [cost, nextLevel, req.telegramId]
    );

    await client.query("COMMIT");

    res.json({
      success: true,
      balance: Number(updated.rows[0].balance),
      pickaxeLevel: updated.rows[0].pickaxe_level,
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
