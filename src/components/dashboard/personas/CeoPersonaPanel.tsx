"use client";

import { DashboardSectionHeader } from "@/components/dashboard/DashboardSectionHeader";
import { KpiHeroCard } from "@/components/dashboard/KpiHeroCard";
import { SparklineTrend } from "@/components/dashboard/SparklineTrend";
import { useDashboardLive } from "@/lib/dashboard-data-context";
import { formatCurrency, formatNumber, pctFromRatio } from "@/lib/data";
import type { KpisPayload } from "@/lib/live-payload-types";
import { parseWeeklyTrend } from "@/lib/persona-metrics";
import { AlertTriangle, BarChart3, DollarSign, ScanEye, TrendingUp, Users } from "lucide-react";

const CONCENTRATION_WARN_PCT = 40;

type KpisPacing = {
  isCurrentMonth?: boolean;
  daysElapsed?: number | null;
  daysInMonth?: number | null;
  projectedRevenue?: number;
  paceVsLastMonthPct?: number | null;
};

export function CeoPersonaPanel() {
  const { loading, error, data } = useDashboardLive();
  const kpis = (data?.kpis ?? null) as (KpisPayload & { pacing?: KpisPacing }) | null;
  const weekly = parseWeeklyTrend(data?.weeklyTrend ?? []);

  const meta = kpis?.meta;
  const cmp = kpis?.comparison;
  const totals = kpis?.totals;
  const pacing = kpis?.pacing;

  const totalRev = totals?.totalRevenue ?? 0;
  const blendedRpm = totals?.totalRpm ?? 0;
  const viewableRpm = totals?.totalVrpm ?? 0;
  const publisherCount = meta?.publisherCountLatestMonth ?? data?.publisherTotals?.length ?? 0;

  const momRevPct = pctFromRatio(cmp?.momRevenueDeltaPct);
  const momRpmPct = pctFromRatio(cmp?.momTotalRpmDeltaPct);
  const momVrpmPct = pctFromRatio(cmp?.momTotalVrpmDeltaPct);

  const topPub = kpis?.topPublisher;
  const sumPubTabRev = meta?.sumPublisherTotalRevenueLatestMonth ?? 0;
  const topShareDenominator = sumPubTabRev > 0 ? sumPubTabRev : totalRev;
  const topSharePct =
    topShareDenominator > 0 && topPub ? (topPub.totalRevenue / topShareDenominator) * 100 : 0;
  const concentrationWarn = topSharePct >= CONCENTRATION_WARN_PCT;

  const last12 = weekly.slice(-12);
  const revenueSpark = last12.map((w) => ({
    date: w.weekStart.slice(5),
    value: w.totalRevenue,
  }));
  const rpmSpark = last12.map((w) => ({
    date: w.weekStart.slice(5),
    value: w.blendedRpm,
  }));
  const vrpmSpark = last12.map((w) => ({
    date: w.weekStart.slice(5),
    value: w.blendedVrpm,
  }));

  if (error) {
    return (
      <div className="rounded-xl border border-red-500/40 bg-red-950/30 p-6 text-red-200">
        {error}
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-8">
      <DashboardSectionHeader
        title="Business overview"
        subtitle={
          meta?.latestMonthLabel
            ? `${meta.latestMonthLabel} · network rollup`
            : "Latest resolved month from network rollup"
        }
      />

      <KpiHeroCard
        label="Gross network total (all activity)"
        value={formatCurrency(totalRev)}
        delta={momRevPct}
        deltaLabel="MoM"
        size="lg"
        icon={DollarSign}
        spotlight
        extra={
          meta?.latestMonthLabel ? (
            <p className="mt-2 text-[11px] text-zinc-500">{meta.latestMonthLabel}</p>
          ) : null
        }
      />

      <div className="rounded-xl border border-zinc-800/50 bg-zinc-900/35 px-4 py-3 sm:px-5 space-y-2 backdrop-blur-[2px]">
        <p className="text-[11px] text-zinc-500 max-w-2xl leading-relaxed">
          Sum of demand on the rollup for the month. Billing finalizes what actually moves between
          partners.
        </p>
        {pacing?.isCurrentMonth && pacing.projectedRevenue ? (
          <p className="text-xs text-zinc-500">
            Projected at pace:{" "}
            <span className="text-zinc-300 font-medium">
              {formatCurrency(pacing.projectedRevenue)}
            </span>{" "}
            ({pacing.daysElapsed}/{pacing.daysInMonth} days)
            {pacing.paceVsLastMonthPct != null && Number.isFinite(pacing.paceVsLastMonthPct) ? (
              <span
                className={
                  pacing.paceVsLastMonthPct >= 0 ? "text-emerald-400" : "text-red-400"
                }
              >
                {" "}
                {pacing.paceVsLastMonthPct >= 0 ? "+" : ""}
                {(pacing.paceVsLastMonthPct * 100).toFixed(0)}% vs last month
              </span>
            ) : null}
          </p>
        ) : null}
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3">
        <KpiHeroCard
          label="Blended RPM"
          value={formatCurrency(blendedRpm)}
          delta={momRpmPct}
          deltaLabel="MoM"
          size="sm"
          icon={BarChart3}
          extra={
            <p className="mt-1 text-[11px] text-zinc-500">Per 1k pageviews · latest network month</p>
          }
        />
        <KpiHeroCard
          label="Viewable RPM"
          value={formatCurrency(viewableRpm)}
          delta={momVrpmPct}
          deltaLabel="MoM"
          size="sm"
          icon={ScanEye}
          extra={
            <p className="mt-1 text-[11px] text-zinc-500">Per 1k SS in-views · latest network month</p>
          }
        />
        <KpiHeroCard
          label="Publishers"
          value={loading ? "—" : String(publisherCount)}
          size="sm"
          icon={Users}
          extra={
            concentrationWarn && topPub ? (
              <p className="mt-1.5 text-[11px] text-amber-400 flex items-center gap-1">
                <AlertTriangle className="w-3 h-3 shrink-0" />
                {topPub.publisher} is {topSharePct.toFixed(0)}% of publisher-tab gross
              </p>
            ) : topPub && topShareDenominator > 0 ? (
              <p className="mt-1.5 text-[11px] text-zinc-500">
                Top: {topPub.publisher} ({topSharePct.toFixed(0)}% of publisher-tab gross)
              </p>
            ) : null
          }
        />
        <KpiHeroCard
          label="Sessions"
          value={formatNumber(totals?.sessions ?? 0)}
          size="sm"
          icon={TrendingUp}
          extra={
            publisherCount > 0 ? (
              <p className="mt-1 text-[11px] text-zinc-500 tabular-nums">
                {formatNumber(Math.round((totals?.sessions ?? 0) / publisherCount))} avg/pub
              </p>
            ) : null
          }
        />
      </div>

      <div className="rounded-2xl border border-zinc-800/55 bg-gradient-to-br from-zinc-950/55 via-zinc-900/25 to-zinc-950/80 p-4 sm:p-5 shadow-inner shadow-black/30 ring-1 ring-white/[0.04]">
        <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
          <div className="flex items-center gap-2 min-w-0">
            <span
              className="h-1.5 w-1.5 rounded-full bg-emerald-400/90 shrink-0"
              aria-hidden
            />
            <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
              Trailing 12 weeks
            </span>
          </div>
          <span className="text-[10px] font-medium uppercase tracking-wider text-zinc-600">
            Weekly rollup
          </span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          <SparklineTrend
            data={revenueSpark}
            color="#34d399"
            height={140}
            valueLabel="Revenue"
            formatAs="currency"
            label="Revenue (12 wk)"
          />
          <SparklineTrend
            data={rpmSpark}
            color="#22d3ee"
            height={140}
            valueLabel="RPM"
            formatAs="currency"
            label="Blended RPM (12 wk)"
          />
          <SparklineTrend
            data={vrpmSpark}
            color="#a78bfa"
            height={140}
            valueLabel="vRPM"
            formatAs="currency"
            label="Viewable RPM (12 wk)"
          />
        </div>
      </div>
    </div>
  );
}
