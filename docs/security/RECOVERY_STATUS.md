# GlaxMiner Phase 0 recovery status, 2026-11-18

Legend: **COMPLETED** done · **VERIFIED** done and checked · **PREPARED** ready, waiting for access or approval · **BLOCKED** cannot proceed without you.

| # | Item | Status | Detail |
|---|---|---|---|
| 1 | Railway project and services | **BLOCKED** | The built-in browser is not signed in to Railway (the project URL shows the logged-out 404). No Railway CLI or token on this machine. Public evidence only: last API deploy `92c29f4` on 2026-08-08, inactive since 2026-09-04, URL answers "Application not found" |
| 2 | Original PostgreSQL database exists? | **BLOCKED / unknown** | The public proxy resets connections before the Postgres handshake (re-checked 2026-11-18). Cannot tell deleted from paused without the dashboard |
| 3 | Backup and restore proof | **PREPARED** | No production backup exists. `npm run backup` / `npm run backup:verify` are built and VERIFIED locally on both possible schemas (counts, md5 checksums, balance totals match after restore into a fresh Postgres) |
| 4 | User count and balance totals | **BLOCKED** | Needs database access |
| 5 | Database password rotation | **BLOCKED** | Needs the backup first, and Railway access. Steps: `PHASE0.md` section 6a |
| 6 | Bot token rotation | **BLOCKED** | Needs your Telegram account (BotFather). Consumers of the token: the bot process (`bot/index.js`) and, from this release, the API (`BOT_TOKEN`). Steps: section 6b |
| 7 | Security branch | **VERIFIED** | `security/phase-0-v2`, parent `92c29f4`; `server/config/mining.js` byte-identical |
| 8 | Tests | **VERIFIED** | 56 tests, repeated green runs; frontend build clean; bundle has no secrets or dev-only code |
| 9 | Migrations | **VERIFIED: none needed** | Works on the original INTEGER schema and on a NUMERIC-widened one |
| 10 | Railway deployment | **BLOCKED** | Prerequisites 1 to 6 not met; nothing deployed |
| 11 | Vercel deployment | **BLOCKED** | Not signed in to Vercel; frontend must follow a healthy API anyway |
| 12 | Telegram launch test | **BLOCKED** | Needs a deployed API and your bot |
| 13 | Mining and upgrade tests | **VERIFIED locally only** | Not tested in production |
| 14 | Git history cleanup | **PREPARED + rehearsed** | Bundle backup verified; rehearsal removes both `.env` files from every commit with no other file changes. Force-push needs your approval |

## What you need to do to unblock

1. Sign in to Railway in the Claude app's browser pane (it is open on railway.com/login) — or tell me what the dashboard shows for project `88d97f95-…`: API service, Postgres service, volume, backups, billing.
2. If Postgres exists: take a Railway backup, or let me run `npm run backup` + `npm run backup:verify` with the current `DATABASE_PUBLIC_URL` set in the shell environment.
3. Rotate the bot token in BotFather yourself, and put it in Railway (API + bot) yourself.
4. Approve the deploy once 1 to 3 are done; approve the history force-push after rotation.
