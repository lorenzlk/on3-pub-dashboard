import path from "node:path";
import dotenv from "dotenv";
import { NextResponse } from "next/server";
import { createRequire } from "node:module";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const appRoot = process.cwd();
dotenv.config({ path: path.join(appRoot, ".env.local") });
dotenv.config({ path: path.join(appRoot, ".env") });
dotenv.config({ path: path.join(appRoot, "..", ".env") });

const require = createRequire(import.meta.url);

const metrics = require("../../../lib/rollupServer/metrics.js") as {
  buildKpis: (
    monthlyNetworkRows: unknown[],
    monthlyPublisherRows: unknown[],
    filters: { month: string | null; year: number | null }
  ) => unknown;
  buildRollupQa: (
    monthlyNetworkRows: unknown[],
    monthlyPublisherRows: unknown[],
    filters: { month: string | null; year: number | null }
  ) => unknown;
  buildMonthlyTotalsFromPublisherRows: (
    publisherRows: unknown[],
    monthlyNetworkRows?: unknown[]
  ) => unknown[];
  buildPublisherTotalsAllTime: (rows: unknown[]) => unknown[];
  buildWeeklyTrend: (rows: unknown[], limit?: number) => unknown[];
  buildWeeklyByPublisher: (rows: unknown[], weekLimit?: number) => unknown[];
  buildPublisherMoMComparison: (
    rows: unknown[],
    filters: { month: string | null; year: number | null }
  ) => unknown[];
};
const { getTabRows } = require("../../../lib/rollupServer/sheetsClient.js") as {
  getTabRows: (
    tabName: string,
    options?: { headerRow?: number; includeFormulas?: boolean }
  ) => Promise<{ headers: unknown[]; rows: unknown[] }>;
};
const { getSpreadsheetTabTitles } = require("../../../lib/rollupServer/sheetsClient.js") as {
  getSpreadsheetTabTitles: () => Promise<string[]>;
};
const { config, validateConfig } = require("../../../lib/rollupServer/config.js") as {
  config: {
    spreadsheetId: string;
    tabs: {
      weekly: { name: string; headerRow: number };
      monthlyNetwork: { name: string; headerRow: number };
      monthlyPublishers: { name: string; headerRow: number };
    };
  };
  validateConfig: () => string[];
};

const DEFAULT_MONTH = "04";
const DEFAULT_YEAR = 2026;

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

function parseMonthNum(raw: unknown): number | null {
  if (raw === null || raw === undefined) return null;
  if (typeof raw === "number" && Number.isFinite(raw)) {
    const n = Math.floor(raw);
    return n >= 1 && n <= 12 ? n : null;
  }
  const s = String(raw).trim();
  if (!s) return null;
  if (/^\d+$/.test(s)) {
    const n = Number(s);
    return n >= 1 && n <= 12 ? n : null;
  }
  const key = s.toLowerCase();
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
  if (map[key]) return map[key];
  const maybe = Object.keys(map).find((k) => k.startsWith(key));
  return maybe ? map[maybe] : null;
}

function monthKeyFromWeekRow(row: Record<string, unknown>): string | null {
  const year = Math.floor(parseNumber(row.year));
  const monthNum = parseMonthNum(row.month);
  if (year && monthNum) return `${year}-${String(monthNum).padStart(2, "0")}`;
  const rawWeek = row.week_start ?? row.weekStart ?? row.week ?? row.date ?? "";
  const iso = formatSheetsDateLike(rawWeek);
  if (/^\d{4}-\d{2}-\d{2}$/.test(iso)) return iso.slice(0, 7);
  return null;
}

export async function GET(request: Request) {
  try {
    const missing = validateConfig();
    if (missing.length) {
      return NextResponse.json(
        { error: "Missing required env vars", missingEnv: missing },
        { status: 500 }
      );
    }

    const { searchParams } = new URL(request.url);
    const month = searchParams.get("month")?.trim() || DEFAULT_MONTH;
    const yearRaw = searchParams.get("year")?.trim();
    const year = yearRaw ? Number(yearRaw) : DEFAULT_YEAR;
    const filters = {
      month,
      year: Number.isFinite(year) ? year : DEFAULT_YEAR
    };

    const [monthlyNetwork, monthlyPublishers, weekly] = await Promise.all([
      getTabRows(config.tabs.monthlyNetwork.name, {
        headerRow: config.tabs.monthlyNetwork.headerRow
      }),
      getTabRows(config.tabs.monthlyPublishers.name, {
        headerRow: config.tabs.monthlyPublishers.headerRow
      }),
      getTabRows(config.tabs.weekly.name, { headerRow: config.tabs.weekly.headerRow })
    ]);

    const kpis = metrics.buildKpis(
      monthlyNetwork.rows,
      monthlyPublishers.rows,
      filters
    );
    const monthlyTotals = metrics.buildMonthlyTotalsFromPublisherRows(
      monthlyPublishers.rows,
      monthlyNetwork.rows
    );
    const publisherTotals = metrics.buildPublisherTotalsAllTime(
      monthlyPublishers.rows
    );
    const wantMonthKey = `${filters.year}-${String(filters.month).padStart(2, "0")}`;
    const weeklyFiltered = (weekly.rows as Record<string, unknown>[]).filter(
      (r) => monthKeyFromWeekRow(r) === wantMonthKey
    );

    const weeklyTrend = metrics.buildWeeklyTrend(weeklyFiltered, 24);
    const weeklyByPublisher = metrics.buildWeeklyByPublisher(weeklyFiltered, 12);
    const publisherMoM = metrics.buildPublisherMoMComparison(
      monthlyPublishers.rows,
      filters
    );
    const qa = metrics.buildRollupQa(
      monthlyNetwork.rows,
      monthlyPublishers.rows,
      filters
    );

    return NextResponse.json({
      kpis,
      qa,
      monthlyTotals,
      publisherTotals,
      weeklyTrend,
      weeklyByPublisher,
      publisherMoM,
      lastUpdated: new Date().toISOString()
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    const availableTabs = await getSpreadsheetTabTitles().catch(() => []);
    return NextResponse.json(
      {
        error: message,
        sheet: {
          spreadsheetId: config?.spreadsheetId,
          tabs: config?.tabs
            ? {
                weekly: config.tabs.weekly.name,
                monthlyNetwork: config.tabs.monthlyNetwork.name,
                monthlyPublishers: config.tabs.monthlyPublishers.name
              }
            : null
        },
        availableTabs
      },
      { status: 500 }
    );
  }
}
