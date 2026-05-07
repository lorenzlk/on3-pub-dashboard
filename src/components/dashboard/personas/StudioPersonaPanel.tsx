"use client";

import { TrendChart } from "@/components/dashboard/TrendChart";
import { useDashboardLive, type MonthlyTotalRow } from "@/lib/dashboard-data-context";
import { formatCurrency, formatNumber, formatPercentChart } from "@/lib/data";
import { parseWeeklyByPublisher } from "@/lib/persona-metrics";
import { useMemo, useState } from "react";

type StudioDimension = "publisher" | "channel";
type StudioGranularity = "monthly" | "quarterly";
type StudioRange = "2" | "3" | "4" | "6" | "8" | "12" | "16" | "all";
type PublisherMetric =
  | "revenue"
  | "pvs"
  | "sessions"
  | "rpm"
  | "vrpm"
  | "loadsRate"
  | "viewability";

const CHANNEL_KEYS = [
  { key: "affiliateRev", label: "Affiliate" },
  { key: "emailRev", label: "Email" },
  { key: "kvpRev", label: "Incremental (KVP)" },
  { key: "videoRev", label: "Video" },
  { key: "nativeRev", label: "Native" },
] as const;

const METRIC_OPTIONS: Array<{ id: PublisherMetric; label: string }> = [
  { id: "revenue", label: "Revenue" },
  { id: "pvs", label: "Pageviews" },
  { id: "sessions", label: "Sessions" },
  { id: "rpm", label: "RPM" },
  { id: "vrpm", label: "vRPM" },
  { id: "loadsRate", label: "Loads ÷ PVs" },
  { id: "viewability", label: "In-views ÷ loads" },
];

type PublisherAgg = {
  revenue: number;
  pvs: number;
  sessions: number;
  widgetLoads: number;
  smartScrollViews: number;
};

type PeriodRow = {
  key: string;
  label: string;
  sort: number;
};

function formatMetric(value: number, metric: PublisherMetric) {
  if (metric === "revenue" || metric === "rpm" || metric === "vrpm") {
    return formatCurrency(value);
  }
  if (metric === "loadsRate" || metric === "viewability") {
    return formatPercentChart(value, 1);
  }
  return formatNumber(value);
}

function monthSortKey(row: MonthlyTotalRow) {
  return row.year * 100 + row.month;
}

function metricFromAgg(agg: PublisherAgg, metric: PublisherMetric): number {
  if (metric === "revenue") return agg.revenue;
  if (metric === "pvs") return agg.pvs;
  if (metric === "sessions") return agg.sessions;
  if (metric === "rpm") return agg.pvs > 0 ? (agg.revenue / agg.pvs) * 1000 : 0;
  if (metric === "vrpm") {
    return agg.smartScrollViews > 0 ? (agg.revenue / agg.smartScrollViews) * 1000 : 0;
  }
  if (metric === "loadsRate") return agg.pvs > 0 ? (agg.widgetLoads / agg.pvs) * 100 : 0;
  return agg.widgetLoads > 0 ? (agg.smartScrollViews / agg.widgetLoads) * 100 : 0;
}

function periodFromYearMonth(
  year: number,
  month: number,
  granularity: StudioGranularity
): PeriodRow {
  if (granularity === "quarterly") {
    const q = Math.floor((month - 1) / 3) + 1;
    return {
      key: `${year}-Q${q}`,
      label: `Q${q} ${year}`,
      sort: year * 10 + q,
    };
  }
  return {
    key: `${year}-${String(month).padStart(2, "0")}`,
    label: `${String(month).padStart(2, "0")}/${String(year).slice(-2)}`,
    sort: year * 100 + month,
  };
}

function periodFromWeekStart(weekStart: string, granularity: StudioGranularity): PeriodRow | null {
  const d = new Date(`${weekStart}T00:00:00Z`);
  if (Number.isNaN(d.getTime())) return null;
  const y = d.getUTCFullYear();
  const m = d.getUTCMonth() + 1;
  return periodFromYearMonth(y, m, granularity);
}

export function StudioPersonaPanel() {
  const { error, data } = useDashboardLive();
  const [dimension, setDimension] = useState<StudioDimension>("publisher");
  const [granularity, setGranularity] = useState<StudioGranularity>("quarterly");
  const [range, setRange] = useState<StudioRange>("3");
  const [publisherMetric, setPublisherMetric] = useState<PublisherMetric>("revenue");

  const weeklyRows = useMemo(
    () => parseWeeklyByPublisher(data?.weeklyByPublisher ?? []),
    [data?.weeklyByPublisher]
  );
  const monthlyTotals = useMemo(
    () => [...(data?.monthlyTotals ?? [])].sort((a, b) => monthSortKey(a) - monthSortKey(b)),
    [data?.monthlyTotals]
  );

  const publisherPeriodAgg = useMemo(() => {
    const map = new Map<string, Map<string, PublisherAgg>>();
    const periodMeta = new Map<string, PeriodRow>();
    for (const row of weeklyRows) {
      const period = periodFromWeekStart(row.weekStart, granularity);
      if (!period) continue;
      periodMeta.set(period.key, period);
      const pubMap = map.get(row.publisher) ?? new Map<string, PublisherAgg>();
      const curr = pubMap.get(period.key) ?? {
        revenue: 0,
        pvs: 0,
        sessions: 0,
        widgetLoads: 0,
        smartScrollViews: 0,
      };
      curr.revenue += row.totalRevenue;
      curr.pvs += row.totalPVs;
      curr.sessions += row.sessions;
      curr.widgetLoads += row.widgetLoads;
      curr.smartScrollViews += row.smartScrollViews;
      pubMap.set(period.key, curr);
      map.set(row.publisher, pubMap);
    }
    const periods = [...periodMeta.values()].sort((a, b) => a.sort - b.sort);
    const limitedPeriods = periods.slice(range === "all" ? undefined : -Number(range));
    const periodKeys = new Set(limitedPeriods.map((p) => p.key));
    return { map, periods: limitedPeriods, periodKeys };
  }, [weeklyRows, granularity, range]);

  const channelPeriodRows = useMemo(() => {
    const grouped = new Map<
      string,
      {
        period: PeriodRow;
        affiliate: number;
        email: number;
        kvp: number;
        video: number;
        native: number;
      }
    >();
    for (const m of monthlyTotals) {
      const period = periodFromYearMonth(m.year, m.month, granularity);
      const curr = grouped.get(period.key) ?? {
        period,
        affiliate: 0,
        email: 0,
        kvp: 0,
        video: 0,
        native: 0,
      };
      curr.affiliate += m.affiliateRev ?? 0;
      curr.email += m.emailRev ?? 0;
      curr.kvp += m.kvpRev ?? 0;
      curr.video += m.videoRev ?? 0;
      curr.native += m.nativeRev ?? 0;
      grouped.set(period.key, curr);
    }
    const rows = [...grouped.values()].sort((a, b) => a.period.sort - b.period.sort);
    return rows.slice(range === "all" ? undefined : -Number(range));
  }, [monthlyTotals, granularity, range]);

  const publisherTrend = useMemo(() => {
    if (!publisherPeriodAgg.periods.length) {
      return { data: [], series: [] as Array<{ name: string; dataKey: string; valueType: "currency" | "count" | "percent" }> };
    }
    const topPublishers = [...publisherPeriodAgg.map.entries()]
      .map(([publisher, per]) => {
        const score = [...per.entries()]
          .filter(([k]) => publisherPeriodAgg.periodKeys.has(k))
          .reduce((sum, [, agg]) => sum + metricFromAgg(agg, publisherMetric), 0);
        return { publisher, score };
      })
      .sort((a, b) => b.score - a.score)
      .slice(0, 4)
      .map((x) => x.publisher);

    const trendData = publisherPeriodAgg.periods.map((period) => {
      const row: Record<string, string | number> = { period: period.label };
      for (const pub of topPublishers) {
        const agg = publisherPeriodAgg.map.get(pub)?.get(period.key);
        row[pub] = agg ? metricFromAgg(agg, publisherMetric) : 0;
      }
      return row;
    });

    const valueType: "currency" | "count" | "percent" =
      publisherMetric === "revenue" || publisherMetric === "rpm" || publisherMetric === "vrpm"
        ? "currency"
        : publisherMetric === "loadsRate" || publisherMetric === "viewability"
          ? "percent"
          : "count";

    return {
      data: trendData,
      series: topPublishers.map((p) => ({ name: p, dataKey: p, valueType })),
    };
  }, [publisherPeriodAgg, publisherMetric]);

  const publisherLeaderboard = useMemo(() => {
    const grouped = new Map<string, number>();
    for (const [publisher, per] of publisherPeriodAgg.map.entries()) {
      let value = 0;
      for (const [key, agg] of per.entries()) {
        if (!publisherPeriodAgg.periodKeys.has(key)) continue;
        value += metricFromAgg(agg, publisherMetric);
      }
      grouped.set(publisher, value);
    }
    return [...grouped.entries()]
      .map(([publisher, value]) => ({ publisher, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 12);
  }, [publisherPeriodAgg, publisherMetric]);

  const channelTrend = useMemo(() => {
    const data = channelPeriodRows.map((m) => ({
      period: m.period.label,
      affiliate: m.affiliate,
      email: m.email,
      kvp: m.kvp,
      video: m.video,
      native: m.native,
    }));
    return {
      data,
      series: [
        { name: "Affiliate", dataKey: "affiliate", valueType: "currency" as const },
        { name: "Email", dataKey: "email", valueType: "currency" as const },
        { name: "Incremental (KVP)", dataKey: "kvp", valueType: "currency" as const },
        { name: "Video", dataKey: "video", valueType: "currency" as const },
        { name: "Native", dataKey: "native", valueType: "currency" as const },
      ],
    };
  }, [channelPeriodRows]);

  const channelLeaderboard = useMemo(() => {
    const totals = CHANNEL_KEYS.map(({ key, label }) => ({
      label,
      value: channelPeriodRows.reduce((sum, m) => {
        if (key === "affiliateRev") return sum + m.affiliate;
        if (key === "emailRev") return sum + m.email;
        if (key === "kvpRev") return sum + m.kvp;
        if (key === "videoRev") return sum + m.video;
        return sum + m.native;
      }, 0),
    })).sort((a, b) => b.value - a.value);
    return totals;
  }, [channelPeriodRows]);

  if (error) {
    return <div className="rounded-xl border border-red-500/40 bg-red-950/30 p-6 text-red-200">{error}</div>;
  }

  const rangeOptions =
    granularity === "quarterly"
      ? [
          { value: "2", label: "Last 2 periods" },
          { value: "3", label: "Last 3 periods" },
          { value: "4", label: "Last 4 periods" },
          { value: "all", label: "All available" },
        ]
      : [
          { value: "4", label: "Last 4 periods" },
          { value: "6", label: "Last 6 periods" },
          { value: "8", label: "Last 8 periods" },
          { value: "12", label: "Last 12 periods" },
          { value: "16", label: "Last 16 periods" },
          { value: "all", label: "All available" },
        ];

  const handleGranularityChange = (next: StudioGranularity) => {
    setGranularity(next);
    setRange(next === "quarterly" ? "3" : "8");
  };

  return (
    <div className="space-y-6 pb-8">
      <div>
        <h2 className="text-xl font-bold text-white">Studio · investor & advisor analytics</h2>
        <p className="text-sm text-zinc-500 mt-0.5 max-w-3xl">
          Upleveled view for momentum and contribution by publisher or channel.
        </p>
      </div>

      <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-4 grid grid-cols-1 md:grid-cols-4 gap-3">
        <label className="text-xs text-zinc-400 flex flex-col gap-1">
          Dimension
          <select
            value={dimension}
            onChange={(e) => setDimension(e.target.value as StudioDimension)}
            className="bg-zinc-900 border border-zinc-700 rounded-md px-2 py-2 text-sm text-white"
          >
            <option value="publisher">Publisher</option>
            <option value="channel">Channel</option>
          </select>
        </label>
        <label className="text-xs text-zinc-400 flex flex-col gap-1">
          Period
          <select
            value={granularity}
            onChange={(e) => handleGranularityChange(e.target.value as StudioGranularity)}
            className="bg-zinc-900 border border-zinc-700 rounded-md px-2 py-2 text-sm text-white"
          >
            <option value="quarterly">Quarterly</option>
            <option value="monthly">Monthly</option>
          </select>
        </label>
        <label className="text-xs text-zinc-400 flex flex-col gap-1">
          Time window
          <select
            value={range}
            onChange={(e) => setRange(e.target.value as StudioRange)}
            className="bg-zinc-900 border border-zinc-700 rounded-md px-2 py-2 text-sm text-white"
          >
            {rangeOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </label>
        <label className="text-xs text-zinc-400 flex flex-col gap-1">
          Metric
          <select
            value={publisherMetric}
            onChange={(e) => setPublisherMetric(e.target.value as PublisherMetric)}
            disabled={dimension !== "publisher"}
            className="bg-zinc-900 border border-zinc-700 rounded-md px-2 py-2 text-sm text-white disabled:opacity-50"
          >
            {METRIC_OPTIONS.map((m) => (
              <option key={m.id} value={m.id}>
                {m.label}
              </option>
            ))}
          </select>
        </label>
      </div>

      <section className="space-y-3">
        <h3 className="text-sm font-semibold text-zinc-300 uppercase tracking-wider">
          Trend over time ({granularity})
        </h3>
        <TrendChart
          data={dimension === "publisher" ? publisherTrend.data : channelTrend.data}
          series={dimension === "publisher" ? publisherTrend.series : channelTrend.series}
          xKey="period"
          height={320}
        />
      </section>

      <section className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-4">
          <h3 className="text-sm font-semibold text-zinc-300 uppercase tracking-wider mb-3">
            Leaderboard
          </h3>
          <div className="space-y-2">
            {(dimension === "publisher" ? publisherLeaderboard : channelLeaderboard).map((row, idx) => (
              <div
                key={`${"publisher" in row ? row.publisher : row.label}-${idx}`}
                className="flex items-center justify-between gap-3 rounded-lg border border-zinc-800/80 bg-zinc-950/30 px-3 py-2"
              >
                <p className="text-sm text-zinc-300 truncate">
                  {idx + 1}. {"publisher" in row ? row.publisher : row.label}
                </p>
                <p className="text-sm font-semibold text-white tabular-nums">
                  {formatMetric(row.value, dimension === "publisher" ? publisherMetric : "revenue")}
                </p>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-4">
          <h3 className="text-sm font-semibold text-zinc-300 uppercase tracking-wider mb-3">
            Mix
          </h3>
          <div className="space-y-3">
            {(dimension === "publisher" ? publisherLeaderboard.slice(0, 8) : channelLeaderboard).map((row) => {
              const total = (dimension === "publisher" ? publisherLeaderboard : channelLeaderboard).reduce(
                (sum, r) => sum + r.value,
                0
              );
              const pct = total > 0 ? (row.value / total) * 100 : 0;
              const label = "publisher" in row ? row.publisher : row.label;
              return (
                <div key={label}>
                  <div className="flex items-baseline justify-between gap-2 text-xs mb-1">
                    <span className="text-zinc-400 truncate">{label}</span>
                    <span className="text-zinc-300 tabular-nums">
                      {pct.toFixed(1)}% · {formatMetric(row.value, dimension === "publisher" ? publisherMetric : "revenue")}
                    </span>
                  </div>
                  <div className="h-2 rounded-full bg-zinc-800 overflow-hidden">
                    <div className="h-full rounded-full bg-emerald-500/80" style={{ width: `${Math.min(100, pct)}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>
    </div>
  );
}

