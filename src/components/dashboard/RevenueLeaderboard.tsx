"use client";

import { formatCurrency, pctFromRatio } from "@/lib/data";
import { cn } from "@/lib/utils";
import { ArrowUpRight, ExternalLink } from "lucide-react";

export type LeaderboardEntry = {
  name: string;
  revenue: number;
  /** Ratio e.g. 0.08 for +8% */
  momDeltaRatio: number | null;
  /** Optional stable key (e.g. Penske `/p/[slug]` slug). */
  slug?: string;
};

const ROW_GRID =
  "grid grid-cols-[minmax(0,1fr)_minmax(4.25rem,auto)_minmax(3rem,auto)] gap-x-2 items-center";

export function RevenueLeaderboard({
  entries,
  maxBars = 12,
  selectedName,
  onSelect,
  /** When set, each row shows a link to the shareable CRO URL for that publisher. */
  shareHref,
  /** Header for the dollar column (e.g. Lifetime vs current month). */
  amountColumnLabel = "Gross",
  /** Header for the trailing % (MoM gross change). */
  pctColumnLabel = "MoM",
  /** First column label; default Publisher in full layout. */
  firstColumnLabel,
  /** Full: revenue + MoM columns; sitesOnly: name + drill link + bar only. */
  variant = "full",
  /** When false, share link navigates in the same tab (e.g. internal `/p/[slug]`). */
  shareOpenInNewTab = true,
  className,
}: {
  entries: LeaderboardEntry[];
  maxBars?: number;
  selectedName?: string | null;
  onSelect?: (name: string) => void;
  shareHref?: (publisherName: string) => string;
  amountColumnLabel?: string;
  pctColumnLabel?: string;
  firstColumnLabel?: string;
  variant?: "full" | "sitesOnly";
  shareOpenInNewTab?: boolean;
  className?: string;
}) {
  const slice = entries.slice(0, maxBars);
  const maxRev = Math.max(...slice.map((e) => e.revenue), 1);
  const sitesOnly = variant === "sitesOnly";
  const labelFirst = firstColumnLabel ?? "Publisher";

  return (
    <div className={cn(sitesOnly ? "" : "space-y-3", className)}>
      {!sitesOnly ? (
        <div
          className={cn(ROW_GRID, "px-2 pb-1.5 border-b border-zinc-800/90")}
          aria-hidden
        >
          <span className="text-[10px] font-medium uppercase tracking-wider text-zinc-500">
            {labelFirst}
          </span>
          <span
            className="text-[10px] font-medium uppercase tracking-wider text-zinc-500 text-right"
            title="Sort / primary amount for this view"
          >
            {amountColumnLabel}
          </span>
          <span
            className="text-[10px] font-medium uppercase tracking-wider text-zinc-500 text-right"
            title="Month-over-month change in gross revenue"
          >
            {pctColumnLabel}
          </span>
        </div>
      ) : null}
      {sitesOnly ? (
        <div className="grid gap-3 sm:grid-cols-2">
          {slice.map((e) => {
            const w = (e.revenue / maxRev) * 100;
            const active = selectedName === e.name;
            return (
              <button
                key={e.slug ?? e.name}
                type="button"
                onClick={() => onSelect?.(e.name)}
                className={cn(
                  "group relative flex flex-col gap-3 rounded-xl border px-4 py-4 text-left transition-all duration-200",
                  "border-zinc-800/70 bg-zinc-900/35 shadow-sm shadow-black/20",
                  "hover:border-cyan-500/30 hover:bg-zinc-900/70 hover:shadow-md hover:shadow-cyan-950/20",
                  onSelect && "cursor-pointer",
                  active && "border-cyan-500/45 bg-cyan-950/15 ring-1 ring-cyan-500/20"
                )}
              >
                <div className="flex items-start justify-between gap-3 min-w-0">
                  <div className="min-w-0 flex-1">
                    <span className="block text-[15px] font-semibold leading-snug tracking-tight text-white group-hover:text-zinc-50 truncate">
                      {e.name}
                    </span>
                    <span className="mt-1 block text-sm font-medium tabular-nums text-zinc-500 group-hover:text-zinc-400">
                      {formatCurrency(e.revenue)}
                    </span>
                  </div>
                  {shareHref ? (
                    <a
                      href={shareHref(e.name)}
                      {...(shareOpenInNewTab
                        ? { target: "_blank", rel: "noopener noreferrer" as const }
                        : {})}
                      title="Open dashboard"
                      aria-label={`Open dashboard for ${e.name}`}
                      className={cn(
                        "shrink-0 flex h-9 w-9 items-center justify-center rounded-lg border transition-colors",
                        "border-zinc-700/80 bg-zinc-950/50 text-zinc-400",
                        "hover:border-cyan-500/40 hover:bg-cyan-950/30 hover:text-cyan-300",
                        "focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500/50"
                      )}
                      onClick={(ev) => ev.stopPropagation()}
                      onKeyDown={(ev) => {
                        if (ev.key === " " || ev.key === "Enter") ev.stopPropagation();
                      }}
                    >
                      <ArrowUpRight className="h-4 w-4" strokeWidth={2} aria-hidden />
                    </a>
                  ) : null}
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-zinc-950 ring-1 ring-zinc-800/80">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-cyan-600 via-teal-600 to-emerald-500 opacity-95 transition-[width] duration-500 ease-out group-hover:opacity-100"
                    style={{ width: `${Math.max(w, 2)}%` }}
                  />
                </div>
              </button>
            );
          })}
        </div>
      ) : (
        slice.map((e) => {
          const pct = pctFromRatio(e.momDeltaRatio);
          const up = pct == null ? null : pct >= 0;
          const w = (e.revenue / maxRev) * 100;
          const active = selectedName === e.name;
          return (
            <button
              key={e.slug ?? e.name}
              type="button"
              onClick={() => onSelect?.(e.name)}
              className={cn(
                "w-full text-left rounded-lg border border-transparent px-2 py-2 transition-colors cursor-pointer",
                onSelect && "hover:border-zinc-700 hover:bg-zinc-900/50",
                active && "border-cyan-500/40 bg-cyan-950/20"
              )}
            >
              <div className={cn(ROW_GRID, "mb-1")}>
                <div className="flex items-center gap-1.5 min-w-0">
                  <span className="text-sm font-medium text-zinc-200 truncate">
                    {e.name}
                  </span>
                  {shareHref ? (
                    <a
                      href={shareHref(e.name)}
                      {...(shareOpenInNewTab
                        ? { target: "_blank", rel: "noopener noreferrer" as const }
                        : {})}
                      title="Open this publisher’s shareable page (for Slack, bookmarks)"
                      aria-label={`Open shareable publisher page for ${e.name}`}
                      className="shrink-0 rounded p-0.5 text-zinc-500 hover:text-cyan-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500/50"
                      onClick={(ev) => ev.stopPropagation()}
                      onKeyDown={(ev) => {
                        if (ev.key === " " || ev.key === "Enter") ev.stopPropagation();
                      }}
                    >
                      <ExternalLink className="h-3.5 w-3.5" strokeWidth={2} />
                    </a>
                  ) : null}
                </div>
                <span className="text-sm tabular-nums text-white text-right">
                  {formatCurrency(e.revenue)}
                </span>
                <span
                  className={cn(
                    "text-xs font-semibold tabular-nums text-right",
                    pct == null
                      ? "text-zinc-600"
                      : up
                        ? "text-emerald-400"
                        : "text-red-400"
                  )}
                  title={
                    pct != null
                      ? "Month-over-month gross revenue change"
                      : undefined
                  }
                >
                  {pct != null ? (
                    <>
                      {up ? "▲" : "▼"}
                      {Math.abs(pct).toFixed(0)}%
                    </>
                  ) : (
                    "—"
                  )}
                </span>
              </div>
              <div className="h-2 rounded-full bg-zinc-800 overflow-hidden">
                <div
                  className={cn(
                    "h-full rounded-full transition-all",
                    up === null
                      ? "bg-gradient-to-r from-zinc-600 to-zinc-500"
                      : up
                        ? "bg-gradient-to-r from-emerald-700 to-emerald-500"
                        : "bg-gradient-to-r from-rose-800 to-rose-500"
                  )}
                  style={{ width: `${w}%` }}
                />
              </div>
            </button>
          );
        })
      )}
    </div>
  );
}
