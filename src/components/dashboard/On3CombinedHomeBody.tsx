"use client";

import {
  On3AllTimeKpiTiles,
  type On3AllTimeKpis,
} from "@/components/dashboard/On3AllTimeKpiTiles";
import { On3PublisherLeaderboard } from "@/components/dashboard/On3PublisherLeaderboard";
import { useEffect, useState } from "react";

type CombinedApiResponse = {
  publisher: string;
  slug: string;
  lastUpdated: string;
  kpis: On3AllTimeKpis | null;
  error?: string;
};

export function On3CombinedHomeBody({
  onRequestPublisherQuickView,
}: {
  onRequestPublisherQuickView: (slug: string) => void;
}) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [kpis, setKpis] = useState<On3AllTimeKpis | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function run() {
      setLoading(true);
      setError(null);
      try {
        const resp = await fetch("/api/on3/all-time", { cache: "no-store" });
        const json = (await resp.json()) as CombinedApiResponse;
        if (!resp.ok) {
          throw new Error(json.error || `Request failed (${resp.status})`);
        }
        if (!cancelled) setKpis(json.kpis);
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : String(e));
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    run();
    return () => {
      cancelled = true;
    };
  }, []);

  if (loading && !kpis) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-16 text-zinc-400">
        <div className="h-8 w-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        <p className="text-sm">Loading combined On3 metrics…</p>
      </div>
    );
  }

  if (error && !kpis) {
    return (
      <div className="space-y-2 py-8 text-center">
        <p className="text-red-400 font-medium text-sm">Could not load combined metrics</p>
        <p className="text-zinc-500 text-xs max-w-md mx-auto">{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {kpis ? <On3AllTimeKpiTiles kpis={kpis} /> : null}
      <On3PublisherLeaderboard
        listVariant="sitesOnly"
        onRequestPublisherQuickView={onRequestPublisherQuickView}
      />
    </div>
  );
}

