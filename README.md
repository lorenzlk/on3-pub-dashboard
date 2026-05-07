Executive dashboard for Penske reporting (live data via `GET /api/live`).

## Repository

**GitHub:** [github.com/lorenzlk/penske-dashboard](https://github.com/lorenzlk/penske-dashboard)

This app works as **the root of its own repo** (`package.json` and `railway.toml` at the top level).

- **Rollup logic** (`metrics.js`, `sheetsClient.js`, `config.js`) lives in `src/lib/rollupServer/`.

## Railway

1. [Railway](https://railway.app) → **New Project** → **Deploy from GitHub** → select **penske-dashboard**.
2. Service → **Variables** → set the same keys as [`env.example`](./env.example): `GOOGLE_SHEETS_SPREADSHEET_ID`, `GOOGLE_SERVICE_ACCOUNT_EMAIL`, `GOOGLE_PRIVATE_KEY`, optional `CACHE_TTL_MS`.
3. Deploy. Railway health check: `GET /api/healthz` (liveness; no external deps).

---

## Local development

Run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000). Env: `.env.local` (copy from `env.example`).

## Diagnostics

- **`GET /api/healthz`**: **liveness** probe (always safe for deploy healthchecks; does not call Google).
- **`GET /api/health`**: validates required env vars, then does lightweight reads of the configured tabs and returns **header + row counts**. Use this first after a Sheet migration to quickly detect: wrong spreadsheet ID, missing service-account access, or renamed tabs / header rows.
- **`GET /api/live`**: on failure, includes **missing env vars** (when applicable) and echoes the configured **spreadsheetId + tab names** to reduce guesswork during deploy debugging.

### If you see `Requested entity was not found`

That message is coming from Google Sheets. In practice it usually means one of:

- **`GOOGLE_SHEETS_SPREADSHEET_ID` is wrong** in the environment you deployed (Railway variables), or
- The spreadsheet exists but **is not shared** with **`GOOGLE_SERVICE_ACCOUNT_EMAIL`**, or
- A configured **tab name** does not exist in that spreadsheet.

On Railway, prefer **no surrounding quotes** for `GOOGLE_PRIVATE_KEY` (paste the PEM with real newlines). If you must use `\n` escapes, ensure Railway is not double-escaping them.

The error string from `/api/live` should now include **which tab read failed** (look for `values.get` + the tab name).
