const express = require("express");
const router = express.Router();

const pool = require("../config/database");
const {
  MINING_DURATION,
  MINING_POWER,
} = require("../config/mining");

// Start Mining
router.post("/start", async (req, res) => {
  try {
    const { telegramId } = req.body;

    const user = await pool.query(
      "SELECT * FROM users WHERE telegram_id=$1",
      [telegramId]
    );

    if (user.rows.length === 0) {
      return res.json({
        success: false,
        message: "User not found",
      });
    }

    const player = user.rows[0];

    if (player.mining) {
      return res.json({
        success: false,
        message: "Already mining",
      });
    }

    const now = Date.now();

    await pool.query(
      `
      UPDATE users
      SET mining=true,
          mining_start=$1,
          can_claim=false
      WHERE telegram_id=$2
      `,
      [now, telegramId]
    );

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

// Claim Reward
router.post("/claim", async (req, res) => {
  try {
    const { telegramId } = req.body;

    const result = await pool.query(
      "SELECT * FROM users WHERE telegram_id=$1",
      [telegramId]
    );

    if (result.rows.length === 0) {
      return res.json({
        success: false,
        message: "User not found",
      });
    }

    const user = result.rows[0];

    const reward =
      MINING_POWER[user.pickaxe_level].reward;

    const newBalance = user.balance + reward;

    await pool.query(
      `
      UPDATE users
      SET
      balance=$1,
      mining=false,
      mining_start=0,
      can_claim=false
      WHERE telegram_id=$2
      `,
      [newBalance, telegramId]
    );

    res.json({
      success: true,
      reward,
      balance: newBalance,
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