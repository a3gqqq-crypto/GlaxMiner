# GlaxMiner Phase 0 recovery status (updated 2026-11-18, 15:10 UTC)

Legend: **COMPLETED** done · **VERIFIED** done and checked · **PREPARED** ready, waiting for access or approval · **BLOCKED** cannot proceed without you.

| # | Item | Status | Detail |
|---|---|---|---|
| 1 | Railway project and services | **VERIFIED** | Project "disciplined-flow", environment "production", Free plan ($0, no payment details). **Postgres** running on the original `postgres-volume` (US West, unexposed). **GlaxMiner API** offline: every deployment is REMOVED; newest ever was `92c29f4` |
| 2 | Original PostgreSQL database | **VERIFIED: data intact** | Volume `fc10d9d8` attached at `/var/lib/postgresql/data`, READY, 111.6 MB of 500 MB. PostgreSQL 18.6 |
| 3 | Backup and restore proof | **VERIFIED** | `C:\Users\Dhanu\GlaxMiner-backups\prod-20261118-railway-export\`; `npm run backup:verify` re-run 2026-11-18: `ok: true` |
| 4 | Production vs backup | **VERIFIED** | Checked before and after the password rotation (14:02 and 14:49 UTC): `users` 1 row, md5 `39fdb65210f6df7157d2a42076d7a583`, GLX total 0.00000000; `usdt_deposits` 0; `wallet_transactions` 0. Identical to the backup |
| 5 | Database password rotation | **VERIFIED** | Rotated 14:48 UTC with Railway's supported **Database > Config > Regenerate** (changes the role password inside PostgreSQL and `POSTGRES_PASSWORD` together). `POSTGRES_PASSWORD`, `PGPASSWORD` and `DATABASE_URL` all changed and agree; Postgres restarted on the same volume ("Skipping initialization"), no authentication failures; the Data tab connects with the new value. `postgres` is the only login role, so the old password no longer works. The API was **not** redeployed |
| 6 | Bot token rotation | **VERIFIED locally** | Old token revoked (Telegram 401). New token in `bot/.env` (git-ignored), accepted by Telegram as `@GlaxMinerBot`; no webhook (long polling); fingerprint recorded, value never printed |
| 7 | API variables | **PREPARED (staged, not deployed)** | `DATABASE_URL = ${{Postgres.DATABASE_URL}}` (private network, resolves to the new password). `ALLOWED_ORIGINS` staged. `BOT_TOKEN` to be pasted by the owner (`set-bot-token.ps1 -CopyForRailway`). Staged values can't be read back before deploy; `verify-api-token.js` proves the match after deploy |
| 8 | Security branch | **VERIFIED** | `security/phase-0-v2`, parent `92c29f4`; `server/config/mining.js` and `bot/index.js` byte-identical |
| 9 | Tests | **VERIFIED** | 56/56 pass; frontend build clean |
| 10 | Migrations | **VERIFIED: none needed** | Production schema already matches what the branch is tested against |
| 11 | Git history cleanup | **PREPARED + re-rehearsed** | Fresh mirror, `git filter-repo --invert-paths --path server/.env --path bot/.env`: 0 commits touch either file; remaining pattern matches are placeholders/test values only; every branch keeps its commit count and files except the two `.env` files. `main` `92c29f4` -> `fdccaf8`, v2 `4d069ee` -> `f2351f8` (before this doc commit) |
| 12 | API + frontend deployment | **WAITING FOR APPROVAL** | Pushing `main` deploys Railway (root `/server`) and Vercel. Until then any API deploy builds the old `92c29f4`: do not click Deploy on staged changes |
| 13 | Bot hosting | **PREPARED** | Not hosted anywhere now (no Railway service, no webhook, not running on this PC). Start with `node index.js` in `bot/` after the API is verified |
| 14 | Telegram launch test | **BLOCKED** | Needs the deployed API and you in Telegram |

## Tools (outside Git)
- `C:\Users\Dhanu\GlaxMiner-backups\tools\set-bot-token.ps1`: hidden-input token install; `-CopyForRailway` copies it for one paste, then clears the clipboard.
- `C:\Users\Dhanu\GlaxMiner-backups\tools\verify-api-token.js`: after deploy, proves Railway's `BOT_TOKEN` equals `bot/.env` by signing initData locally; prints only status codes.

## Free-plan notes
- Free deployments sleep when idle and wake on traffic; 0.5 GB RAM per service, $1 of usage a month.
- No public database access; the API reaches Postgres over the private network.
- Railway backups need a paid plan; use `npm run backup` from inside Railway's network, or the Data-tab export method.
