const { Pool } = require("pg");

// TLS stays on (as before) unless DATABASE_SSL=false (local Postgres / tests)
const ssl =
  process.env.DATABASE_SSL === "false"
    ? false
    : {
        rejectUnauthorized: false,
      };

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl,
});

module.exports = pool;
