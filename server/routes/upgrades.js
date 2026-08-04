const express = require("express");
const router = express.Router();

const pool = require("../config/database");
const { MINING_POWER } = require("../config/mining");

router.post("/pickaxe", async (req, res) => {
  try {
    const { telegramId } = req.body;

    const result = await pool.query(
      "SELECT * FROM users WHERE telegram_id = $1",
      [telegramId]
    );

    if (result.rows.length === 0) {
      return res.json({
        success: false,
        message: "User not found",
      });
    }

    const user = result.rows[0];

    if (user.pickaxe_level >= 10) {
      return res.json({
        success: false,
        message: "Maximum level reached",
      });
    }

    const nextLevel = user.pickaxe_level + 1;
    const cost = MINING_POWER[nextLevel].upgradeCost;

    if (user.balance < cost) {
      return res.json({
        success: false,
        message: "Not enough GLX",
      });
    }

    const newBalance = user.balance - cost;

    await pool.query(
      `
      UPDATE users
      SET balance = $1,
          pickaxe_level = $2
      WHERE telegram_id = $3
      `,
      [newBalance, nextLevel, telegramId]
    );

    res.json({
      success: true,
      balance: newBalance,
      pickaxeLevel: nextLevel,
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