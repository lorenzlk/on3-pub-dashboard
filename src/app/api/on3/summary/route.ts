import { NextResponse } from "next/server";
import { createRequire } from "node:module";
import { normalizePublisherName, slugifyPublisherName } from "@/lib/publishers";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

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

function shortDateLabel(iso: string): string {
  const d = new Date(`${iso}T12:00:00Z`);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "UTC" });
}

function monthName(month: number): string {
  return new Date(Date.UTC(2000, month - 1, 1)).toLocaleDateString("en-US", { month: "long", timeZone: "UTC" });
}

/** Inclusive span in days for weekly buckets: first week start through end of last week (+7). */
function spanDaysForWeekKeys(keys: string[]): number {
  if (keys.length === 0) return 1;
  const first = new Date(`${keys[0]!}T12:00:00Z`).getTime();
  const last = new Date(`${keys[keys.length - 1]!}T12:00:00Z`).getTime();
  if (!Number.isFinite(first) || !Number.isFinite(last)) return Math.max(1, keys.length * 7);
  const days = Math.round((last - first) / 86400000) + 7;
  return Math.max(1, days);
}

type RowAgg = {
  totalRev: number;
  totalPVs: number;
  smartScrollViews: number;
  affiliateClicks: number;
  nextpageClicks: number;
  incrementalImpressions: number;
  affiliateRev: number;
  emailRev: number;
  kvpRev: number;
  videoRev: number;
  nativeRev: number;
};

function emptyAgg(): RowAgg {
  return {
    totalRev: 0,
    totalPVs: 0,
    smartScrollViews: 0,
    affiliateClicks: 0,
    nextpageClicks: 0,
    incrementalImpressions: 0,
    affiliateRev: 0,
    emailRev: 0,
    kvpRev: 0,
    videoRev: 0,
    nativeRev: 0,
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
    affiliateRev: a.affiliateRev + parseNumber(r.affiliate_rev),
    emailRev: a.emailRev + parseNumber(r.email_rev),
    kvpRev: a.kvpRev + parseNumber(r.kvp_rev),
    videoRev: a.videoRev + parseNumber(r.video_rev),
    nativeRev: a.nativeRev + parseNumber(r.native_rev),
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

function yearsWithData(sortedWeeks: string[]): number[] {
  const set = new Set<number>();
  for (const w of sortedWeeks) {
    if (w.length >= 4 && /^\d{4}/.test(w)) set.add(Number(w.slice(0, 4)));
  }
  return [...set].sort((a, b) => a - b);
}

function monthsWithDataInYear(sortedWeeks: string[], year: number): number[] {
  const set = new Set<number>();
  const y = `${year}-`;
  for (const w of sortedWeeks) {
    if (!w.startsWith(y) || w.length < 7) continue;
    const m = Number(w.slice(5, 7));
    if (m >= 1 && m <= 12) set.add(m);
  }
  return [...set].sort((a, b) => a - b);
}

function weeksInMonth(sortedWeeks: string[], year: number, month: number): string[] {
  const prefix = `${year}-${String(month).padStart(2, "0")}-`;
  return sortedWeeks.filter((w) => w.startsWith(prefix));
}

export async function GET(req: Request) {
  const missing = validateConfig();
  if (missing.length) {
    return NextResponse.json({ error: "Missing required env vars", missingEnv: missing }, { status: 500 });
  }

  const { searchParams } = new URL(req.url);
  const yearParam = searchParams.get("year")?.trim();
  const monthParam = searchParams.get("month")?.trim();

  const tab = config.tabs.weekly;
  const { rows } = await getTabRows(tab.name, { headerRow: tab.headerRow });

  const byWeek = new Map<string, RowAgg>();
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
  const availableYears = yearsWithData(sortedWeeks);

  const emptyPayload = (rangeLabel: string) =>
    NextResponse.json({
      mode: "monthly",
      selectedYear: null as number | null,
      selectedMonth: null as number | null,
      availableYears,
      monthsWithData: [] as number[],
      windowDays: 0,
      windowWeeks: 0,
      rangeLabel,
      series: [],
      current: null,
      sites: [],
      channels: null,
      lastUpdated: new Date().toISOString(),
    });

  if (sortedWeeks.length === 0 || availableYears.length === 0) {
    return emptyPayload("—");
  }

  let selectedYear: number;
  if (yearParam && /^\d{4}$/.test(yearParam)) {
    const y = Number(yearParam);
    selectedYear = availableYears.includes(y) ? y : availableYears[availableYears.length - 1]!;
  } else {
    const fallback = new Date().getUTCFullYear();
    selectedYear = availableYears.includes(fallback)
      ? fallback
      : availableYears[availableYears.length - 1]!;
  }

  const monthsInYear = monthsWithDataInYear(sortedWeeks, selectedYear);

  let selectedMonth: number;
  if (monthParam && /^\d{1,2}$/.test(monthParam)) {
    const m = Number(monthParam);
    selectedMonth = monthsInYear.includes(m) ? m : monthsInYear[monthsInYear.length - 1]!;
  } else {
    selectedMonth = monthsInYear[monthsInYear.length - 1]!;
  }

  if (monthsInYear.length === 0) {
    return emptyPayload(`No data for ${selectedYear}`);
  }

  const currentKeys = weeksInMonth(sortedWeeks, selectedYear, selectedMonth);

  if (currentKeys.length === 0) {
    return NextResponse.json({
      mode: "monthly",
      selectedYear,
      selectedMonth,
      availableYears,
      monthsWithData: monthsInYear,
      windowDays: 0,
      windowWeeks: 0,
      rangeLabel: `No weeks in ${monthName(selectedMonth)} ${selectedYear}`,
      series: [],
      current: null,
      sites: [],
      channels: { affiliate: 0, email: 0, kvp: 0, video: 0, native: 0 },
      lastUpdated: new Date().toISOString(),
    });
  }

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
      out.affiliateRev += a.affiliateRev;
      out.emailRev += a.emailRev;
      out.kvpRev += a.kvpRev;
      out.videoRev += a.videoRev;
      out.nativeRev += a.nativeRev;
    }
    return out;
  };

  const curAgg = sumWeeks(currentKeys);
  const cur = rollUpMetrics(curAgg);

  const spanDays = spanDaysForWeekKeys(currentKeys);
  const dailyAvgRev = cur.totalRev / spanDays;

  const firstWeek = currentKeys[0]!;
  const lastWeek = currentKeys[currentKeys.length - 1]!;
  const rangeLabel = `${shortDateLabel(firstWeek)} – ${shortDateLabel(lastWeek)} · ${monthName(selectedMonth)} ${selectedYear}`;

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

  const siteMap = new Map<string, RowAgg>();
  for (const wk of currentKeys) {
    const pm = byWeekPub.get(wk);
    if (!pm) continue;
    for (const [pub, a] of pm) {
      const acc = siteMap.get(pub) ?? emptyAgg();
      siteMap.set(pub, {
        totalRev: acc.totalRev + a.totalRev,
        totalPVs: acc.totalPVs + a.totalPVs,
        smartScrollViews: acc.smartScrollViews + a.smartScrollViews,
        affiliateClicks: acc.affiliateClicks + a.affiliateClicks,
        nextpageClicks: acc.nextpageClicks + a.nextpageClicks,
        incrementalImpressions: acc.incrementalImpressions + a.incrementalImpressions,
        affiliateRev: acc.affiliateRev + a.affiliateRev,
        emailRev: acc.emailRev + a.emailRev,
        kvpRev: acc.kvpRev + a.kvpRev,
        videoRev: acc.videoRev + a.videoRev,
        nativeRev: acc.nativeRev + a.nativeRev,
      });
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
    mode: "monthly",
    selectedYear,
    selectedMonth,
    availableYears,
    monthsWithData: monthsInYear,
    windowDays: spanDays,
    windowWeeks: currentKeys.length,
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
    sites,
    channels: {
      affiliate: curAgg.affiliateRev,
      email: curAgg.emailRev,
      kvp: curAgg.kvpRev,
      video: curAgg.videoRev,
      native: curAgg.nativeRev,
    },
    lastUpdated: new Date().toISOString(),
  });
}
