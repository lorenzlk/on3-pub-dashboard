# System patterns

## Architecture

```
Browser → DashboardDataProvider → GET /api/live
              ↓
    sheetsClient.getTabRows (×3 tabs, in-memory cache)
              ↓
    metrics.buildKpis | buildRollupQa (identity + widget columns + MoM sanity) | aggregates | weekly builders
              ↓
    JSON: kpis, qa, monthlyTotals, publisherTotals, weeklyTrend,
          weeklyByPublisher, publisherMoM, lastUpdated
```

## Key locations

| Concern | Path |
|--------|------|
| Live API route | `src/app/api/live/route.ts` |
| Client payload hook | `src/lib/dashboard-data-context.tsx` |
| Rollup / math (CJS) | `src/lib/rollupServer/metrics.js` |
| Sheet fetch + cache | `src/lib/rollupServer/sheetsClient.js` |
| Tab names, env | `src/lib/rollupServer/config.js` |
| Shared KPI typings | `src/lib/live-payload-types.ts` |
| Persona transforms | `src/lib/persona-metrics.ts` |
| Main dashboard page | `src/app/page.tsx` |
| Persona shell + routes | `src/app/dashboard/*`, `DashboardPersonaShell`, `PersonaSwitcher` |

## Integration pattern: Next + CJS rollup

The API route uses **`createRequire`** to load **`metrics.js`** (CommonJS) from TypeScript. Keep rollup files **Node-friendly** and **exported via `module.exports`**.

## Persona views

- Routes: `/dashboard/ceo`, `/coo`, `/cro`, `/cpo`; `/dashboard` redirects to CEO.
- Same **`LivePayload`**; each page selects slices (e.g. `weeklyByPublisher` for COO variance charts).
- Shared components live under `src/components/dashboard/` (e.g. `KpiHeroCard`, `TrendChart`, `CooPublisherPerformanceTable`).

## Sync with monorepo

`npm run sync-rollup-lib` copies `metrics.js`, `sheetsClient.js`, `config.js` from `../src` when present; standalone clones skip and use committed `src/lib/rollupServer/`.

## Sibling repo: `MulaNetworkReporting` (billing & rollup source)

The **Google Apps Script** project that builds **Mula Network Rollup** and **monthly billing** lives alongside this app (path may be `../MulaNetworkReporting`). For **gross vs net**, **rev-share**, **credit/debit streams**, and **payment direction**, read **`BillingConfig.js`** and **`BillingCalculator.js`** there; **`productContext.md`** summarizes the split between rollup KPIs (this UI) and billing settlement (that repo).

## Conventions

- Prefer **small diffs**; extend `K` aliases and builders in **`metrics.js`** when sheet columns evolve.
- **Type** client consumers; keep **`LivePayload`** optional fields backward-tolerant when possible.
- **No new dependencies** for persona work unless product explicitly approves (per project norms).
