"use client";

import type { PublisherTotalRow } from "@/lib/dashboard-data-context";
import { formatNumber } from "@/lib/data";
import {
  inViewPctOfWidgetLoads,
  widgetLoadsPctOfPvs,
  wowInViewPerLoadsPctDelta,
  wowWidgetLoadsPctDelta,
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

export function SmartScrollTable({
  rows,
  weeklyByPublisher,
}: {
  rows: PublisherTotalRow[];
  weeklyByPublisher: WeeklyByPublisherRow[];
}) {
  const sorted = [...rows].sort((a, b) => {
    const d = widgetLoadsPctOfPvs(b) - widgetLoadsPctOfPvs(a);
    if (d !== 0) return d;
    const d2 = inViewPctOfWidgetLoads(b) - inViewPctOfWidgetLoads(a);
    if (d2 !== 0) return d2;
    return a.publisher.localeCompare(b.publisher);
  });

  return (
    <div className="overflow-x-auto rounded-xl border border-zinc-800">
      <Table>
        <TableHeader>
          <TableRow className="border-zinc-800 hover:bg-transparent">
            <TableHead className="text-zinc-400">Publisher</TableHead>
            <TableHead className="text-zinc-400 text-right">Widget loads</TableHead>
            <TableHead className="text-zinc-400 text-right">Loads % PVs</TableHead>
            <TableHead className="text-zinc-400 text-right">SS in-views</TableHead>
            <TableHead className="text-zinc-400 text-right">Viewability % loads</TableHead>
            <TableHead className="text-zinc-400 text-right">Δ WoW loads</TableHead>
            <TableHead className="text-zinc-400 text-right">Δ WoW viewability</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sorted.map((r) => {
            const loadsPct = widgetLoadsPctOfPvs(r);
            const viewabilityPct = inViewPctOfWidgetLoads(r);
            const wl = r.widgetLoads ?? r.smartScrollViews;
            const dLoads = wowWidgetLoadsPctDelta(weeklyByPublisher, r.publisher);
            const dView = wowInViewPerLoadsPctDelta(weeklyByPublisher, r.publisher);
            return (
              <TableRow key={r.publisher} className="border-zinc-800/80">
                <TableCell className="font-medium text-white">{r.publisher}</TableCell>
                <TableCell className="text-right tabular-nums text-zinc-300">
                  {formatNumber(wl)}
                </TableCell>
                <TableCell className="text-right tabular-nums text-zinc-300">
                  {loadsPct.toFixed(1)}%
                </TableCell>
                <TableCell className="text-right tabular-nums text-zinc-300">
                  {formatNumber(r.smartScrollViews)}
                </TableCell>
                <TableCell className="text-right tabular-nums text-zinc-300">
                  {viewabilityPct.toFixed(1)}%
                </TableCell>
                <TableCell className="text-right tabular-nums text-zinc-300">
                  {dLoads == null ? "—" : `${dLoads >= 0 ? "+" : ""}${dLoads.toFixed(1)}`}
                </TableCell>
                <TableCell className="text-right tabular-nums text-zinc-300">
                  {dView == null ? "—" : `${dView >= 0 ? "+" : ""}${dView.toFixed(1)}`}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
