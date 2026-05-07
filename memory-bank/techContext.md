# Tech context

## Stack

- **Node** ≥ 20.9.0
- **Next.js** 15.x (App Router), **React** 18, **TypeScript**
- **Tailwind CSS**, shadcn-style UI under `src/components/ui/`
- **recharts** for charts, **lucide-react** for icons
- **googleapis** (JWT) for Sheets read-only

## Commands (authoritative)

| Command | Purpose |
|---------|---------|
| `npm install` | Dependencies |
| `npm run dev` | Local dev server |
| `npm run build` | Production build |
| `npm run lint` | `tsc --noEmit` + `next lint` |
| `npm run sync-rollup-lib` | Copy rollup trio from `../src` when monorepo layout exists |
| `npm run format` | Biome format |

## Environment

See **`env.example`** at repo root:

- `GOOGLE_SHEETS_SPREADSHEET_ID`
- `GOOGLE_SERVICE_ACCOUNT_EMAIL`
- `GOOGLE_PRIVATE_KEY` (PEM; `\n` normalized in config)
- `CACHE_TTL_MS` (optional)

## Deploy

- **Railway**: `railway.toml` — build runs `sync-rollup-lib && next build`, health `GET /api/health`.
- **PORT**: provided by host in production.

## Tooling notes

- **`postinstall`**: `scripts/patch-next-fork-execargv.cjs` — do not remove without understanding impact.
- **Biome** + **ESLint** coexist; `lint` script is source of truth for CI-style checks.

## Agent contract

- **`AGENTS.MD`** at repo root + this **memory-bank** override informal instructions when they conflict.
- Log meaningful work to **`memory-bank/progress.jsonl`** (append-only).
