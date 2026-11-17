# Phase 0 (v2): security hotfixes on the original economy

Branch: `security/phase-0-v2`, based directly on `92c29f4` (= `main`, the last production deploy).
**Nothing here has been deployed, migrated or run against production.**

The earlier branch `security/phase-0` (and an identical copy, `wip/economy-and-deposits`) keeps your
uncommitted 8 h / 5 GLX work, Auto Miner and deposits. None of that is in this release.

---

## 1. Economy: unchanged from 92c29f4

`server/config/mining.js` is byte-identical to `92c29f4` (a test checks this).

| Value | Production (92c29f4) | This release |
|---|---|---|
| Session length | 5 h | 5 h (now enforced by the server) |
| Reward per session by pickaxe level 1 to 10 | 100, 125, 155, 190, 230, 280, 340, 420, 520, 650 | Same |
| Upgrade cost to reach level 1 to 10 | 0, 500, 1,200, 2,500, 5,000, 10,000, 18,000, 30,000, 50,000, 80,000 | Same |
| Referral economics | None | None |
| Auto Miner, USDT/BNB deposits | Not present | Not present |

## 2. What changed

| Area | Change | Files |
|---|---|---|
| Authentication | Every API route except `GET /` requires `Authorization: tma <initData>`. The server verifies Telegram's HMAC signature with `BOT_TOKEN` and rejects data older than 24 h. The user ID comes only from the signed data; `telegramId` in a body is ignored; `GET /user/:telegramId` returns 403 for anyone but the owner | `server/middleware/telegramAuth.js`, `server/app.js`, `server/routes/*` |
| addBalance | `POST /user/addBalance` removed (anyone could credit any amount to anyone) | `server/routes/user.js`, `app/src/api/userApi.js` |
| Mining start | One atomic `UPDATE … WHERE mining IS NOT TRUE`: a second start while mining is refused | `server/routes/mining.js` |
| Mining claim | Pays the level reward only when 5 h have passed since the start; row lock plus reset in one transaction, so exactly one claim per session. Before, `/mine/claim` paid the full reward any number of times with no session and no wait | `server/routes/mining.js` |
| Pickaxe upgrade | Same costs; verified caller only; check and debit under a row lock in one transaction | `server/routes/upgrades.js` |
| Route mismatches | The app called `/mine/sync` and a localhost leaderboard, neither of which existed. Added read-only `GET /mine/status` and `GET /user/leaderboard` (username, balance and level only) and `GET /user/me`; the app now calls these | `server/routes/*`, `app/src/api/*`, `app/src/pages/Leaderboard.jsx` |
| Claim in the app | The app never called `/mine/claim`, so mining through the app credited nothing. It now shows a Claim button when the server says the session is complete | `app/src/hooks/useMining.js`, `app/src/components/MiningCard.jsx` |
| Displayed values | The app showed 8 h and "5 GLX per cycle". It now shows the server's duration, reward and level | `MiningCard.jsx`, `ProgressBar.jsx`, `StatsCards.jsx` |
| Telegram sign-in | `index.html` never loaded `telegram-web-app.js`, so `window.Telegram` was undefined and the app fell back to telegram_id `1` ("Developer") for everyone. The script is now loaded and the fallback removed; outside Telegram the app says "Open GlaxMiner from Telegram" | `app/index.html`, `app/src/context/AuthContext.jsx`, `app/src/App.jsx` |
| Rate limiting | In-memory limits: 120 requests/min per IP, 60/min per user, 10 state-changing POSTs/min per user (429 beyond) | `server/middleware/rateLimit.js`, `server/app.js` |
| CORS | Exact origins only: `https://glax-miner.vercel.app` by default, or the list in `ALLOWED_ORIGINS` | `server/app.js` |
| Deposits | Every former deposit and Auto Miner path (`/wallet/*`, `/upgrade/wallet/*`, `/upgrade/auto-miner/*`) answers **503 "Deposits are unavailable"** and credits nothing. Nothing in the app can submit a deposit. Real deposits wait for sender-ownership verification (separate phase) | `server/app.js` |
| Local development | Outside Telegram, a dev build can use `VITE_DEV_INIT_DATA` (a real initData from a test bot; the server still verifies it). Production builds strip this code | `app/src/api/api.js`, `app/.env.example` |
| Secrets | `server/.env` and `bot/.env` untracked (local files kept); `.gitignore` rules; `.env.example` templates | root |
| Schema | **No migrations.** The boot-time `CREATE TABLE IF NOT EXISTS users` moved verbatim to `server/db/init.js`; it never alters existing rows | `server/db/init.js` |
| Preflight | `npm run preflight`: read-only report (in a READ ONLY transaction) | `server/scripts/preflight-check.js` |

### Behaviour players will notice
- Rewards now arrive when you tap **Claim** after a 5 h session. Before, mining in the app credited nothing (it called a route that did not exist).
- The app shows 5 h and the real reward for your level instead of 8 h / 5 GLX.
- The app works only when opened from Telegram.

### Known limitations (later phases)
- Balance and history are not yet a ledger; that is Phase 1.
- Rate-limit counters live in memory (fine for one API instance).
- The leaderboard shows usernames and balances, as the page already intended.
- Home-screen cards `BalanceCard` (placeholder pool numbers) and `InviteCard` (hard-coded code) are unchanged visual placeholders; the redesign replaces them.

---

## 3. Production status (2026-11-18)

| What | Evidence | Status |
|---|---|---|
| API on Railway | GitHub deployment records from the Railway app: 26 deploys to "disciplined-flow / production", last `92c29f4` on 2026-08-08, marked **inactive** on 2026-09-04; `glaxminer-production.up.railway.app` answers Railway's own 404 "Application not found" | **Not running** |
| Database | `hayabusa.proxy.rlwy.net:24741` accepts TCP and resets the connection before the Postgres SSL handshake | **Unknown**: removed, paused, or the proxy is off |
| Frontend | `glax-miner.vercel.app` serves the `92c29f4` build, which calls the dead Railway API | Live but non-functional |

**Before anything else, in the Railway dashboard (project `88d97f95-…`, environment "production"):**
1. Is the API service still there? Was it deleted, or is it paused or out of credits?
2. Is the Postgres service still there, with its volume and data?
3. Did any deploy happen with `railway up` (CLI deploys don't show in GitHub)?

If the database is gone, there is nothing to migrate and no balances to preserve; say so and we plan a fresh start. If it is there, continue below.

---

## 4. Order of operations (each step needs your go-ahead)

1. **Backup** (section 5). Nothing touches the database before this.
2. **Rotate** the database password and the bot token (section 6).
3. **Preflight** with the new credentials: `npm run preflight > preflight-before.txt`. Review: column types, totals, the top-10 balances, and the `telegram_id = 1` account.
4. **Deploy the API** from `security/phase-0-v2` with the env vars in section 7. Check `GET /` and the logs.
5. **Deploy the frontend** from the same branch right after.
6. **Smoke test** from Telegram: sign in, start mining, see 5 h; upgrade with enough GLX; leaderboard loads.
7. **Preflight again** (`preflight-after.txt`): totals must match apart from new activity.

No migrations are needed for this release.

**Rollback:** redeploy the previous builds. Nothing in the schema changes, so no database rollback exists or is needed.

---

## 5. Production backup

Do one of these, then confirm the backup opens.

- Railway → Postgres service → **Backups** → create a manual backup (if your plan has backups).
- From a machine with PostgreSQL client tools (use the current `DATABASE_PUBLIC_URL` from the Railway dashboard, not the leaked one in git history):

```bash
pg_dump "$DATABASE_PUBLIC_URL" --format=custom --no-owner --file=glaxminer-before-phase0.dump
```

```bash
pg_restore --list glaxminer-before-phase0.dump | head
```

Keep the dump outside the repository.

**Plus a verified logical backup (no PostgreSQL client tools needed).** With `DATABASE_URL` set to the current public URL in your shell (never in a file in the repo):

```bash
cd server
npm run backup -- C:/Users/Dhanu/GlaxMiner-backups/prod-before-phase0
```

```bash
npm run backup:verify -- C:/Users/Dhanu/GlaxMiner-backups/prod-before-phase0
```

The first command reads one consistent, read-only snapshot and writes `schema.json`, one `.ndjson` file per table and `manifest.json` (row counts, md5 checksums, balance totals). The second restores everything into a throwaway local Postgres and fails unless every count and checksum matches; it writes `restore-verification.json`. The tool refuses to write inside the repository and never prints the URL. It is tested against both this branch's schema and the WIP schema (`users` with NUMERIC balances, `usdt_deposits`, `wallet_transactions`, partial unique indexes).

---

## 6. Secret rotation (treat both as compromised)

Both values have been in public git history since the first commit.

> Never paste new secrets into chat, an issue or a commit. Put them only in Railway, Vercel, your bot host and your local untracked `.env` files.

### 6a. Database password (Railway Postgres)
1. After the backup: Railway → Postgres → **Variables**. Generate a new strong password (32+ random characters).
2. Change the role's password in the database (Railway Data/Query tab or `psql`): `ALTER ROLE postgres WITH PASSWORD '<new>';`
3. Set the Postgres service's password variable to the same value so `DATABASE_URL` and `DATABASE_PUBLIC_URL` change; redeploy Postgres if Railway asks. Check Railway's current docs for the exact control on your template.
4. API service → **Variables**: set `DATABASE_URL` to the reference `${{Postgres.DATABASE_URL}}` (private network), not a pasted string.
5. Consider turning off the public TCP proxy if nothing outside Railway needs it; the leaked URL pointed at it.
6. Verify: the old URL fails with an authentication error; the API logs `✅ Connected to PostgreSQL`; preflight with the new URL matches your "before" numbers.

### 6b. Telegram bot token
1. @BotFather → `/mybots` → your bot → **API Token** → **Revoke current token**. The old token stops working immediately.
2. Set the new token as `BOT_TOKEN` on the **bot host** and on the **Railway API service** (new and required: the API verifies sign-ins with it; it must be the same bot that opens the Mini App), and in your local untracked `.env` files.
3. Verify on your own machine (don't share the output):

```bash
curl -s https://api.telegram.org/bot<NEW_TOKEN>/getMe
```

```bash
curl -s https://api.telegram.org/bot<OLD_TOKEN>/getMe
```

The first must say `"ok":true`, the second `401 Unauthorized`. Then send `/start` to the bot and check the button opens the app.

---

## 7. Environment variables

| Where | Variable | Value |
|---|---|---|
| Railway API | `DATABASE_URL` | `${{Postgres.DATABASE_URL}}` |
| Railway API | `BOT_TOKEN` | new bot token (required) |
| Railway API | `ALLOWED_ORIGINS` | `https://glax-miner.vercel.app` |
| Railway API | `INITDATA_MAX_AGE_SECONDS` | optional, default `86400` |
| Bot host | `BOT_TOKEN` | new bot token |
| Vercel | `VITE_API_URL` | the API's URL if it changes from `https://glaxminer-production.up.railway.app` |

---

## 8. Git history cleanup (not executed; needs your approval after rotation)

`server/.env` and `bot/.env` are in every commit since `1422b89`. Run this on a fresh mirror clone, never on your working copy:

```bash
pip install git-filter-repo
```

```bash
git clone --mirror https://github.com/a3gqqq-crypto/GlaxMiner.git GlaxMiner-mirror
```

```bash
cd GlaxMiner-mirror
```

```bash
git filter-repo --invert-paths --path server/.env --path bot/.env
```

Both of these must print nothing:

```bash
git log --all --oneline -- server/.env bot/.env
```

```bash
git grep -I -e "DATABASE_URL=postgres" -e "BOT_TOKEN=[0-9]" $(git rev-list --all) -- . | head
```

**Approval point:** re-add the remote and force-push.

```bash
git remote add origin https://github.com/a3gqqq-crypto/GlaxMiner.git
```

```bash
git push --force --mirror origin
```

Afterwards every clone must be re-cloned; commit hashes change (including `92c29f4`); GitHub may keep cached views, so treat the old secrets as permanently public.

### Rehearsal result (2026-11-18, local only, nothing pushed)

- Backup first: `C:\Users\Dhanu\GlaxMiner-backups\20261118-020827-pre-history-cleanup\repo-all-refs.bundle` (`git bundle verify`: okay; all 4 branches and `origin/main`), plus `refs-before.txt`.
- GitHub has one ref: `main` = `92c29f4`. The other branches exist only locally.
- On a disposable mirror of the local repo, `git filter-repo --invert-paths --path server/.env --path bot/.env` rewrote 3 commits that touched the files.
- Afterwards: 0 commits touch either file; a scan of every commit for Railway Postgres URLs and bot-token patterns finds 0 matches (the same scan on the original finds both files, so the scan works).
- Every branch keeps its commit count (main 26, security/phase-0-v2 31, security/phase-0 33, wip/economy-and-deposits 33) and has no file differences except the two removed `.env` files. `server/config/mining.js` is byte-identical.
- `92c29f4` would become `fdccaf8`. Re-run the rewrite right before the push so it includes the latest commits.

To push the cleaned history, rewrite a fresh mirror of the **local** repo (so the local-only branches are cleaned too), then push `main` and any branches you want on GitHub with `--force`. This needs your approval after rotation.

---

## 9. Tests

```bash
cd server
npm test
```

55 tests (5 consecutive green runs) against the real Express app on an embedded PostgreSQL 17. They cover: the economy (config byte-identical to 92c29f4, every reward and cost, no 8 h / 5 GLX left), 401 on every route, forged/tampered/expired initData, body `telegramId` ignored, 403 on other users, `addBalance` gone, the 5 h rule to the second, all 10 level rewards, 50 parallel claims paying once, 20 parallel starts, parallel upgrades never double-spending, preserved rows on boot, a read-only preflight, a NUMERIC balance column, rate limiting and CORS (default and configured), 50 concurrent sync/status calls during a finished session, every deposit path returning 503 with a tx hash replayed across endpoints and users crediting nothing, and every frontend API path existing on the server.
