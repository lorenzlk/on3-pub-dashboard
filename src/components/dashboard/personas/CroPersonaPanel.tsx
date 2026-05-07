"use client";

import { DashboardSectionHeader } from "@/components/dashboard/DashboardSectionHeader";
import { KpiHeroCard } from "@/components/dashboard/KpiHeroCard";
import {
  RevenueLeaderboard,
  type LeaderboardEntry,
} from "@/components/dashboard/RevenueLeaderboard";
import { SparklineTrend } from "@/components/dashboard/SparklineTrend";
import { useDashboardLive, type PublisherTotalRow } from "@/lib/dashboard-data-context";
import { formatCurrency, formatCurrencyFull, formatNumber, pctFromRatio } from "@/lib/data";
import {
  absoluteCroPublisherUrl,
  croPublisherDashboardHref,
  matchPublisherInTotals,
} from "@/lib/cro-publisher-url";
import type { KpisPayload, PublisherMoMRow } from "@/lib/live-payload-types";
import { parsePublisherMoM, parseWeeklyByPublisher } from "@/lib/persona-metrics";
import { cn } from "@/lib/utils";
import { BarChart3, ClipboardCopy, DollarSign, Eye, ScanEye, X } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import {
  Area,
  CartesianGrid,
  ComposedChart,
  Legend,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

type SparkDatum = { date: string; value: number };

function CroPublisherDrilldownCard({
  row,
  pubRevSpark,
  pubRpmSpark,
  pubVrpmSpark,
  copyHint,
  onDismiss,
  onCopyLink,
  dismissLabel = "Clear",
  showDismiss = true,
  className,
}: {
  row: PublisherTotalRow;
  pubRevSpark: SparkDatum[];
  pubRpmSpark: SparkDatum[];
  pubVrpmSpark: SparkDatum[];
  copyHint: string | null;
  onDismiss: () => void;
  onCopyLink: () => void | Promise<void>;
  dismissLabel?: string;
  showDismiss?: boolean;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "rounded-xl border border-cyan-500/30 bg-zinc-900/50 p-4 space-y-4",
        className
      )}
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h4 id="cro-drill-title" className="text-base font-semibold text-white pr-2">
          {row.publisher}
        </h4>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => void onCopyLink()}
            className="inline-flex items-center gap-1 rounded-md border border-zinc-700 px-2 py-1 text-xs font-medium text-zinc-400 hover:text-zinc-200 hover:border-zinc-600"
          >
            <ClipboardCopy className="h-3 w-3" />
            Copy page link
          </button>
          {copyHint ? (
            <span className="text-[11px] text-emerald-400/90">{copyHint}</span>
          ) : null}
          {showDismiss ? (
            <button
              type="button"
              onClick={onDismiss}
              className="text-xs text-zinc-500 hover:text-zinc-300"
            >
              {dismissLabel}
            </button>
          ) : null}
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3 text-sm">
        <div>
          <p className="text-[10px] uppercase text-zinc-500">Gross revenue (lifetime)</p>
          <p className="text-zinc-200 font-semibold tabular-nums">
            {formatCurrency(row.totalRev)}
          </p>
        </div>
        <div>
          <p className="text-[10px] uppercase text-zinc-500">Blended RPM</p>
          <p className="text-zinc-200 font-semibold tabular-nums">{formatCurrency(row.avgRpm)}</p>
        </div>
        <div>
          <p className="text-[10px] uppercase text-zinc-500">Viewable RPM</p>
          <p className="text-zinc-200 font-semibold tabular-nums">{formatCurrency(row.avgVrpm)}</p>
        </div>
        <div>
          <p className="text-[10px] uppercase text-zinc-500">Pageviews</p>
          <p className="text-zinc-200 tabular-nums">{formatNumber(row.totalPVs)}</p>
        </div>
        <div className="col-span-2">
          <p className="text-[10px] uppercase text-zinc-500">Sessions</p>
          <p className="text-zinc-200 tabular-nums">{formatNumber(row.sessions)}</p>
        </div>
      </div>
      <div className="space-y-1">
        <p className="text-[10px] uppercase text-zinc-500">Channel split</p>
        <div className="flex gap-2 text-xs text-zinc-400 flex-wrap">
          <span>Aff: {formatCurrency(row.affiliateRev)}</span>
          <span>Email: {formatCurrency(row.emailRev)}</span>
          <span>KVP: {formatCurrency(row.kvpRev)}</span>
          <span>Video: {formatCurrency(row.videoRev)}</span>
          <span>Native: {formatCurrency(row.nativeRev)}</span>
        </div>
      </div>
      <SparklineTrend
        data={pubRevSpark}
        color="#34d399"
        height={80}
        valueLabel="Revenue"
        formatAs="currency"
        label="Weekly revenue"
      />
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <SparklineTrend
          data={pubRpmSpark}
          color="#22d3ee"
          height={80}
          valueLabel="RPM"
          formatAs="currency"
          label="Weekly blended RPM"
        />
        <SparklineTrend
          data={pubVrpmSpark}
          color="#a78bfa"
          height={80}
          valueLabel="vRPM"
          formatAs="currency"
          label="Weekly viewable RPM"
        />
      </div>
    </div>
  );
}

function CroPersonaPanelInner() {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const isCroRoute = pathname === "/dashboard/cro";

  const [period, setPeriod] = useState<"rev" | "mom">("rev");
  /** Leaderboard selection when not on `/dashboard/cro` (URL does not drive state on home). */
  const [localPublisherSelection, setLocalPublisherSelection] = useState<string | null>(null);
  const [copyHint, setCopyHint] = useState<string | null>(null);
  const { error, data } = useDashboardLive();

  const kpis = (data?.kpis ?? null) as KpisPayload | null;
  const cmp = kpis?.comparison;
  const totals = kpis?.totals;
  const momRevPts = pctFromRatio(cmp?.momRevenueDeltaPct);
  const meta = kpis?.meta;
  const monthlyTotals = useMemo(() => data?.monthlyTotals ?? [], [data?.monthlyTotals]);
  const publisherTotals = useMemo(() => data?.publisherTotals ?? [], [data?.publisherTotals]);

  const publisherFromUrl = useMemo((): string | null => {
    if (!isCroRoute || !publisherTotals.length) return null;
    const raw = searchParams.get("publisher");
    if (!raw) return null;
    try {
      return matchPublisherInTotals(decodeURIComponent(raw), publisherTotals);
    } catch {
      return null;
    }
  }, [isCroRoute, publisherTotals, searchParams]);

  useEffect(() => {
    if (!isCroRoute || !publisherTotals.length) return;
    const raw = searchParams.get("publisher");
    if (!raw) return;
    try {
      const decoded = decodeURIComponent(raw);
      const match = matchPublisherInTotals(decoded, publisherTotals);
      if (match != null) return;
    } catch {
      /* fall through to strip */
    }
    const params = new URLSearchParams(searchParams.toString());
    params.delete("publisher");
    const q = params.toString();
    router.replace(q ? `${pathname}?${q}` : pathname, { scroll: false });
  }, [isCroRoute, pathname, publisherTotals, router, searchParams]);

  const selectedPub = isCroRoute ? publisherFromUrl : localPublisherSelection;

  const applyPublisherSelection = useCallback(
    (name: string | null) => {
      if (!isCroRoute) {
        setLocalPublisherSelection(name);
        return;
      }
      const params = new URLSearchParams(searchParams.toString());
      if (name) params.set("publisher", name);
      else params.delete("publisher");
      const q = params.toString();
      router.replace(q ? `${pathname}?${q}` : pathname, { scroll: false });
    },
    [isCroRoute, pathname, router, searchParams]
  );

  const momRows = parsePublisherMoM(data?.publisherMoM ?? []);
  const weeklyByPub = parseWeeklyByPublisher(data?.weeklyByPublisher ?? []);

  const momMap = useMemo(() => {
    const m = new Map<string, PublisherMoMRow>();
    for (const r of momRows) m.set(r.publisher.trim().toLowerCase(), r);
    return m;
  }, [momRows]);

  const leaderboardEntries = useMemo((): LeaderboardEntry[] => {
    const entries: LeaderboardEntry[] = publisherTotals.map((p) => {
      const row = momMap.get(p.publisher.trim().toLowerCase());
      return {
        name: p.publisher,
        revenue: period === "mom" ? (row?.currentMonthRev ?? p.totalRev) : p.totalRev,
        momDeltaRatio: row?.momRevDeltaPct ?? null,
      };
    });
    if (period === "mom") {
      entries.sort((a, b) => {
        const da = Math.abs(a.momDeltaRatio ?? 0);
        const db = Math.abs(b.momDeltaRatio ?? 0);
        if (db !== da) return db - da;
        return b.revenue - a.revenue;
      });
    } else {
      entries.sort((a, b) => b.revenue - a.revenue);
    }
    return entries;
  }, [publisherTotals, momMap, period]);

  const stackData = useMemo(
    () =>
      monthlyTotals.map((m) => {
        const ss = m.smartScrollViews ?? 0;
        return {
          label: m.label.slice(0, 3) + " " + String(m.year).slice(2),
          affiliate: m.affiliateRev,
          email: m.emailRev,
          kvp: m.kvpRev,
          video: m.videoRev,
          native: m.nativeRev,
          rpm: m.totalPVs > 0 ? (m.totalRev / m.totalPVs) * 1000 : 0,
          viewableRpm: ss > 0 ? (m.totalRev / ss) * 1000 : 0,
        };
      }),
    [monthlyTotals]
  );

  const selectedRow = publisherTotals.find((p) => p.publisher === selectedPub);

  const weeklyForPub = useMemo(() => {
    if (!selectedPub) return [];
    return weeklyByPub
      .filter((w) => w.publisher.trim().toLowerCase() === selectedPub.trim().toLowerCase())
      .sort((a, b) => a.weekStart.localeCompare(b.weekStart))
      .slice(-12);
  }, [weeklyByPub, selectedPub]);

  const pubRevSpark = weeklyForPub.map((w) => ({
    date: w.weekStart.slice(5),
    value: w.totalRevenue,
  }));
  const pubRpmSpark = weeklyForPub.map((w) => ({
    date: w.weekStart.slice(5),
    value: w.rpm,
  }));
  const pubVrpmSpark = weeklyForPub.map((w) => ({
    date: w.weekStart.slice(5),
    value: w.vrpm,
  }));

  const handleCopyPubLink = useCallback(async () => {
    if (typeof window === "undefined" || !selectedPub) return;
    try {
      await navigator.clipboard.writeText(
        absoluteCroPublisherUrl(window.location.origin, selectedPub)
      );
      setCopyHint("Copied link");
      window.setTimeout(() => setCopyHint(null), 2000);
    } catch {
      setCopyHint("Could not copy");
      window.setTimeout(() => setCopyHint(null), 2000);
    }
  }, [selectedPub]);

  const croDrillModalOpen = isCroRoute && selectedRow != null && selectedPub != null;

  useEffect(() => {
    if (!croDrillModalOpen) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") applyPublisherSelection(null);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [croDrillModalOpen, applyPublisherSelection]);

  useEffect(() => {
    if (!croDrillModalOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [croDrillModalOpen]);

  if (error) {
    return (
      <div className="rounded-xl border border-red-500/40 bg-red-950/30 p-6 text-red-200">
        {error}
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <DashboardSectionHeader
          title="Revenue & growth"
          subtitle={
            meta?.latestMonthLabel
              ? `${meta.latestMonthLabel} · publisher revenue, mix, and yield`
              : "Publisher revenue breakdown and trends"
          }
        />
        <div className="flex rounded-lg border border-zinc-700 p-0.5 gap-0.5">
          {(["rev", "mom"] as const).map((key) => (
            <button
              key={key}
              type="button"
              onClick={() => setPeriod(key)}
              className={cn(
                "px-3 py-1.5 text-xs font-semibold rounded-md transition-colors",
                period === key
                  ? "bg-zinc-100 text-zinc-900"
                  : "text-zinc-400 hover:text-zinc-200"
              )}
            >
              {key === "rev" ? "By total revenue" : "By MoM change"}
            </button>
          ))}
        </div>
      </div>

      <KpiHeroCard
        label="Gross network total (latest month)"
        value={formatCurrency(totals?.totalRevenue ?? 0)}
        delta={momRevPts}
        deltaLabel="MoM"
        size="lg"
        icon={DollarSign}
        spotlight
        extra={
          meta?.latestMonthLabel ? (
            <p className="mt-2 text-[11px] text-zinc-500">{meta.latestMonthLabel}</p>
          ) : null
        }
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        <KpiHeroCard
          label="Blended RPM"
          value={formatCurrency(totals?.totalRpm ?? 0)}
          delta={pctFromRatio(cmp?.momTotalRpmDeltaPct)}
          deltaLabel="MoM"
          size="md"
          icon={BarChart3}
          extra={
            <p className="mt-1.5 text-[11px] text-zinc-500">Per 1k pageviews</p>
          }
        />
        <KpiHeroCard
          label="Viewable RPM"
          value={formatCurrency(totals?.totalVrpm ?? 0)}
          delta={pctFromRatio(cmp?.momTotalVrpmDeltaPct)}
          deltaLabel="MoM"
          size="md"
          icon={ScanEye}
          extra={
            <p className="mt-1.5 text-[11px] text-zinc-500">Per 1k SS in-views</p>
          }
        />
        <KpiHeroCard
          label="Network pageviews"
          value={formatNumber(totals?.totalPVs ?? 0)}
          delta={pctFromRatio(cmp?.momTotalPvsDeltaPct)}
          deltaLabel="MoM"
          size="md"
          icon={Eye}
        />
      </div>

      <div
        className={cn(
          "grid grid-cols-1 gap-6",
          isCroRoute ? "lg:grid-cols-1" : "lg:grid-cols-5"
        )}
      >
        <section className={cn(!isCroRoute && "lg:col-span-3", "space-y-3")}>
          <div>
            <h3 className="text-sm font-semibold text-zinc-300 uppercase tracking-wider">
              Publisher leaderboard
            </h3>
            <p className="text-xs text-zinc-500 mt-1">
              Lifetime gross in the list; drill-down shows yield, channel mix, and weekly trends. Use
              the <span className="text-zinc-400">link icon</span> for a shareable publisher page
              (Slack, bookmarks).
              {isCroRoute ? (
                <>
                  {" "}
                  On this page, selecting a publisher opens a{" "}
                  <span className="text-zinc-400">focused overlay</span> so shared links stay easy to
                  read.
                </>
              ) : null}
            </p>
          </div>
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-4">
            <RevenueLeaderboard
              entries={leaderboardEntries}
              selectedName={selectedPub}
              shareHref={croPublisherDashboardHref}
              amountColumnLabel={period === "mom" ? "Month" : "Lifetime"}
              pctColumnLabel="MoM %"
              onSelect={(name) =>
                applyPublisherSelection(selectedPub === name ? null : name)
              }
            />
          </div>
        </section>

        {!isCroRoute ? (
          <section className="lg:col-span-2 space-y-3">
            <div>
              <h3 className="text-sm font-semibold text-zinc-300 uppercase tracking-wider">
                Publisher drill-down
              </h3>
              <p className="text-xs text-zinc-500 mt-1">
                Lifetime totals, channel mix, last 12 weeks of revenue and yield.
              </p>
            </div>
            {selectedRow && selectedPub ? (
              <CroPublisherDrilldownCard
                row={selectedRow}
                pubRevSpark={pubRevSpark}
                pubRpmSpark={pubRpmSpark}
                pubVrpmSpark={pubVrpmSpark}
                copyHint={copyHint}
                onDismiss={() => applyPublisherSelection(null)}
                onCopyLink={handleCopyPubLink}
              />
            ) : (
              <div className="rounded-xl border border-dashed border-zinc-800 bg-zinc-900/20 p-6 text-center space-y-2">
                <p className="text-sm text-zinc-500">Nothing selected yet</p>
                <p className="text-xs text-zinc-500 max-w-sm mx-auto leading-relaxed">
                  Choose a row in the leaderboard to see yield, channels, and 12-week trends.
                </p>
              </div>
            )}
          </section>
        ) : null}
      </div>

      {croDrillModalOpen && selectedRow && selectedPub ? (
        <div
          className="fixed inset-0 z-[100] flex items-start justify-center overflow-y-auto p-3 sm:p-6 sm:pt-12 sm:pb-16"
          role="presentation"
        >
          <button
            type="button"
            className="fixed inset-0 bg-zinc-950/85 backdrop-blur-[2px]"
            aria-label="Close publisher drill-down"
            onClick={() => applyPublisherSelection(null)}
          />
          <div
            className="relative z-10 mt-4 w-full max-w-2xl rounded-xl border border-zinc-600/80 bg-zinc-950 p-3 shadow-2xl ring-1 ring-white/10 sm:p-4 sm:pt-5"
            role="dialog"
            aria-modal="true"
            aria-labelledby="cro-drill-title"
          >
            <button
              type="button"
              onClick={() => applyPublisherSelection(null)}
              className="absolute right-2 top-2 z-20 rounded-lg p-2 text-zinc-400 hover:bg-zinc-800 hover:text-white"
              aria-label="Close"
            >
              <X className="h-5 w-5" />
            </button>
            <CroPublisherDrilldownCard
              row={selectedRow}
              pubRevSpark={pubRevSpark}
              pubRpmSpark={pubRpmSpark}
              pubVrpmSpark={pubVrpmSpark}
              copyHint={copyHint}
              onDismiss={() => applyPublisherSelection(null)}
              onCopyLink={handleCopyPubLink}
              showDismiss={false}
              className="border-cyan-500/40 bg-zinc-900/70 pr-10 sm:pr-12"
            />
          </div>
        </div>
      ) : null}

      <section className="space-y-3">
        <h3 className="text-sm font-semibold text-zinc-300 uppercase tracking-wider">
          Revenue mix over time
        </h3>
        <p className="text-xs text-zinc-500">
          Stacked revenue by channel; blended and viewable RPM on the right axis.
        </p>
        <div className="h-72 w-full rounded-xl border border-zinc-800 bg-zinc-900/40 p-2">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={stackData} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
              <XAxis dataKey="label" tick={{ fill: "#71717a", fontSize: 11 }} />
              <YAxis
                yAxisId="left"
                tick={{ fill: "#71717a", fontSize: 11 }}
                tickFormatter={(v) => formatCurrencyFull(Number(v))}
                width={72}
              />
              <YAxis
                yAxisId="right"
                orientation="right"
                tick={{ fill: "#71717a", fontSize: 11 }}
                tickFormatter={(v) => formatCurrencyFull(Number(v))}
                width={56}
              />
              <Tooltip
                contentStyle={{
                  background: "#18181b",
                  border: "1px solid #3f3f46",
                  borderRadius: 8,
                  fontSize: 12,
                }}
                formatter={(value, name) => [
                  formatCurrencyFull(Number(value)),
                  String(name),
                ]}
              />
              <Legend />
              <Area
                yAxisId="left"
                type="monotone"
                dataKey="affiliate"
                stackId="a"
                fill="#10b981"
                stroke="#059669"
                name="Affiliate"
              />
              <Area
                yAxisId="left"
                type="monotone"
                dataKey="email"
                stackId="a"
                fill="#22c55e"
                stroke="#16a34a"
                name="Email"
              />
              <Area
                yAxisId="left"
                type="monotone"
                dataKey="kvp"
                stackId="a"
                fill="#06b6d4"
                stroke="#0891b2"
                name="KVP"
              />
              <Area
                yAxisId="left"
                type="monotone"
                dataKey="video"
                stackId="a"
                fill="#a78bfa"
                stroke="#7c3aed"
                name="Video"
              />
              <Area
                yAxisId="left"
                type="monotone"
                dataKey="native"
                stackId="a"
                fill="#fb923c"
                stroke="#ea580c"
                name="Native"
              />
              <Line
                yAxisId="right"
                type="monotone"
                dataKey="rpm"
                stroke="#f4f4f5"
                strokeWidth={2}
                dot={false}
                name="Blended RPM"
              />
              <Line
                yAxisId="right"
                type="monotone"
                dataKey="viewableRpm"
                stroke="#34d399"
                strokeWidth={2}
                dot={false}
                name="Viewable RPM"
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </section>
    </div>
  );
}

export function CroPersonaPanel() {
  return (
    <Suspense
      fallback={
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 px-4 py-12 text-center text-sm text-zinc-500">
          Loading revenue view…
        </div>
      }
    >
      <CroPersonaPanelInner />
    </Suspense>
  );
}
