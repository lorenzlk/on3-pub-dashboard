"use client";

import { CooPublisherPerformanceTable } from "@/components/dashboard/CooPublisherPerformanceTable";
import { CpoHeroMetricCard } from "@/components/dashboard/CpoHeroMetricCard";
import { KpiHeroCard } from "@/components/dashboard/KpiHeroCard";
import { PersonaMetricGlossary } from "@/components/dashboard/PersonaMetricGlossary";
import { CooPersonaDataQaSection } from "@/components/dashboard/personas/CooPersonaDataQaSection";
import { CooPacingDashboard } from "@/components/dashboard/personas/CooPacingDashboard";
import { TrendChart } from "@/components/dashboard/TrendChart";
import { useDashboardLive } from "@/lib/dashboard-data-context";
import {
  formatCurrency,
  formatNumber,
  formatPercentChart,
  pctFromRatio,
} from "@/lib/data";
import { cn } from "@/lib/utils";
import type { KpisPayload } from "@/lib/live-payload-types";
import {
  loadsAndInViewsAreDuplicate,
  parsePublisherMoM,
  parseWeeklyByPublisher,
  parseWeeklyTrend,
} from "@/lib/persona-metrics";
import {
  Activity,
  BarChart3,
  TrendingUp,
  UserCheck,
} from "lucide-react";
import { useMemo } from "react";

const TOP_PUBLISHERS_CHART = 6;
const WEEKS_CHART = 8;
const WEEKS_REV_TREND = 12;

const CHANNEL_COLORS: Record<string, string> = {
  Affiliate: "#10b981",
  Email: "#22c55e",
  "Incremental (KVP)": "#06b6d4",
  Video: "#a78bfa",
  Native: "#fb923c",
};

const PUB_BAR_COLORS = [
  "#10b981",
  "#06b6d4",
  "#a78bfa",
  "#fb923c",
  "#f472b6",
  "#38bdf8",
  "#fbbf24",
  "#94a3b8",
] as const;

function CooPublisherMixStrip({
  publishers,
  monthLabel,
  topThreePct,
}: {
  publishers: { label: string; revenue: number; pct: number }[];
  monthLabel: string | null;
  topThreePct: number | null;
}) {
  if (!publishers.length) {
    return (
      <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-4 sm:p-5 h-full">
        <h3 className="text-sm font-semibold text-zinc-300 uppercase tracking-wider">
          Publisher mix
        </h3>
        <p className="text-xs text-zinc-500 mt-2">
          No publisher-tab gross for the latest month yet, or all rows are zero.
        </p>
      </div>
    );
  }
  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-4 sm:p-5 space-y-4 h-full">
      <div>
        <h3 className="text-sm font-semibold text-zinc-300 uppercase tracking-wider">
          Publisher mix
        </h3>
        <p className="text-xs text-zinc-500 mt-1">
          Who is driving this month&apos;s gross (publishers tab).{" "}
          {monthLabel ? <span className="text-zinc-400">{monthLabel}</span> : null}
          {topThreePct != null && Number.isFinite(topThreePct) ? (
            <span className="block mt-1 text-zinc-500">
              Top three:{" "}
              <span className="text-zinc-300 tabular-nums">{topThreePct.toFixed(1)}%</span> of
              publisher-tab total
            </span>
          ) : null}
        </p>
      </div>
      <div className="space-y-3">
        {publishers.map((c, i) => (
          <div key={c.label}>
            <div className="flex flex-wrap items-baseline justify-between gap-2 text-xs mb-1.5">
              <span className="text-zinc-400 font-medium truncate max-w-[60%]" title={c.label}>
                {c.label}
              </span>
              <span className="text-zinc-300 tabular-nums">
                {formatCurrency(c.revenue)}
                <span className="text-zinc-500 ml-2">{c.pct.toFixed(1)}%</span>
              </span>
            </div>
            <div className="h-2 rounded-full bg-zinc-800 overflow-hidden">
              <div
                className="h-full rounded-full transition-all min-w-[2px]"
                style={{
                  width: `${Math.min(100, Math.max(0, c.pct))}%`,
                  backgroundColor: PUB_BAR_COLORS[i % PUB_BAR_COLORS.length],
                }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function CooDemandMixStrip({
  channels,
  monthLabel,
}: {
  channels: { label: string; revenue: number; pct: number }[];
  monthLabel: string | null;
}) {
  if (!channels.length) return null;
  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-4 sm:p-5 space-y-4 h-full">
      <div>
        <h3 className="text-sm font-semibold text-zinc-300 uppercase tracking-wider">
          Channel mix
        </h3>
        <p className="text-xs text-zinc-500 mt-1">
          Demand diversity — affiliate, KVP, video, native on the network total row.{" "}
          {monthLabel ? <span className="text-zinc-400">{monthLabel}</span> : null}
        </p>
      </div>
      <div className="space-y-3">
        {channels.map((c) => (
          <div key={c.label}>
            <div className="flex flex-wrap items-baseline justify-between gap-2 text-xs mb-1.5">
              <span className="text-zinc-400 font-medium">{c.label}</span>
              <span className="text-zinc-300 tabular-nums">
                {formatCurrency(c.revenue)}
                <span className="text-zinc-500 ml-2">{c.pct.toFixed(1)}%</span>
              </span>
            </div>
            <div className="h-2 rounded-full bg-zinc-800 overflow-hidden">
              <div
                className="h-full rounded-full transition-all min-w-[2px]"
                style={{
                  width: `${Math.min(100, c.pct)}%`,
                  backgroundColor: CHANNEL_COLORS[c.label] ?? "#71717a",
                }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function CooPersonaPanel({
  qaSectionId = "qa-detail",
  dataQaPlacement = "panel",
}: {
  /** DOM id for QA section (anchor links). */
  qaSectionId?: string;
  /** When `external`, omit Data QA here so the parent can render `CooPersonaDataQaSection` later (e.g. home page). */
  dataQaPlacement?: "panel" | "external";
}) {
  const { error, data } = useDashboardLive();
  const kpis = (data?.kpis ?? null) as KpisPayload | null;
  const qa = data?.qa;
  const publisherTotals = useMemo(
    () => data?.publisherTotals ?? [],
    [data?.publisherTotals]
  );
  const weeklyByPublisher = useMemo(
    () => parseWeeklyByPublisher(data?.weeklyByPublisher ?? []),
    [data?.weeklyByPublisher]
  );
  const weeklyAgg = useMemo(
    () => parseWeeklyTrend(data?.weeklyTrend ?? []),
    [data?.weeklyTrend]
  );

  const { sumPV, sumWL, sumSS, loadsPerPvPct, inViewPerLoadPct } = useMemo(() => {
    let pv = 0;
    let wl = 0;
    let ss = 0;
    for (const p of publisherTotals) {
      pv += p.totalPVs;
      const loads = p.widgetLoads ?? p.smartScrollViews;
      wl += loads;
      ss += p.smartScrollViews;
    }
    const lpp = pv > 0 ? (wl / pv) * 100 : 0;
    const ipl = wl > 0 ? (ss / wl) * 100 : 0;
    return {
      sumPV: pv,
      sumWL: wl,
      sumSS: ss,
      loadsPerPvPct: lpp,
      inViewPerLoadPct: ipl,
    };
  }, [publisherTotals]);

  /**
   * Viewability ÷ loads is not meaningful when loads and in-view counts match (legacy single column).
   * Check both lifetime totals and the same weeks as the chart — weekly network rows can still be
   * duplicated even if publisher lifetime sums differ slightly.
   */
  const viewabilityNotComparable = useMemo(() => {
    const lifetimeDup =
      sumWL > 0 && sumSS > 0 && loadsAndInViewsAreDuplicate(sumWL, sumSS);
    const chartWeeks = weeklyAgg.slice(-WEEKS_CHART);
    const weeksWithLoads = chartWeeks.filter((w) => {
      const wl = w.widgetLoads ?? w.smartScrollViews;
      return wl > 0;
    });
    const weeklyDup =
      weeksWithLoads.length > 0 &&
      weeksWithLoads.every((w) => {
        const wl = w.widgetLoads ?? w.smartScrollViews;
        return loadsAndInViewsAreDuplicate(wl, w.smartScrollViews);
      });
    return Boolean(lifetimeDup || weeklyDup);
  }, [sumWL, sumSS, weeklyAgg]);

  const latestMonthLabel = kpis?.meta?.latestMonthLabel ?? null;
  const monthInProgress = kpis?.pacing?.isCurrentMonth === true;

  const totalPubs = publisherTotals.length || 1;
  const pubsWithLoads = publisherTotals.filter(
    (p) => (p.widgetLoads ?? p.smartScrollViews) > 0
  ).length;
  const lastW = weeklyAgg.slice(-2);
  const loadPenLast =
    lastW.length && lastW[lastW.length - 1]!.totalPVs > 0
      ? ((lastW[lastW.length - 1]!.widgetLoads ??
          lastW[lastW.length - 1]!.smartScrollViews) /
          lastW[lastW.length - 1]!.totalPVs) *
        100
      : 0;
  const loadPenPrev =
    lastW.length > 1 && lastW[0]!.totalPVs > 0
      ? ((lastW[0]!.widgetLoads ?? lastW[0]!.smartScrollViews) / lastW[0]!.totalPVs) *
        100
      : 0;
  const widgetWowPp = lastW.length > 1 ? loadPenLast - loadPenPrev : null;

  const viewPenLast =
    lastW.length > 0
      ? (() => {
          const w = lastW[lastW.length - 1]!;
          const wl = w.widgetLoads ?? w.smartScrollViews;
          return wl > 0 ? (w.smartScrollViews / wl) * 100 : 0;
        })()
      : 0;
  const viewPenPrev =
    lastW.length > 1
      ? (() => {
          const w = lastW[0]!;
          const wl = w.widgetLoads ?? w.smartScrollViews;
          return wl > 0 ? (w.smartScrollViews / wl) * 100 : 0;
        })()
      : 0;
  const viewabilityWowPp = lastW.length > 1 ? viewPenLast - viewPenPrev : null;

  const widgetLoadChartData = useMemo(() => {
    const weeks = weeklyAgg.slice(-WEEKS_CHART);
    return weeks.map((w) => {
      const wl = w.widgetLoads ?? w.smartScrollViews;
      return {
        week: w.weekStart.slice(5),
        loadsPerPvPct: w.totalPVs > 0 ? (wl / w.totalPVs) * 100 : 0,
        viewabilityPct: wl > 0 ? (w.smartScrollViews / wl) * 100 : 0,
      };
    });
  }, [weeklyAgg]);
  const loadsSparklineValues = useMemo(
    () => widgetLoadChartData.map((w) => w.loadsPerPvPct),
    [widgetLoadChartData]
  );
  const viewabilitySparklineValues = useMemo(
    () => widgetLoadChartData.map((w) => w.viewabilityPct),
    [widgetLoadChartData]
  );

  const demandChannels = useMemo(() => {
    const t = kpis?.totals;
    const tr = t?.totalRevenue ?? 0;
    if (tr <= 0) return [];
    const rows = [
      { label: "Affiliate" as const, revenue: t?.affiliateRevenue ?? 0 },
      { label: "Email" as const, revenue: t?.emailRevenue ?? 0 },
      { label: "Incremental (KVP)" as const, revenue: t?.kvpRevenue ?? 0 },
      { label: "Video" as const, revenue: t?.videoRevenue ?? 0 },
      { label: "Native" as const, revenue: t?.nativeRevenue ?? 0 },
    ];
    return rows
      .map((r) => ({
        ...r,
        pct: (r.revenue / tr) * 100,
      }))
      .sort((a, b) => b.revenue - a.revenue);
  }, [kpis?.totals]);

  const publisherMoMRows = useMemo(
    () => parsePublisherMoM(data?.publisherMoM ?? []),
    [data?.publisherMoM]
  );

  const { publisherMixPubs, publisherTopThreePct } = useMemo(() => {
    const denomRaw = kpis?.meta?.sumPublisherTotalRevenueLatestMonth;
    const denom =
      typeof denomRaw === "number" && denomRaw > 0
        ? denomRaw
        : publisherMoMRows.reduce((s, r) => s + r.currentMonthRev, 0);
    const sorted = [...publisherMoMRows].sort(
      (a, b) => b.currentMonthRev - a.currentMonthRev
    );
    if (denom <= 0) {
      return { publisherMixPubs: [] as { label: string; revenue: number; pct: number }[], publisherTopThreePct: null as number | null };
    }
    const top = sorted.filter((r) => r.currentMonthRev !== 0).slice(0, 8);
    const pubs = top.map((r) => ({
      label: r.publisher,
      revenue: r.currentMonthRev,
      pct: (r.currentMonthRev / denom) * 100,
    }));
    const top3sum = sorted
      .slice(0, 3)
      .reduce((s, r) => s + r.currentMonthRev, 0);
    const topThreePct = (top3sum / denom) * 100;
    return { publisherMixPubs: pubs, publisherTopThreePct: topThreePct };
  }, [publisherMoMRows, kpis?.meta?.sumPublisherTotalRevenueLatestMonth]);

  const weeklyRevChartData = useMemo(() => {
    const weeks = weeklyAgg.slice(-WEEKS_REV_TREND);
    return weeks.map((w) => ({
      week: w.weekStart.slice(5),
      networkRev: w.totalRevenue,
    }));
  }, [weeklyAgg]);

  const weeklyRevNarrative = useMemo(() => {
    const w = weeklyAgg.slice(-WEEKS_REV_TREND);
    if (w.length < 2) return null;
    const first = w[0]!.totalRevenue;
    const last = w[w.length - 1]!.totalRevenue;
    if (!(first > 0) || !Number.isFinite(last)) return null;
    const pct = ((last - first) / first) * 100;
    return {
      pct,
      firstLabel: w[0]!.weekStart.slice(5),
      lastLabel: w[w.length - 1]!.weekStart.slice(5),
    };
  }, [weeklyAgg]);

  const rpmChartData = useMemo(() => {
    const top = [...publisherTotals]
      .sort((a, b) => b.totalRev - a.totalRev)
      .slice(0, TOP_PUBLISHERS_CHART)
      .map((p) => p.publisher);
    const weeks = [
      ...new Set(weeklyByPublisher.map((r) => r.weekStart)),
    ].sort((a, b) => a.localeCompare(b));
    const lastWeeks = weeks.slice(-WEEKS_CHART);
    return lastWeeks.map((w) => {
      const row: Record<string, string | number> = { week: w.slice(5) };
      for (const pub of top) {
        const hit = weeklyByPublisher.find(
          (r) => r.weekStart === w && r.publisher === pub
        );
        row[pub] = hit?.rpm ?? 0;
      }
      return row;
    });
  }, [weeklyByPublisher, publisherTotals]);

  const rpmSeries = useMemo(() => {
    const top = [...publisherTotals]
      .sort((a, b) => b.totalRev - a.totalRev)
      .slice(0, TOP_PUBLISHERS_CHART)
      .map((p) => p.publisher);
    return top.map((name) => ({ name, dataKey: name, valueType: "currency" as const }));
  }, [publisherTotals]);

  const checks = qa?.checks ?? [];

  const previousMonthLabel = kpis?.meta?.previousMonthLabel ?? null;
  const momRev = monthInProgress ? null : pctFromRatio(kpis?.comparison?.momRevenueDeltaPct);
  const momPvs = monthInProgress ? null : pctFromRatio(kpis?.comparison?.momTotalPvsDeltaPct);
  const momSess = monthInProgress ? null : pctFromRatio(kpis?.comparison?.momSessionsDeltaPct);
  const momRpm = monthInProgress ? null : pctFromRatio(kpis?.comparison?.momTotalRpmDeltaPct);

  const pacing = kpis?.pacing;
  const projectedRevenue = pacing?.projectedRevenue ?? 0;
  const paceVsPriorFullMonth = monthInProgress
    ? pctFromRatio(pacing?.paceVsLastMonthPct)
    : null;
  const pacingDayLine =
    monthInProgress &&
    pacing?.daysElapsed != null &&
    pacing?.daysInMonth != null &&
    pacing.daysInMonth > 0
      ? `Day ${pacing.daysElapsed} of ${pacing.daysInMonth} · MTD`
      : null;

  if (error) {
    return (
      <div className="rounded-xl border border-red-500/40 bg-red-950/30 p-6 text-red-200">
        {error}
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-8">
      <div>
        <h2 className="text-xl font-bold text-white">COO · operations & partners</h2>
        <p className="text-sm text-zinc-500 mt-0.5 max-w-2xl">
          Network-first: growth, month-over-month, and revenue diversity. Scroll for footprint and
          each publisher.
        </p>
      </div>

      <section className="space-y-4">
        <div className="flex flex-wrap items-center gap-2 text-zinc-300">
          <Activity className="w-4 h-4 text-amber-400 shrink-0" aria-hidden />
          <h3 className="text-sm font-semibold uppercase tracking-wider">Network</h3>
          {latestMonthLabel ? (
            <span className="text-xs font-normal normal-case text-zinc-500">
              Latest month · {latestMonthLabel}
            </span>
          ) : null}
        </div>
        {monthInProgress ? (
          <p className="text-xs text-amber-400/90 leading-relaxed">
            Month in progress — weekly revenue (below) shows direction; the pacing table compares MTD
            to a projected month-end vs the full prior month.
          </p>
        ) : null}

        <CooPacingDashboard kpis={kpis} lastUpdated={data?.lastUpdated ?? null} />

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-4 sm:p-5 flex flex-col min-h-[320px]">
            <div className="flex items-start gap-3 mb-2">
              <div className="p-2 rounded-lg bg-zinc-800/70 text-emerald-400 shrink-0">
                <TrendingUp className="w-5 h-5" aria-hidden />
              </div>
              <div>
                <h4 className="text-sm font-semibold text-white">Are we growing?</h4>
                <p className="text-xs text-zinc-500 mt-0.5">
                  Network gross revenue by week (rollup). Direction across the last{" "}
                  {WEEKS_REV_TREND} weeks.
                </p>
              </div>
            </div>
            {weeklyRevNarrative ? (
              <p
                className={cn(
                  "text-sm font-medium mb-3 tabular-nums",
                  weeklyRevNarrative.pct >= 0 ? "text-emerald-400" : "text-red-400"
                )}
              >
                {weeklyRevNarrative.pct >= 0 ? "Up" : "Down"}{" "}
                {Math.abs(weeklyRevNarrative.pct).toFixed(1)}% week{" "}
                <span className="text-zinc-400">{weeklyRevNarrative.firstLabel}</span> →{" "}
                <span className="text-zinc-400">{weeklyRevNarrative.lastLabel}</span>
              </p>
            ) : (
              <p className="text-xs text-zinc-500 mb-3">Need at least two weeks of data.</p>
            )}
            <div className="flex-1 min-h-[220px]">
              <TrendChart
                data={weeklyRevChartData}
                series={[
                  {
                    name: "Network revenue",
                    dataKey: "networkRev",
                    valueType: "currency",
                  },
                ]}
                xKey="week"
                height={260}
              />
            </div>
          </div>

          <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-4 sm:p-5 flex flex-col">
            <div className="flex items-start gap-3 mb-4">
              <div className="p-2 rounded-lg bg-zinc-800/70 text-cyan-400 shrink-0">
                <BarChart3 className="w-5 h-5" aria-hidden />
              </div>
              <div className="min-w-0">
                <h4 className="text-sm font-semibold text-white">How did we do vs last month?</h4>
                <p className="text-xs text-zinc-500 mt-0.5">
                  Network total row{previousMonthLabel ? ` · benchmark ${previousMonthLabel}` : ""}
                  .
                </p>
                {monthInProgress ? (
                  <p className="text-[11px] text-amber-400/95 mt-2 leading-relaxed">
                    This month is still open.{" "}
                    <span className="text-zinc-400">
                      Revenue, PVs, and sessions below are MTD;{" "}
                      <strong className="text-amber-200/90">run-rate vs prior month</strong> is in the
                      pacing table above. RPM MoM is withheld until close (partial month RPM is noisy).
                    </span>
                  </p>
                ) : null}
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="rounded-lg border border-zinc-800/80 bg-zinc-950/30 p-3">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500 mb-1">
                  Revenue
                </p>
                <p className="text-xl font-bold text-white tabular-nums leading-tight">
                  {formatCurrency(kpis?.totals?.totalRevenue ?? 0)}
                </p>
                {pacingDayLine ? (
                  <p className="text-[11px] text-zinc-500 mt-1">{pacingDayLine}</p>
                ) : null}
                {momRev != null && Number.isFinite(momRev) ? (
                  <p
                    className={cn(
                      "text-sm font-semibold mt-2 tabular-nums",
                      momRev >= 0 ? "text-emerald-400" : "text-red-400"
                    )}
                  >
                    {momRev >= 0 ? "\u25B2" : "\u25BC"} {Math.abs(momRev).toFixed(1)}% MoM
                  </p>
                ) : monthInProgress ? (
                  <div className="mt-2 space-y-1.5">
                    {projectedRevenue > 0 ? (
                      <p className="text-[11px] text-zinc-400">
                        If daily pace holds:{" "}
                        <span className="text-zinc-200 tabular-nums font-medium">
                          {formatCurrency(projectedRevenue)}
                        </span>{" "}
                        projected
                      </p>
                    ) : null}
                    {paceVsPriorFullMonth != null && Number.isFinite(paceVsPriorFullMonth) ? (
                      <p
                        className={cn(
                          "text-sm font-semibold tabular-nums",
                          paceVsPriorFullMonth >= 0 ? "text-emerald-400" : "text-red-400"
                        )}
                      >
                        {paceVsPriorFullMonth >= 0 ? "\u25B2" : "\u25BC"}{" "}
                        {Math.abs(paceVsPriorFullMonth).toFixed(1)}% vs full{" "}
                        {previousMonthLabel ?? "prior month"}{" "}
                        <span className="text-[11px] font-normal text-zinc-500">(run-rate)</span>
                      </p>
                    ) : (
                      <p className="text-[11px] text-zinc-500">
                        Pacing vs prior month isn&apos;t available yet.
                      </p>
                    )}
                  </div>
                ) : (
                  <p className="text-xs text-zinc-500 mt-2">No MoM data.</p>
                )}
              </div>
              <div className="rounded-lg border border-zinc-800/80 bg-zinc-950/30 p-3">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500 mb-1">
                  Pageviews
                </p>
                <p className="text-xl font-bold text-white tabular-nums leading-tight">
                  {formatNumber(kpis?.totals?.totalPVs ?? 0)}
                </p>
                {monthInProgress ? (
                  <p className="text-[11px] text-zinc-500 mt-2 leading-relaxed">
                    MTD snapshot. MoM % after this month closes.
                  </p>
                ) : momPvs != null && Number.isFinite(momPvs) ? (
                  <p
                    className={cn(
                      "text-sm font-semibold mt-2 tabular-nums",
                      momPvs >= 0 ? "text-emerald-400" : "text-red-400"
                    )}
                  >
                    {momPvs >= 0 ? "\u25B2" : "\u25BC"} {Math.abs(momPvs).toFixed(1)}% MoM
                  </p>
                ) : (
                  <p className="text-xs text-zinc-500 mt-2">—</p>
                )}
              </div>
              <div className="rounded-lg border border-zinc-800/80 bg-zinc-950/30 p-3">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500 mb-1">
                  Sessions
                </p>
                <p className="text-xl font-bold text-white tabular-nums leading-tight">
                  {formatNumber(kpis?.totals?.sessions ?? 0)}
                </p>
                {monthInProgress ? (
                  <p className="text-[11px] text-zinc-500 mt-2 leading-relaxed">
                    MTD snapshot. Run-rate vs prior month is in the pacing table above.
                  </p>
                ) : momSess != null && Number.isFinite(momSess) ? (
                  <p
                    className={cn(
                      "text-sm font-semibold mt-2 tabular-nums",
                      momSess >= 0 ? "text-emerald-400" : "text-red-400"
                    )}
                  >
                    {momSess >= 0 ? "\u25B2" : "\u25BC"} {Math.abs(momSess).toFixed(1)}% MoM
                  </p>
                ) : (
                  <p className="text-xs text-zinc-500 mt-2">—</p>
                )}
              </div>
            </div>
            <p className="text-[11px] text-zinc-500 mt-3 pt-3 border-t border-zinc-800/80">
              Blended RPM (network):{" "}
              <span className="text-zinc-300 tabular-nums font-medium">
                {formatCurrency(kpis?.totals?.totalRpm ?? 0)}
              </span>
              {!monthInProgress && momRpm != null && Number.isFinite(momRpm) ? (
                <span
                  className={cn(
                    "ml-2 tabular-nums font-semibold",
                    momRpm >= 0 ? "text-emerald-400" : "text-red-400"
                  )}
                >
                  {momRpm >= 0 ? "\u25B2" : "\u25BC"} {Math.abs(momRpm).toFixed(1)}% MoM
                </span>
              ) : monthInProgress ? (
                <span className="text-zinc-600 ml-1">· MoM after month closes</span>
              ) : (
                <span className="text-zinc-600 ml-1">· —</span>
              )}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 items-stretch">
          <CooDemandMixStrip channels={demandChannels} monthLabel={latestMonthLabel} />
          <CooPublisherMixStrip
            publishers={publisherMixPubs}
            monthLabel={latestMonthLabel}
            topThreePct={publisherTopThreePct}
          />
        </div>

        <div className="rounded-xl border border-zinc-800 bg-zinc-900/30 p-4 sm:p-5 space-y-3">
          <h4 className="text-sm font-semibold text-zinc-300 uppercase tracking-wider">
            Network footprint trend (weekly)
          </h4>
          <p className="text-xs text-zinc-500">
            Green = loads ÷ PVs.
            {!viewabilityNotComparable
              ? " Cyan = in-views ÷ loads."
              : " Viewability hidden — loads and in-views look identical in the rollup."}
          </p>
          {viewabilityNotComparable ? (
            <p className="text-xs text-amber-400/90">
              Add separate sheet columns for widget loads and in-views to chart viewability over
              time.
            </p>
          ) : null}
          <TrendChart
            data={widgetLoadChartData}
            series={[
              {
                name: "Loads ÷ PVs",
                dataKey: "loadsPerPvPct",
                valueType: "percent",
              },
              ...(!viewabilityNotComparable
                ? [
                    {
                      name: "Viewability (in-views ÷ loads)",
                      dataKey: "viewabilityPct" as const,
                      valueType: "percent" as const,
                    },
                  ]
                : []),
            ]}
            xKey="week"
            height={280}
          />
        </div>
      </section>

      <div className="border-t border-zinc-800 pt-8 space-y-8">
        <div className="flex flex-wrap items-center gap-2 text-zinc-300">
          <UserCheck className="w-4 h-4 text-emerald-400 shrink-0" aria-hidden />
          <h3 className="text-sm font-semibold uppercase tracking-wider">
            Partners & publishers
          </h3>
        </div>
        <PersonaMetricGlossary className="max-w-3xl" />

        <section>
          <h4 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider mb-3">
            Lifetime footprint (summed from publisher rows)
          </h4>
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
            <CpoHeroMetricCard
              label="Widget loads ÷ pageviews"
              valuePct={loadsPerPvPct}
              formulaBadge="loads ÷ PVs"
              formulaTitle="Widget loads divided by pageviews"
              accent="cyan"
              sparklineValues={loadsSparklineValues}
              sparklineCaption="Network loads ÷ PVs (weekly)"
            >
              <div className="space-y-1">
                <p className="text-[11px] text-zinc-500">
                  Eligible serves ÷ tagged pageviews ·{" "}
                  <span className="text-zinc-400 tabular-nums">
                    {formatNumber(sumWL)} / {formatNumber(sumPV)}
                  </span>
                </p>
                {viewabilityNotComparable ? (
                  <p className="text-[11px] text-zinc-500">
                    In-views use the same totals as loads — see viewability card.
                  </p>
                ) : null}
                {widgetWowPp != null ? (
                  <p
                    className={`text-xs font-medium ${
                      widgetWowPp >= 0 ? "text-emerald-400" : "text-amber-400"
                    }`}
                  >
                    Loads ÷ PVs WoW: {widgetWowPp >= 0 ? "+" : ""}
                    {widgetWowPp.toFixed(1)} pp
                  </p>
                ) : null}
              </div>
            </CpoHeroMetricCard>
            <CpoHeroMetricCard
              label="Viewability (in-views ÷ loads)"
              valuePct={viewabilityNotComparable ? 0 : inViewPerLoadPct}
              formulaBadge="in-views ÷ loads"
              formulaTitle="SmartScroll in-views divided by widget loads"
              accent="emerald"
              sparklineValues={viewabilityNotComparable ? loadsSparklineValues : viewabilitySparklineValues}
              sparklineCaption={
                viewabilityNotComparable
                  ? "Legacy rollup columns (viewability unavailable)"
                  : "Network in-views ÷ loads (weekly)"
              }
            >
              <div className="space-y-1">
                {viewabilityNotComparable ? (
                  <p className="text-[11px] text-amber-400/95 leading-relaxed">
                    Not available: loads and in-views are identical in the rollup (usually one
                    legacy column). Add{" "}
                    <span className="text-amber-300/90">widget_loads</span> and{" "}
                    <span className="text-amber-300/90">ss_in_views</span> (or{" "}
                    <span className="text-amber-300/90">in_views</span>) to measure this.
                  </p>
                ) : (
                  <>
                    <p className="text-[11px] text-zinc-500">
                      In-view ÷ eligible serves ·{" "}
                      <span className="text-zinc-400 tabular-nums">
                        {formatNumber(sumSS)} / {formatNumber(sumWL)}
                      </span>
                    </p>
                    {viewabilityWowPp != null ? (
                      <p
                        className={`text-xs font-medium ${
                          viewabilityWowPp >= 0 ? "text-emerald-400" : "text-amber-400"
                        }`}
                      >
                        Viewability WoW: {viewabilityWowPp >= 0 ? "+" : ""}
                        {viewabilityWowPp.toFixed(1)} pp
                      </p>
                    ) : null}
                  </>
                )}
              </div>
            </CpoHeroMetricCard>
            {pubsWithLoads < totalPubs ? (
              <KpiHeroCard
                label="Partners with widget loads"
                value={`${pubsWithLoads}/${totalPubs}`}
                size="sm"
                icon={UserCheck}
                extra={
                  <div className="mt-2 space-y-1">
                    <p className="text-[11px] text-zinc-500">
                      Sites with load volume &gt; 0 in the lifetime rollup.
                    </p>
                  </div>
                }
              />
            ) : null}
          </div>
        </section>

      <section className="space-y-3">
        <h3 className="text-sm font-semibold text-zinc-300 uppercase tracking-wider">
          How much we make from each publisher
        </h3>
        <p className="text-xs text-zinc-500">
          Lifetime gross, latest-month context in the table, RPM vs trailing weeks, and QA. Click a
          row to expand.
        </p>
        <CooPublisherPerformanceTable
          rows={publisherTotals}
          weeklyByPublisher={weeklyByPublisher}
          qaChecks={checks}
        />
      </section>

      <section className="space-y-3">
        <h3 className="text-sm font-semibold text-zinc-300 uppercase tracking-wider">
          RPM by top publisher (weekly)
        </h3>
        <p className="text-xs text-zinc-500">
          Top {TOP_PUBLISHERS_CHART} by lifetime revenue — yield check alongside footprint.
        </p>
        <TrendChart data={rpmChartData} series={rpmSeries} xKey="week" height={280} />
      </section>
      </div>

      {dataQaPlacement === "panel" ? (
        <CooPersonaDataQaSection qaSectionId={qaSectionId} />
      ) : null}
    </div>
  );
}
