"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";
import { CheckCircle2, AlertTriangle, XCircle } from "lucide-react";
import type { NetworkHealth } from "@/lib/persona-metrics";

export function StatusBadge({
  status,
  label,
  href,
  className,
}: {
  status: NetworkHealth;
  label: string;
  href?: string;
  className?: string;
}) {
  const Icon =
    status === "healthy"
      ? CheckCircle2
      : status === "warning"
        ? AlertTriangle
        : XCircle;
  const colors = {
    healthy: "text-emerald-400 border-emerald-500/40 bg-emerald-950/30",
    warning: "text-amber-400 border-amber-500/40 bg-amber-950/30",
    critical: "text-red-400 border-red-500/40 bg-red-950/30",
  };

  const inner = (
    <div
      className={cn(
        "inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-sm font-medium",
        colors[status],
        href && "cursor-pointer hover:opacity-90 transition-opacity",
        className
      )}
    >
      <Icon className="w-4 h-4 shrink-0" aria-hidden />
      <span>{label}</span>
    </div>
  );

  if (href) {
    return (
      <Link href={href} className="inline-block">
        {inner}
      </Link>
    );
  }
  return inner;
}
