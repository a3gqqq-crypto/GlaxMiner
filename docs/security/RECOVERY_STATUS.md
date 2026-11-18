# GlaxMiner Phase 0 recovery status (updated 2026-11-18)

Legend: **COMPLETED** done · **VERIFIED** done and checked · **PREPARED** ready, waiting for access or approval · **BLOCKED** cannot proceed without you.

| # | Item | Status | Detail |
|---|---|---|---|
| 1 | Railway project and services | **VERIFIED** | Project "disciplined-flow", environment "production". Trial had expired; workspace **downgraded to the Free plan** ($0, $1 monthly usage credit, 1 vCPU / 0.5 GB RAM per service, 0.5 GB volume). No payment details entered. **Postgres** redeployed (same image `postgres-ssl:18`, same `postgres-volume`, US West, still unexposed). **GlaxMiner API** left offline. Newest API deploy ever: `92c29f4` via GitHub |
| 2 | Original PostgreSQL database | **VERIFIED: exists, data intact** | Before the downgrade the volume showed "scheduled to be deleted soon per data retention policy"; that warning is gone on Free. Volume max size 500 MB (fits Free). PostgreSQL 18.6 |
| 3 | Backup and restore proof | **VERIFIED** | Exported schema and every row through Railway's Data tab with read-only SELECTs (md5 checksums computed in production). Saved at `C:\Users\Dhanu\GlaxMiner-backups\prod-20261118-railway-export\`. `npm run backup:verify` restored it into a disposable local PostgreSQL: all row counts, checksums and balance totals match (`ok: true`). No Railway backups exist (they need a paid plan) |
| 4 | User count and balance totals | **VERIFIED** | `users`: **1 row**, telegram_id `1`, username "Developer" (the old app's fallback account), balance 0, level 1, created 2026-08-04, a mining session started that day. `usdt_deposits`: 0. `wallet_transactions`: 0. Total GLX 0, total USDT 0. **No real player data was ever stored** |
| 5 | Database password rotation | **PREPARED** | Not done. The data is a single test row, so risk is low, but it must be done before the API goes live. Steps: `PHASE0.md` section 6a |
| 6 | Bot token rotation | **BLOCKED** | Needs your Telegram account (BotFather) |
| 7 | Security branch | **VERIFIED** | `security/phase-0-v2`, parent `92c29f4`; `server/config/mining.js` byte-identical |
| 8 | Tests | **VERIFIED** | 56 tests, repeated green runs; frontend build clean |
| 9 | Migrations | **VERIFIED: none needed** | Production `users.balance` is `numeric(20,8)` (the WIP server widened it); the branch is tested against exactly that. Extra WIP columns and the `usdt_deposits` / `wallet_transactions` tables are left untouched |
| 10 | Railway API deployment | **PREPARED** | Not deployed (prerequisites 5 and 6 open). On Free the API needs `BOT_TOKEN`, `DATABASE_URL=${{Postgres.DATABASE_URL}}`, `ALLOWED_ORIGINS` |
| 11 | Vercel deployment | **BLOCKED** | Not signed in to Vercel |
| 12 | Telegram launch test | **BLOCKED** | Needs the deployed API and your bot |
| 13 | Mining and upgrade tests | **VERIFIED locally only** | Not tested in production |
| 14 | Git history cleanup | **PREPARED + rehearsed** | Force-push needs your approval after rotation |

## Free-plan notes
- Free deployments are serverless-style and limited to 0.5 GB RAM per service and $1 of usage a month; both Postgres and the API fit for current traffic. Watch the usage page.
- Public database access was **not** enabled (a permission check blocked it, and it wasn't needed). The API reaches Postgres over Railway's private network.
- Railway backups need a paid plan; use `npm run backup` (from inside Railway's network or with a temporary tunnel) or the Data-tab export method for future backups.

## Next steps
1. Rotate the bot token in BotFather; set it on the bot host and the Railway API service.
2. Rotate the database password (or confirm you accept the risk given the database holds only the test row).
3. Approve deploying the API from `security/phase-0-v2`, then the frontend on Vercel (sign in to Vercel in the browser pane).
4. Approve the history force-push.
