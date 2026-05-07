# Rollup server (CommonJS)

These files are the **source of truth** in a standalone dashboard repo. In the **MulaNetworkReporting** monorepo they are copied from `lori-dashboard-web/src/` when you run `npm run sync-rollup-lib` (that script no-ops if `../src` is missing).

After changing the originals in the parent folder (monorepo only), run:

```bash
npm run sync-rollup-lib
```

(from this `executive-dashboard` directory)
