"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

export type MonthlyTotalRow = {
  month: number;
  year: number;
  label: string;
  totalRev: number;
  totalPVs: number;
  humanViews: number;
  sessions: number;
  totalClicks: number;
  affiliateRev: number;
  emailRev: number;
  kvpRev: number;
  /** Optional: estimated KVP revenue (sheet-specific). */
  kvpRevEst?: number;
  /** Optional: KVP impressions/counts (sheet-specific). */
  kvpImpressions?: number;
  nativeRev: number;
  videoRev: number;
  /** SS in-views summed across publishers for the month (for viewable / vRPM). */
  smartScrollViews: number;
  /** Widget loads summed across publishers for the month. */
  widgetLoads: number;
};

export type PublisherTotalRow = {
  publisher: string;
  totalRev: number;
  totalPVs: number;
  humanViews: number;
  sessions: number;
  totalClicks: number;
  affiliateRev: number;
  emailRev: number;
  kvpRev: number;
  /** Optional: estimated KVP revenue (sheet-specific). */
  kvpRevEst?: number;
  /** Optional: KVP impressions/counts (sheet-specific). */
  kvpImpressions?: number;
  nativeRev: number;
  videoRev: number;
  /** Tag + placement + targeting: unit eligible to serve (loads ÷ PVs numerator). */
  widgetLoads: number;
  /** SmartScroll in-view (viewability; vRPM denominator). */
  smartScrollViews: number;
  /** Lifetime: totalRev / totalPVs × 1000 */
  avgRpm: number;
  /** Lifetime: totalRev / smartScrollViews × 1000 when SS in-views > 0 */
  avgVrpm: number;
  /** Lifetime: totalRev / sessions × 1000 */
  avgRps: number;
};

export type QaCheck = {
  id: string;
  severity: "pass" | "warn" | "fail";
  message: string;
  detail?: Record<string, unknown>;
};

export type QaPayload = {
  latestMonthLabel: string | null;
  checks: QaCheck[];
  summary: {
    ok: boolean;
    failCount: number;
    warnCount: number;
    passCount: number;
  };
};

export type LivePayload = {
  kpis: unknown;
  qa?: QaPayload;
  monthlyTotals: MonthlyTotalRow[];
  publisherTotals: PublisherTotalRow[];
  weeklyTrend: unknown[];
  /** Per-publisher weekly rows (last N weeks); from `buildWeeklyByPublisher`. */
  weeklyByPublisher?: unknown[];
  /** Resolved-month vs prior-month revenue per publisher. */
  publisherMoM?: unknown[];
  lastUpdated: string;
};

type DashboardLiveState = {
  loading: boolean;
  error: string | null;
  data: LivePayload | null;
  refetch: () => void;
};

const DashboardLiveContext = createContext<DashboardLiveState | null>(null);

export function DashboardDataProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<LivePayload | null>(null);
  const [tick, setTick] = useState(0);

  const refetch = useCallback(() => setTick((t) => t + 1), []);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    fetch("/api/live")
      .then(async (res) => {
        const body = await res.json().catch(() => ({}));
        if (!res.ok) {
          throw new Error(
            typeof body.error === "string" ? body.error : res.statusText
          );
        }
        return body as LivePayload;
      })
      .then((payload) => {
        if (!cancelled) {
          setData(payload);
        }
      })
      .catch((err: Error) => {
        if (!cancelled) {
          setError(err.message || "Failed to load dashboard");
          setData(null);
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [tick]);

  const value = useMemo(
    () => ({ loading, error, data, refetch }),
    [loading, error, data, refetch]
  );

  return (
    <DashboardLiveContext.Provider value={value}>
      {children}
    </DashboardLiveContext.Provider>
  );
}

export function useDashboardLive(): DashboardLiveState {
  const ctx = useContext(DashboardLiveContext);
  if (!ctx) {
    throw new Error("useDashboardLive must be used within DashboardDataProvider");
  }
  return ctx;
}
