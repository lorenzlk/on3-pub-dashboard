import { NextResponse } from "next/server";
import { createRequire } from "node:module";
import { normalizePublisherName, slugifyPublisherName } from "@/lib/publishers";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const ALLOWED_DAYS = new Set([7, 22, 30]);
const DEFAULT_DAYS = 22;

const require = createRequire(import.meta.url);

const { validateConfig, config } = require("../../../../lib/rollupServer/config.js") as {
  validateConfig: () => string[];
  config: {
    spreadsheetId: string;
    tabs: { weekly: { name: string; headerRow: number } };
  };
};

const { getTabRows } = require("../../../../lib/rollupServer/sheetsClient.js") as {
  getTabRows: (
    tabName: string,
    options?: { headerRow?: number; includeFormulas?: boolean }
  ) => Promise<{ headers: unknown[]; rows: Record<string, unknown>[] }>;
};

function parseNumber(value: unknown): number {
  if (value === null || value === undefined || value === "") return 0;
  if (typeof value === "number") return Number.isFinite(value) ? value : 0;
  const cleaned = String(value).replace(/[$,%\s,]/g, "");
  const n = Number(cleaned);
  return Number.isFinite(n) ? n : 0;
}

function formatSheetsDateLike(value: unknown): string {
  if (value === null || value === undefined || value === "") return "";
  if (typeof value === "string") {
    const trimmed = value.trim();
    if (/^\d{4}-\d{2}-\d{2}/.test(trimmed)) return trimmed.slice(0, 10);
    return trimmed;
  }
  if (typeof value === "number" && Number.isFinite(value)) {
    const epochUtcMs = Date.UTC(1899, 11, 30) + Math.round(value) * 86400000;
    return new Date(epochUtcMs).toISOString().slice(0, 10);
  }
  return String(value);
}

function rpm(rev: number, pvs: number): number {
  if (pvs <= 0) return 0;
  return (rev / pvs) * 1000;
}

function vrpm(rev: number, ss: number): number {
  if (ss <= 0) return 0;
  return (rev / ss) * 1000;
}

function ctrPercentFromInviews(clicks: number, inViews: number): number {
  if (inViews <= 0 || !Number.isFinite(clicks) || clicks < 0) return 0;
  return (clicks / inViews) * 100;
}

function weekCountFromDays(days: number): number {
  return Math.max(1, Math.ceil(days / 7));
}

function shortDateLabel(iso: string): string {
  const d = new Date(`${iso}T12:00:00Z`);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "UTC" });
}

type RowAgg = {
  totalRev: number;
  totalPVs: number;
  smartScrollViews: number;
  affiliateClicks: number;
  nextpageClicks: number;
  incrementalImpressions: number;
};

function emptyAgg(): RowAgg {
  return {
    totalRev: 0,
    totalPVs: 0,
    smartScrollViews: 0,
    affiliateClicks: 0,
    nextpageClicks: 0,
    incrementalImpressions: 0,
  };
}

function addRow(a: RowAgg, r: Record<string, unknown>): RowAgg {
  const totalRev = parseNumber(r.total_rev);
  const totalPVs = parseNumber(r.total_pvs);
  const smartScrollViews = parseNumber(r.smart_scroll_views);
  return {
    totalRev: a.totalRev + totalRev,
    totalPVs: a.totalPVs + totalPVs,
    smartScrollViews: a.smartScrollViews + smartScrollViews,
    affiliateClicks: a.affiliateClicks + parseNumber(r.affiliate_clicks),
    nextpageClicks: a.nextpageClicks + parseNumber(r.nextpage_clicks),
    incrementalImpressions: a.incrementalImpressions + parseNumber(r.nextpage_clicks),
  };
}

function rollUpMetrics(a: RowAgg) {
  const vrpmBlended = vrpm(a.totalRev, a.smartScrollViews);
  const rpmBlended = rpm(a.totalRev, a.totalPVs);
  return {
    ...a,
    vrpm: vrpmBlended,
    rpm: rpmBlended,
    affiliateCtr: ctrPercentFromInviews(a.affiliateClicks, a.smartScrollViews),
    articleCtr: ctrPercentFromInviews(a.nextpageClicks, a.smartScrollViews),
  };
}

function ratioDelta(cur: number, prev: number): number | null {
  if (!Number.isFinite(prev) || prev === 0) return null;
  return (cur - prev) / prev;
}

export async function GET(req: Request) {
  const missing = validateConfig();
  if (missing.length) {
    return NextResponse.json({ error: "Missing required env vars", missingEnv: missing }, { status: 500 });
  }

  const { searchParams } = new URL(req.url);
  const daysRaw = Number(searchParams.get("days")?.trim());
  const windowDays = ALLOWED_DAYS.has(daysRaw) ? daysRaw : DEFAULT_DAYS;
  const windowWeeks = weekCountFromDays(windowDays);

  const tab = config.tabs.weekly;
  const { rows } = await getTabRows(tab.name, { headerRow: tab.headerRow });

  /** weekStart -> aggregate across publishers */
  const byWeek = new Map<string, RowAgg>();
  /** weekStart -> publisher -> aggregate */
  const byWeekPub = new Map<string, Map<string, RowAgg>>();

  for (const r of rows) {
    const rawWeek = r.week_start ?? r.weekStart ?? r.week ?? r.date ?? "";
    const weekStart = formatSheetsDateLike(rawWeek);
    const publisher = normalizePublisherName(String(r.publisher || ""));
    if (!publisher || !weekStart || !/^\d{4}-\d{2}-\d{2}$/.test(weekStart)) continue;

    const agg = byWeek.get(weekStart) ?? emptyAgg();
    byWeek.set(weekStart, addRow(agg, r));

    if (!byWeekPub.has(weekStart)) byWeekPub.set(weekStart, new Map());
    const pm = byWeekPub.get(weekStart)!;
    const pa = pm.get(publisher) ?? emptyAgg();
    pm.set(publisher, addRow(pa, r));
  }

  const sortedWeeks = [...byWeek.keys()].sort((a, b) => a.localeCompare(b));
  if (sortedWeeks.length === 0) {
    return NextResponse.json({
      windowDays,
      windowWeeks,
      rangeLabel: "—",
      series: [],
      current: null,
      prior: null,
      deltas: null,
      sites: [],
      lastUpdated: new Date().toISOString(),
    });
  }

  const currentKeys = sortedWeeks.slice(-windowWeeks);
  const priorKeys = sortedWeeks.slice(-windowWeeks * 2, -windowWeeks);

  const sumWeeks = (keys: string[]): RowAgg => {
    const out = emptyAgg();
    for (const k of keys) {
      const a = byWeek.get(k);
      if (!a) continue;
      out.totalRev += a.totalRev;
      out.totalPVs += a.totalPVs;
      out.smartScrollViews += a.smartScrollViews;
      out.affiliateClicks += a.affiliateClicks;
      out.nextpageClicks += a.nextpageClicks;
      out.incrementalImpressions += a.incrementalImpressions;
    }
    return out;
  };

  const curAgg = sumWeeks(currentKeys);
  const prevAgg = sumWeeks(priorKeys);
  const cur = rollUpMetrics(curAgg);
  const prev = rollUpMetrics(prevAgg);

  const spanDays = Math.max(1, windowWeeks * 7);
  const dailyAvgRev = cur.totalRev / spanDays;

  const firstWeek = currentKeys[0]!;
  const lastWeek = currentKeys[currentKeys.length - 1]!;
  const rangeLabel = `${shortDateLabel(firstWeek)} – ${shortDateLabel(lastWeek)}, ${lastWeek.slice(0, 4)}`;

  const series = currentKeys.map((wk) => {
    const a = byWeek.get(wk)!;
    const m = rollUpMetrics(a);
    return {
      weekStart: wk,
      totalRev: m.totalRev,
      vrpm: m.vrpm,
      inViews: m.smartScrollViews,
      commerceClicks: m.affiliateClicks,
    };
  });

  const deltas = {
    totalRevRatio: ratioDelta(cur.totalRev, prev.totalRev),
    vrpmRatio: ratioDelta(cur.vrpm, prev.vrpm),
    inViewsRatio: ratioDelta(cur.smartScrollViews, prev.smartScrollViews),
    commerceClicksRatio: ratioDelta(cur.affiliateClicks, prev.affiliateClicks),
    incrementalRatio: ratioDelta(cur.incrementalImpressions, prev.incrementalImpressions),
    affiliateCtrPp: cur.affiliateCtr - prev.affiliateCtr,
    articleCtrPp: cur.articleCtr - prev.articleCtr,
  };

  /** Sites: per-publisher totals in current window */
  const siteMap = new Map<string, RowAgg>();
  for (const wk of currentKeys) {
    const pm = byWeekPub.get(wk);
    if (!pm) continue;
    for (const [pub, a] of pm) {
      const acc = siteMap.get(pub) ?? emptyAgg();
      siteMap.set(
        pub,
        {
          totalRev: acc.totalRev + a.totalRev,
          totalPVs: acc.totalPVs + a.totalPVs,
          smartScrollViews: acc.smartScrollViews + a.smartScrollViews,
          affiliateClicks: acc.affiliateClicks + a.affiliateClicks,
          nextpageClicks: acc.nextpageClicks + a.nextpageClicks,
          incrementalImpressions: acc.incrementalImpressions + a.incrementalImpressions,
        }
      );
    }
  }

  const sitesUnsorted = [...siteMap.entries()].map(([name, a]) => {
    const m = rollUpMetrics(a);
    return {
      name,
      slug: slugifyPublisherName(name),
      revenue: m.totalRev,
      rpm: m.vrpm,
      views: m.smartScrollViews,
      clicks: m.affiliateClicks,
    };
  });
  sitesUnsorted.sort((x, y) => y.revenue - x.revenue);
  const sites = sitesUnsorted.filter((s) => s.revenue > 0 || s.views > 0);

  return NextResponse.json({
    publisher: "All On3 sites",
    slug: "combined",
    windowDays,
    windowWeeks,
    rangeLabel,
    series,
    current: {
      totals: {
        totalRev: cur.totalRev,
        totalPVs: cur.totalPVs,
        vrpm: cur.vrpm,
        smartScrollViews: cur.smartScrollViews,
        commerceClicks: cur.affiliateClicks,
        incrementalImpressions: cur.incrementalImpressions,
        affiliateCtr: cur.affiliateCtr,
        articleCtr: cur.articleCtr,
      },
      dailyAvgRev,
      spanDays,
      weekStart: firstWeek,
      throughWeek: lastWeek,
    },
    prior: {
      totals: {
        totalRev: prev.totalRev,
        vrpm: prev.vrpm,
        smartScrollViews: prev.smartScrollViews,
        commerceClicks: prev.affiliateClicks,
        incrementalImpressions: prev.incrementalImpressions,
        affiliateCtr: prev.affiliateCtr,
        articleCtr: prev.articleCtr,
      },
      weekKeys: priorKeys,
    },
    deltas,
    sites,
    lastUpdated: new Date().toISOString(),
  });
}
