"use client";

import { DashboardSectionHeader } from "@/components/dashboard/DashboardSectionHeader";
import { PublisherHeroMetricCard } from "@/components/dashboard/PublisherHeroMetricCard";

export type PenskeAllTimeKpis = {
  period: { weekStart: string; weekLabel?: string; throughWeek?: string };
  totals: {
    totalRev: number;
    totalPVs: number;
    sessions: number;
    rpm: number;
    vrpm: number;
    widgetLoads: number;
    smartScrollViews: number;
    totalClicks: number;
    nextpageClicks: number;
    commerceClicks: number;
    incrementalImpressions: number;
    affiliateCtr: number;
    affiliateEpc: number;
    articleCtr: number;
  };
  wow: null;
};

export function PenskeAllTimeKpiTiles({ kpis }: { kpis: PenskeAllTimeKpis }) {
  const t = kpis.totals;
  return (
    <section className="space-y-4">
      <DashboardSectionHeader
        accent="cyan"
        title={kpis.period.weekLabel ?? "All time"}
        titleClassName="text-xs font-semibold uppercase tracking-wider text-zinc-500"
        subtitle={
          kpis.period.weekStart && kpis.period.throughWeek ? (
            <span className="text-[10px] font-normal normal-case tracking-normal text-zinc-600">
              {kpis.period.weekStart} → {kpis.period.throughWeek}
            </span>
          ) : null
        }
      />
      <div className="grid max-w-[90rem] grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        <PublisherHeroMetricCard
          label="Revenue"
          value={t.totalRev}
          valueType="currency"
          accent="emerald"
          badge="Commerce"
          showTrailingTrend={false}
        />
        <PublisherHeroMetricCard
          label="Viewable RPM"
          value={t.vrpm}
          valueType="currency"
          accent="cyan"
          badge="Traffic"
          showTrailingTrend={false}
        />
        <PublisherHeroMetricCard
          label="In views"
          value={t.smartScrollViews}
          valueType="count"
          accent="cyan"
          badge="Traffic"
          showTrailingTrend={false}
        />
        <PublisherHeroMetricCard
          label="Commerce clicks"
          value={t.commerceClicks}
          valueType="count"
          accent="emerald"
          badge="Commerce"
          showTrailingTrend={false}
        />
        <PublisherHeroMetricCard
          label="Incremental impressions"
          value={t.incrementalImpressions}
          valueType="count"
          accent="cyan"
          badge="Traffic"
          showTrailingTrend={false}
        />
        <PublisherHeroMetricCard
          label="Affiliate CTR"
          value={t.affiliateCtr}
          valueType="percent"
          accent="emerald"
          badge="Commerce"
          showTrailingTrend={false}
        />
        <PublisherHeroMetricCard
          label="Article CTR"
          value={t.articleCtr}
          valueType="percent"
          accent="violet"
          badge="Article"
          showTrailingTrend={false}
        />
      </div>
    </section>
  );
}
