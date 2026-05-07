"use client";

import { StatusBadge } from "@/components/dashboard/StatusBadge";
import { useDashboardLive } from "@/lib/dashboard-data-context";
import { networkHealthFromQa } from "@/lib/persona-metrics";

/** CEO rollup QA summary + link to COO QA detail; render at page bottom with Data QA. */
export function PersonaQaCeoStrip({ href = "/dashboard/coo#qa-detail" }: { href?: string }) {
  const { data } = useDashboardLive();
  const qa = data?.qa;
  const health = networkHealthFromQa(qa);
  const healthLabel =
    health === "healthy"
      ? "All checks pass"
      : health === "warning"
        ? "Review needed"
        : "Critical issues";

  return (
    <div className="flex flex-wrap items-center gap-4 rounded-xl border border-zinc-800 bg-zinc-900/30 px-4 py-3">
      <StatusBadge status={health} label={healthLabel} href={href} />
      <p className="text-xs text-zinc-500">
        {qa?.summary
          ? `${qa.summary.passCount} pass · ${qa.summary.warnCount} warn · ${qa.summary.failCount} fail`
          : "QA checks run on latest rollup month"}
      </p>
    </div>
  );
}
