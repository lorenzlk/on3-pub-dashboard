"use client";

import { formatChartCount, formatCurrencyFull, pctFromRatio } from "@/lib/data";
import { cn } from "@/lib/utils";
import type { KpisPayload } from "@/lib/live-payload-types";
import { Gauge } from "lucide-react";

type PacingRow = {
  metric: string;
  lastMonth: number;
  mtd: number;
  projected: number;
  paceRatio: number | null;
  format: "currency" | "count";
};

function formatCell(value: number, format: PacingRow["format"]) {
  if (format === "currency") return formatCurrencyFull(value);
  return formatChartCount(value);
}

function formatDelta(value: number, format: PacingRow["format"]) {
  if (!Number.isFinite(value)) return "—";
  const sign = value > 0 ? "+" : value < 0 ? "-" : "";
  const abs = Math.abs(value);
  const body = format === "currency" ? formatCurrencyFull(abs) : formatChartCount(abs);
  return `${sign}${body}`;
}

function paceCellClass(pctPoints: number | undefined) {
  if (pctPoints == null || !Number.isFinite(pctPoints)) return "text-zinc-500";
  if (pctPoints > 0) return "text-emerald-400 font-semibold";
  if (pctPoints < 0) return "text-red-400 font-semibold";
  return "text-zinc-300";
}

export function CooPacingDashboard({
  kpis,
  lastUpdated,
}: {
  kpis: KpisPayload | null;
  lastUpdated: string | null;
}) {
  const pacing = kpis?.pacing;
  const totals = kpis?.totals;
  const curKey = kpis?.meta?.latestMonthKey ?? null;
  const prevKey = kpis?.meta?.previousMonthKey ?? null;

  const lastUpdatedStr = lastUpdated
    ? new Date(lastUpdated).toLocaleString("en-US", {
        month: "2-digit",
        day: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      })
    : null;

  if (!pacing || !totals || !curKey || !prevKey) {
    return (
      <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-4 sm:p-5">
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-lg bg-zinc-800/70 text-amber-400 shrink-0">
            <Gauge className="w-5 h-5" aria-hidden />
          </div>
          <div>
            <h4 className="text-sm font-semibold text-white">Pacing dashboard</h4>
            <p className="text-xs text-zinc-500 mt-1">
              Need at least two months on the network tab to compare run-rate to the prior month.
            </p>
          </div>
        </div>
      </div>
    );
  }

  const rows: PacingRow[] = [
    {
      metric: "Total revenue",
      lastMonth: pacing.priorMonthRevenue,
      mtd: totals.totalRevenue,
      projected: pacing.projectedRevenue,
      paceRatio: pacing.paceVsLastMonthPct,
      format: "currency",
    },
    {
      metric: "Total PVs",
      lastMonth: pacing.priorMonthTotalPVs,
      mtd: totals.totalPVs,
      projected: pacing.projectedTotalPVs,
      paceRatio: pacing.paceVsLastMonthPvsPct,
      format: "count",
    },
    {
      metric: "Sessions",
      lastMonth: pacing.priorMonthSessions,
      mtd: totals.sessions,
      projected: pacing.projectedSessions,
      paceRatio: pacing.paceVsLastMonthSessionsPct,
      format: "count",
    },
  ];

  const title = `Pacing dashboard (${curKey} vs ${prevKey})`;

  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-4 sm:p-5 space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
        <div className="flex items-start gap-3 min-w-0">
          <div className="p-2 rounded-lg bg-zinc-800/70 text-amber-400 shrink-0">
            <Gauge className="w-5 h-5" aria-hidden />
          </div>
          <div className="min-w-0">
            <h4 className="text-sm font-semibold text-white tracking-tight">{title}</h4>
            <p className="text-xs text-zinc-500 mt-1 leading-relaxed max-w-2xl">
              Network total row — MTD scales to projected end-of-month using days elapsed. Pacing
              % is projected EOM vs the full prior month (same basis as the network pacing tab in the
              rollup workbook).
            </p>
          </div>
        </div>
        {lastUpdatedStr ? (
          <p className="text-[11px] text-zinc-500 tabular-nums shrink-0 sm:text-right">
            Last updated: {lastUpdatedStr}
          </p>
        ) : null}
      </div>

      <div className="overflow-x-auto rounded-lg border border-zinc-800/80 -mx-1 sm:mx-0">
        <table className="w-full min-w-[720px] text-left text-xs border-collapse">
          <thead>
            <tr className="border-b border-zinc-800 bg-zinc-950/50">
              <th className="py-2.5 px-2 sm:px-3 font-semibold text-zinc-400 whitespace-nowrap">
                Metric
              </th>
              <th className="py-2.5 px-2 sm:px-3 font-semibold text-zinc-400 whitespace-nowrap text-right">
                Last month ({prevKey})
              </th>
              <th className="py-2.5 px-2 sm:px-3 font-semibold text-zinc-400 whitespace-nowrap text-right">
                {pacing.isCurrentMonth ? `MTD (${curKey})` : `Month (${curKey})`}
              </th>
              <th className="py-2.5 px-2 sm:px-3 font-semibold text-zinc-400 whitespace-nowrap text-right">
                Days elapsed
              </th>
              <th className="py-2.5 px-2 sm:px-3 font-semibold text-zinc-400 whitespace-nowrap text-right">
                Days in month
              </th>
              <th className="py-2.5 px-2 sm:px-3 font-semibold text-zinc-400 whitespace-nowrap text-right">
                Proj. EOM
              </th>
              <th className="py-2.5 px-2 sm:px-3 font-semibold text-zinc-400 whitespace-nowrap text-right">
                Δ (proj − last)
              </th>
              <th className="py-2.5 px-2 sm:px-3 font-semibold text-zinc-400 whitespace-nowrap text-right">
                Pacing vs last month
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => {
              const delta = r.projected - r.lastMonth;
              const pacePts = pctFromRatio(r.paceRatio);
              return (
                <tr
                  key={r.metric}
                  className="border-b border-zinc-800/60 last:border-0 hover:bg-zinc-800/20"
                >
                  <td className="py-2.5 px-2 sm:px-3 text-zinc-200 font-medium whitespace-nowrap">
                    {r.metric}
                  </td>
                  <td className="py-2.5 px-2 sm:px-3 text-right text-zinc-300 tabular-nums">
                    {formatCell(r.lastMonth, r.format)}
                  </td>
                  <td className="py-2.5 px-2 sm:px-3 text-right text-zinc-300 tabular-nums">
                    {formatCell(r.mtd, r.format)}
                  </td>
                  <td className="py-2.5 px-2 sm:px-3 text-right text-zinc-400 tabular-nums">
                    {pacing.daysElapsed ?? "—"}
                  </td>
                  <td className="py-2.5 px-2 sm:px-3 text-right text-zinc-400 tabular-nums">
                    {pacing.daysInMonth ?? "—"}
                  </td>
                  <td className="py-2.5 px-2 sm:px-3 text-right text-zinc-300 tabular-nums">
                    {formatCell(r.projected, r.format)}
                  </td>
                  <td
                    className={cn(
                      "py-2.5 px-2 sm:px-3 text-right tabular-nums",
                      delta > 0
                        ? "text-emerald-400/95"
                        : delta < 0
                          ? "text-red-400/95"
                          : "text-zinc-400"
                    )}
                  >
                    {formatDelta(delta, r.format)}
                  </td>
                  <td
                    className={cn(
                      "py-2.5 px-2 sm:px-3 text-right tabular-nums",
                      paceCellClass(pacePts)
                    )}
                  >
                    {pacePts != null && Number.isFinite(pacePts) ? (
                      <>
                        {pacePts > 0 ? "+" : ""}
                        {pacePts.toFixed(1)}%
                      </>
                    ) : (
                      "—"
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
