"use client";

import {
  RevenueLeaderboard,
  type LeaderboardEntry,
} from "@/components/dashboard/RevenueLeaderboard";
import { PublisherQuickViewModal } from "@/components/dashboard/PublisherQuickViewModal";
import { slugifyPublisherName } from "@/lib/publishers";
import { useCallback, useEffect, useState } from "react";

type ApiPublisher = {
  name: string;
  slug: string;
  lifetimeRev: number;
  momDeltaRatio: number | null;
};

export function On3PublisherLeaderboard({
  currentPublisherName,
  /** When set (e.g. embedded home), row opens this instead of an internal modal so one overlay can host the app. */
  onRequestPublisherQuickView,
  /** Home: compact site list without $ / MoM columns; per-publisher page: full CRO-style board. */
  listVariant = "full",
}: {
  currentPublisherName?: string | null;
  onRequestPublisherQuickView?: (slug: string) => void;
  listVariant?: "full" | "sitesOnly";
}) {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [modalSlug, setModalSlug] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function run() {
      setLoading(true);
      setErr(null);
      try {
        const r = await fetch("/api/publishers/leaderboard", { cache: "no-store" });
        const j = (await r.json()) as { publishers?: ApiPublisher[]; error?: string };
        if (!r.ok) throw new Error(j.error || `Request failed (${r.status})`);
        const list: LeaderboardEntry[] = (j.publishers ?? []).map((p) => ({
          name: p.name,
          slug: p.slug,
          revenue: p.lifetimeRev,
          momDeltaRatio: p.momDeltaRatio,
        }));
        if (!cancelled) setEntries(list);
      } catch (e) {
        if (!cancelled) setErr(e instanceof Error ? e.message : String(e));
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    run();
    return () => {
      cancelled = true;
    };
  }, []);

  const shareHref = useCallback(
    (name: string) => {
      const ent = entries.find((e) => e.name === name);
      const slugPart = ent?.slug ?? slugifyPublisherName(name);
      return `/p/${encodeURIComponent(slugPart)}`;
    },
    [entries]
  );

  const onSelect = useCallback(
    (name: string) => {
      const ent = entries.find((e) => e.name === name);
      const s = ent?.slug ?? slugifyPublisherName(name);
      if (onRequestPublisherQuickView) {
        onRequestPublisherQuickView(s);
        return;
      }
      setModalSlug(s);
    },
    [entries, onRequestPublisherQuickView]
  );

  const sitesOnly = listVariant === "sitesOnly";

  return (
    <section className="max-w-[90rem]">
      {sitesOnly ? (
        <div className="overflow-hidden rounded-2xl border border-zinc-800/60 bg-gradient-to-b from-zinc-950/95 to-zinc-950/55 shadow-2xl shadow-black/40 ring-1 ring-zinc-800/35">
          <div className="border-b border-zinc-800/50 bg-zinc-900/35 px-5 py-3.5 sm:px-6">
            <h2 className="text-[11px] font-semibold uppercase tracking-[0.2em] text-zinc-400">
              On3 sites
            </h2>
          </div>
          <div className="p-4 sm:p-5">
            {loading ? (
              <p className="py-8 text-center text-sm text-zinc-500">Loading…</p>
            ) : err ? (
              <p className="py-2 text-sm text-red-400">{err}</p>
            ) : (
              <RevenueLeaderboard
                entries={entries}
                maxBars={24}
                selectedName={currentPublisherName ?? undefined}
                onSelect={onSelect}
                shareHref={shareHref}
                variant="sitesOnly"
                shareOpenInNewTab={false}
              />
            )}
          </div>
        </div>
      ) : (
        <>
          <div className="mb-3 space-y-1">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
              Publisher leaderboard
            </h2>
          </div>
          <div className="rounded-2xl border border-zinc-800/90 bg-zinc-950/40 p-4 sm:p-5 ring-1 ring-zinc-800/50">
            {loading ? (
              <p className="py-6 text-sm text-zinc-500">Loading leaderboard…</p>
            ) : err ? (
              <p className="py-2 text-sm text-red-400">{err}</p>
            ) : (
              <RevenueLeaderboard
                entries={entries}
                maxBars={24}
                selectedName={currentPublisherName ?? undefined}
                onSelect={onSelect}
                shareHref={shareHref}
                variant="full"
                shareOpenInNewTab
                amountColumnLabel="Lifetime"
                pctColumnLabel="MoM %"
              />
            )}
          </div>
        </>
      )}
      {onRequestPublisherQuickView ? null : (
        <PublisherQuickViewModal
          slug={modalSlug}
          open={modalSlug !== null}
          onClose={() => setModalSlug(null)}
        />
      )}
    </section>
  );
}

