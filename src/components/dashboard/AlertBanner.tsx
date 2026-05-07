"use client";

import { cn } from "@/lib/utils";
import { AlertTriangle } from "lucide-react";

export type PersonaAlert = {
  severity: "info" | "warn" | "critical";
  /** Primary explanation (shown once; not repeated per publisher when grouping). */
  message: string;
  /** Single-publisher line (legacy). */
  publisher?: string;
  /** Several publishers, same underlying issue — chips instead of repeated bullets. */
  publishers?: string[];
  /** Zero-traffic style: one row per publisher with weeks count. */
  stallRows?: { publisher: string; weeks: number }[];
};

function severityBorder(sev: PersonaAlert["severity"]): string {
  if (sev === "critical") return "border-l-red-500";
  if (sev === "info") return "border-l-sky-500/80";
  return "border-l-amber-500";
}

function AlertBlock({ alert: a }: { alert: PersonaAlert }) {
  const border = severityBorder(a.severity);

  if (a.stallRows && a.stallRows.length > 0) {
    return (
      <div
        className={cn(
          "rounded-lg border border-zinc-700/80 border-l-4 bg-zinc-900/50 pl-3 pr-3 py-2.5",
          border
        )}
      >
        <p className="text-sm font-medium text-zinc-100 leading-snug">{a.message}</p>
        <div className="mt-2 overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead>
              <tr className="text-zinc-500 border-b border-zinc-800">
                <th className="py-1 pr-4 font-medium">Publisher</th>
                <th className="py-1 font-medium tabular-nums">Zero-PV weeks</th>
              </tr>
            </thead>
            <tbody>
              {a.stallRows.map((row) => (
                <tr key={row.publisher} className="border-t border-zinc-800/80">
                  <td className="py-1.5 pr-4 text-zinc-200">{row.publisher}</td>
                  <td className="py-1.5 tabular-nums text-zinc-400">{row.weeks}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  if (a.publishers && a.publishers.length > 0) {
    return (
      <div
        className={cn(
          "rounded-lg border border-zinc-700/80 border-l-4 bg-zinc-900/50 pl-3 pr-3 py-2.5",
          border
        )}
      >
        <p className="text-sm font-medium text-zinc-100 leading-snug">{a.message}</p>
        <p className="mt-2 text-[11px] text-zinc-500 uppercase tracking-wide">
          {a.publishers.length} publisher{a.publishers.length === 1 ? "" : "s"}
        </p>
        <div className="mt-1.5 flex flex-wrap gap-1.5">
          {a.publishers.map((name) => (
            <span
              key={name}
              className="inline-flex rounded-md border border-zinc-700/90 bg-zinc-900/80 px-2 py-0.5 text-xs font-medium text-zinc-200"
            >
              {name}
            </span>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "rounded-lg border border-zinc-700/80 border-l-4 bg-zinc-900/50 pl-3 pr-3 py-2.5",
        border
      )}
    >
      <p className="text-sm text-zinc-200 leading-relaxed">
        {a.publisher ? (
          <>
            <span className="font-semibold text-white">{a.publisher}</span>
            <span className="text-zinc-500"> — </span>
          </>
        ) : null}
        {a.message}
      </p>
    </div>
  );
}

export function AlertBanner({
  alerts,
  className,
  sticky,
}: {
  alerts: PersonaAlert[];
  className?: string;
  sticky?: boolean;
}) {
  if (!alerts.length) return null;

  const critical = alerts.filter((a) => a.severity === "critical").length;
  const warn = alerts.filter((a) => a.severity === "warn").length;

  return (
    <div
      className={cn(
        "rounded-xl border border-amber-500/35 bg-gradient-to-b from-amber-950/50 to-zinc-900/80 px-4 py-4",
        sticky && "sticky top-0 z-30 backdrop-blur-md",
        className
      )}
      role="status"
    >
      <div className="flex items-start gap-3">
        <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" aria-hidden />
        <div className="min-w-0 flex-1 space-y-3">
          <div>
            <p className="text-sm font-semibold text-zinc-100">Ops alerts</p>
            <p className="text-xs text-zinc-500 mt-0.5">
              {critical > 0 ? (
                <span className="text-red-400/90">{critical} critical</span>
              ) : null}
              {critical > 0 && warn > 0 ? <span className="text-zinc-500"> · </span> : null}
              {warn > 0 ? <span>{warn} warning{warn === 1 ? "" : "s"}</span> : null}
              {critical === 0 && warn === 0 ? <span>Review items below</span> : null}
            </p>
          </div>
          <div className="space-y-2.5">
            {alerts.map((a, i) => (
              <AlertBlock key={i} alert={a} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
