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
    const month = searchParams.get("month")?.trim() || null;
    const yearRaw = searchParams.get("year")?.trim();
    const year = yearRaw ? Number(yearRaw) : null;
    const filters = {
      month,
      year: Number.isFinite(year) ? year : null
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
    const weeklyTrend = metrics.buildWeeklyTrend(weekly.rows, 24);
    const weeklyByPublisher = metrics.buildWeeklyByPublisher(
      weekly.rows,
      12
    );
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
