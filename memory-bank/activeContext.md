# Active context

**Last updated:** 2026-05-07 (publisher home summary dashboard; **`mb-095`**)

## Current focus

- **Memory Bank** initialized at `memory-bank/` per **`AGENTS.MD`** — canonical context for agents and humans.
- **On3 repo initialized**: bootstrapped from the Penske dashboard template to reuse the proven Next.js + Sheets ingestion architecture and publisher UI.
- **Single source of truth**: Google Sheet `1TrFxliMogEJGdfiHFcDCSymxKN6Vlb0-9ECs4rg9Ouw` (set in `env.example`; configure in Railway vars for deploys).
- **Pipeline reference**: Apps Script project id `1R3nQv8_6XI7sOqacQXj9fv4pmfI1jBou6_S5GNg4vCgO5a7cORlgDkuu` (not called by this app; useful for upstream debugging).
- **Publisher-facing surface**: `/p/[slug]` pages backed by `/api/publisher/[slug]` reading the rollup weekly totals; home page shows the windowed publisher dashboard + site breakdown (**`GET /api/on3/summary`**).
- **Publisher KPI honesty** (`mb-079`): hero-card sparklines on **`/p/[slug]`** use the actual trailing week count (up to 12); footer copy matches. (Home **`/`** hero revenue uses the summary window weeks from the selected 7d/22d/30d pill.)
- **Publisher scope** (**`mb-085`**, evolves **`mb-083`**): `/p/[slug]` is **all-time aggregates** (sums + blended RPM/vRPM + CTR from total clicks ÷ total in-views); **no weekly trend charts** and **no sparklines/WoW** on hero tiles. Period header shows first→last week in the rollup. Seven tile order unchanged.
- **Publisher visual grouping** (**`mb-086`**): hero tile **accent colors** follow widget family — **cyan** traffic, **emerald** commerce, **violet** article.
- **Publisher leaderboard** (**`On3PublisherLeaderboard`** + **`GET /api/publishers/leaderboard`**): retained for **`/p/[slug]`** and exec surfaces if needed; **home `/`** site list is the **`On3PublisherDashboard`** table (not the card grid).
- **Publisher quick-view** (**`mb-088`**, **`mb-090`**, **`mb-099`**): **`PublisherQuickViewModal`** — large-type metrics (no channel split; see home **`channels`** from **`/api/on3/summary`**); opened from **home site table** or **`/p/[slug]`**.
- **CTR semantics** (**`mb-084`**): Affiliate and article CTR in `/api/publisher/[slug]` are **recomputed** as clicks ÷ **in-view impressions** (Smart Scroll views), not PV-based sheet columns.
- **Home UX** (**`mb-095`**–**`mb-098`**): **`/`** uses **`useOn3Summary()`**; **`GET /api/on3/summary`** returns one **calendar month** of weekly rollup (query **`year`**, **`month`**); header has **month** buttons (and **year** when multiple years in sheet); **no** period-over-period / YoY deltas. **`/api/on3/all-time`** remains for lifetime aggregates elsewhere.
- **No Mula rev share in product** (**`mb-093`** supersedes **`mb-092`**): **`mula_rev` / Mula revenue is not read or exposed** in rollup metrics, **`GET /api/live`**, publisher APIs, or executive UI. Gross revenue and channel gross only; **`channelBreakdown`** removed from live JSON.
- **Executive visual polish** (**`mb-094`**): **`DashboardSectionHeader`** (gradient accent bar); **`KpiHeroCard`** **`spotlight`** on CEO/CRO gross; CEO **Trailing 12 weeks** chart shell; Penske home KPIs use **cyan** section accent.

## What to do next (when touching this repo)

1. Read **`memory-bank/projectbrief.md`**, **`productContext.md`**, **`systemPatterns.md`** (and **`techContext.md`** if changing tooling or env).
2. After substantive edits: append **`memory-bank/progress.jsonl`**, regenerate **`progress.md`**, refresh this file if focus shifts.

## Open considerations

- **CRO publisher deep links** (**`mb-055`**, **`mb-056`**): canonical **`/dashboard/cro?publisher=<name>`**; on **`/dashboard/cro`** drill-down opens in a **modal overlay** (backdrop, Escape, X); home CRO keeps **inline** two-column drill-down.
- **Dark UI readability** (**`mb-054`**): global CSS variables and **`zinc-900` / `text-zinc-500`** swaps vs **`zinc-950` / `text-zinc-600`**; tune per surface if contrast still low.
- **Weekly sheet columns**: if PVs / Smart Scroll / RPM columns are missing, persona charts degrade gracefully but may look sparse.
- **Upstream changes**: if the source sheet renames columns, extend `src/lib/rollupServer/metrics.js` alias map (`K`) instead of adding one-off parsing.
- **`AGENTS.MD` filename** is uppercase; some tools expect `AGENTS.md` — rename or symlink if discovery fails.

## Not in flight

- User authentication layer.
- New databases or replacement of Sheets as source.
