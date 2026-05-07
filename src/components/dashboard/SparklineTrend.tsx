"use client";

import { cn } from "@/lib/utils";
import { formatChartCount, formatCurrencyFull } from "@/lib/data";
import { useId } from "react";
import {
  Area,
  AreaChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

export function SparklineTrend({
  data,
  color = "#34d399",
  height = 96,
  valueLabel = "Value",
  formatAs = "currency",
  label,
  className,
}: {
  data: { date: string; value: number }[];
  color?: string;
  height?: number;
  valueLabel?: string;
  formatAs?: "currency" | "number" | "raw";
  label?: string;
  className?: string;
}) {
  const gradId = useId().replace(/:/g, "");

  const fmtValue = (v: number) => {
    if (formatAs === "currency") return formatCurrencyFull(v);
    if (formatAs === "number") return formatChartCount(v);
    return String(v);
  };

  if (!data.length) {
    return (
      <div
        className={cn(
          "flex flex-col items-center justify-center rounded-xl border border-dashed border-zinc-800 bg-zinc-900/20 text-zinc-500 text-sm gap-1",
          className
        )}
        style={{ minHeight: height }}
      >
        <span className="text-xs">No data yet</span>
        {label && <span className="text-[10px] text-zinc-700">{label}</span>}
      </div>
    );
  }

  const lastValue = data[data.length - 1]!.value;

  return (
    <div className={cn("w-full rounded-xl border border-zinc-800 bg-zinc-900/40 p-3", className)}>
      {label && (
        <div className="flex items-baseline justify-between mb-1">
          <p className="text-xs font-medium text-zinc-400">{label}</p>
          <p className="text-sm font-semibold text-zinc-200 tabular-nums">
            {fmtValue(lastValue)}
          </p>
        </div>
      )}
      <ResponsiveContainer width="100%" height={height}>
        <AreaChart data={data} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity={0.35} />
              <stop offset="100%" stopColor={color} stopOpacity={0} />
            </linearGradient>
          </defs>
          <XAxis
            dataKey="date"
            tick={{ fill: "#71717a", fontSize: 10 }}
            tickLine={false}
            axisLine={false}
            interval="preserveStartEnd"
          />
          <YAxis hide domain={["auto", "auto"]} />
          <Tooltip
            contentStyle={{
              background: "#18181b",
              border: "1px solid #3f3f46",
              borderRadius: 8,
              fontSize: 12,
            }}
            labelStyle={{ color: "#a1a1aa" }}
            formatter={(v) => [v != null ? fmtValue(Number(v)) : "—", valueLabel]}
          />
          <Area
            type="monotone"
            dataKey="value"
            stroke={color}
            strokeWidth={2}
            fill={`url(#${gradId})`}
            isAnimationActive
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
