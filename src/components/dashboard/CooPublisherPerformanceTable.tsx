"use client";

import type { PublisherTotalRow, QaCheck } from "@/lib/dashboard-data-context";
import { formatCurrency, formatNumber } from "@/lib/data";
import {
  inViewPctOfWidgetLoads,
  mergePublisherPerformanceStatus,
  publisherTrafficStallStatus,
  rpmVarianceVsTrailing4w,
  widgetLoadsPctOfPvs,
  type RpmVarianceStatus,
} from "@/lib/persona-metrics";
import type { WeeklyByPublisherRow } from "@/lib/live-payload-types";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { ChevronDown, ChevronRight } from "lucide-react";
import { Fragment, useMemo, useState } from "react";

const VARIANCE_THRESHOLDS = {
  greenMaxAbs: 0.1,
  yellowMaxAbs: 0.2,
} as const;

function cellBg(status: RpmVarianceStatus): string {
  if (status === "red") return "bg-red-950/25";
  if (status === "yellow") return "bg-amber-950/20";
  return "bg-emerald-950/15";
}

function statusRank(status: RpmVarianceStatus): number {
  if (status === "red") return 0;
  if (status === "yellow") return 1;
  return 2;
}

type RowModel = PublisherTotalRow & {
  rpmVariance: ReturnType<typeof rpmVarianceVsTrailing4w>;
  trafficStall: ReturnType<typeof publisherTrafficStallStatus>;
  displayStatus: RpmVarianceStatus;
  deltaRpmPct: number | null;
};

export function CooPublisherPerformanceTable({
  rows,
  weeklyByPublisher,
  qaChecks,
}: {
  rows: PublisherTotalRow[];
  weeklyByPublisher: WeeklyByPublisherRow[];
  qaChecks: QaCheck[];
}) {
  const [expanded, setExpanded] = useState<string | null>(null);
  const [sort, setSort] = useState<"severity" | "revenue">("severity");

  const models = useMemo(() => {
    const list: RowModel[] = rows.map((r) => {
      const rpmVariance = rpmVarianceVsTrailing4w(weeklyByPublisher, r.publisher);
      const trafficStall = publisherTrafficStallStatus(weeklyByPublisher, r.publisher);
      const displayStatus = mergePublisherPerformanceStatus(
        rpmVariance.status,
        trafficStall.status
      );
      let deltaRpmPct: number | null = null;
      if (
        rpmVariance.variance != null &&
        rpmVariance.trailingAvg != null &&
        rpmVariance.trailingAvg !== 0
      ) {
        deltaRpmPct = rpmVariance.variance * 100;
      }
      return { ...r, rpmVariance, trafficStall, displayStatus, deltaRpmPct };
    });

    if (sort === "severity") {
      list.sort((a, b) => {
        const ra = statusRank(a.displayStatus);
        const rb = statusRank(b.displayStatus);
        if (ra !== rb) return ra - rb;
        return b.totalRev - a.totalRev;
      });
    } else {
      list.sort((a, b) => b.totalRev - a.totalRev);
    }
    return list;
  }, [rows, weeklyByPublisher, sort]);

  const publisherQa = useMemo(() => {
    const map = new Map<string, QaCheck[]>();
    for (const c of qaChecks) {
      const pub =
        (c.detail?.publisher as string) ||
        (c.detail?.publishers as string)?.[0];
      if (typeof pub === "string" && pub) {
        const arr = map.get(pub) ?? [];
        arr.push(c);
        map.set(pub, arr);
      }
    }
    return map;
  }, [qaChecks]);

  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900/30 overflow-hidden">
      <div className="flex items-center justify-between px-4 py-2 border-b border-zinc-800">
        <p className="text-sm text-zinc-400">Sort</p>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setSort("severity")}
            className={cn(
              "text-xs px-2 py-1 rounded-md border",
              sort === "severity"
                ? "border-zinc-500 bg-zinc-800 text-white"
                : "border-transparent text-zinc-500 hover:text-zinc-300"
            )}
          >
            Severity → revenue
          </button>
          <button
            type="button"
            onClick={() => setSort("revenue")}
            className={cn(
              "text-xs px-2 py-1 rounded-md border",
              sort === "revenue"
                ? "border-zinc-500 bg-zinc-800 text-white"
                : "border-transparent text-zinc-500 hover:text-zinc-300"
            )}
          >
            Revenue
          </button>
        </div>
      </div>
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="border-zinc-800 hover:bg-transparent">
              <TableHead className="w-8" />
              <TableHead className="text-zinc-400">Publisher</TableHead>
              <TableHead className="text-zinc-400 text-right">Rev</TableHead>
              <TableHead className="text-zinc-400 text-right">RPM</TableHead>
              <TableHead className="text-zinc-400 text-right">RPS</TableHead>
              <TableHead className="text-zinc-400 text-right">Δ RPM*</TableHead>
              <TableHead className="text-zinc-400 text-right">Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {models.map((r) => {
              const open = expanded === r.publisher;
              const status = r.displayStatus;
              return (
                <Fragment key={r.publisher}>
                  <TableRow
                    className={cn(
                      "border-zinc-800/80 cursor-pointer",
                      cellBg(status)
                    )}
                    onClick={() => setExpanded(open ? null : r.publisher)}
                  >
                    <TableCell className="text-zinc-500">
                      {open ? (
                        <ChevronDown className="w-4 h-4" />
                      ) : (
                        <ChevronRight className="w-4 h-4" />
                      )}
                    </TableCell>
                    <TableCell className="font-medium text-white">
                      {r.publisher}
                    </TableCell>
                    <TableCell className="text-right text-zinc-200 tabular-nums">
                      {formatCurrency(r.totalRev)}
                    </TableCell>
                    <TableCell className="text-right text-zinc-300 tabular-nums">
                      {formatCurrency(r.avgRpm)}
                    </TableCell>
                    <TableCell className="text-right text-zinc-300 tabular-nums">
                      {formatCurrency(r.avgRps)}
                    </TableCell>
                    <TableCell className="text-right tabular-nums text-zinc-300">
                      {r.deltaRpmPct == null
                        ? "—"
                        : `${r.deltaRpmPct >= 0 ? "+" : ""}${r.deltaRpmPct.toFixed(0)}%`}
                    </TableCell>
                    <TableCell className="text-right text-xs font-medium uppercase">
                      {status === "red" && (
                        <span className="inline-flex flex-col items-end gap-0.5">
                          <span className="text-red-400">Risk</span>
                          {r.trafficStall.status === "red" &&
                          r.rpmVariance.status !== "red" ? (
                            <span className="text-[9px] font-normal normal-case text-red-400/75">
                              No traffic
                            </span>
                          ) : null}
                        </span>
                      )}
                      {status === "yellow" && (
                        <span className="text-amber-400">Watch</span>
                      )}
                      {status === "green" && (
                        <span className="text-emerald-400">OK</span>
                      )}
                    </TableCell>
                  </TableRow>
                  {open ? (
                    <TableRow
                      className="border-zinc-800 bg-zinc-900/80"
                    >
                      <TableCell colSpan={7} className="p-4 text-sm text-zinc-400">
                        <div className="grid sm:grid-cols-2 gap-4">
                          <div>
                            <p className="text-zinc-500 text-xs uppercase mb-1">
                              Traffic / widget and viewability
                            </p>
                            <ul className="space-y-1 tabular-nums">
                              <li>PVs (tags loaded): {formatNumber(r.totalPVs)}</li>
                              <li>Widget loads:{" "}
                                {formatNumber(r.widgetLoads ?? r.smartScrollViews)}
                              </li>
                              <li>Loads ÷ PVs: {widgetLoadsPctOfPvs(r).toFixed(1)}%</li>
                              <li>SS in-views: {formatNumber(r.smartScrollViews)}</li>
                              <li>
                                Viewability (in-views ÷ loads):{" "}
                                {inViewPctOfWidgetLoads(r).toFixed(1)}%
                              </li>
                              <li>Human views: {formatNumber(r.humanViews)}</li>
                              <li>Sessions: {formatNumber(r.sessions)}</li>
                              <li>Avg vRPM: {formatCurrency(r.avgVrpm)}</li>
                              {r.trafficStall.status === "red" ? (
                                <li className="text-red-400/95 pt-1">
                                  Weekly rollup:{" "}
                                  {r.trafficStall.consecutiveZeroWeeks} consecutive weeks with 0
                                  pageviews (risk).
                                </li>
                              ) : null}
                            </ul>
                          </div>
                          <div>
                            <p className="text-zinc-500 text-xs uppercase mb-1">
                              QA mentions
                            </p>
                            {(publisherQa.get(r.publisher) ?? []).length ? (
                              <ul className="list-disc pl-4 space-y-1">
                                {publisherQa.get(r.publisher)!.map((c) => (
                                  <li key={c.id}>{c.message}</li>
                                ))}
                              </ul>
                            ) : (
                              <p>No publisher-specific QA rows.</p>
                            )}
                          </div>
                        </div>
                        <p className="mt-3 text-[10px] text-zinc-500">
                          *Δ RPM vs trailing 4-week average from weekly rollup (green &lt;{" "}
                          {VARIANCE_THRESHOLDS.greenMaxAbs * 100}% deviation, yellow &lt;{" "}
                          {VARIANCE_THRESHOLDS.yellowMaxAbs * 100}%, else red).{" "}
                          <span className="text-zinc-500">
                            Risk also if 3+ consecutive weeks with 0 pageviews in that rollup.
                          </span>
                        </p>
                      </TableCell>
                    </TableRow>
                  ) : null}
                </Fragment>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
