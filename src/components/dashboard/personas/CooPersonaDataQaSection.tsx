"use client";

import { AlertBanner, type PersonaAlert } from "@/components/dashboard/AlertBanner";
import { KpiHeroCard } from "@/components/dashboard/KpiHeroCard";
import { useDashboardLive } from "@/lib/dashboard-data-context";
import { formatNumber } from "@/lib/data";
import {
  parseWeeklyByPublisher,
  parseWeeklyTrend,
  publisherTrafficStallStatus,
  publishersWithRpmVarianceAlert,
} from "@/lib/persona-metrics";
import { CheckCircle2, ShieldAlert } from "lucide-react";
import { useMemo } from "react";

const RPM_WOW_ALERT_ABS = 0.2;
const WIDGET_WOW_WARN_PP = 0.5;

/**
 * COO Data QA: ops alerts + rollup check table. Used at bottom of COO panel or bottom of home
 * (after lifetime charts) when `dataQaPlacement="external"` on the panel.
 */
export function CooPersonaDataQaSection({
  qaSectionId = "qa-detail",
}: {
  qaSectionId?: string;
}) {
  const { error, data } = useDashboardLive();
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

  const rpmOutliers = useMemo(
    () =>
      publishersWithRpmVarianceAlert(
        weeklyByPublisher,
        publisherTotals.map((p) => p.publisher),
        RPM_WOW_ALERT_ABS
      ),
    [weeklyByPublisher, publisherTotals]
  );

  const trafficStallAlerts = useMemo(
    () =>
      publisherTotals
        .map((p) => {
          const st = publisherTrafficStallStatus(weeklyByPublisher, p.publisher);
          return st.status === "red"
            ? { publisher: p.publisher, weeks: st.consecutiveZeroWeeks }
            : null;
        })
        .filter((x): x is { publisher: string; weeks: number } => x != null),
    [weeklyByPublisher, publisherTotals]
  );

  const alerts = useMemo((): PersonaAlert[] => {
    const list: PersonaAlert[] = [];
    const fails = qa?.summary?.failCount ?? 0;
    const warns = qa?.summary?.warnCount ?? 0;
    if (fails > 0) {
      list.push({
        severity: "critical",
        message: `${fails} rollup QA check${fails === 1 ? "" : "s"} failed for the latest month — see “QA detail” below.`,
      });
    }
    if (warns > 0) {
      list.push({
        severity: "warn",
        message: `Monthly rollup QA has ${warns} warning${warns === 1 ? "" : "s"}. Open “QA detail” below for each check.`,
      });
    }
    if (
      widgetWowPp != null &&
      widgetWowPp < -WIDGET_WOW_WARN_PP &&
      lastW.length > 1
    ) {
      list.push({
        severity: "warn",
        message: `Network widget loads ÷ pageviews fell ${Math.abs(widgetWowPp).toFixed(1)} percentage points week over week.`,
      });
    }
    if (rpmOutliers.length) {
      list.push({
        severity: "warn",
        message: `Weekly RPM is more than ${RPM_WOW_ALERT_ABS * 100}% away from the trailing 4-week average (possible yield or data shift).`,
        publishers: rpmOutliers,
      });
    }
    if (trafficStallAlerts.length) {
      list.push({
        severity: "warn",
        message:
          "No pageviews in the weekly rollup for several weeks in a row (tag or traffic issue).",
        stallRows: trafficStallAlerts.map((r) => ({
          publisher: r.publisher,
          weeks: r.weeks,
        })),
      });
    }
    return list;
  }, [
    qa?.summary?.failCount,
    qa?.summary?.warnCount,
    rpmOutliers,
    trafficStallAlerts,
    widgetWowPp,
    lastW.length,
  ]);

  const checks = qa?.checks ?? [];
  const failCount = qa?.summary?.failCount ?? 0;
  const warnCount = qa?.summary?.warnCount ?? 0;
  const passCount = qa?.summary?.passCount ?? 0;

  if (error) {
    return (
      <div className="rounded-xl border border-red-500/40 bg-red-950/30 p-6 text-red-200">
        {error}
      </div>
    );
  }

  return (
    <section id={qaSectionId} className="scroll-mt-24 space-y-4 pt-2 border-t border-zinc-800/80">
      <div>
        <h3 className="text-sm font-semibold text-zinc-300 uppercase tracking-wider">
          Data QA
        </h3>
          <p className="text-xs text-zinc-500 mt-1 max-w-2xl">
            Monthly checks in the table. Alerts group weekly signals (RPM outliers, zero-PV streaks).
          </p>
      </div>

      <AlertBanner alerts={alerts} sticky />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        <KpiHeroCard
          label="QA checks"
          value={`${passCount}/${checks.length}`}
          size="sm"
          icon={failCount > 0 ? ShieldAlert : CheckCircle2}
          extra={
            <p className="mt-1 text-[11px] text-zinc-500">
              {failCount > 0
                ? `${failCount} fail · ${warnCount} warn`
                : warnCount > 0
                  ? `${warnCount} warn`
                  : "All passing"}
            </p>
          }
        />
      </div>

      <h4 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">
        QA detail
      </h4>
      <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 overflow-hidden">
        <details open={failCount > 0}>
          <summary className="cursor-pointer px-4 py-3 text-sm font-medium text-zinc-200 hover:bg-zinc-800/30 transition-colors">
            {checks.length} checks
            {failCount > 0 && (
              <span className="ml-2 text-red-400 text-xs font-semibold">
                {failCount} failed
              </span>
            )}
            {warnCount > 0 && failCount === 0 && (
              <span className="ml-2 text-amber-400 text-xs font-semibold">
                {warnCount} warnings
              </span>
            )}
          </summary>
          <div className="border-t border-zinc-800 overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-zinc-500 bg-zinc-900/60">
                  <th className="px-4 py-2 font-medium">Status</th>
                  <th className="px-4 py-2 font-medium">Check</th>
                  <th className="px-4 py-2 font-medium max-w-sm">Detail</th>
                </tr>
              </thead>
              <tbody>
                {checks.map((c) => (
                  <tr key={c.id} className="border-t border-zinc-800/60 hover:bg-zinc-800/20">
                    <td className="px-4 py-2.5 w-20">
                      <span
                        className={`inline-flex items-center gap-1 text-xs font-semibold uppercase ${
                          c.severity === "fail"
                            ? "text-red-400"
                            : c.severity === "warn"
                              ? "text-amber-400"
                              : "text-emerald-400"
                        }`}
                      >
                        {c.severity === "fail" && (
                          <span className="w-1.5 h-1.5 rounded-full bg-red-400" />
                        )}
                        {c.severity === "warn" && (
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                        )}
                        {c.severity === "pass" && (
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                        )}
                        {c.severity}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 text-zinc-300 max-w-md">{c.message}</td>
                    <td className="px-4 py-2.5 text-zinc-500 text-xs max-w-sm">
                      {c.detail ? (
                        <span className="font-mono">
                          {Object.entries(c.detail)
                            .slice(0, 4)
                            .map(([k, v]) =>
                              `${k}: ${typeof v === "number" ? formatNumber(v) : v}`
                            )
                            .join(" · ")}
                        </span>
                      ) : (
                        "—"
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </details>
      </div>
    </section>
  );
}
