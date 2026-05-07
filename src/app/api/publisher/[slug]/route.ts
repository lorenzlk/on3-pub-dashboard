import { NextResponse } from "next/server";
import { createRequire } from "node:module";
import { normalizePublisherName, publisherSlugMatches } from "@/lib/publishers";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const DEFAULT_MONTH = "04";
const DEFAULT_YEAR = 2026;

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
    // Sheets serial dates are days since 1899-12-30.
    const epochUtcMs = Date.UTC(1899, 11, 30) + Math.round(value) * 86400000;
    return new Date(epochUtcMs).toISOString().slice(0, 10);
  }
  return String(value);
}

type WeeklyRow = {
  weekStart: string;
  weekLabel: string;
  month: string;
  year: number;
  publisher: string;
  humanViews: number;
  botPvs: number;
  totalPVs: number;
  smartScrollViews: number;
  widgetLoads: number;
  sessions: number;
  pvPerSession: number;
  totalRev: number;
  affiliateRev: number;
  emailRev: number;
  kvpRev: number;
  kvpRevEst: number;
  kvpImpressions: number;
  videoRev: number;
  nativeRev: number;
  totalRpm: number;
  totalVrpm: number;
  totalRps: number;
  totalClicks: number;
  affiliateClicks: number;
  nextpageClicks: number;
  videoClicks: number;
  nativeClicks: number;
  affiliateCtr: number;
  affiliateEpc: number;
  nextArtCtr: number;
};

type MonthlyRow = {
  key: string; // YYYY-MM
  year: number;
  month: number; // 1-12
  label: string; // e.g. Apr 2026
  totalRev: number;
  totalPVs: number;
  sessions: number;
  widgetLoads: number;
  smartScrollViews: number;
  affiliateRev: number;
  emailRev: number;
  kvpRev: number;
  kvpRevEst: number;
  videoRev: number;
  nativeRev: number;
  totalClicks: number;
};

function monthToNum(month: string): number | null {
  const m = String(month || "").trim().toLowerCase();
  const map: Record<string, number> = {
    january: 1,
    february: 2,
    march: 3,
    april: 4,
    may: 5,
    june: 6,
    july: 7,
    august: 8,
    september: 9,
    october: 10,
    november: 11,
    december: 12,
  };
  if (map[m]) return map[m];
  const maybe = Object.keys(map).find((k) => k.startsWith(m));
  return maybe ? map[maybe] : null;
}

function monthLabel(monthNum: number, year: number): string {
  const d = new Date(Date.UTC(year, monthNum - 1, 1));
  return d.toLocaleString("en-US", { month: "short", year: "numeric", timeZone: "UTC" });
}

function weekLabel(isoDate: string): string {
  const d = new Date(`${isoDate}T00:00:00Z`);
  if (Number.isNaN(d.getTime())) return isoDate;
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "UTC" });
}

function rpm(rev: number, pvs: number): number {
  if (pvs <= 0) return 0;
  return (rev / pvs) * 1000;
}

function vrpm(rev: number, ss: number): number {
  if (ss <= 0) return 0;
  return (rev / ss) * 1000;
}

/** CTR as percentage (0–100 scale) for UI formatters; denominator = in-view impressions (Smart Scroll views), not PVs. */
function ctrPercentFromInviews(clicks: number, inViews: number): number {
  if (inViews <= 0 || !Number.isFinite(clicks) || clicks < 0) return 0;
  return (clicks / inViews) * 100;
}

export async function GET(
  req: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const missing = validateConfig();
  if (missing.length) {
    return NextResponse.json({ error: "Missing required env vars", missingEnv: missing }, { status: 500 });
  }

  const { slug } = await params;
  const wantedSlug = String(slug || "").trim().toLowerCase();
  if (!wantedSlug) {
    return NextResponse.json({ error: "Missing publisher slug" }, { status: 400 });
  }

  const tab = config.tabs.weekly;
  const { rows } = await getTabRows(tab.name, { headerRow: tab.headerRow });

  const matched = rows.filter((r) => publisherSlugMatches(wantedSlug, String(r.publisher || "")));
  if (matched.length === 0) {
    // Provide a small hint list to help debug slugs.
    const unique = Array.from(new Set(rows.map((r) => normalizePublisherName(String(r.publisher || ""))).filter(Boolean)));
    return NextResponse.json(
      {
        error: "Unknown publisher",
        slug: wantedSlug,
        knownPublishers: unique.slice(0, 50),
      },
      { status: 404 }
    );
  }

  const { searchParams } = new URL(req.url);
  const monthParam = searchParams.get("month")?.trim() || DEFAULT_MONTH;
  const yearParamRaw = searchParams.get("year")?.trim();
  const yearParam = yearParamRaw ? Number(yearParamRaw) : DEFAULT_YEAR;
  const wantMonthKey = `${yearParam}-${String(monthParam).padStart(2, "0")}`;

  const weekly: WeeklyRow[] = matched
    .map((r) => {
      const rawWeek = r.week_start ?? r.weekStart ?? r.week ?? r.date ?? "";
      const weekStart = formatSheetsDateLike(rawWeek);
      const totalRev = parseNumber(r.total_rev);
      const totalPVs = parseNumber(r.total_pvs);
      const smartScrollViews = parseNumber(r.smart_scroll_views);
      const kvpImpressions = parseNumber(r.nextpage_clicks);
      const rpmSheet = parseNumber(r.total_rpm);
      const vrpmSheet = parseNumber(r.total_vrpm);
      const totalRpm = rpmSheet > 0 ? rpmSheet : rpm(totalRev, totalPVs);
      const totalVrpm = vrpmSheet > 0 ? vrpmSheet : vrpm(totalRev, smartScrollViews);
      return {
        weekStart,
        weekLabel: weekLabel(weekStart),
        month: String(r.month || ""),
        year: Math.floor(parseNumber(r.year)),
        publisher: normalizePublisherName(String(r.publisher || "")),
        humanViews: parseNumber(r.human_views),
        botPvs: parseNumber(r.bot_pvs),
        totalPVs,
        smartScrollViews,
        widgetLoads: parseNumber(r.widget_loads),
        sessions: parseNumber(r.sessions),
        pvPerSession: parseNumber(r.pv_per_session),
        totalRev,
        affiliateRev: parseNumber(r.affiliate_rev),
        emailRev: parseNumber(r.email_rev),
        kvpRev: parseNumber(r.kvp_rev),
        kvpRevEst: parseNumber(r.kvp_rev_est),
        kvpImpressions,
        videoRev: parseNumber(r.video_rev),
        nativeRev: parseNumber(r.native_rev),
        totalRpm,
        totalVrpm,
        totalRps: parseNumber(r.total_rps),
        totalClicks: parseNumber(r.total_clicks),
        affiliateClicks: parseNumber(r.affiliate_clicks),
        nextpageClicks: parseNumber(r.nextpage_clicks),
        videoClicks: parseNumber(r.video_clicks),
        nativeClicks: parseNumber(r.native_clicks),
        affiliateEpc: parseNumber(r.affiliate_epc),
        // CTRs for publisher UI: always clicks ÷ in-views (not sheet PV-based affiliate_ctr / next_art_ctr).
        affiliateCtr: ctrPercentFromInviews(
          parseNumber(r.affiliate_clicks),
          smartScrollViews
        ),
        nextArtCtr: ctrPercentFromInviews(
          parseNumber(r.nextpage_clicks),
          smartScrollViews
        ),
      };
    })
    .filter((r) => r.weekStart && r.year)
    .filter((r) => r.weekStart.slice(0, 7) === wantMonthKey)
    .sort((a, b) => String(a.weekStart).localeCompare(String(b.weekStart)));

  // Monthly aggregates from weekly rows (publisher-only).
  const monthlyMap = new Map<string, MonthlyRow>();
  for (const w of weekly) {
    const monthNum = monthToNum(w.month);
    if (!monthNum) continue;
    const key = `${w.year}-${String(monthNum).padStart(2, "0")}`;
    const curr =
      monthlyMap.get(key) ??
      ({
        key,
        year: w.year,
        month: monthNum,
        label: monthLabel(monthNum, w.year),
        totalRev: 0,
        totalPVs: 0,
        sessions: 0,
        widgetLoads: 0,
        smartScrollViews: 0,
        affiliateRev: 0,
        emailRev: 0,
        kvpRev: 0,
        kvpRevEst: 0,
        videoRev: 0,
        nativeRev: 0,
        totalClicks: 0,
      } satisfies MonthlyRow);
    curr.totalRev += w.totalRev;
    curr.totalPVs += w.totalPVs;
    curr.sessions += w.sessions;
    curr.widgetLoads += w.widgetLoads;
    curr.smartScrollViews += w.smartScrollViews;
    curr.affiliateRev += w.affiliateRev;
    curr.emailRev += w.emailRev;
    curr.kvpRev += w.kvpRev;
    curr.kvpRevEst += w.kvpRevEst;
    curr.videoRev += w.videoRev;
    curr.nativeRev += w.nativeRev;
    curr.totalClicks += w.totalClicks;
    monthlyMap.set(key, curr);
  }

  const monthly = [...monthlyMap.values()].sort((a, b) => a.key.localeCompare(b.key));

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
    publisher: weekly[0]?.publisher ?? normalizePublisherName(String(matched[0]?.publisher || "")),
    slug: wantedSlug,
    lastUpdated: new Date().toISOString(),
    weekly,
    monthly,
    kpis,
  });
}

