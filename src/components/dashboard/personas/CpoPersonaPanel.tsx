"use client";

import { CpoHeroMetricCard } from "@/components/dashboard/CpoHeroMetricCard";
import { KpiHeroCard } from "@/components/dashboard/KpiHeroCard";
import { PersonaMetricGlossary } from "@/components/dashboard/PersonaMetricGlossary";
import { SmartScrollTable } from "@/components/dashboard/SmartScrollTable";
import { TrendChart } from "@/components/dashboard/TrendChart";
import { VrpmGapTable } from "@/components/dashboard/VrpmGapTable";
import {
  useDashboardLive,
  type PublisherTotalRow,
} from "@/lib/dashboard-data-context";
import { formatCurrency, pctFromRatio } from "@/lib/data";
import type { KpisPayload } from "@/lib/live-payload-types";
import { parseWeeklyByPublisher, parseWeeklyTrend } from "@/lib/persona-metrics";
import { BarChart3, ScanEye } from "lucide-react";
import { useMemo } from "react";

const TREND_WEEKS = 12;
/** Lifetime gross per stream must clear this to count as “active” for diversification. */
const MIN_CHANNEL_GROSS_USD = 25;

const EMPTY_PUBLISHER_TOTALS: PublisherTotalRow[] = [];

function activeDemandStreamCount(p: PublisherTotalRow): number {
  let n = 0;
  if (p.affiliateRev >= MIN_CHANNEL_GROSS_USD) n++;
  if (p.emailRev >= MIN_CHANNEL_GROSS_USD) n++;
  if (p.kvpRev >= MIN_CHANNEL_GROSS_USD) n++;
  if (p.videoRev >= MIN_CHANNEL_GROSS_USD) n++;
  if (p.nativeRev >= MIN_CHANNEL_GROSS_USD) n++;
  return n;
}

export function CpoPersonaPanel() {
  const { error, data } = useDashboardLive();
  const kpis = (data?.kpis ?? null) as KpisPayload | null;
  const cmp = kpis?.comparison;
  const totals = kpis?.totals;
  const monthInProgress = kpis?.pacing?.isCurrentMonth === true;
  const meta = kpis?.meta;
  const publisherTotals = data?.publisherTotals ?? EMPTY_PUBLISHER_TOTALS;
  const weeklyAgg = parseWeeklyTrend(data?.weeklyTrend ?? []);
  const weeklyByPublisher = parseWeeklyByPublisher(data?.weeklyByPublisher ?? []);

  const totalPubs = publisherTotals.length || 1;
  const pubsWithLoads = publisherTotals.filter(
    (p) => (p.widgetLoads ?? p.smartScrollViews) > 0
  ).length;
  const adoptionPct = (pubsWithLoads / totalPubs) * 100;

  const { networkLoadsPerPvPct, networkViewabilityPct } = useMemo(() => {
    let pv = 0;
    let wl = 0;
    let ss = 0;
    for (const p of publisherTotals) {
      pv += p.totalPVs;
      wl += p.widgetLoads ?? p.smartScrollViews;
      ss += p.smartScrollViews;
    }
    return {
      networkLoadsPerPvPct: pv > 0 ? (wl / pv) * 100 : 0,
      networkViewabilityPct: wl > 0 ? (ss / wl) * 100 : 0,
    };
  }, [publisherTotals]);

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
      ? ((lastW[0]!.widgetLoads ?? lastW[0]!.smartScrollViews) / lastW[0]!.totalPVs) * 100
      : 0;
  const loadPenPp = lastW.length > 1 ? loadPenLast - loadPenPrev : null;

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
  const viewabilityPenPp = lastW.length > 1 ? viewPenLast - viewPenPrev : null;

  const loadPenetrationSeries = useMemo(
    () =>
      weeklyAgg.slice(-TREND_WEEKS).map((w) => {
        const wl = w.widgetLoads ?? w.smartScrollViews;
        return w.totalPVs > 0 ? (wl / w.totalPVs) * 100 : 0;
      }),
    [weeklyAgg]
  );

  const viewabilitySeries = useMemo(
    () =>
      weeklyAgg.slice(-TREND_WEEKS).map((w) => {
        const wl = w.widgetLoads ?? w.smartScrollViews;
        return wl > 0 ? (w.smartScrollViews / wl) * 100 : 0;
      }),
    [weeklyAgg]
  );

  const { diversificationPct, diversifiedPubCount, diversificationSparkline } = useMemo(() => {
    const diversified = publisherTotals.filter((p) => activeDemandStreamCount(p) >= 2);
    const pct = totalPubs > 0 ? (diversified.length / totalPubs) * 100 : 0;
    const flat = Array.from({ length: TREND_WEEKS }, () => pct);
    return {
      diversificationPct: pct,
      diversifiedPubCount: diversified.length,
      diversificationSparkline: flat,
    };
  }, [publisherTotals, totalPubs]);

  const trendData = weeklyAgg.slice(-TREND_WEEKS).map((w) => ({
    week: w.weekStart.slice(5),
    widgetLoads: w.widgetLoads ?? w.smartScrollViews,
    smartScrollViews: w.smartScrollViews,
    blendedVrpm: w.blendedVrpm,
    pageviews: w.totalPVs,
  }));

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
        <h2 className="text-xl font-bold text-white">Product metrics</h2>
        <p className="text-sm text-zinc-500 mt-0.5">
          {meta?.latestMonthLabel
            ? `${meta.latestMonthLabel} · adoption, viewability, publisher mix`
            : "Adoption, viewability, and publisher mix"}
        </p>
        <PersonaMetricGlossary className="mt-3" />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <KpiHeroCard
          label="Blended RPM"
          value={formatCurrency(totals?.totalRpm ?? 0)}
          delta={monthInProgress ? null : pctFromRatio(cmp?.momTotalRpmDeltaPct)}
          deltaLabel="MoM"
          size="sm"
          icon={BarChart3}
          extra={
            <p className="mt-1 text-[11px] text-zinc-500">Per 1k pageviews · latest network month</p>
          }
        />
        <KpiHeroCard
          label="Viewable RPM"
          value={formatCurrency(totals?.totalVrpm ?? 0)}
          delta={monthInProgress ? null : pctFromRatio(cmp?.momTotalVrpmDeltaPct)}
          deltaLabel="MoM"
          size="sm"
          icon={ScanEye}
          extra={
            <p className="mt-1 text-[11px] text-zinc-500">Per 1k SS in-views · latest network month</p>
          }
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <CpoHeroMetricCard
          label="Widget loads ÷ pageviews"
          valuePct={networkLoadsPerPvPct}
          formulaBadge="loads ÷ PVs"
          formulaTitle="Widget loads ÷ pageviews (network lifetime)"
          accent="cyan"
          sparklineValues={loadPenetrationSeries}
          sparklineCaption="Network loads ÷ PVs (weekly)"
        >
          <p className="text-zinc-500">
            <span className="text-zinc-400 font-medium">{pubsWithLoads}</span> of{" "}
            <span className="text-zinc-400">{totalPubs}</span> publishers with loads (
            {adoptionPct.toFixed(0)}% activation).
          </p>
          {loadPenPp != null ? (
            <p
              className={
                loadPenPp >= 0 ? "font-medium text-cyan-400" : "font-medium text-red-400"
              }
            >
              Loads ÷ PVs WoW: {loadPenPp >= 0 ? "+" : ""}
              {loadPenPp.toFixed(1)} pp
            </p>
          ) : null}
        </CpoHeroMetricCard>
        <CpoHeroMetricCard
          label="Viewability (in-views ÷ loads)"
          valuePct={networkViewabilityPct}
          formulaBadge="in-views ÷ loads"
          formulaTitle="SmartScroll in-views ÷ widget loads (network lifetime)"
          accent="emerald"
          sparklineValues={viewabilitySeries}
          sparklineCaption="Network SS in-views ÷ widget loads (weekly)"
        >
          <p>Of eligible widget loads, share that were measured in-view.</p>
          {viewabilityPenPp != null ? (
            <p
              className={
                viewabilityPenPp >= 0
                  ? "font-medium text-emerald-400"
                  : "font-medium text-red-400"
              }
            >
              Viewability WoW: {viewabilityPenPp >= 0 ? "+" : ""}
              {viewabilityPenPp.toFixed(1)} pp
            </p>
          ) : null}
        </CpoHeroMetricCard>
        <CpoHeroMetricCard
          label="Publisher mix"
          valuePct={diversificationPct}
          formulaBadge="≥2 streams"
          formulaTitle={`Publishers with at least two of Affiliate, KVP, Video, Native each ≥ $${MIN_CHANNEL_GROSS_USD} lifetime gross (rollup). Headline is share of all publishers in the table.`}
          accent="amber"
          sparklineValues={diversificationSparkline}
          sparklineCaption="Share of publishers (lifetime snapshot)"
        >
          <p>
            <span className="text-zinc-400 font-medium">{diversifiedPubCount}</span> of{" "}
            <span className="text-zinc-400">{totalPubs}</span> publishers earn from{" "}
            <span className="text-zinc-400 font-medium">two or more</span> demand streams above{" "}
            <span className="text-zinc-400 font-medium">${MIN_CHANNEL_GROSS_USD}</span> each
            (lifetime).
          </p>
          <p className="text-zinc-500">
            Streams: Affiliate, KVP, Video, Native. Flat trend line — weekly per-publisher channel
            splits are not in this feed.
          </p>
        </CpoHeroMetricCard>
      </div>

      <section className="space-y-3">
        <h3 className="text-sm font-semibold text-zinc-300 uppercase tracking-wider">
          Weekly trend (network)
        </h3>
        <p className="text-xs text-zinc-500">
          Counts on the left; blended vRPM (revenue per 1k SS in-views) on the right.
        </p>
        <TrendChart
          data={trendData}
          series={[
            {
              name: "Widget loads",
              dataKey: "widgetLoads",
              yAxisId: "left",
              valueType: "count",
            },
            {
              name: "SS in-views",
              dataKey: "smartScrollViews",
              yAxisId: "left",
              valueType: "count",
            },
            {
              name: "Pageviews",
              dataKey: "pageviews",
              yAxisId: "left",
              valueType: "count",
            },
            {
              name: "Blended vRPM",
              dataKey: "blendedVrpm",
              yAxisId: "right",
              valueType: "currency",
            },
          ]}
          xKey="week"
          height={360}
        />
      </section>

      <section className="space-y-3">
        <h3 className="text-sm font-semibold text-zinc-300 uppercase tracking-wider">
          vRPM vs RPM gap analysis
        </h3>
        <p className="text-xs text-zinc-500 max-w-3xl leading-relaxed">
          <span className="text-zinc-400">Gap = RPM − vRPM</span> (
          <span className="text-zinc-500">RPM</span> per 1k pageviews vs.{" "}
          <span className="text-zinc-500">vRPM</span> per 1k in-views). Different bases — a big
          negative gap often means viewable impressions earn more per thousand than blended PVs, not
          a simple “lost dollars” figure.{" "}
          <span className="text-zinc-400">CPO use:</span> rank who gets a{" "}
          <span className="text-zinc-300">product pass</span> (widget placement, lazy load, page
          speed, loads ÷ PVs, viewability); if <span className="text-zinc-300">Trend</span> is{" "}
          <span className="text-zinc-300">widening</span>, confirm in the publisher table below.
        </p>
        <VrpmGapTable rows={publisherTotals} weeklyByPublisher={weeklyByPublisher} />
      </section>

      <section className="space-y-3">
        <h3 className="text-sm font-semibold text-zinc-300 uppercase tracking-wider">
          Loads and in-view penetration by publisher
        </h3>
        <p className="text-xs text-zinc-500">
          By loads ÷ PVs, then viewability. Legacy rollups may duplicate one column for loads and
          in-views.
        </p>
        <SmartScrollTable rows={publisherTotals} weeklyByPublisher={weeklyByPublisher} />
      </section>
    </div>
  );
}
