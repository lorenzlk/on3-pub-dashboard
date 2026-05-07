"use client";

import { Card } from "@/components/ui/card";
import { useDashboardLive } from "@/lib/dashboard-data-context";
import { formatCurrencyFull } from "@/lib/data";
import { useEffect, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

export function RevenueBreakdownChart() {
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
        <h3 className="text-lg font-semibold text-white">Revenue by type</h3>
        <p className="text-sm text-zinc-500">
          Stacked affiliate, email, incremental ad, native, and video — summed across publishers by month
          {monthRange ? (
            <span className="text-zinc-400"> · {monthRange}</span>
          ) : null}
        </p>
      </div>

      <div style={{ height: 300, width: "100%" }}>
        {loading && !data.length ? (
          <div className="h-full flex items-center justify-center text-zinc-500 text-sm">
            Loading breakdown…
          </div>
        ) : isClient ? (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 10, right: 30, left: 10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
              <XAxis
                dataKey="label"
                tick={{ fill: "#71717a", fontSize: 11 }}
                axisLine={{ stroke: "#27272a" }}
                tickLine={false}
              />
              <YAxis
                tickFormatter={(value) => formatCurrencyFull(Number(value))}
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
                  formatCurrencyFull(Number(value)),
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
              <Bar
                dataKey="affiliateRev"
                name="Affiliate"
                fill="#10b981"
                radius={[4, 4, 0, 0]}
                stackId="stack"
              />
              <Bar
                dataKey="emailRev"
                name="Email"
                fill="#22c55e"
                radius={[0, 0, 0, 0]}
                stackId="stack"
              />
              <Bar
                dataKey="kvpRev"
                name="Incremental Ad Revenue"
                fill="#06b6d4"
                radius={[0, 0, 0, 0]}
                stackId="stack"
              />
              <Bar
                dataKey="nativeRev"
                name="Native"
                fill="#8b5cf6"
                radius={[0, 0, 0, 0]}
                stackId="stack"
              />
              <Bar
                dataKey="videoRev"
                name="Video"
                fill="#f59e0b"
                radius={[4, 4, 0, 0]}
                stackId="stack"
              />
            </BarChart>
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
