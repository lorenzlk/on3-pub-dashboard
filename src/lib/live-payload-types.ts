/** KPI object returned by `buildKpis` in rollup `metrics.js`. */
export type KpisPayload = {
  meta?: {
    latestMonthLabel: string | null;
    previousMonthLabel: string | null;
    /** ISO-style month id for titles (e.g. `2026-04`). */
    latestMonthKey?: string | null;
    previousMonthKey?: string | null;
    publisherCountLatestMonth: number;
    /** Latest month: sum of publisher total_rev (Publishers tab); use for concentration vs network row. */
    sumPublisherTotalRevenueLatestMonth?: number;
  };
  comparison?: {
    /** Prior month network total revenue (USD); used to gate noisy MoM when tiny. */
    prevTotalRevenue?: number;
    momRevenueDeltaPct: number | null;
    momHumanDeltaPct?: number | null;
    momTotalPvsDeltaPct?: number | null;
    momSessionsDeltaPct?: number | null;
    momTotalClicksDeltaPct?: number | null;
    momTotalRpmDeltaPct?: number | null;
    momTotalVrpmDeltaPct?: number | null;
    momRpsDeltaPct?: number | null;
  };
  totals: {
    totalRevenue: number;
    affiliateRevenue: number;
    /** On3 Impact email-attributed commission (rollup `Email Rev`); 0 when column absent. */
    emailRevenue?: number;
    kvpRevenue: number;
    videoRevenue: number;
    nativeRevenue: number;
    totalRpm: number;
    totalVrpm: number;
    humanViews: number;
    totalPVs: number;
    sessions: number;
    rps: number;
    totalClicksLatestMonth: number;
  };
  /** Present when returned by `buildKpis` (latest month may be in progress). */
  pacing?: {
    isCurrentMonth: boolean;
    daysElapsed: number | null;
    daysInMonth: number | null;
    projectedRevenue: number;
    paceVsLastMonthPct: number | null;
    projectedTotalPVs: number;
    paceVsLastMonthPvsPct: number | null;
    projectedSessions: number;
    paceVsLastMonthSessionsPct: number | null;
    priorMonthRevenue: number;
    priorMonthTotalPVs: number;
    priorMonthSessions: number;
  };
  topPublisher: {
    publisher: string;
    totalRevenue: number;
  } | null;
};

/** Aggregated network weekly row from `buildWeeklyTrend`. */
export type WeeklyTrendPoint = {
  weekStart: string;
  totalRevenue: number;
  sessions: number;
  totalPVs: number;
  /** Eligible widget serves (same semantics as publisher `widgetLoads`). */
  widgetLoads: number;
  /** SS in-view (saw widget). */
  smartScrollViews: number;
  blendedRpm: number;
  blendedVrpm: number;
};

/** Per-publisher weekly row from `buildWeeklyByPublisher`. */
export type WeeklyByPublisherRow = {
  weekSortKey: string | number;
  weekStart: string;
  publisher: string;
  totalRevenue: number;
  totalPVs: number;
  widgetLoads: number;
  /** SS in-view count for the week. */
  smartScrollViews: number;
  sessions: number;
  rpm: number;
  vrpm: number;
};

/** Latest vs prior month revenue per publisher. */
export type PublisherMoMRow = {
  publisher: string;
  currentMonthRev: number;
  previousMonthRev: number;
  momRevDeltaPct: number | null;
};
