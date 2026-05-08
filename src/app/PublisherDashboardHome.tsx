"use client";

import { On3CombinedHomeBody } from "@/components/dashboard/On3CombinedHomeBody";
import {
  On3DashboardHeaderChrome,
  useOn3Summary,
} from "@/components/dashboard/On3PublisherDashboard";
import { PublisherQuickViewModal } from "@/components/dashboard/PublisherQuickViewModal";
import { useState } from "react";

export function PublisherDashboardHome() {
  const [quickViewSlug, setQuickViewSlug] = useState<string | null>(null);
  const summary = useOn3Summary(22);
  const hasData = summary.data?.current != null;

  return (
    <div className="min-h-screen bg-zinc-900">
      <header className="sticky top-0 z-50 border-b border-zinc-800/70 bg-[#111418]/95 backdrop-blur-xl">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex min-h-16 flex-col gap-3 py-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
            <div className="flex items-baseline gap-2">
              <span className="text-[15px] font-extrabold tracking-tight text-white">On3</span>
              <span className="text-[10px] font-semibold uppercase tracking-[0.22em] text-zinc-500">
                Publisher dashboard
              </span>
            </div>
            <On3DashboardHeaderChrome
              days={summary.days}
              setDays={summary.setDays}
              rangeLabel={summary.data?.rangeLabel}
              loading={summary.loading}
              hasData={hasData}
            />
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
        <section className="space-y-4">
          <div className="rounded-2xl border border-zinc-800 bg-gradient-to-br from-zinc-950/40 via-zinc-900/30 to-zinc-950/50 p-4 shadow-xl shadow-black/20 ring-1 ring-zinc-800 sm:p-6">
            <On3CombinedHomeBody
              summary={summary}
              onRequestPublisherQuickView={(s) => setQuickViewSlug(s)}
            />
          </div>
        </section>
      </main>

      <PublisherQuickViewModal
        slug={quickViewSlug}
        open={quickViewSlug !== null}
        onClose={() => setQuickViewSlug(null)}
      />
    </div>
  );
}
