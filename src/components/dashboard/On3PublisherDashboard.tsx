"use client";

import { formatCurrency, formatCurrencyFull, formatNumber, formatPercentChart } from "@/lib/data";
import { cn } from "@/lib/utils";
import { useCallback, useEffect, useId, useState } from "react";

export type On3SummarySeriesPoint = {
  weekStart: string;
  totalRev: number;
  vrpm: number;
  inViews: number;
  commerceClicks: number;
};

export type On3SummarySite = {
  name: string;
  slug: string;
  revenue: number;
  rpm: number;
  views: number;
  clicks: number;
};

export type On3SummaryDeltas = {
  totalRevRatio: number | null;
  vrpmRatio: number | null;
  inViewsRatio: number | null;
  commerceClicksRatio: number | null;
  incrementalRatio: number | null;
  affiliateCtrPp: number;
  articleCtrPp: number;
};

export type On3SummaryCurrent = {
  totals: {
    totalRev: number;
    vrpm: number;
    smartScrollViews: number;
    commerceClicks: number;
    incrementalImpressions: number;
    affiliateCtr: number;
    articleCtr: number;
  };
  dailyAvgRev: number;
  spanDays: number;
  weekStart: string;
  throughWeek: string;
};

export type On3SummaryPayload = {
  windowDays: number;
  windowWeeks: number;
  rangeLabel: string;
  series: On3SummarySeriesPoint[];
  current: On3SummaryCurrent | null;
  prior: { totals: Partial<On3SummaryCurrent["totals"]>; weekKeys: string[] } | null;
  deltas: On3SummaryDeltas | null;
  sites: On3SummarySite[];
  lastUpdated: string;
  error?: string;
};

export const ON3_SUMMARY_WINDOWS = [7, 22, 30] as const;
export type On3SummaryWindowDays = (typeof ON3_SUMMARY_WINDOWS)[number];

export type On3SummaryController = {
  days: On3SummaryWindowDays;
  setDays: (d: On3SummaryWindowDays) => void;
  data: On3SummaryPayload | null;
  loading: boolean;
  error: string | null;
};

export function useOn3Summary(initialDays: On3SummaryWindowDays = 22): On3SummaryController {
  const [days, setDays] = useState<On3SummaryWindowDays>(initialDays);
  const [data, setData] = useState<On3SummaryPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (d: number) => {
    setLoading(true);
    setError(null);
    try {
      const r = await fetch(`/api/on3/summary?days=${d}`, { cache: "no-store" });
      const j = (await r.json()) as On3SummaryPayload & { error?: string };
      if (!r.ok) throw new Error(j.error || `Request failed (${r.status})`);
      setData(j);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
      setData(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load(days);
  }, [days, load]);

  return { days, setDays, data, loading, error };
}

export function On3DashboardHeaderChrome({
  days,
  setDays,
  rangeLabel,
  loading,
  hasData,
}: {
  days: On3SummaryWindowDays;
  setDays: (d: On3SummaryWindowDays) => void;
  rangeLabel: string | null | undefined;
  loading: boolean;
  hasData: boolean;
}) {
  return (
    <div className="flex flex-col items-stretch gap-3 sm:flex-row sm:items-center sm:justify-end sm:gap-4">
      <div className="flex items-center justify-end gap-2 sm:justify-start">
        <p className="text-sm text-zinc-400 tabular-nums">
          {rangeLabel ? rangeLabel : loading && !hasData ? "Loading…" : "—"}
        </p>
        {loading && hasData ? (
          <span
            className="inline-block h-2 w-2 shrink-0 rounded-full bg-teal-400/90 animate-pulse"
            aria-hidden
          />
        ) : null}
      </div>
      <div className="flex flex-wrap justify-end gap-2" role="group" aria-label="Reporting window">
        {ON3_SUMMARY_WINDOWS.map((d) => (
          <button
            key={d}
            type="button"
            onClick={() => setDays(d)}
            className={cn(
              "rounded-full border px-3.5 py-1.5 text-xs font-semibold transition-colors",
              days === d
                ? "border-teal-400/80 bg-teal-500/10 text-teal-300"
                : "border-zinc-700 bg-zinc-950/40 text-zinc-400 hover:border-zinc-600"
            )}
          >
            {d}d
          </button>
        ))}
      </div>
    </div>
  );
}

function paddedYScale(values: number[]): { minY: number; maxY: number; flat: boolean } {
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

function smoothLinePath(pts: readonly (readonly [number, number])[], tension = 6): string {
  if (pts.length < 2) return "";
  if (pts.length === 2) {
    return `M ${pts[0]![0]} ${pts[0]![1]} L ${pts[1]![0]} ${pts[1]![1]}`;
  }
  let d = `M ${pts[0]![0]} ${pts[0]![1]}`;
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

function HeroRevenueChart({ values, lineColor }: { values: number[]; lineColor: string }) {
  const rawId = useId().replace(/:/g, "");
  const gradId = `hero-grad-${rawId}`;
  const fillGradId = `hero-fill-${rawId}`;

  const w = 800;
  const h = 140;
  const padX = 12;
  const padY = 16;
  const innerW = w - padX * 2;
  const innerH = h - padY * 2;
  const bottomY = h - padY;

  if (values.length === 0) {
    return (
      <div className="h-[140px] w-full rounded-xl bg-zinc-950/50 ring-1 ring-zinc-800/70" aria-hidden />
    );
  }

  if (values.length === 1) {
    const cx = padX + innerW / 2;
    const cy = padY + innerH / 2;
    return (
      <svg viewBox={`0 0 ${w} ${h}`} className="h-[140px] w-full" preserveAspectRatio="none" aria-hidden>
        <circle cx={cx} cy={cy} r={5} fill={lineColor} opacity={0.9} />
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

  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="h-[140px] w-full" preserveAspectRatio="none" aria-hidden>
      <defs>
        <linearGradient id={fillGradId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={lineColor} stopOpacity={0.35} />
          <stop offset="50%" stopColor={lineColor} stopOpacity={0.08} />
          <stop offset="100%" stopColor={lineColor} stopOpacity={0} />
        </linearGradient>
        <linearGradient id={gradId} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#2dd4bf" />
          <stop offset="100%" stopColor="#a78bfa" />
        </linearGradient>
      </defs>
      <path d={areaD} fill={`url(#${fillGradId})`} />
      <path
        d={lineD}
        fill="none"
        stroke={lineColor}
        strokeWidth={2.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx={last[0]} cy={last[1]} r={4} fill={lineColor} stroke="#18181b" strokeWidth={1.5} />
    </svg>
  );
}

function MiniSparklineTeal({ values }: { values: number[] }) {
  const lineColor = "#2dd4bf";
  const rawId = useId().replace(/:/g, "");
  const gradId = `mini-${rawId}`;
  const w = 400;
  const h = 56;
  const padX = 6;
  const padY = 6;
  const innerW = w - padX * 2;
  const innerH = h - padY * 2;
  const bottomY = h - padY;

  if (values.length < 2) {
    return <div className="h-14 w-full rounded-lg bg-zinc-950/40 ring-1 ring-zinc-800/60" aria-hidden />;
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

  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="h-14 w-full" preserveAspectRatio="none" aria-hidden>
      <defs>
        <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={lineColor} stopOpacity={0.28} />
          <stop offset="100%" stopColor={lineColor} stopOpacity={0} />
        </linearGradient>
      </defs>
      <path d={areaD} fill={`url(#${gradId})`} />
      <path
        d={lineD}
        fill="none"
        stroke={lineColor}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function MiniSparklineConditional({ values, invert }: { values: number[]; invert?: boolean }) {
  const last = values[values.length - 1] ?? 0;
  const first = values[0] ?? 0;
  const down = last < first - 1e-9;
  const color = invert ? (down ? "#2dd4bf" : "#f87171") : down ? "#f87171" : "#2dd4bf";
  const rawId = useId().replace(/:/g, "");
  const gradId = `cond-${rawId}`;
  const w = 400;
  const h = 56;
  const padX = 6;
  const padY = 6;
  const innerW = w - padX * 2;
  const innerH = h - padY * 2;
  const bottomY = h - padY;

  if (values.length < 2) {
    return <div className="h-14 w-full rounded-lg bg-zinc-950/40 ring-1 ring-zinc-800/60" aria-hidden />;
  }

  const { minY, maxY, flat } = paddedYScale(values);
  const span = maxY - minY || 1;
  const pts: [number, number][] = values.map((v, i) => {
    const x = padX + (i / (values.length - 1)) * innerW;
    const y = flat ? padY + innerH / 2 : padY + innerH * (1 - (v - minY) / span);
    return [x, y];
  });
  const lineD = smoothLinePath(pts);
  const lastP = pts[pts.length - 1]!;
  const firstP = pts[0]!;
  const areaD = `${lineD} L ${lastP[0]} ${bottomY} L ${firstP[0]} ${bottomY} Z`;

  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="h-14 w-full" preserveAspectRatio="none" aria-hidden>
      <defs>
        <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity={0.28} />
          <stop offset="100%" stopColor={color} stopOpacity={0} />
        </linearGradient>
      </defs>
      <path d={areaD} fill={`url(#${gradId})`} />
      <path
        d={lineD}
        fill="none"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function formatPctRatio(r: number | null): string {
  if (r === null || !Number.isFinite(r)) return "—";
  const pct = r * 100;
  const sign = pct > 0 ? "+" : "";
  return `${sign}${pct.toFixed(1)}%`;
}

function DeltaLine({
  ratio,
  suffix = "vs prior period",
  pp,
}: {
  ratio?: number | null;
  suffix?: string;
  pp?: number;
}) {
  if (pp !== undefined && Number.isFinite(pp)) {
    const flat = Math.abs(pp) < 0.03;
    if (flat) {
      return <p className="text-xs font-medium text-zinc-500">flat {suffix}</p>;
    }
    const pos = pp > 0;
    return (
      <p className={cn("text-xs font-semibold tabular-nums", pos ? "text-teal-400" : "text-red-400")}>
        {pos ? "+" : ""}
        {pp.toFixed(2)}pp {suffix}
      </p>
    );
  }
  if (ratio === null || ratio === undefined || !Number.isFinite(ratio)) {
    return <p className="text-xs text-zinc-500">— {suffix}</p>;
  }
  const flat = Math.abs(ratio) < 0.002;
  if (flat) {
    return <p className="text-xs font-medium text-zinc-500">flat {suffix}</p>;
  }
  const pos = ratio > 0;
  return (
    <p className={cn("text-xs font-semibold tabular-nums", pos ? "text-teal-400" : "text-red-400")}>
      {formatPctRatio(ratio)} {suffix}
    </p>
  );
}

function formatCompactInt(n: number): string {
  if (!Number.isFinite(n)) return "—";
  if (Math.abs(n) >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (Math.abs(n) >= 1000) return `${(n / 1000).toFixed(1)}K`;
  return formatNumber(n);
}

export function On3PublisherDashboard({
  onRequestPublisherQuickView,
  summary,
}: {
  onRequestPublisherQuickView: (slug: string) => void;
  summary: On3SummaryController;
}) {
  const { data, loading, error: err } = summary;

  const cur = data?.current;
  const deltas = data?.deltas;
  const series = data?.series ?? [];
  const sites = data?.sites ?? [];

  const revSeries = series.map((s) => s.totalRev);
  const vrpmSeries = series.map((s) => s.vrpm);
  const viewsSeries = series.map((s) => s.inViews);
  const clicksSeries = series.map((s) => s.commerceClicks);

  if (loading && !cur) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-16 text-zinc-400">
        <div className="h-8 w-8 border-2 border-teal-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-sm">Loading publisher dashboard…</p>
      </div>
    );
  }

  if (err && !cur) {
    return (
      <div className="space-y-2 py-8 text-center">
        <p className="text-red-400 font-medium text-sm">Could not load dashboard</p>
        <p className="text-zinc-500 text-xs max-w-md mx-auto">{err}</p>
      </div>
    );
  }

  if (!cur) {
    return <p className="py-8 text-center text-sm text-zinc-500">No rollup data for this window.</p>;
  }

  const t = cur.totals;
  const lastUpdatedFmt = data?.lastUpdated
    ? new Date(data.lastUpdated).toLocaleString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "numeric",
        minute: "2-digit",
      })
    : "—";

  return (
    <div className="space-y-8">
      {/* Hero revenue */}
      <div
        className={cn(
          "relative overflow-hidden rounded-2xl border border-zinc-800/90",
          "bg-gradient-to-br from-zinc-900/95 to-zinc-950 p-6 shadow-xl shadow-black/30"
        )}
      >
        <div
          className="pointer-events-none absolute inset-x-0 top-0 h-[3px] bg-gradient-to-r from-teal-400 via-cyan-400 to-violet-500 opacity-90"
          aria-hidden
        />
        <div className="relative flex flex-col gap-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-zinc-500">Total revenue</p>
            <p className="text-xs text-zinc-500 tabular-nums">
              Daily avg{" "}
              <span className="font-semibold text-zinc-300">{formatCurrencyFull(cur.dailyAvgRev)}</span>
            </p>
          </div>
          <div className="flex flex-wrap items-end justify-between gap-4">
            <p className="text-4xl font-bold tracking-tight text-white tabular-nums sm:text-5xl">
              {formatCurrencyFull(t.totalRev)}
            </p>
            <DeltaLine ratio={deltas?.totalRevRatio ?? null} />
          </div>
          <HeroRevenueChart values={revSeries} lineColor="#2dd4bf" />
          <div className="flex justify-between text-[10px] uppercase tracking-wide text-zinc-600">
            <span>{series[0] ? shortWeekLabel(series[0].weekStart) : ""}</span>
            <span>{series.length ? shortWeekLabel(series[series.length - 1]!.weekStart) : ""}</span>
          </div>
        </div>
      </div>

      {/* Secondary metrics */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <div className="rounded-2xl border border-zinc-800/90 bg-zinc-900/50 p-5 ring-1 ring-zinc-800/50">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-zinc-500">Viewable RPM</p>
          <p className="mt-2 text-2xl font-bold text-white tabular-nums">{formatCurrencyFull(t.vrpm)}</p>
          <DeltaLine ratio={deltas?.vrpmRatio ?? null} />
          <div className="mt-3">
            <MiniSparklineTeal values={vrpmSeries} />
          </div>
        </div>
        <div className="rounded-2xl border border-zinc-800/90 bg-zinc-900/50 p-5 ring-1 ring-zinc-800/50">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-zinc-500">In-view impressions</p>
          <p className="mt-2 text-2xl font-bold text-white tabular-nums">{formatCompactInt(t.smartScrollViews)}</p>
          <DeltaLine ratio={deltas?.inViewsRatio ?? null} />
          <div className="mt-3">
            <MiniSparklineTeal values={viewsSeries} />
          </div>
        </div>
        <div className="rounded-2xl border border-zinc-800/90 bg-zinc-900/50 p-5 ring-1 ring-zinc-800/50">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-zinc-500">Commerce clicks</p>
          <p className="mt-2 text-2xl font-bold text-white tabular-nums">{formatNumber(t.commerceClicks)}</p>
          <DeltaLine ratio={deltas?.commerceClicksRatio ?? null} />
          <div className="mt-3">
            <MiniSparklineConditional values={clicksSeries} />
          </div>
        </div>
      </div>

      {/* Tertiary */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <div className="rounded-2xl border border-zinc-800/90 bg-zinc-900/40 p-5">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-zinc-500">Incr. impressions</p>
          <p className="mt-2 text-xl font-bold text-white tabular-nums">{formatCompactInt(t.incrementalImpressions)}</p>
          <DeltaLine ratio={deltas?.incrementalRatio ?? null} />
        </div>
        <div className="rounded-2xl border border-zinc-800/90 bg-zinc-900/40 p-5">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-zinc-500">Affiliate CTR</p>
          <p className="mt-2 text-xl font-bold text-white tabular-nums">{formatPercentChart(t.affiliateCtr, 2)}</p>
          <DeltaLine pp={deltas?.affiliateCtrPp ?? 0} />
        </div>
        <div className="rounded-2xl border border-zinc-800/90 bg-zinc-900/40 p-5">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-zinc-500">Article CTR</p>
          <p className="mt-2 text-xl font-bold text-white tabular-nums">{formatPercentChart(t.articleCtr, 2)}</p>
          <DeltaLine pp={deltas?.articleCtrPp ?? 0} />
        </div>
      </div>

      {/* Site breakdown */}
      <section className="space-y-3">
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-[11px] font-semibold uppercase tracking-[0.18em] text-zinc-500">Site breakdown</h2>
          <p className="text-[10px] text-zinc-600">
            {sites.length} active site{sites.length === 1 ? "" : "s"}
          </p>
        </div>
        <div className="overflow-hidden rounded-2xl border border-zinc-800/90 bg-zinc-950/40 ring-1 ring-zinc-800/50">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-zinc-800/80 text-[10px] uppercase tracking-wider text-zinc-500">
                <th className="px-4 py-3 font-semibold">Site</th>
                <th className="px-4 py-3 font-semibold text-right">Revenue</th>
                <th className="px-4 py-3 font-semibold text-right">RPM</th>
                <th className="hidden sm:table-cell px-4 py-3 font-semibold text-right">Views</th>
                <th className="px-4 py-3 font-semibold text-right">Clicks</th>
              </tr>
            </thead>
            <tbody>
              {sites.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-zinc-500">
                    No site rows in this window.
                  </td>
                </tr>
              ) : (
                sites.map((s, i) => (
                  <tr
                    key={`${s.slug}-${i}`}
                    className="border-b border-zinc-800/50 last:border-0 hover:bg-zinc-900/50"
                  >
                    <td className="px-4 py-3">
                      <button
                        type="button"
                        onClick={() => onRequestPublisherQuickView(s.slug)}
                        className="text-left font-medium text-white hover:text-teal-300"
                      >
                        <span className="mr-2 inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-emerald-600/30 text-[10px] font-bold text-emerald-300">
                          O3
                        </span>
                        {s.name}
                      </button>
                      <p className="mt-0.5 pl-8 text-[11px] text-zinc-600">/p/{s.slug}</p>
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums text-zinc-200">{formatCurrency(s.revenue)}</td>
                    <td className="px-4 py-3 text-right tabular-nums text-zinc-200">{formatCurrency(s.rpm)}</td>
                    <td className="hidden sm:table-cell px-4 py-3 text-right tabular-nums text-zinc-200">
                      {formatCompactInt(s.views)}
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums text-zinc-200">{formatNumber(s.clicks)}</td>
                  </tr>
                ))
              )}
            </tbody>
            {sites.length > 0 ? (
              <tfoot>
                <tr>
                  <td colSpan={5} className="p-0 border-0">
                    <div
                      className="h-[3px] w-full bg-gradient-to-r from-teal-400 via-cyan-400 to-violet-500 opacity-90"
                      aria-hidden
                    />
                  </td>
                </tr>
              </tfoot>
            ) : null}
          </table>
        </div>
        <p className="text-center text-xs italic text-zinc-600">
          Additional sites appear here as they onboard.
        </p>
      </section>

      <footer className="flex flex-col gap-2 border-t border-zinc-800/70 pt-6 text-xs text-zinc-500 sm:flex-row sm:items-center sm:justify-between">
        <p>
          Powered by{" "}
          <a
            href="https://mula.network"
            target="_blank"
            rel="noopener noreferrer"
            className="text-zinc-400 underline-offset-2 hover:text-teal-400 hover:underline"
          >
            Mula
          </a>
        </p>
        <p className="tabular-nums">Last updated: {lastUpdatedFmt}</p>
      </footer>
    </div>
  );
}

function shortWeekLabel(iso: string): string {
  const d = new Date(`${iso}T12:00:00Z`);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "UTC" });
}
