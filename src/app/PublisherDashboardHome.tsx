"use client";

import { On3CombinedHomeBody } from "@/components/dashboard/On3CombinedHomeBody";
import { PublisherQuickViewModal } from "@/components/dashboard/PublisherQuickViewModal";
import { useState } from "react";

export function PublisherDashboardHome() {
  const [quickViewSlug, setQuickViewSlug] = useState<string | null>(null);

  return (
    <div className="min-h-screen bg-zinc-900">
      <header className="sticky top-0 z-50 border-b border-zinc-800/80 bg-zinc-900/85 backdrop-blur-xl">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex min-h-16 flex-col gap-2 py-4 sm:flex-row sm:items-center sm:justify-between sm:gap-6 sm:py-3">
            <div className="min-w-0">
              <div className="flex items-baseline gap-2">
                <span className="text-sm font-semibold tracking-tight text-gradient">
                  On3.com
                </span>
                <h1 className="text-lg font-bold tracking-tight text-white">
                  Publisher network
                </h1>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
        <section className="space-y-4">
          <div className="rounded-2xl border border-zinc-800 bg-gradient-to-br from-zinc-950/40 via-zinc-900/30 to-zinc-950/50 p-4 shadow-xl shadow-black/20 ring-1 ring-zinc-800 sm:p-6">
            <On3CombinedHomeBody onRequestPublisherQuickView={(s) => setQuickViewSlug(s)} />
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
