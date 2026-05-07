"use client";

import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";

interface KPICardProps {
  title: string;
  value: string;
  /** Percentage points (e.g. 12.3 for +12.3%). Omit when no prior period to compare. */
  change?: number | null;
  changeLabel?: string;
  icon: LucideIcon;
  variant?: "default" | "success" | "warning" | "info";
  className?: string;
}

export function KPICard({
  title,
  value,
  change,
  changeLabel,
  icon: Icon,
  variant = "default",
  className,
}: KPICardProps) {
  const hasChange = change != null && Number.isFinite(change);
  const isPositive = hasChange && change >= 0;

  const variantStyles = {
    default: "from-zinc-800/50 to-zinc-900/50 border-zinc-700/50",
    success: "from-emerald-950/50 to-emerald-900/30 border-emerald-700/30",
    warning: "from-amber-950/50 to-amber-900/30 border-amber-700/30",
    info: "from-cyan-950/50 to-cyan-900/30 border-cyan-700/30",
  };

  const iconStyles = {
    default: "bg-zinc-800 text-zinc-300",
    success: "bg-emerald-900/50 text-emerald-400",
    warning: "bg-amber-900/50 text-amber-400",
    info: "bg-cyan-900/50 text-cyan-400",
  };

  return (
    <Card
      className={cn(
        "relative overflow-hidden p-6 bg-gradient-to-br border transition-all duration-300 hover:scale-[1.02] hover:shadow-lg hover:shadow-emerald-900/10",
        variantStyles[variant],
        className
      )}
    >
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <p className="text-sm font-medium text-zinc-400 uppercase tracking-wider">
            {title}
          </p>
          <p className="text-3xl font-bold tracking-tight text-white">
            {value}
          </p>
          {hasChange && (
            <div className="flex items-center gap-1.5 flex-wrap">
              <span
                className={cn(
                  "text-sm font-semibold",
                  isPositive ? "text-emerald-400" : "text-red-400"
                )}
              >
                {isPositive ? "+" : ""}
                {change.toFixed(1)}%
              </span>
              {changeLabel && (
                <span className="text-xs text-zinc-500">{changeLabel}</span>
              )}
            </div>
          )}
        </div>
        <div className={cn("p-3 rounded-xl", iconStyles[variant])}>
          <Icon className="w-6 h-6" />
        </div>
      </div>

      {/* Subtle glow effect */}
      <div className="absolute -bottom-4 -right-4 w-24 h-24 bg-gradient-to-br from-emerald-500/10 to-transparent rounded-full blur-2xl" />
    </Card>
  );
}
