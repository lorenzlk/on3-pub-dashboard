"use client";

import { formatCurrency } from "@/lib/data";
import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";
import { useEffect, useState } from "react";

export function KpiHeroCard({
  label,
  value,
  delta,
  deltaLabel,
  size = "md",
  animateValue,
  icon: Icon,
  className,
  extra,
  /** Softer emerald wash + top highlight — use for primary gross / headline KPI only. */
  spotlight = false,
}: {
  label: string;
  value: string;
  delta?: number | null;
  deltaLabel?: string;
  size?: "lg" | "md" | "sm";
  animateValue?: number;
  icon?: LucideIcon;
  className?: string;
  extra?: React.ReactNode;
  spotlight?: boolean;
}) {
  const [display, setDisplay] = useState(animateValue != null ? 0 : null);

  useEffect(() => {
    if (animateValue == null || !Number.isFinite(animateValue)) return;
    const target = animateValue;
    const duration = 900;
    const t0 = performance.now();
    let raf = 0;
    const tick = (now: number) => {
      const t = Math.min(1, (now - t0) / duration);
      const eased = 1 - (1 - t) ** 3;
      setDisplay(target * eased);
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [animateValue]);

  const hasDelta = delta != null && Number.isFinite(delta);
  const positive = hasDelta && (delta as number) >= 0;

  const sizeCls = {
    lg: "text-4xl sm:text-5xl",
    md: "text-2xl sm:text-3xl",
    sm: "text-xl sm:text-2xl",
  };

  const shownValue = display != null ? formatCurrency(display) : value;

  return (
    <div
      className={cn(
        "relative rounded-2xl p-5 sm:p-6 shadow-lg shadow-black/20 overflow-hidden",
        spotlight
          ? "border border-emerald-500/15 ring-1 ring-emerald-500/10 bg-gradient-to-br from-emerald-950/40 via-zinc-900/95 to-zinc-950"
          : "border border-zinc-800 bg-gradient-to-br from-zinc-900/90 to-zinc-900",
        className
      )}
    >
      {spotlight ? (
        <>
          <div
            className="pointer-events-none absolute inset-x-6 top-0 h-px bg-gradient-to-r from-transparent via-emerald-400/45 to-transparent"
            aria-hidden
          />
          <div
            className="pointer-events-none absolute -right-16 -top-24 h-48 w-48 rounded-full bg-emerald-500/[0.07] blur-3xl"
            aria-hidden
          />
        </>
      ) : null}
      <div className="relative flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p
            className={cn(
              "text-[10px] sm:text-xs font-semibold uppercase tracking-wider mb-2",
              spotlight ? "text-emerald-500/85" : "text-zinc-500"
            )}
          >
            {label}
          </p>
          <p
            className={cn(
              "font-bold tracking-tight text-white tabular-nums",
              sizeCls[size]
            )}
          >
            {shownValue}
          </p>
          {hasDelta && (
            <p className="mt-2 text-sm">
              <span
                className={cn(
                  "font-semibold",
                  positive ? "text-emerald-400" : "text-red-400"
                )}
              >
                {positive ? "▲" : "▼"} {Math.abs(delta as number).toFixed(1)}%
              </span>
              {deltaLabel ? (
                <span className="text-zinc-500 text-xs ml-2">{deltaLabel}</span>
              ) : null}
            </p>
          )}
          {extra}
        </div>
        {Icon && (
          <div
            className={cn(
              "p-2.5 rounded-xl shrink-0",
              spotlight
                ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/20"
                : "bg-zinc-800/60 text-zinc-400"
            )}
          >
            <Icon className="w-5 h-5" />
          </div>
        )}
      </div>
    </div>
  );
}
