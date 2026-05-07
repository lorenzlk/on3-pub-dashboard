# Product context

## Problem

Leadership and ops need a **fast, trustworthy view** of network revenue, traffic, yield (RPM / vRPM / RPS), and publisher-level performance **without** standing up a separate analytics warehouse for this slice of reporting.

## Users (intent)

- **CEO** — health of the business: **gross** network revenue, **publishers vs Mula** split from rollup columns (Total − Mula vs Mula), MoM movement, concentration risk, high-level trends. Billing remains authoritative for net settlement.
- **COO** — maximize **widget loads ÷ pageviews**, **partner activation** (pubs with loads), **demand mix** (affiliate / KVP / video / native revenue), and **exceptions** (QA, RPM variance vs recent weeks). **Pageviews** = pages where Mula tags load; **widget loads** = tag present + placement + targeting so the unit can serve; **viewability** = **SS in-views ÷ widget loads** (of eligible serves, share seen in-view). Rollup exposes `widget_loads` vs `ss_in_views` / `in_views` separately when columns exist; legacy `smart_scroll_views` backfills both when split columns are missing.
- **CRO** — same **publishers vs Mula** network split (latest month) plus **per-publisher** gross, **Mula share (lifetime)**, and publisher estimate from rollup columns; MoM movement, mix over time, “where to lean.”
- **CPO** — product signals: **loads ÷ PVs**, **viewability (in-views ÷ loads)**, **publisher mix** (share of publishers with meaningful gross in **two or more** of Affiliate / KVP / Video / Native on lifetime rollup), vRPM vs RPM gaps, weekly trends.

## Solution (this repo)

1. **Sheets** hold monthly network, monthly publisher, and weekly rollup tabs (names in `src/lib/rollupServer/config.js`).
2. **Server** fetches tab values (cached TTL), runs **`metrics.js`** to produce KPIs, aggregates, QA checks, and series.
3. **Client** uses **`useDashboardLive()`** → `fetch("/api/live")` and renders the main dashboard plus **persona routes** under `/dashboard/*` that reuse the same payload.

## Revenue semantics (rollup vs billing)

- **Rollup “revenue”** (`total_rev` / `total_revenue` / `revenue` → `totalRevenue` / `totalRev` in **`metrics.js`**) is **gross-style activity revenue** from the sheet: dollars tied to reported delivery / attribution in the rollup, **not** final net settlement across all commercial paths.
- **Commercial reality** includes multiple flows (e.g. demand or networks paying **publishers** with Mula on a **rev share**, or paying **Mula** with Mula paying publishers a **rev share**, and analogous relationships with **demand partners**). How those shares and nets are calculated is owned by **billing** today; this dashboard does **not** replace billing for net-to-Mula or net-to-publisher figures.
- **`mula_rev` / `mulaRevenue`** is a separate column from the rollup when present (e.g. CEO “Mula revenue” card). **Mula ÷ total gross** on the network row is a **sheet ratio** only; it is **not** assumed to match a single contractual margin or rev-share across streams until columns align with billing definitions. **Native** and other channels each follow **agreement-specific** economics. **Billing** remains authoritative for settlement.

### Where billing lives (sibling repo `MulaNetworkReporting`)

When the **Network Reporting** Apps Script project is in the workspace, use it as the canonical spec for settlement math and agreement terms:

| Artifact | Role |
|----------|------|
| **`BillingConfig.js`** | **`PUBLISHER_TERMS`**: per-publisher **`revenueShares`** by stream (e.g. native, mulaAffiliate, kvp, publisherAffiliate, video), **`streams`** classification (**`credit`** = Mula owes publisher, **`debit`** = publisher owes Mula, **`none`**), **`netDays`** / payment terms, **On3** tiered RPM shares, **`PARTNER_TERMS`** (e.g. Freestar fee waiver / PoC dates). |
| **`BillingCalculator.js`** | Monthly engine: pulls month-scoped source from the rollup, applies terms, **nets** as **Credits − Debits** → net transfer amount; **positive** ⇒ Mula pays publisher (ACH), **negative** ⇒ publisher pays Mula (invoice) — see **`MulaNetworkReporting/docs/memory-bank/systemPatterns.md`** (“Billing Netting Direction”). |
| **`BillingQA.js`** | Cross-checks billing totals vs daily source and Monthly Rollup, due dates, waivers, etc. (see **`docs/QA-PLAN.md`**). |
| **`Config.js`** | Ingestion: e.g. video sources may be **gross**; **`publisherRevenueFractionOfGross`** (On3 **0.81**) scales Ex.Co gross into rollup video / total before downstream formulas; comments tie **billing** **`revenueShares.video`** to that rollup slice. |
| **`Code.js` / rollup** | Sheet formulas and **Revenue Share Lookup** (from **`BillingConfig`**) drive **Mula Rev** in the rollup; monthly Mula sums align publishers + network (see **`systemPatterns.md`** in that repo). |

This dashboard reads **Monthly Rollup** tabs only; it does **not** run **`calculateMonthlyBilling`** or duplicate **`BillingConfig`** splits.

## Constraints

- **One live API shape** (`LivePayload`); persona views are **presentation + client-side transforms**, not new fetch endpoints.
- Header/column naming in Sheets can vary; **`metrics.js`** uses alias maps (`K`) to stay resilient.
- Rollup logic may need **sync from monorepo** when the source of truth there changes.

## Trust

**`buildRollupQa`** produces checks (pass/warn/fail) for identity/consistency on the resolved “latest” month. The UI surfaces these so users know when numbers may not reconcile.
