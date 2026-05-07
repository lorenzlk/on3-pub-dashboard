import type { PublisherTotalRow, QaPayload } from "@/lib/dashboard-data-context";
import type {
  PublisherMoMRow,
  WeeklyByPublisherRow,
  WeeklyTrendPoint,
} from "@/lib/live-payload-types";

export type NetworkHealth = "healthy" | "warning" | "critical";

export function networkHealthFromQa(qa: QaPayload | undefined): NetworkHealth {
  const fails = qa?.summary?.failCount ?? 0;
  if (fails === 0) return "healthy";
  if (fails < 3) return "warning";
  return "critical";
}

export function parseWeeklyTrend(points: unknown[]): WeeklyTrendPoint[] {
  if (!Array.isArray(points)) return [];
  return points
    .filter((p): p is WeeklyTrendPoint => {
      if (!p || typeof p !== "object") return false;
      const o = p as WeeklyTrendPoint;
      return typeof o.weekStart === "string";
    })
    .map((p) => ({
      ...p,
      widgetLoads:
        typeof p.widgetLoads === "number" && Number.isFinite(p.widgetLoads)
          ? p.widgetLoads
          : p.smartScrollViews,
    }));
}

export function parseWeeklyByPublisher(rows: unknown[]): WeeklyByPublisherRow[] {
  if (!Array.isArray(rows)) return [];
  return rows
    .filter((r): r is WeeklyByPublisherRow => {
      if (!r || typeof r !== "object") return false;
      const o = r as WeeklyByPublisherRow;
      return typeof o.publisher === "string" && typeof o.weekStart === "string";
    })
    .map((r) => ({
      ...r,
      widgetLoads:
        typeof r.widgetLoads === "number" && Number.isFinite(r.widgetLoads)
          ? r.widgetLoads
          : r.smartScrollViews,
    }));
}

export function parsePublisherMoM(rows: unknown[]): PublisherMoMRow[] {
  if (!Array.isArray(rows)) return [];
  return rows.filter((r): r is PublisherMoMRow => {
    if (!r || typeof r !== "object") return false;
    const o = r as PublisherMoMRow;
    return typeof o.publisher === "string";
  });
}

/** Last N weeks' RPM for a publisher, chronological. */
export function publisherWeeklyRpmSeries(
  rows: WeeklyByPublisherRow[],
  publisher: string,
  maxWeeks = 4
): number[] {
  const match = rows.filter(
    (r) => r.publisher.trim().toLowerCase() === publisher.trim().toLowerCase()
  );
  const byWeek = new Map<string | number, WeeklyByPublisherRow>();
  for (const r of match) {
    byWeek.set(r.weekSortKey, r);
  }
  const keys = [...byWeek.keys()].sort((a, b) => {
    if (typeof a === "number" && typeof b === "number") return a - b;
    return String(a).localeCompare(String(b));
  });
  const last = keys.slice(-maxWeeks);
  return last.map((k) => byWeek.get(k)!.rpm).filter((n) => Number.isFinite(n));
}

const DEFAULT_STALL_MIN_ZERO_WEEKS = 3;
const DEFAULT_STALL_LOOKBACK_WEEKS = 12;

/**
 * Detect sustained zero traffic from weekly publisher rows (total pageviews).
 * RPM variance alone stays "green" when trailing RPM is 0 — this surfaces stalled sites.
 */
export function publisherTrafficStallStatus(
  rows: WeeklyByPublisherRow[],
  publisher: string,
  options?: { minConsecutiveZeroWeeks?: number; lookbackWeeks?: number }
): {
  status: "green" | "red";
  consecutiveZeroWeeks: number;
  weeksInWindow: number;
} {
  const minZero = options?.minConsecutiveZeroWeeks ?? DEFAULT_STALL_MIN_ZERO_WEEKS;
  const lookback = options?.lookbackWeeks ?? DEFAULT_STALL_LOOKBACK_WEEKS;
  const match = rows.filter(
    (r) => r.publisher.trim().toLowerCase() === publisher.trim().toLowerCase()
  );
  if (match.length === 0) {
    return { status: "green", consecutiveZeroWeeks: 0, weeksInWindow: 0 };
  }
  const byWeek = new Map<string | number, WeeklyByPublisherRow>();
  for (const r of match) {
    byWeek.set(r.weekSortKey, r);
  }
  const keys = [...byWeek.keys()].sort((a, b) => {
    if (typeof a === "number" && typeof b === "number") return a - b;
    return String(a).localeCompare(String(b));
  });
  const windowKeys = keys.slice(-lookback);
  let streak = 0;
  for (let i = windowKeys.length - 1; i >= 0; i--) {
    const row = byWeek.get(windowKeys[i]!)!;
    const pvs = Number(row.totalPVs) || 0;
    if (pvs <= 0) streak++;
    else break;
  }
  const enoughHistory = windowKeys.length >= minZero;
  const stalled = enoughHistory && streak >= minZero;
  return {
    status: stalled ? "red" : "green",
    consecutiveZeroWeeks: streak,
    weeksInWindow: windowKeys.length,
  };
}

/** RPM variance row status merged with traffic stall (stall forces red). */
export function mergePublisherPerformanceStatus(
  rpmStatus: "green" | "yellow" | "red",
  trafficStallStatus: "green" | "red"
): "green" | "yellow" | "red" {
  if (trafficStallStatus === "red") return "red";
  return rpmStatus;
}

export type RpmVarianceStatus = "green" | "yellow" | "red";

export function rpmVarianceVsTrailing4w(
  rows: WeeklyByPublisherRow[],
  publisher: string
): { status: RpmVarianceStatus; variance: number | null; trailingAvg: number | null; currentRpm: number | null } {
  const series = publisherWeeklyRpmSeries(rows, publisher, 5);
  if (series.length < 2) {
    return { status: "green", variance: null, trailingAvg: null, currentRpm: null };
  }
  const currentRpm = series[series.length - 1]!;
  const prior = series.slice(0, -1);
  const trailingAvg = prior.reduce((a, b) => a + b, 0) / prior.length;
  if (!Number.isFinite(trailingAvg) || trailingAvg === 0) {
    return { status: "green", variance: null, trailingAvg, currentRpm };
  }
  const variance = (currentRpm - trailingAvg) / trailingAvg;
  const abs = Math.abs(variance);
  let status: RpmVarianceStatus = "green";
  if (abs >= 0.2) status = "red";
  else if (abs >= 0.1) status = "yellow";
  return { status, variance, trailingAvg, currentRpm };
}

export function publishersWithRpmVarianceAlert(
  rows: WeeklyByPublisherRow[],
  publisherNames: string[],
  minAbsVariance = 0.2
): string[] {
  return publisherNames.filter((name) => {
    const { variance } = rpmVarianceVsTrailing4w(rows, name);
    return variance != null && Math.abs(variance) >= minAbsVariance;
  });
}

export type GapTrend = "narrowing" | "stable" | "widening" | "unknown";

export function vrpmRpmGapTrend(
  rows: WeeklyByPublisherRow[],
  publisher: string
): GapTrend {
  const match = rows.filter(
    (r) => r.publisher.trim().toLowerCase() === publisher.trim().toLowerCase()
  );
  const byWeek = new Map<string | number, WeeklyByPublisherRow>();
  for (const r of match) byWeek.set(r.weekSortKey, r);
  const keys = [...byWeek.keys()].sort((a, b) => {
    if (typeof a === "number" && typeof b === "number") return a - b;
    return String(a).localeCompare(String(b));
  });
  const last4 = keys.slice(-4).map((k) => byWeek.get(k)!);
  if (last4.length < 2) return "unknown";
  const gaps = last4.map((r) =>
    Number.isFinite(r.rpm) && Number.isFinite(r.vrpm) ? r.rpm - r.vrpm : NaN
  ).filter((g) => Number.isFinite(g));
  if (gaps.length < 2) return "unknown";
  const first = gaps[0]!;
  const last = gaps[gaps.length - 1]!;
  const delta = last - first;
  if (Math.abs(delta) < 0.05 * (Math.abs(first) + 1)) return "stable";
  return delta > 0 ? "widening" : "narrowing";
}

/** True if counts match within tolerance (rollup used one column for both loads and in-views). */
export function loadsAndInViewsAreDuplicate(
  wl: number,
  ss: number,
  relTol = 0.001
): boolean {
  if (wl <= 0) return ss <= 0;
  return Math.abs(ss - wl) / wl < relTol;
}

/** Lifetime network sums from publisher rows: loads ÷ PVs and viewability (in-views ÷ loads). */
export function networkPublisherFootprintTotals(rows: PublisherTotalRow[]) {
  let pv = 0;
  let wl = 0;
  let ss = 0;
  for (const p of rows) {
    pv += p.totalPVs;
    wl += p.widgetLoads ?? p.smartScrollViews;
    ss += p.smartScrollViews;
  }
  const loadsPerPvPct = pv > 0 ? (wl / pv) * 100 : 0;
  const viewabilityPct = wl > 0 ? (ss / wl) * 100 : 0;
  const viewabilityNotComparable =
    wl > 0 && ss > 0 && loadsAndInViewsAreDuplicate(wl, ss);
  return {
    sumPV: pv,
    sumWL: wl,
    sumSS: ss,
    loadsPerPvPct,
    viewabilityPct,
    viewabilityNotComparable,
  };
}

/** Viewability: SS in-views ÷ widget loads (of eligible serves, share that were seen in-view). */
export function inViewPctOfWidgetLoads(row: PublisherTotalRow): number {
  const wl = row.widgetLoads ?? row.smartScrollViews;
  if (wl <= 0) return 0;
  return (row.smartScrollViews / wl) * 100;
}

/** Widget loads ÷ pageviews (eligible unit on tagged pages). */
export function widgetLoadsPctOfPvs(row: PublisherTotalRow): number {
  if (row.totalPVs <= 0) return 0;
  const wl = row.widgetLoads ?? row.smartScrollViews;
  return (wl / row.totalPVs) * 100;
}

/** WoW change in viewability: SS in-views ÷ widget loads (percentage points). */
export function wowInViewPerLoadsPctDelta(
  rows: WeeklyByPublisherRow[],
  publisher: string
): number | null {
  const match = rows.filter(
    (r) => r.publisher.trim().toLowerCase() === publisher.trim().toLowerCase()
  );
  const byWeek = new Map<string | number, WeeklyByPublisherRow>();
  for (const r of match) byWeek.set(r.weekSortKey, r);
  const keys = [...byWeek.keys()].sort((a, b) => {
    if (typeof a === "number" && typeof b === "number") return a - b;
    return String(a).localeCompare(String(b));
  });
  if (keys.length < 2) return null;
  const k1 = keys[keys.length - 2]!;
  const k2 = keys[keys.length - 1]!;
  const a = byWeek.get(k1)!;
  const b = byWeek.get(k2)!;
  const rate = (r: WeeklyByPublisherRow) => {
    const wl = r.widgetLoads ?? r.smartScrollViews;
    return wl > 0 ? (r.smartScrollViews / wl) * 100 : 0;
  };
  return rate(b) - rate(a);
}

/** WoW change in widget loads ÷ PVs (percentage points). */
export function wowWidgetLoadsPctDelta(
  rows: WeeklyByPublisherRow[],
  publisher: string
): number | null {
  const match = rows.filter(
    (r) => r.publisher.trim().toLowerCase() === publisher.trim().toLowerCase()
  );
  const byWeek = new Map<string | number, WeeklyByPublisherRow>();
  for (const r of match) byWeek.set(r.weekSortKey, r);
  const keys = [...byWeek.keys()].sort((a, b) => {
    if (typeof a === "number" && typeof b === "number") return a - b;
    return String(a).localeCompare(String(b));
  });
  if (keys.length < 2) return null;
  const k1 = keys[keys.length - 2]!;
  const k2 = keys[keys.length - 1]!;
  const a = byWeek.get(k1)!;
  const b = byWeek.get(k2)!;
  const wl = (r: WeeklyByPublisherRow) =>
    r.totalPVs > 0 ? ((r.widgetLoads ?? r.smartScrollViews) / r.totalPVs) * 100 : 0;
  return wl(b) - wl(a);
}
