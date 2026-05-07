"use client";

import { formatChartCount, formatCurrencyFull, formatPercentChart } from "@/lib/data";
import { cn } from "@/lib/utils";
import { useId } from "react";
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

const COLORS = ["#34d399", "#22d3ee", "#a78bfa", "#fb923c", "#f472b6", "#e5e5e5"];

export type TrendSeriesItem = {
  name: string;
  dataKey: string;
  yAxisId?: "left" | "right";
  /** Tooltip / axis: currency, whole counts, or percentage */
  valueType?: "currency" | "count" | "percent";
};

export function TrendChart({
  data,
  series,
  xKey,
  className,
  height = 320,
}: {
  data: Record<string, string | number>[];
  series: TrendSeriesItem[];
  xKey: string;
  className?: string;
  height?: number;
}) {
  const uid = useId().replace(/:/g, "");
  const hasRight = series.some((s) => s.yAxisId === "right");
  const leftSeries = series.filter((s) => (s.yAxisId ?? "left") === "left");
  const leftAxisKind = leftSeries.some((s) => s.valueType === "percent")
    ? "percent"
    : leftSeries.some((s) => s.valueType === "count")
      ? "count"
      : "currency";
  const formatLeftAxisTick = (v: number) => {
    if (leftAxisKind === "percent") return formatPercentChart(Number(v), 0);
    if (leftAxisKind === "count") return formatChartCount(v);
    return formatCurrencyFull(v);
  };

  const formatTooltip = (value: unknown, item: { dataKey?: unknown }) => {
    const n = Number(value);
    if (!Number.isFinite(n)) return "—";
    const key = String(item?.dataKey ?? "");
    const cfg = series.find((s) => s.dataKey === key);
    const vt = cfg?.valueType ?? "currency";
    if (vt === "count") return formatChartCount(n);
    if (vt === "percent") return formatPercentChart(n, 1);
    return formatCurrencyFull(n);
  };

  return (
    <div
      className={cn(
        "w-full min-w-0 min-h-[240px] rounded-xl border border-zinc-800 bg-zinc-900/40 p-3",
        className
      )}
    >
      <ResponsiveContainer width="100%" height={height}>
        <LineChart
          data={data}
          margin={{ top: 8, right: hasRight ? 20 : 12, left: 4, bottom: 0 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
          <XAxis
            dataKey={xKey}
            tick={{ fill: "#71717a", fontSize: 11 }}
            tickLine={false}
          />
          <YAxis
            yAxisId="left"
            tick={{ fill: "#71717a", fontSize: 11 }}
            tickLine={false}
            axisLine={false}
            tickFormatter={formatLeftAxisTick}
            width={72}
          />
          {hasRight ? (
            <YAxis
              yAxisId="right"
              orientation="right"
              tick={{ fill: "#71717a", fontSize: 11 }}
              tickLine={false}
              axisLine={false}
              tickFormatter={(v) => formatCurrencyFull(Number(v))}
              width={64}
            />
          ) : null}
          <Tooltip
            contentStyle={{
              background: "#18181b",
              border: "1px solid #3f3f46",
              borderRadius: 8,
              fontSize: 12,
            }}
            formatter={(value, _name, item) => [
              formatTooltip(value, item),
              item.name as string,
            ]}
          />
          <Legend wrapperStyle={{ fontSize: 12 }} />
          {series.map((s, i) => (
            <Line
              key={`${uid}-${s.dataKey}`}
              type="monotone"
              name={s.name}
              dataKey={s.dataKey}
              yAxisId={s.yAxisId ?? "left"}
              stroke={COLORS[i % COLORS.length]}
              strokeWidth={2}
              dot={false}
              isAnimationActive
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
