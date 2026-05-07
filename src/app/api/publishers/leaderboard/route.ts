import { NextResponse } from "next/server";
import { createRequire } from "node:module";
import { normalizePublisherName, slugifyPublisherName } from "@/lib/publishers";

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

const PRIOR_MONTH_MIN_REV_USD = 25;

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

type ParsedWeek = {
  publisher: string;
  weekStart: string;
  totalRev: number;
};

function ratioMom(current: number, previous: number): number | null {
  if (!Number.isFinite(previous) || previous < PRIOR_MONTH_MIN_REV_USD) return null;
  const r = (current - previous) / previous;
  if (!Number.isFinite(r)) return null;
  return Math.max(-4, Math.min(4, r));
}

export async function GET() {
  const missing = validateConfig();
  if (missing.length) {
    return NextResponse.json({ error: "Missing required env vars", missingEnv: missing }, { status: 500 });
  }

  const tab = config.tabs.weekly;
  const { rows } = await getTabRows(tab.name, { headerRow: tab.headerRow });

  const wantMonthKey = `${DEFAULT_YEAR}-${DEFAULT_MONTH}`;

  const parsed: ParsedWeek[] = [];
  for (const r of rows) {
    const rawWeek = r.week_start ?? r.weekStart ?? r.week ?? r.date ?? "";
    const weekStart = formatSheetsDateLike(rawWeek);
    const year = Math.floor(parseNumber(r.year));
    const publisher = normalizePublisherName(String(r.publisher || ""));
    const totalRev = parseNumber(r.total_rev);
    if (!publisher || !weekStart || !year) continue;
    if (weekStart.slice(0, 7) !== wantMonthKey) continue;
    parsed.push({ publisher, weekStart, totalRev });
  }

  /** Lifetime gross + monthly buckets for MoM (calendar month from week start). */
  const lifetime = new Map<string, number>();
  const byPubMonth = new Map<string, Map<string, number>>();

  for (const w of parsed) {
    lifetime.set(w.publisher, (lifetime.get(w.publisher) ?? 0) + w.totalRev);
    const monthKey = w.weekStart.slice(0, 7);
    if (!byPubMonth.has(w.publisher)) byPubMonth.set(w.publisher, new Map());
    const m = byPubMonth.get(w.publisher)!;
    m.set(monthKey, (m.get(monthKey) ?? 0) + w.totalRev);
  }

  const publishers = [...lifetime.entries()]
    .map(([name, lifetimeRev]) => {
      const monthMap = byPubMonth.get(name) ?? new Map<string, number>();
      const months = [...monthMap.keys()].sort();
      let momDeltaRatio: number | null = null;
      if (months.length >= 2) {
        const prevKey = months[months.length - 2]!;
        const lastKey = months[months.length - 1]!;
        momDeltaRatio = ratioMom(monthMap.get(lastKey) ?? 0, monthMap.get(prevKey) ?? 0);
      }
      return {
        name,
        slug: slugifyPublisherName(name),
        lifetimeRev,
        momDeltaRatio,
      };
    })
    .filter((p) => p.lifetimeRev > 0)
    .sort((a, b) => b.lifetimeRev - a.lifetimeRev);

  return NextResponse.json({
    lastUpdated: new Date().toISOString(),
    publishers,
  });
}
