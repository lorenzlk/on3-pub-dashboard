"use client";

import type { ReactNode } from "react";
import type { ExecutiveRole } from "@/components/dashboard/DashboardHeader";
import { useDashboardLive } from "@/lib/dashboard-data-context";
import {
  formatCurrency,
  formatMomPercentLine,
  formatPercentChart,
  formatNumber,
  formatRpmMomPercentLine,
  pctFromRatio,
} from "@/lib/data";
import type { KpisPayload } from "@/lib/live-payload-types";
import { networkPublisherFootprintTotals } from "@/lib/persona-metrics";
import { cn } from "@/lib/utils";
import {
  ArrowRight,
  BarChart3,
  DollarSign,
  ScanEye,
  Target,
} from "lucide-react";

type PersonaRole = Exclude<ExecutiveRole, "group">;

const TILES: {
  role: PersonaRole;
  label: string;
  accent: string;
  icon: typeof DollarSign;
}[] = [
  {
    role: "ceo",
    label: "CEO",
    accent: "border-emerald-500/40 bg-emerald-500/[0.06] hover:border-emerald-500/55 hover:bg-emerald-500/[0.09]",
    icon: DollarSign,
  },
  {
    role: "coo",
    label: "COO",
    accent: "border-amber-500/40 bg-amber-500/[0.06] hover:border-amber-500/55 hover:bg-amber-500/[0.09]",
    icon: Target,
  },
  {
    role: "cpo",
    label: "CPO",
    accent: "border-cyan-500/40 bg-cyan-500/[0.06] hover:border-cyan-500/55 hover:bg-cyan-500/[0.09]",
    icon: ScanEye,
  },
  {
    role: "cro",
    label: "CRO",
    accent: "border-violet-500/40 bg-violet-500/[0.06] hover:border-violet-500/55 hover:bg-violet-500/[0.09]",
    icon: BarChart3,
  },
];

function tileScopeLine(role: PersonaRole, latestMonthLabel: string | null): string {
  switch (role) {
    case "ceo":
      return latestMonthLabel
        ? `${latestMonthLabel} · Gross Revenue`
        : "Gross Revenue (latest month)";
    case "coo":
      return "Lifetime · loads ÷ pageviews";
    case "cpo":
      return "Lifetime · in-views ÷ loads";
    case "cro":
      return latestMonthLabel
        ? `${latestMonthLabel} · Blended RPM`
        : "Blended RPM (latest month)";
    default:
      return "";
  }
}

function momLineClass(line: string | null, pct: number | undefined): string {
  if (!line || line === "—") return "text-zinc-500";
  if (line.startsWith("MoM —")) return "text-zinc-500";
  return (pct ?? 0) >= 0 ? "text-emerald-400" : "text-red-400";
}

function PercentRing({
  pct,
  color,
}: {
  pct: number;
  color: "amber" | "cyan";
}) {
  const clamped = Math.max(0, Math.min(100, Number.isFinite(pct) ? pct : 0));
  const ringColor = color === "amber" ? "rgba(251, 191, 36, 0.95)" : "rgba(34, 211, 238, 0.95)";
  return (
    <div className="relative h-14 w-14 shrink-0">
      <div
        className="absolute inset-0 rounded-full"
        style={{
          background: `conic-gradient(${ringColor} ${clamped * 3.6}deg, rgba(39,39,42,0.9) 0deg)`,
        }}
      />
      <div className="absolute inset-[6px] rounded-full bg-zinc-900/95 border border-zinc-800/80" />
    </div>
  );
}

export function ExecutiveGroupOverview({
  onOpenPersona,
}: {
  onOpenPersona: (role: PersonaRole) => void;
}) {
  const { data } = useDashboardLive();
  const kpis = (data?.kpis ?? null) as KpisPayload | null;
  const totals = kpis?.totals;
  const cmp = kpis?.comparison;
  const publisherTotals = data?.publisherTotals ?? [];

  const totalRev = totals?.totalRevenue ?? 0;
  const momRevPct = pctFromRatio(cmp?.momRevenueDeltaPct);
  const prevRev = cmp?.prevTotalRevenue;

  const footprint = networkPublisherFootprintTotals(publisherTotals);
  const previousMonthLabel = kpis?.meta?.previousMonthLabel ?? null;
  const latestMonthLabel = kpis?.meta?.latestMonthLabel ?? null;

  const blendedRpm = totals?.totalRpm ?? 0;
  const viewableRpm = totals?.totalVrpm ?? 0;
  const momRpmPct = pctFromRatio(cmp?.momTotalRpmDeltaPct);

  const momOpts = {
    priorRevenue: prevRev,
    priorMonthLabel: previousMonthLabel,
    compact: true,
  } as const;
  const rpmOpts = {
    priorMonthLabel: previousMonthLabel,
    compact: true,
  } as const;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3 sm:gap-4">
        {TILES.map((t) => {
          const Icon = t.icon;
          let value = "—";
          let sub: ReactNode = null;
          let foot: ReactNode = null;

          if (t.role === "ceo") {
            value = formatCurrency(totalRev);
            const momLine = formatMomPercentLine(momRevPct, momOpts);
            sub = (
              <span className={momLineClass(momLine, momRevPct)}>{momLine ?? "—"}</span>
            );
          } else if (t.role === "coo") {
            value = formatPercentChart(footprint.loadsPerPvPct, 1);
            sub = (
              <p className="text-[10px] text-zinc-500 leading-snug">
                Coverage on publisher sites: widget eligible to serve vs pageviews (lifetime).
              </p>
            );
            foot = (
              <div className="space-y-0.5">
                <p className="text-[10px] text-zinc-500">Widget loads · pageviews</p>
                <p className="text-[11px] text-zinc-400 tabular-nums">
                  {formatNumber(footprint.sumWL)} · {formatNumber(footprint.sumPV)}
                </p>
              </div>
            );
          } else if (t.role === "cpo") {
            value = footprint.viewabilityNotComparable
              ? "—"
              : formatPercentChart(footprint.viewabilityPct, 1);
            sub = footprint.viewabilityNotComparable ? (
              <div className="space-y-1">
                <span
                  className="text-[11px] text-amber-400/90"
                  title="Loads and in-views map to the same column — add split columns in the sheet for viewability."
                >
                  N/A
                </span>
                <p className="text-[10px] text-zinc-500 leading-snug">
                  Viewability needs separate widget-load vs in-view columns in the sheet.
                </p>
              </div>
            ) : (
              <p className="text-[10px] text-zinc-500 leading-snug">
                Viewability: SmartScroll in-views ÷ widget loads — share of serves seen in-view
                (lifetime).
              </p>
            );
            foot = footprint.viewabilityNotComparable ? null : (
              <div className="space-y-0.5">
                <p className="text-[10px] text-zinc-500">SS in-views · widget loads</p>
                <p className="text-[11px] text-zinc-400 tabular-nums">
                  {formatNumber(footprint.sumSS)} · {formatNumber(footprint.sumWL)}
                </p>
              </div>
            );
          } else if (t.role === "cro") {
            value = formatCurrency(blendedRpm);
            const rpmLine = formatRpmMomPercentLine(momRpmPct, rpmOpts);
            sub = (
              <div className="space-y-1">
                <span className={momLineClass(rpmLine, momRpmPct)}>{rpmLine ?? "—"}</span>
                <p className="text-[11px] text-zinc-500 tabular-nums">
                  Viewable RPM {formatCurrency(viewableRpm)}
                </p>
              </div>
            );
          }

          const scope = tileScopeLine(t.role, latestMonthLabel);

          return (
            <button
              key={t.role}
              type="button"
              onClick={() => onOpenPersona(t.role)}
              className={cn(
                "text-left rounded-2xl border transition-colors group flex flex-col min-h-[220px]",
                "focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/45",
                "shadow-sm shadow-black/20",
                (t.role === "coo" || t.role === "cpo") &&
                  "bg-gradient-to-br from-zinc-900/95 to-zinc-900 overflow-hidden",
                t.accent,
                t.role === "ceo" ? "p-4 sm:p-5" : "p-4 sm:p-5"
              )}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 space-y-1">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400">
                    {t.label}
                  </p>
                  <p className="text-[11px] text-zinc-500 leading-snug">{scope}</p>
                </div>
                {t.role === "coo" ? (
                  <div className="rounded-md border border-amber-400/20 bg-amber-500/10 px-1.5 py-1">
                    <p className="text-[9px] font-mono font-semibold text-amber-300">loads ÷ PVs</p>
                  </div>
                ) : t.role === "cpo" ? (
                  <div className="rounded-md border border-cyan-400/20 bg-cyan-500/10 px-1.5 py-1">
                    <p className="text-[9px] font-mono font-semibold text-cyan-300">in-views ÷ loads</p>
                  </div>
                ) : (
                  <Icon className="w-5 h-5 text-zinc-500 group-hover:text-zinc-300 shrink-0 mt-0.5" />
                )}
              </div>

              {t.role === "coo" || t.role === "cpo" ? (
                <div className="mt-3 flex items-end justify-between gap-3">
                  <p className="text-2xl sm:text-[1.65rem] font-bold text-white tabular-nums tracking-tight leading-none">
                    {value}
                  </p>
                  <PercentRing
                    pct={t.role === "coo" ? footprint.loadsPerPvPct : footprint.viewabilityPct}
                    color={t.role === "coo" ? "amber" : "cyan"}
                  />
                </div>
              ) : (
                <p className="mt-3 text-2xl sm:text-[1.65rem] font-bold text-white tabular-nums tracking-tight leading-none">
                  {value}
                </p>
              )}

              {sub ? <div className="mt-1.5 text-xs">{sub}</div> : null}
              {foot ? <div className="mt-2 text-xs">{foot}</div> : null}

              <p className="mt-auto pt-4 flex items-center gap-1 text-[11px] font-medium text-zinc-500 group-hover:text-emerald-400/90">
                Open {t.label}
                <ArrowRight className="w-3.5 h-3.5" />
              </p>
            </button>
          );
        })}
      </div>
    </div>
  );
}
