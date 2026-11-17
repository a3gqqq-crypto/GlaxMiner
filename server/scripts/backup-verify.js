// Logical backup of the production database + restore verification.
//
//   node scripts/backup-verify.js backup <out-dir>    (reads DATABASE_URL)
//   node scripts/backup-verify.js verify <out-dir>    (restores into a disposable local Postgres)
//
// backup: one REPEATABLE READ, READ ONLY transaction (a consistent snapshot;
//   it cannot change anything). Writes schema.json, one <table>.ndjson per
//   table and manifest.json (row counts, md5 checksums, balance totals).
// verify: starts a throwaway embedded PostgreSQL, recreates the schema,
//   loads every row, recomputes counts and checksums and compares them with
//   the manifest. Exit code 0 only if everything matches.
//
// This is a fallback when pg_dump / Railway backups are not available.
// Prefer a Railway backup or pg_dump as well. Never prints DATABASE_URL.
const fs = require("fs");
const path = require("path");
const os = require("os");
const { Client } = require("pg");

const q = (name) => `"${String(name).replace(/"/g, '""')}"`;

// Same text output on both sides, whatever the server defaults are
async function normalise(c) {
  await c.query("SET TIME ZONE 'UTC'");
  await c.query("SET DateStyle = 'ISO, MDY'");
  await c.query("SET extra_float_digits = 1");
  await c.query("SET IntervalStyle = 'postgres'");
}

async function readSchema(c) {
  const tables = (
    await c.query(`
      SELECT c.relname AS name
      FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
      WHERE n.nspname = 'public' AND c.relkind = 'r'
      ORDER BY c.relname`)
  ).rows.map((r) => r.name);

  const schema = { tables: [], sequences: [] };

  for (const t of tables) {
    const columns = (
      await c.query(
        `SELECT a.attname AS name,
                format_type(a.atttypid, a.atttypmod) AS type,
                a.attnotnull AS not_null,
                pg_get_expr(d.adbin, d.adrelid) AS default
         FROM pg_attribute a
         LEFT JOIN pg_attrdef d ON d.adrelid = a.attrelid AND d.adnum = a.attnum
         WHERE a.attrelid = $1::regclass AND a.attnum > 0 AND NOT a.attisdropped
         ORDER BY a.attnum`,
        [`public.${q(t)}`]
      )
    ).rows;

    const constraints = (
      await c.query(
        `SELECT conname AS name, contype AS type, pg_get_constraintdef(oid) AS def
         FROM pg_constraint WHERE conrelid = $1::regclass
         ORDER BY contype = 'f', conname`,
        [`public.${q(t)}`]
      )
    ).rows;

    const indexes = (
      await c.query(
        `SELECT i.relname AS name, pg_get_indexdef(i.oid) AS def
         FROM pg_index x JOIN pg_class i ON i.oid = x.indexrelid
         WHERE x.indrelid = $1::regclass
           AND NOT EXISTS (SELECT 1 FROM pg_constraint k WHERE k.conindid = i.oid)
         ORDER BY i.relname`,
        [`public.${q(t)}`]
      )
    ).rows;

    schema.tables.push({ name: t, columns, constraints, indexes });
  }

  schema.sequences = (
    await c.query(`
      SELECT sequencename AS name, last_value::text AS last_value,
             data_type::text AS data_type
      FROM pg_sequences WHERE schemaname = 'public' ORDER BY sequencename`)
  ).rows;

  return schema;
}

async function tableStats(c, table, columns) {
  const stats = {};
  const r = await c.query(
    `SELECT count(*)::bigint::text AS rows,
            md5(COALESCE(string_agg(t::text, E'\\n' ORDER BY t::text), '')) AS md5
     FROM public.${q(table)} t`
  );
  stats.rows = Number(r.rows[0].rows);
  stats.md5 = r.rows[0].md5;
  if (columns.some((col) => col.name === "balance")) {
    const s = await c.query(
      `SELECT COALESCE(sum(balance), 0)::text AS total FROM public.${q(table)}`
    );
    stats.balanceTotal = s.rows[0].total;
  }
  return stats;
}

async function backup(outDir) {
  if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is not set");
  fs.mkdirSync(outDir, { recursive: true });

  const c = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.DATABASE_SSL === "false" ? false : { rejectUnauthorized: false },
  });
  await c.connect();
  await normalise(c);

  try {
    await c.query("BEGIN ISOLATION LEVEL REPEATABLE READ READ ONLY");

    const meta = (
      await c.query(
        "SELECT version() AS version, current_database() AS db, now()::text AS taken_at"
      )
    ).rows[0];

    const schema = await readSchema(c);
    fs.writeFileSync(path.join(outDir, "schema.json"), JSON.stringify(schema, null, 2));

    const manifest = {
      takenAt: meta.taken_at,
      serverVersion: meta.version,
      database: meta.db,
      tables: {},
    };

    for (const t of schema.tables) {
      const file = path.join(outDir, `${t.name}.ndjson`);
      const rows = await c.query(
        `SELECT row_to_json(t)::text AS j FROM public.${q(t.name)} t ORDER BY t::text`
      );
      fs.writeFileSync(file, rows.rows.map((r) => r.j).join("\n") + (rows.rows.length ? "\n" : ""));
      manifest.tables[t.name] = await tableStats(c, t.name, t.columns);
    }

    await c.query("ROLLBACK");
    fs.writeFileSync(path.join(outDir, "manifest.json"), JSON.stringify(manifest, null, 2));
    return manifest;
  } finally {
    await c.end();
  }
}

async function restoreInto(c, dir) {
  const schema = JSON.parse(fs.readFileSync(path.join(dir, "schema.json"), "utf8"));

  for (const s of schema.sequences) {
    await c.query(`CREATE SEQUENCE ${q(s.name)} AS ${s.data_type}`);
  }

  for (const t of schema.tables) {
    const cols = t.columns
      .map((col) =>
        [q(col.name), col.type, col.not_null ? "NOT NULL" : "", col.default ? `DEFAULT ${col.default}` : ""]
          .filter(Boolean)
          .join(" ")
      )
      .join(",\n  ");
    await c.query(`CREATE TABLE ${q(t.name)} (\n  ${cols}\n)`);

    const lines = fs
      .readFileSync(path.join(dir, `${t.name}.ndjson`), "utf8")
      .split("\n")
      .filter(Boolean);
    for (const line of lines) {
      await c.query(
        `INSERT INTO ${q(t.name)} SELECT * FROM json_populate_record(NULL::${q(t.name)}, $1::json)`,
        [line]
      );
    }
  }

  for (const t of schema.tables) {
    for (const k of t.constraints.filter((x) => x.type !== "f")) {
      await c.query(`ALTER TABLE ${q(t.name)} ADD CONSTRAINT ${q(k.name)} ${k.def}`);
    }
  }
  for (const t of schema.tables) {
    for (const k of t.constraints.filter((x) => x.type === "f")) {
      await c.query(`ALTER TABLE ${q(t.name)} ADD CONSTRAINT ${q(k.name)} ${k.def}`);
    }
    for (const i of t.indexes) {
      await c.query(i.def);
    }
  }

  for (const s of schema.sequences) {
    if (s.last_value !== null) {
      await c.query(`SELECT setval($1, $2::bigint, true)`, [q(s.name), s.last_value]);
    }
  }

  return schema;
}

async function verify(dir) {
  const manifest = JSON.parse(fs.readFileSync(path.join(dir, "manifest.json"), "utf8"));
  const EmbeddedPostgres = require("embedded-postgres").default;

  const port = 55000 + Math.floor(Math.random() * 900);
  const dataDir = fs.mkdtempSync(path.join(os.tmpdir(), "glx-restore-"));
  const pg = new EmbeddedPostgres({
    databaseDir: dataDir,
    user: "postgres",
    password: "restore",
    port,
    persistent: false,
    onLog: () => {},
    onError: () => {},
  });

  await pg.initialise();
  await pg.start();
  await pg.createDatabase("restore_check");

  const c = new Client({
    connectionString: `postgresql://postgres:restore@127.0.0.1:${port}/restore_check`,
  });
  await c.connect();
  await normalise(c);

  const problems = [];
  const result = { tables: {} };

  try {
    const schema = await restoreInto(c, dir);

    for (const t of schema.tables) {
      const got = await tableStats(c, t.name, t.columns);
      const want = manifest.tables[t.name];
      result.tables[t.name] = got;
      for (const key of Object.keys(want)) {
        if (String(got[key]) !== String(want[key])) {
          problems.push(`${t.name}.${key}: backup ${want[key]} vs restored ${got[key]}`);
        }
      }
    }
    if (Object.keys(manifest.tables).length !== schema.tables.length) {
      problems.push("table count differs from manifest");
    }
  } finally {
    await c.end();
    await pg.stop();
  }

  result.ok = problems.length === 0;
  result.problems = problems;
  fs.writeFileSync(path.join(dir, "restore-verification.json"), JSON.stringify(result, null, 2));
  return result;
}

module.exports = { backup, verify };

if (require.main === module) {
  require("dotenv").config({ path: path.join(__dirname, "..", ".env") });
  const [mode, dir] = process.argv.slice(2);

  if (!["backup", "verify"].includes(mode) || !dir) {
    console.error("usage: node scripts/backup-verify.js backup|verify <out-dir>");
    process.exit(2);
  }

  const out = path.resolve(dir);
  const repo = path.resolve(__dirname, "..", "..");
  if (out.startsWith(repo + path.sep) || out === repo) {
    console.error("Refusing to write a backup inside the Git repository.");
    process.exit(2);
  }

  const run = mode === "backup" ? backup(out) : verify(out);
  run
    .then((r) => {
      const summary =
        mode === "backup"
          ? Object.fromEntries(Object.entries(r.tables).map(([k, v]) => [k, v]))
          : r;
      console.log(JSON.stringify(summary, null, 2));
      if (mode === "verify" && !r.ok) process.exit(1);
    })
    .catch((err) => {
      console.error(`${mode} failed: ${err.message}`);
      process.exit(1);
    });
}
