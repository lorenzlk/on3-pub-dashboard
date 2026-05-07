/**
 * Quick QA: assert network weekly and per-publisher weekly formulas use PVs vs SS in-views correctly.
 * Run: node scripts/verify-metrics-formulas.cjs
 */
const assert = require("node:assert/strict");
const {
  buildWeeklyTrend,
  buildWeeklyByPublisher
} = require("../src/lib/rollupServer/metrics.js");

const week = "2026-01-06";

const weeklyRows = [
  {
    publisher: "SiteA",
    week_start: week,
    total_rev: 1000,
    total_pvs: 100_000,
    widget_loads: 50_000,
    ss_in_views: 40_000
  },
  {
    publisher: "SiteB",
    week_start: week,
    total_rev: 500,
    total_pvs: 50_000,
    widget_loads: 30_000,
    smart_scroll_in_views: 20_000
  }
];

const trend = buildWeeklyTrend(weeklyRows, 24);
assert.equal(trend.length, 1);
const t0 = trend[0];
assert.equal(t0.totalPVs, 150_000);
assert.equal(t0.widgetLoads, 80_000);
assert.equal(t0.smartScrollViews, 60_000);
assert.ok(Math.abs(t0.blendedRpm - 10) < 1e-6, `blendedRpm want 10 got ${t0.blendedRpm}`);
assert.ok(Math.abs(t0.blendedVrpm - 25) < 1e-6, `blendedVrpm want 25 got ${t0.blendedVrpm}`);

const byPub = buildWeeklyByPublisher(weeklyRows, 12);
const siteA = byPub.find((r) => r.publisher === "SiteA");
assert.ok(siteA);
assert.ok(Math.abs(siteA.rpm - 10) < 1e-6, "publisher rpm uses rev/PVs");
assert.ok(Math.abs(siteA.vrpm - 25) < 1e-6, "publisher vRPM uses rev/SS in-views not widget loads");

console.log("verify-metrics-formulas: ok");
