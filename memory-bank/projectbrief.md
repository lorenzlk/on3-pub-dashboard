# Project brief — On3 Publisher Dashboard

## Purpose

Standalone **Next.js** application that surfaces **On3 publisher reporting** from a **Google Sheet** (rollup tabs). No application database; the spreadsheet is the system of record for displayed metrics.

**Primary data source:** `GOOGLE_SHEETS_SPREADSHEET_ID=1TrFxliMogEJGdfiHFcDCSymxKN6Vlb0-9ECs4rg9Ouw`

**Upstream pipeline context (Apps Script):** `1R3nQv8_6XI7sOqacQXj9fv4pmfI1jBou6_S5GNg4vCgO5a7cORlgDkuu`

## Scope (in)

- Read-only ingestion from Google Sheets (service account).
- Executive UI: KPIs, charts, publisher tables, data-quality (QA) signals.
- **`GET /api/live`** as the single live JSON surface for the client.
- Deploy targets: **Railway** (and documented Netlify/monorepo paths per `README.md`).

## Scope (out)

- Writing back to Sheets from this app.
- Authn/authz for end users (dashboard is not a multi-tenant product in-repo unless added later).
- Replacing rollup business logic duplicated in **MulaNetworkReporting** without an explicit merge/sync decision.

## Canonical repo

**github.com/lorenzlk/on3-pub-dashboard**

## Success criteria

- Accurate display of network + publisher rollups for the configured sheet.
- Safe deploy with env vars from `env.example`.
- Changes stay small, testable (`npm run lint`, `npm run build`), and traceable via **Memory Bank** + git.
