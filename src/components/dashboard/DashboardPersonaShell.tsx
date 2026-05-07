"use client";

import { DashboardPersonaQaFooter } from "@/components/dashboard/DashboardPersonaQaFooter";
import { PersonaSwitcher, type PersonaId } from "@/components/dashboard/PersonaSwitcher";
import { useDashboardLive } from "@/lib/dashboard-data-context";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { LayoutDashboard, RefreshCw } from "lucide-react";

function personaFromPath(pathname: string | null): PersonaId {
  const seg = pathname?.split("/").filter(Boolean).pop();
  if (seg === "ceo" || seg === "coo" || seg === "cro" || seg === "cpo" || seg === "studio") {
    return seg;
  }
  return "ceo";
}

export function DashboardPersonaShell({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const persona = personaFromPath(pathname);
  const { data, loading, refetch } = useDashboardLive();

  const lastUpdatedStr = data?.lastUpdated
    ? new Date(data.lastUpdated).toLocaleString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "numeric",
        minute: "2-digit",
      })
    : null;

  return (
    <div className="min-h-screen flex flex-col">
      <header className="shrink-0 sticky top-0 z-40 border-b border-zinc-800/80 bg-zinc-900/95 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-4">
            <Link
              href="/"
              className="flex items-center gap-2 text-zinc-300 hover:text-white transition-colors shrink-0"
            >
              <div className="p-1.5 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-lg">
                <LayoutDashboard className="w-4 h-4 text-white" />
              </div>
              <span className="text-sm font-semibold hidden sm:inline">Penske</span>
            </Link>
            <PersonaSwitcher currentPersona={persona} />
          </div>
          <div className="flex items-center gap-3">
            {loading && (
              <div className="flex items-center gap-1.5">
                <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                <span className="text-xs text-zinc-500">Loading…</span>
              </div>
            )}
            {!loading && lastUpdatedStr && (
              <button
                type="button"
                onClick={() => refetch()}
                className="flex items-center gap-1.5 text-xs text-zinc-500 hover:text-zinc-300 transition-colors"
              >
                <RefreshCw className="w-3 h-3" />
                {lastUpdatedStr}
              </button>
            )}
          </div>
        </div>
      </header>
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6">
        {loading && !data ? (
          <DashboardSkeleton />
        ) : (
          <>
            {children}
            <DashboardPersonaQaFooter persona={persona} />
          </>
        )}
      </main>
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="h-6 w-32 bg-zinc-800 rounded" />
      <div className="h-4 w-64 bg-zinc-800/60 rounded" />
      <div className="h-32 bg-zinc-800/40 rounded-2xl" />
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="h-24 bg-zinc-800/40 rounded-2xl" />
        <div className="h-24 bg-zinc-800/40 rounded-2xl" />
        <div className="h-24 bg-zinc-800/40 rounded-2xl" />
      </div>
      <div className="h-48 bg-zinc-800/30 rounded-xl" />
    </div>
  );
}
