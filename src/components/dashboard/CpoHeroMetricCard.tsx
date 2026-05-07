"use client";

import { cn } from "@/lib/utils";

const PALETTE = {
  cyan: {
    ring: "stroke-cyan-400/90",
    track: "stroke-zinc-800",
    glow: "from-cyan-500/15 via-transparent to-transparent",
    line: "#22d3ee",
    fill: "rgba(34, 211, 238, 0.12)",
    iconBg: "bg-cyan-500/15 text-cyan-400",
  },
  violet: {
    ring: "stroke-violet-400/90",
    track: "stroke-zinc-800",
    glow: "from-violet-500/15 via-transparent to-transparent",
    line: "#a78bfa",
    fill: "rgba(167, 139, 250, 0.12)",
    iconBg: "bg-violet-500/15 text-violet-400",
  },
  emerald: {
    ring: "stroke-emerald-400/90",
    track: "stroke-zinc-800",
    glow: "from-emerald-500/15 via-transparent to-transparent",
    line: "#34d399",
    fill: "rgba(52, 211, 153, 0.12)",
    iconBg: "bg-emerald-500/15 text-emerald-400",
  },
  amber: {
    ring: "stroke-amber-400/90",
    track: "stroke-zinc-800",
    glow: "from-amber-500/15 via-transparent to-transparent",
    line: "#fbbf24",
    fill: "rgba(251, 191, 36, 0.12)",
    iconBg: "bg-amber-500/15 text-amber-400",
  },
} as const;

function MiniSparkline({
  values,
  lineColor,
  areaFill,
}: {
  values: number[];
  lineColor: string;
  areaFill: string;
}) {
  if (values.length < 2) {
    return (
      <div
        className="h-12 w-full rounded-lg bg-zinc-900/60 border border-zinc-800/80"
        aria-hidden
      />
    );
  }
  const w = 360;
  const h = 48;
  const padX = 4;
  const padY = 5;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  const innerW = w - padX * 2;
  const innerH = h - padY * 2;
  const pts = values.map((v, i) => {
    const x = padX + (i / (values.length - 1)) * innerW;
    const y = padY + innerH * (1 - (v - min) / range);
    return [x, y] as const;
  });
  const lineD = pts.map(([x, y], i) => `${i === 0 ? "M" : "L"} ${x} ${y}`).join(" ");
  const lastX = pts[pts.length - 1]![0];
  const firstX = pts[0]![0];
  const areaD = `${lineD} L ${lastX} ${h - padY} L ${firstX} ${h - padY} Z`;

  return (
    <svg
      viewBox={`0 0 ${w} ${h}`}
      className="w-full h-12 rounded-lg bg-zinc-900/40 border border-zinc-800/60"
      preserveAspectRatio="none"
      aria-hidden
    >
      <path d={areaD} fill={areaFill} />
      <path
        d={lineD}
        fill="none"
        stroke={lineColor}
        strokeWidth="2.25"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}



export function CpoHeroMetricCard({
  label,
  valuePct,
  formulaBadge,
  formulaTitle,
  accent,
  children,
  sparklineValues,
  sparklineCaption,
}: {
  label: string;
  valuePct: number;
  /** Short formula top-right (e.g. `loads ÷ PVs`) — clearer than a decorative icon. */
  formulaBadge: string;
  /** Optional longer explanation for hover / accessibility. */
  formulaTitle?: string;
  accent: keyof typeof PALETTE;
  children?: React.ReactNode;
  sparklineValues: number[];
  sparklineCaption: string;
}) {
  const pal = PALETTE[accent];
  const display =
    valuePct >= 10 || Number.isInteger(valuePct)
      ? `${Math.round(valuePct)}%`
      : `${valuePct.toFixed(1)}%`;

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-2xl border border-zinc-800/90",
        "bg-gradient-to-br from-zinc-900/95 to-zinc-900",
        "p-5 sm:p-6 shadow-xl shadow-black/25"
      )}
    >
      <div
        className={cn(
          "pointer-events-none absolute inset-0 bg-gradient-to-br opacity-100",
          pal.glow
        )}
      />
      <div className="relative flex flex-col gap-4">
        <div className="flex items-start justify-between gap-3">
          <p className="text-[10px] sm:text-xs font-semibold uppercase tracking-wider text-zinc-500 min-w-0 pr-2">
            {label}
          </p>
          <div
            className={cn(
              "shrink-0 max-w-[min(10.5rem,48%)] rounded-md border border-white/10 px-2 py-1.5 text-right",
              pal.iconBg
            )}
            title={formulaTitle ?? formulaBadge}
            aria-label={formulaTitle ?? `Formula: ${formulaBadge}`}
          >
            <p className="text-[10px] font-mono font-semibold leading-snug tracking-tight text-right [word-spacing:-0.12em]">
              {formulaBadge}
            </p>
          </div>
        </div>

        <div className="flex items-end justify-between gap-2 min-h-[6.5rem]">
          <p className="text-4xl sm:text-5xl font-bold tracking-tight text-white tabular-nums leading-none min-w-0">
            {display}
          </p>
        </div>

        <div className="space-y-1.5">
          <MiniSparkline
            values={sparklineValues}
            lineColor={pal.line}
            areaFill={pal.fill}
          />
          <p className="text-[10px] uppercase tracking-wide text-zinc-500">{sparklineCaption}</p>
        </div>

        {children ? (
          <div className="text-[11px] sm:text-xs text-zinc-500 space-y-1.5 leading-relaxed border-t border-zinc-800/80 pt-3">
            {children}
          </div>
        ) : null}
      </div>
    </div>
  );
}
