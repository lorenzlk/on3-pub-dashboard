"use client";

import { Card } from "@/components/ui/card";
import { useDashboardLive } from "@/lib/dashboard-data-context";
import { formatChartCount } from "@/lib/data";
import { useEffect, useState } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

export function TrafficChart() {
  const [isClient, setIsClient] = useState(false);
  const { data: live, loading } = useDashboardLive();
  const data = live?.monthlyTotals ?? [];
  const monthRange =
    data.length > 0
      ? `${data[0].label} – ${data[data.length - 1].label}`
      : null;

  useEffect(() => {
    setIsClient(true);
  }, []);

  return (
    <Card className="p-6 bg-gradient-to-br from-zinc-900/80 to-zinc-900 border-zinc-800">
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-white">Traffic overview</h3>
        <p className="text-sm text-zinc-500">
          Human views vs total PVs (human + bot), summed by month from Monthly Rollup —
          Publishers
          {monthRange ? (
            <span className="text-zinc-400"> · {monthRange}</span>
          ) : null}
        </p>
      </div>

      <div style={{ height: 300, width: "100%" }}>
        {loading && !data.length ? (
          <div className="h-full flex items-center justify-center text-zinc-500 text-sm">
            Loading traffic…
          </div>
        ) : isClient ? (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 10, right: 30, left: 10, bottom: 0 }}>
              <defs>
                <linearGradient id="humanViewsGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#06b6d4" stopOpacity={0.3} />
                  <stop offset="100%" stopColor="#06b6d4" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="totalPVsGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#8b5cf6" stopOpacity={0.3} />
                  <stop offset="100%" stopColor="#8b5cf6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
              <XAxis
                dataKey="label"
                tick={{ fill: "#71717a", fontSize: 11 }}
                axisLine={{ stroke: "#27272a" }}
                tickLine={false}
              />
              <YAxis
                tickFormatter={(value) => formatChartCount(Number(value))}
                tick={{ fill: "#71717a", fontSize: 11 }}
                axisLine={false}
                tickLine={false}
                width={72}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#18181b",
                  border: "1px solid #3f3f46",
                  borderRadius: "8px",
                  color: "#fff"
                }}
                formatter={(value, name) => [
                  formatChartCount(Number(value)),
                  String(name),
                ]}
                labelStyle={{ color: "#a1a1aa" }}
              />
              <Legend
                wrapperStyle={{ paddingTop: "20px" }}
                formatter={(value) => (
                  <span style={{ color: "#d4d4d8", fontSize: "12px" }}>{value}</span>
                )}
              />
              <Area
                type="monotone"
                dataKey="totalPVs"
                name="Total PVs"
                stroke="#8b5cf6"
                strokeWidth={2}
                fill="url(#totalPVsGrad)"
              />
              <Area
                type="monotone"
                dataKey="humanViews"
                name="Human Views"
                stroke="#06b6d4"
                strokeWidth={2}
                fill="url(#humanViewsGrad)"
              />
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-full w-full flex items-center justify-center">
            <div className="animate-pulse text-zinc-500">Loading chart...</div>
          </div>
        )}
      </div>
    </Card>
  );
}
