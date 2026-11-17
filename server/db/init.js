// Boot-time schema setup, moved VERBATIM from index.js (92c29f4).
// It only creates the users table if it does not exist; it never alters
// or rewrites existing rows.
const pool = require("../config/database");

async function initDatabase() {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        telegram_id BIGINT UNIQUE,
        username TEXT,
        balance INTEGER DEFAULT 0,
        pickaxe_level INTEGER DEFAULT 1,
        mining BOOLEAN DEFAULT FALSE,
        mining_start BIGINT DEFAULT 0,
        can_claim BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);

    console.log("✅ Connected to PostgreSQL");
    console.log("✅ Users table is ready");
  } catch (err) {
    console.error("❌ Database Error:", err);
  }
}

module.exports = { initDatabase };
