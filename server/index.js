const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");

dotenv.config();

const pool = require("./config/database");

const userRoutes = require("./routes/user");
const miningRoutes = require("./routes/mining");

const app = express();

app.use(cors());
app.use(express.json());

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

initDatabase();

// Routes
app.use("/user", userRoutes);
app.use("/mine", miningRoutes);

// Test Route
app.get("/", (req, res) => {
  res.send("🚀 GlaxMiner API Running");
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});