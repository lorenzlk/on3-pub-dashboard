"use client";

import { formatCurrency, formatNumber, formatPercentChart } from "@/lib/data";
import Link from "next/link";
import { Copy, ExternalLink, X } from "lucide-react";
import type { ReactNode } from "react";
import { useCallback, useEffect, useState } from "react";

type QuickViewPayload = {
  publisher: string;
  slug: string;
  kpis: null | {
    period: { weekLabel?: string; weekStart?: string; throughWeek?: string };
    totals: {
      totalRev: number;
      totalPVs: number;
      sessions: number;
      rpm: number;
      vrpm: number;
      widgetLoads: number;
      smartScrollViews: number;
      commerceClicks: number;
      incrementalImpressions: number;
      affiliateCtr: number;
      articleCtr: number;
    };
  };
  weekly: Array<{
    totalRev: number;
    affiliateRev: number;
    emailRev: number;
    kvpRev: number;
    videoRev: number;
    nativeRev: number;
  }>;
};

function StatBlock({
  label,
  value,
  valueClassName = "text-white",
}: {
  label: string;
  value: ReactNode;
  valueClassName?: string;
}) {
  return (
    <div className="rounded-xl border border-zinc-800/90 bg-zinc-900/60 p-4 sm:p-5">
      <p className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500">{label}</p>
      <p className={`mt-2 text-2xl font-semibold tracking-tight tabular-nums sm:text-3xl ${valueClassName}`}>
        {value}
      </p>
    </div>
  );
}

export function PublisherQuickViewModal({
  slug,
  open,
  onClose,
}: {
  slug: string | null;
  open: boolean;
  onClose: () => void;
}) {
  const [data, setData] = useState<QuickViewPayload | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copyHint, setCopyHint] = useState<string | null>(null);

  useEffect(() => {
    if (!open || !slug) {
      setData(null);
      setError(null);
      return;
    }
    const publisherSlug = slug;
    let cancelled = false;
    async function run() {
      setLoading(true);
      setError(null);
      try {
        const r = await fetch(`/api/publisher/${encodeURIComponent(publisherSlug)}`, {
          cache: "no-store",
        });
        const j = (await r.json()) as unknown;
        if (!r.ok) {
          const msg =
            typeof j === "object" && j !== null && "error" in j
              ? String((j as { error?: unknown }).error)
              : String(r.status);
          throw new Error(msg);
        }
        if (!cancelled) setData(j as QuickViewPayload);
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
  }, [open, slug]);

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);

  const handleCopy = useCallback(async () => {
    if (!slug || typeof window === "undefined") return;
    const url = `${window.location.origin}/p/${encodeURIComponent(slug)}`;
    try {
      await navigator.clipboard.writeText(url);
      setCopyHint("Link copied");
      window.setTimeout(() => setCopyHint(null), 2000);
    } catch {
      setCopyHint("Could not copy");
      window.setTimeout(() => setCopyHint(null), 2000);
    }
  }, [slug]);

  if (!open || !slug) return null;

  const k = data?.kpis?.totals;

  return (
    <div
      className="fixed inset-0 z-[60] flex items-start justify-center overflow-y-auto bg-black/70 px-4 py-10 backdrop-blur-sm sm:py-16"
      role="dialog"
      aria-modal="true"
      aria-labelledby="publisher-quick-view-title"
    >
      <button
        type="button"
        className="absolute inset-0 cursor-default"
        aria-label="Close"
        onClick={onClose}
      />
      <div
        className="relative z-10 w-full max-w-3xl rounded-2xl border border-zinc-700/90 bg-zinc-950 shadow-2xl ring-1 ring-zinc-700/40"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="flex items-start justify-between gap-4 border-b border-zinc-800/90 px-5 py-4 sm:px-6 sm:py-5">
          <div className="min-w-0">
            <h2
              id="publisher-quick-view-title"
              className="truncate text-xl font-bold tracking-tight text-white sm:text-2xl"
            >
              {loading ? "Loading…" : data?.publisher ?? slug}
            </h2>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <button
              type="button"
              onClick={handleCopy}
              className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-xs font-medium text-zinc-200 transition-colors hover:border-zinc-600 hover:bg-zinc-800 hover:text-white"
            >
              <Copy className="h-3.5 w-3.5" strokeWidth={2} aria-hidden />
              Copy page link
            </button>
            <Link
              href={`/p/${encodeURIComponent(slug)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-xs font-medium text-zinc-200 transition-colors hover:border-zinc-600 hover:bg-zinc-800 hover:text-white"
            >
              <ExternalLink className="h-3.5 w-3.5" strokeWidth={2} aria-hidden />
              Full page
            </Link>
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-zinc-700 p-2 text-zinc-400 transition-colors hover:border-zinc-600 hover:bg-zinc-900 hover:text-white"
              aria-label="Close"
            >
              <X className="h-5 w-5" strokeWidth={2} />
            </button>
          </div>
        </header>

        {copyHint ? (
          <p className="border-b border-zinc-800/80 bg-emerald-950/30 px-5 py-2 text-center text-xs text-emerald-300 sm:px-6">
            {copyHint}
          </p>
        ) : null}

        <div className="space-y-8 px-5 py-6 sm:px-6 sm:py-8">
          {error ? (
            <p className="text-sm text-red-400">{error}</p>
          ) : loading || !k ? (
            <p className="text-sm text-zinc-500">Loading metrics…</p>
          ) : (
            <>
              <section className="space-y-3">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Revenue</h3>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-1">
                  <StatBlock label="Gross revenue (lifetime)" value={formatCurrency(k.totalRev)} />
                </div>
              </section>

              <section className="space-y-3">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
                  Traffic & inventory
                </h3>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
                  <StatBlock label="Views" value={formatNumber(k.totalPVs)} />
                  <StatBlock label="In views" value={formatNumber(k.smartScrollViews)} />
                  <StatBlock label="Sessions" value={formatNumber(k.sessions)} />
                  <StatBlock label="Widget loads" value={formatNumber(k.widgetLoads)} />
                  <StatBlock label="Incremental impressions" value={formatNumber(k.incrementalImpressions)} />
                </div>
              </section>

              <section className="space-y-3">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Yield</h3>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-1">
                  <StatBlock label="Viewable RPM" value={formatCurrency(k.vrpm)} />
                </div>
              </section>

              <section className="space-y-3">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
                  Commerce & article
                </h3>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                  <StatBlock label="Commerce clicks" value={formatNumber(k.commerceClicks)} />
                  <StatBlock label="Affiliate CTR" value={formatPercentChart(k.affiliateCtr, 2)} />
                  <StatBlock label="Article CTR" value={formatPercentChart(k.articleCtr, 2)} />
                </div>
              </section>

              <div className="flex flex-wrap justify-end gap-3 border-t border-zinc-800/90 pt-6">
                <button
                  type="button"
                  onClick={onClose}
                  className="rounded-xl border border-zinc-700 px-4 py-2.5 text-sm font-medium text-zinc-300 hover:bg-zinc-900"
                >
                  Close
                </button>
                <Link
                  href={`/p/${encodeURIComponent(slug)}`}
                  onClick={onClose}
                  className="rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-500"
                >
                  Open full dashboard
                </Link>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
