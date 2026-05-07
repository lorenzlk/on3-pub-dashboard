"use client";

import { cn } from "@/lib/utils";
import { formatCurrency, formatNumber, formatPercentChart } from "@/lib/data";
import { useId } from "react";

const PALETTE = {
  emerald: {
    ring: "stroke-emerald-400/90",
    track: "stroke-zinc-800",
    glow: "from-emerald-500/15 via-transparent to-transparent",
    line: "#34d399",
    fill: "rgba(52, 211, 153, 0.12)",
    iconBg: "bg-emerald-500/15 text-emerald-400",
  },
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
  amber: {
    ring: "stroke-amber-400/90",
    track: "stroke-zinc-800",
    glow: "from-amber-500/15 via-transparent to-transparent",
    line: "#fbbf24",
    fill: "rgba(251, 191, 36, 0.12)",
    iconBg: "bg-amber-500/15 text-amber-400",
  },
} as const;

function paddedYScale(
  values: number[]
): { minY: number; maxY: number; flat: boolean } {
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min;
  const flat = !Number.isFinite(range) || range <= 1e-12;
  if (flat) {
    const mid = Number.isFinite(min) ? min : 0;
    const pad = Math.max(Math.abs(mid) * 0.08, 1);
    return { minY: mid - pad, maxY: mid + pad, flat: true };
  }
  const pad = range * 0.12;
  return { minY: min - pad, maxY: max + pad, flat: false };
}

/** Cardinal spline to cubic Beziers (Chart.js–style smoothness). */
function smoothLinePath(pts: readonly (readonly [number, number])[], tension = 6): string {
  if (pts.length < 2) return "";
  if (pts.length === 2) {
    return `M ${pts[0][0]} ${pts[0][1]} L ${pts[1][0]} ${pts[1][1]}`;
  }
  let d = `M ${pts[0][0]} ${pts[0][1]}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[Math.max(0, i - 1)]!;
    const p1 = pts[i]!;
    const p2 = pts[i + 1]!;
    const p3 = pts[Math.min(pts.length - 1, i + 2)]!;
    const c1x = p1[0] + (p2[0] - p0[0]) / tension;
    const c1y = p1[1] + (p2[1] - p0[1]) / tension;
    const c2x = p2[0] - (p3[0] - p1[0]) / tension;
    const c2y = p2[1] - (p3[1] - p1[1]) / tension;
    d += ` C ${c1x} ${c1y} ${c2x} ${c2y} ${p2[0]} ${p2[1]}`;
  }
  return d;
}

function MiniSparkline({
  values,
  lineColor,
}: {
  values: number[];
  lineColor: string;
}) {
  const rawId = useId().replace(/:/g, "");
  const gradId = `spark-grad-${rawId}`;
  const glowId = `spark-glow-${rawId}`;

  const w = 400;
  const h = 56;
  const padX = 6;
  const padY = 6;
  const innerW = w - padX * 2;
  const innerH = h - padY * 2;
  const bottomY = h - padY;

  if (values.length === 0) {
    return (
      <div
        className="h-14 w-full rounded-xl bg-zinc-950/40 ring-1 ring-zinc-800/70"
        aria-hidden
      />
    );
  }

  if (values.length === 1) {
    const cx = padX + innerW / 2;
    const cy = padY + innerH / 2;
    return (
      <svg
        viewBox={`0 0 ${w} ${h}`}
        className="h-14 w-full rounded-xl bg-zinc-950/50 ring-1 ring-zinc-800/70"
        aria-hidden
      >
        <circle cx={cx} cy={cy} r={4} fill={lineColor} opacity={0.9} />
        <circle cx={cx} cy={cy} r={7} fill={lineColor} opacity={0.15} />
      </svg>
    );
  }

  const { minY, maxY, flat } = paddedYScale(values);
  const span = maxY - minY || 1;
  const pts: [number, number][] = values.map((v, i) => {
    const x = padX + (i / (values.length - 1)) * innerW;
    const y = flat ? padY + innerH / 2 : padY + innerH * (1 - (v - minY) / span);
    return [x, y];
  });

  const lineD = smoothLinePath(pts);
  const last = pts[pts.length - 1]!;
  const first = pts[0]!;
  const areaD = `${lineD} L ${last[0]} ${bottomY} L ${first[0]} ${bottomY} Z`;

  const gridYs = [0.25, 0.5, 0.75].map((t) => padY + innerH * t);

  return (
    <svg
      viewBox={`0 0 ${w} ${h}`}
      className="h-14 w-full rounded-xl bg-zinc-950/50 ring-1 ring-zinc-800/70"
      preserveAspectRatio="none"
      aria-hidden
    >
      <defs>
        <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={lineColor} stopOpacity={0.28} />
          <stop offset="55%" stopColor={lineColor} stopOpacity={0.06} />
          <stop offset="100%" stopColor={lineColor} stopOpacity={0} />
        </linearGradient>
        <filter id={glowId} x="-40%" y="-40%" width="180%" height="180%">
          <feGaussianBlur stdDeviation="2.2" result="b" />
          <feMerge>
            <feMergeNode in="b" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {gridYs.map((gy) => (
        <line
          key={gy}
          x1={padX}
          x2={w - padX}
          y1={gy}
          y2={gy}
          stroke="#3f3f46"
          strokeOpacity={0.35}
          strokeWidth={1}
        />
      ))}

      <path d={areaD} fill={`url(#${gradId})`} />
      <path
        d={lineD}
        fill="none"
        stroke={lineColor}
        strokeOpacity={0.35}
        strokeWidth={5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d={lineD}
        fill="none"
        stroke={lineColor}
        strokeWidth={2.35}
        strokeLinecap="round"
        strokeLinejoin="round"
        filter={`url(#${glowId})`}
      />
      <circle
        cx={last[0]}
        cy={last[1]}
        r={5}
        fill={lineColor}
        fillOpacity={0.2}
      />
      <circle
        cx={last[0]}
        cy={last[1]}
        r={3.25}
        fill={lineColor}
        stroke="rgba(24,24,27,0.85)"
        strokeWidth={1.5}
      />
    </svg>
  );
}



export type PublisherHeroValueType = "currency" | "count" | "percent";

function formatValue(value: number, type: PublisherHeroValueType) {
  if (type === "currency") return formatCurrency(value);
  if (type === "percent") return formatPercentChart(value, 2);
  return formatNumber(value);
}

function gaugePctFromSeries(
  value: number,
  type: PublisherHeroValueType,
  series: number[]
): number {
  if (type === "percent") return value;
  const values = series.length ? series : [value];
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min;
  if (!Number.isFinite(range) || range <= 1e-9) return 50;
  return ((value - min) / range) * 100;
}

export function PublisherHeroMetricCard({
  label,
  value,
  valueType,
  accent,
  badge,
  badgeTitle,
  sparklineValues = [],
  sparklineCaption = "",
  deltaText,
  showTrailingTrend = true,
}: {
  label: string;
  value: number;
  valueType: PublisherHeroValueType;
  accent: keyof typeof PALETTE;
  badge?: string;
  badgeTitle?: string;
  /** Weekly points for sparkline + ring scale; ignored when `showTrailingTrend` is false. */
  sparklineValues?: number[];
  sparklineCaption?: string;
  deltaText?: string | null;
  /** When false, hides sparkline, caption, and WoW row (e.g. all-time KPIs). */
  showTrailingTrend?: boolean;
}) {
  const pal = PALETTE[accent];
  const display = formatValue(value, valueType);
  const pct = showTrailingTrend
    ? gaugePctFromSeries(value, valueType, sparklineValues)
    : valueType === "percent"
      ? Math.min(100, Math.max(0, value))
      : 54;

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
          {badge ? (
            <div
              className={cn(
                "shrink-0 max-w-[min(10.5rem,48%)] rounded-md border border-white/10 px-2 py-1.5 text-right",
                pal.iconBg
              )}
              title={badgeTitle ?? badge}
              aria-label={badgeTitle ?? badge}
            >
              <p className="text-[10px] font-mono font-semibold leading-snug tracking-tight text-right [word-spacing:-0.12em]">
                {badge}
              </p>
            </div>
          ) : null}
        </div>

        <div className="flex items-end justify-between gap-2 min-h-[6.5rem]">
          <p className="text-4xl sm:text-5xl font-bold tracking-tight text-white tabular-nums leading-none min-w-0">
            {display}
          </p>
        </div>

        {showTrailingTrend ? (
          <div className="space-y-1.5">
            <MiniSparkline values={sparklineValues} lineColor={pal.line} />
            <div className="flex items-baseline justify-between gap-3">
              <p className="text-[10px] uppercase tracking-wide text-zinc-500">
                {sparklineCaption}
              </p>
              {deltaText ? (
                <p className="text-[10px] uppercase tracking-wide text-zinc-500 tabular-nums">
                  {deltaText}
                </p>
              ) : null}
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}

