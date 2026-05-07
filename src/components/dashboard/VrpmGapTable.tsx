"use client";

import type { PublisherTotalRow } from "@/lib/dashboard-data-context";
import { formatCurrency } from "@/lib/data";
import { vrpmRpmGapTrend, type GapTrend } from "@/lib/persona-metrics";
import type { WeeklyByPublisherRow } from "@/lib/live-payload-types";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { AlertTriangle } from "lucide-react";

function trendLabel(t: GapTrend): string {
  if (t === "narrowing") return "narrowing";
  if (t === "widening") return "widening";
  if (t === "stable") return "stable";
  return "—";
}

export function VrpmGapTable({
  rows,
  weeklyByPublisher,
}: {
  rows: PublisherTotalRow[];
  weeklyByPublisher: WeeklyByPublisherRow[];
}) {
  const sorted = [...rows].sort((a, b) => b.totalRev - a.totalRev);

  return (
    <div className="overflow-x-auto rounded-xl border border-zinc-800">
      <Table>
        <TableHeader>
          <TableRow className="border-zinc-800 hover:bg-transparent">
            <TableHead className="text-zinc-400">Publisher</TableHead>
            <TableHead className="text-zinc-400 text-right">RPM</TableHead>
            <TableHead className="text-zinc-400 text-right">vRPM</TableHead>
            <TableHead className="text-zinc-400 text-right">Gap</TableHead>
            <TableHead className="text-zinc-400 text-right">Trend</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sorted.map((r) => {
            const gap = r.avgRpm - r.avgVrpm;
            const trend = vrpmRpmGapTrend(weeklyByPublisher, r.publisher);
            const warn = trend === "widening" && gap > 0.5;
            return (
              <TableRow key={r.publisher} className="border-zinc-800/80">
                <TableCell className="font-medium text-white">{r.publisher}</TableCell>
                <TableCell className="text-right tabular-nums text-zinc-300">
                  {formatCurrency(r.avgRpm)}
                </TableCell>
                <TableCell className="text-right tabular-nums text-zinc-300">
                  {formatCurrency(r.avgVrpm)}
                </TableCell>
                <TableCell className="text-right tabular-nums text-zinc-300">
                  {formatCurrency(gap)}
                </TableCell>
                <TableCell className="text-right">
                  <span className="inline-flex items-center justify-end gap-1 text-zinc-400 text-sm">
                    {warn ? (
                      <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" aria-label="Widening gap" />
                    ) : null}
                    {trendLabel(trend)}
                  </span>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
