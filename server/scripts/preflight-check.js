// READ-ONLY production report. Runs inside a READ ONLY transaction, so it
// cannot change anything. Run it before and after the Phase 0 deploy and
// keep both outputs.
//
//   npm run preflight
if (require.main === module) {
  require("dotenv").config();
}

const pool = require("../config/database");

async function run(log = console.log) {
  const client = await pool.connect();

  try {
    await client.query("BEGIN READ ONLY");

    const tables = await client.query(`
      SELECT table_name FROM information_schema.tables
      WHERE table_schema = 'public' ORDER BY table_name
    `);
    log("Tables:", tables.rows.map((r) => r.table_name).join(", ") || "(none)");

    const cols = await client.query(`
      SELECT column_name, data_type
      FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'users'
      ORDER BY ordinal_position
    `);
    log("users columns:", cols.rows.map((r) => `${r.column_name}:${r.data_type}`).join(", "));

    const totals = await client.query(`
      SELECT count(*)::int AS users,
             COALESCE(sum(balance), 0)::text AS total_balance,
             COALESCE(max(balance), 0)::text AS max_balance,
             count(*) FILTER (WHERE balance < 0)::int AS negative_balances,
             count(*) FILTER (WHERE mining IS TRUE)::int AS mining_now
      FROM users
    `);
    log("Totals:", JSON.stringify(totals.rows[0]));

    const levels = await client.query(`
      SELECT pickaxe_level, count(*)::int AS n
      FROM users GROUP BY pickaxe_level ORDER BY pickaxe_level
    `);
    log("Pickaxe levels:", JSON.stringify(levels.rows));

    const finished = await client.query(`
      SELECT count(*)::int AS n FROM users
      WHERE mining IS TRUE
        AND mining_start > 0
        AND (extract(epoch from now()) * 1000 - mining_start) >= 5 * 3600 * 1000
    `);
    log("Finished sessions waiting to be claimed:", finished.rows[0].n);

    const fallback = await client.query(`
      SELECT telegram_id, username, balance::text, pickaxe_level
      FROM users WHERE telegram_id = 1
    `);
    log(
      "Fallback account telegram_id=1 (old app's no-Telegram default):",
      fallback.rows.length ? JSON.stringify(fallback.rows[0]) : "not present"
    );

    const top = await client.query(`
      SELECT telegram_id, username, balance::text, pickaxe_level, created_at
      FROM users ORDER BY balance DESC NULLS LAST LIMIT 10
    `);
    log("Top 10 balances (review for tampering):");
    for (const r of top.rows) log("  ", JSON.stringify(r));

    await client.query("ROLLBACK");
  } finally {
    client.release();
  }
}

module.exports = { run };

if (require.main === module) {
  run()
    .then(() => pool.end())
    .catch((err) => {
      console.error(err.message);
      pool.end().finally(() => process.exit(1));
    });
}
