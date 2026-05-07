"use client";

import { PenskeAllTimeKpiTiles } from "@/components/dashboard/PenskeAllTimeKpiTiles";
import { PenskePublisherLeaderboard } from "@/components/dashboard/PenskePublisherLeaderboard";
import Link from "next/link";
import { useEffect, useState } from "react";

type PublisherApiResponse = {
  publisher: string;
  slug: string;
  lastUpdated: string;
  weekly: Array<{
    weekStart: string;
    weekLabel?: string;
    totalRev: number;
    totalPVs: number;
    sessions: number;
    widgetLoads: number;
    smartScrollViews: number;
    kvpImpressions?: number;
    totalClicks?: number;
    nextpageClicks?: number;
    affiliateClicks?: number;
    affiliateCtr?: number;
    affiliateEpc?: number;
    nextArtCtr?: number;
    affiliateRev: number;
    emailRev: number;
    kvpRev: number;
    kvpRevEst: number;
    videoRev: number;
    nativeRev: number;
    totalRpm: number;
    totalVrpm: number;
  }>;
  kpis: null | {
    period: { weekStart: string; weekLabel?: string; throughWeek?: string };
    totals: {
      totalRev: number;
      totalPVs: number;
      sessions: number;
      rpm: number;
      vrpm: number;
      widgetLoads: number;
      smartScrollViews: number;
      totalClicks: number;
      nextpageClicks: number;
      commerceClicks: number;
      incrementalImpressions: number;
      affiliateCtr: number;
      affiliateEpc: number;
      articleCtr: number;
    };
    wow: null;
  };
};

export function PublisherPageClient({
  slug,
  embedded = false,
  onRequestPublisherQuickView,
}: {
  slug: string;
  embedded?: boolean;
  /** Embedded home: delegate leaderboard row quick-view to parent (single modal). */
  onRequestPublisherQuickView?: (slug: string) => void;
}) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<PublisherApiResponse | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function run() {
      setLoading(true);
      setError(null);
      try {
        const resp = await fetch(`/api/publisher/${encodeURIComponent(slug)}`, {
          cache: "no-store",
        });
        const json = (await resp.json()) as unknown;
        if (!resp.ok) {
          const errMsg =
            typeof json === "object" && json !== null && "error" in json
              ? String((json as { error?: unknown }).error || "")
              : "";
          throw new Error(errMsg || `Request failed (${resp.status})`);
        }
        if (!cancelled) setData(json as PublisherApiResponse);
      } catch (e) {
        const message = e instanceof Error ? e.message : String(e);
        if (!cancelled) setError(message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    run();
    return () => {
      cancelled = true;
    };
  }, [slug]);

  if (loading && !data) {
    return (
      <div className="min-h-screen bg-zinc-900 flex flex-col items-center justify-center gap-3 text-zinc-400">
        <div className="h-8 w-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-sm">Loading publisher dashboard…</p>
      </div>
    );
  }

  if (error && !data) {
    return (
      <div className="min-h-screen bg-zinc-900 flex flex-col items-center justify-center gap-4 px-6 text-center">
        <p className="text-red-400 font-medium">Could not load publisher dashboard</p>
        <p className="text-zinc-500 text-sm max-w-md">{error}</p>
      </div>
    );
  }

  const kpis = data?.kpis;

  return (
    <div className={embedded ? "bg-transparent" : "min-h-screen bg-zinc-900"}>
      {embedded ? null : (
        <header className="sticky top-0 z-50 w-full border-b border-zinc-800 bg-zinc-900/80 backdrop-blur-xl">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <div>
              <h1 className="text-lg font-bold text-white tracking-tight">
                {data?.publisher ?? "Publisher"}
              </h1>
            </div>
            <Link
              href="/"
              className="text-sm text-zinc-400 hover:text-white transition-colors"
            >
              All publishers
            </Link>
          </div>
        </div>
      </header>
      )}

      <main className={embedded ? "space-y-8" : "container mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8"}>
        {kpis ? <PenskeAllTimeKpiTiles kpis={kpis} /> : null}
        {data ? (
          <PenskePublisherLeaderboard
            currentPublisherName={data.publisher}
            onRequestPublisherQuickView={onRequestPublisherQuickView}
          />
        ) : null}
      </main>
    </div>
  );
}
