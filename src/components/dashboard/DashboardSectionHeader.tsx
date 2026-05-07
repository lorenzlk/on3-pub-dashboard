import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

/** Vertical accent + title block for dashboard sections. */
export function DashboardSectionHeader({
  title,
  subtitle,
  titleClassName = "text-xl font-bold text-white tracking-tight",
  accent = "emerald",
}: {
  title: string;
  subtitle?: ReactNode;
  titleClassName?: string;
  accent?: "emerald" | "cyan";
}) {
  const bar =
    accent === "cyan"
      ? "from-cyan-400/90 via-teal-500/50 to-emerald-600/35"
      : "from-emerald-400/90 via-teal-500/60 to-cyan-600/40";

  return (
    <div className="flex gap-3 items-start min-w-0">
      <div
        className={cn("mt-1 w-1 shrink-0 rounded-full h-9 sm:h-10 bg-gradient-to-b", bar)}
        aria-hidden
      />
      <div className="min-w-0 flex-1">
        <h2 className={titleClassName}>{title}</h2>
        {subtitle ? <div className="mt-1 text-sm text-zinc-500">{subtitle}</div> : null}
      </div>
    </div>
  );
}
