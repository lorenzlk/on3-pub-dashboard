import { NextResponse } from "next/server";
import { createRequire } from "node:module";
import { normalizePublisherName } from "@/lib/publishers";

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

type WeeklyRow = {
  weekStart: string;
  year: number;
  publisher: string;
  totalPVs: number;
  smartScrollViews: number;
  widgetLoads: number;
  sessions: number;
  totalRev: number;
  affiliateRev: number;
  emailRev: number;
  kvpRev: number;
  kvpImpressions: number;
  videoRev: number;
  nativeRev: number;
  totalRpm: number;
  totalVrpm: number;
  totalClicks: number;
  affiliateClicks: number;
  nextpageClicks: number;
  affiliateEpc: number;
  affiliateCtr: number;
  nextArtCtr: number;
};

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

export async function GET() {
  const missing = validateConfig();
  if (missing.length) {
    return NextResponse.json({ error: "Missing required env vars", missingEnv: missing }, { status: 500 });
  }

  const tab = config.tabs.weekly;
  const { rows } = await getTabRows(tab.name, { headerRow: tab.headerRow });

  const weekly: WeeklyRow[] = [];
  for (const r of rows) {
    const rawWeek = r.week_start ?? r.weekStart ?? r.week ?? r.date ?? "";
    const weekStart = formatSheetsDateLike(rawWeek);
    const year = Math.floor(parseNumber(r.year));
    const publisher = normalizePublisherName(String(r.publisher || ""));
    if (!publisher || !weekStart || !year) continue;

    const totalRev = parseNumber(r.total_rev);
    const totalPVs = parseNumber(r.total_pvs);
    const smartScrollViews = parseNumber(r.smart_scroll_views);
    const kvpImpressions = parseNumber(r.nextpage_clicks);
    const rpmSheet = parseNumber(r.total_rpm);
    const vrpmSheet = parseNumber(r.total_vrpm);
    const totalRpm = rpmSheet > 0 ? rpmSheet : rpm(totalRev, totalPVs);
    const totalVrpm = vrpmSheet > 0 ? vrpmSheet : vrpm(totalRev, smartScrollViews);

    weekly.push({
      weekStart,
      year,
      publisher,
      totalPVs,
      smartScrollViews,
      widgetLoads: parseNumber(r.widget_loads),
      sessions: parseNumber(r.sessions),
      totalRev,
      affiliateRev: parseNumber(r.affiliate_rev),
      emailRev: parseNumber(r.email_rev),
      kvpRev: parseNumber(r.kvp_rev),
      kvpImpressions,
      videoRev: parseNumber(r.video_rev),
      nativeRev: parseNumber(r.native_rev),
      totalRpm,
      totalVrpm,
      totalClicks: parseNumber(r.total_clicks),
      affiliateClicks: parseNumber(r.affiliate_clicks),
      nextpageClicks: parseNumber(r.nextpage_clicks),
      affiliateEpc: parseNumber(r.affiliate_epc),
      affiliateCtr: ctrPercentFromInviews(parseNumber(r.affiliate_clicks), smartScrollViews),
      nextArtCtr: ctrPercentFromInviews(parseNumber(r.nextpage_clicks), smartScrollViews),
    });
  }

  weekly.sort((a, b) => String(a.weekStart).localeCompare(String(b.weekStart)));

  const kpis =
    weekly.length > 0
      ? (() => {
          let totalRev = 0;
          let totalPVs = 0;
          let smartScrollViews = 0;
          let widgetLoads = 0;
          let sessions = 0;
          let totalClicks = 0;
          let nextpageClicks = 0;
          let commerceClicks = 0;
          let incrementalImpressions = 0;
          let affiliateRev = 0;
          for (const w of weekly) {
            totalRev += w.totalRev;
            totalPVs += w.totalPVs;
            smartScrollViews += w.smartScrollViews;
            widgetLoads += w.widgetLoads;
            sessions += w.sessions;
            totalClicks += w.totalClicks;
            nextpageClicks += w.nextpageClicks;
            commerceClicks += w.affiliateClicks;
            incrementalImpressions += w.kvpImpressions;
            affiliateRev += w.affiliateRev;
          }
          const rpmBlended = rpm(totalRev, totalPVs);
          const vrpmAll = vrpm(totalRev, smartScrollViews);
          const affiliateCtr = ctrPercentFromInviews(commerceClicks, smartScrollViews);
          const articleCtr = ctrPercentFromInviews(nextpageClicks, smartScrollViews);
          const affiliateEpc = commerceClicks > 0 ? affiliateRev / commerceClicks : 0;
          const firstWeek = weekly[0]!.weekStart;
          const lastWeek = weekly[weekly.length - 1]!.weekStart;
          return {
            period: {
              weekLabel: "All time",
              weekStart: firstWeek,
              throughWeek: lastWeek,
            },
            totals: {
              totalRev,
              totalPVs,
              sessions,
              rpm: rpmBlended,
              vrpm: vrpmAll,
              widgetLoads,
              smartScrollViews,
              totalClicks,
              nextpageClicks,
              commerceClicks,
              incrementalImpressions,
              affiliateCtr,
              affiliateEpc,
              articleCtr,
            },
            wow: null,
          };
        })()
      : null;

  return NextResponse.json({
    publisher: "All On3 sites",
    slug: "combined",
    lastUpdated: new Date().toISOString(),
    weekly: [],
    monthly: [],
    kpis,
  });
}

