import { NextResponse } from "next/server";
import { createRequire } from "node:module";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const require = createRequire(import.meta.url);

const { validateConfig, config } = require("../../../lib/rollupServer/config.js") as {
  validateConfig: () => string[];
  config: {
    spreadsheetId: string;
    tabs: {
      weekly: { name: string; headerRow: number };
      monthlyNetwork: { name: string; headerRow: number };
      monthlyPublishers: { name: string; headerRow: number };
    };
  };
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

function normalizeHeader(value: unknown) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ")
    .replace(/[^\w\s%/-]/g, "");
}

function keyForHeader(header: unknown) {
  return normalizeHeader(header)
    .replace(/[%/()-]/g, " ")
    .replace(/\s+/g, "_");
}

export async function GET() {
  const missing = validateConfig();
  if (missing.length) {
    return NextResponse.json(
      { ok: false, missingEnv: missing },
      { status: 500 }
    );
  }

  try {
    const tabChecks = await Promise.all([
      getTabRows(config.tabs.monthlyNetwork.name, {
        headerRow: config.tabs.monthlyNetwork.headerRow
      }),
      getTabRows(config.tabs.monthlyPublishers.name, {
        headerRow: config.tabs.monthlyPublishers.headerRow
      }),
      getTabRows(config.tabs.weekly.name, { headerRow: config.tabs.weekly.headerRow })
    ]);

    const tabDetails = [
      {
        name: config.tabs.monthlyNetwork.name,
        headers: tabChecks[0].headers.length,
        rows: tabChecks[0].rows.length,
        headerPreview: tabChecks[0].headers.slice(0, 60),
        headerKeyPreview: tabChecks[0].headers.slice(0, 60).map(keyForHeader)
      },
      {
        name: config.tabs.monthlyPublishers.name,
        headers: tabChecks[1].headers.length,
        rows: tabChecks[1].rows.length,
        headerPreview: tabChecks[1].headers.slice(0, 60),
        headerKeyPreview: tabChecks[1].headers.slice(0, 60).map(keyForHeader)
      },
      {
        name: config.tabs.weekly.name,
        headers: tabChecks[2].headers.length,
        rows: tabChecks[2].rows.length,
        headerPreview: tabChecks[2].headers.slice(0, 60),
        headerKeyPreview: tabChecks[2].headers.slice(0, 60).map(keyForHeader)
      }
    ];

    return NextResponse.json({
      ok: true,
      sheets: {
        spreadsheetId: config.spreadsheetId,
        tabs: tabDetails
      }
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    const availableTabs = await getSpreadsheetTabTitles().catch(() => []);
    return NextResponse.json(
      {
        ok: false,
        error: message,
        sheets: {
          spreadsheetId: config.spreadsheetId,
          configuredTabs: {
            weekly: config.tabs.weekly.name,
            monthlyNetwork: config.tabs.monthlyNetwork.name,
            monthlyPublishers: config.tabs.monthlyPublishers.name
          },
          availableTabs
        }
      },
      { status: 500 }
    );
  }
}
