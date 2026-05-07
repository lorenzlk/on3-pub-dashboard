"use client";

import { Card } from "@/components/ui/card";
import { useDashboardLive } from "@/lib/dashboard-data-context";
import { formatCurrencyFull } from "@/lib/data";
import { useEffect, useState } from "react";

export function RevenueChart() {
  const [isClient, setIsClient] = useState(false);
  const { data: live, loading } = useDashboardLive();
  const data = live?.monthlyTotals ?? [];
  const monthRange =
    data.length > 0
      ? `${data[0].label} – ${data[data.length - 1].label}`
      : null;

  useEffect(() => {
    setIsClient(true);
    // Dynamically load recharts only on client
    if (typeof window !== "undefined") {
      import("recharts").then((mod) => {
        setRechartsModule(mod);
      });
    }
  }, []);

  const [rechartsModule, setRechartsModule] = useState<typeof import("recharts") | null>(null);

  // Calculate max for scaling
  const maxRev = data.length ? Math.max(...data.map((d) => d.totalRev)) : 0;
  const minRev = data.length ? Math.min(...data.map((d) => d.totalRev)) : 0;

  // Static chart fallback
  const renderStaticChart = () => {
    const width = 100;
    const height = 100;
    const denom = data.length > 1 ? data.length - 1 : 1;
    const points = data.map((d, i) => {
      const x = (i / denom) * width;
      const y = height - ((d.totalRev - minRev) / (maxRev - minRev || 1)) * height * 0.8 - 10;
      return `${x},${y}`;
    }).join(" ");

    return (
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full" preserveAspectRatio="none">
        <defs>
          <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#10b981" stopOpacity="0.4" />
            <stop offset="100%" stopColor="#10b981" stopOpacity="0" />
          </linearGradient>
        </defs>
        {/* Grid lines */}
        {[20, 40, 60, 80].map((y) => (
          <line key={y} x1="0" y1={y} x2={width} y2={y} stroke="#27272a" strokeWidth="0.5" />
        ))}
        {/* Area fill */}
        <polygon
          points={`0,${height} ${points} ${width},${height}`}
          fill="url(#revGrad)"
        />
        {/* Line */}
        <polyline
          points={points}
          fill="none"
          stroke="#10b981"
          strokeWidth="2"
        />
        {/* Dots */}
        {data.map((d, i) => {
          const x = (i / denom) * width;
          const y = height - ((d.totalRev - minRev) / (maxRev - minRev || 1)) * height * 0.8 - 10;
          return (
            <circle key={i} cx={x} cy={y} r="2" fill="#10b981" />
          );
        })}
      </svg>
    );
  };

  // Interactive recharts version
  const renderInteractiveChart = () => {
    if (!rechartsModule) return renderStaticChart();
    if (!data.length) {
      return (
        <div className="h-full flex items-center justify-center text-zinc-500 text-sm">
          No monthly data yet
        </div>
      );
    }

    const { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } = rechartsModule;

    return (
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 10, right: 30, left: 10, bottom: 0 }}>
          <defs>
            <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#10b981" stopOpacity={0.4} />
              <stop offset="100%" stopColor="#10b981" stopOpacity={0} />
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
            tickFormatter={(value: number) => formatCurrencyFull(value)}
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
            formatter={(value) => [
              formatCurrencyFull(Number(value)),
              "Revenue",
            ]}
            labelStyle={{ color: "#a1a1aa" }}
          />
          <Area
            type="monotone"
            dataKey="totalRev"
            stroke="#10b981"
            strokeWidth={2.5}
            fill="url(#revenueGrad)"
            isAnimationActive={true}
          />
        </AreaChart>
      </ResponsiveContainer>
    );
  };

  return (
    <Card className="p-6 bg-gradient-to-br from-zinc-900/80 to-zinc-900 border-zinc-800">
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-white">
          Publisher Revenue Trend
          <span className="text-zinc-500 font-medium"> — Revenue trend</span>
        </h3>
        <p className="text-sm text-zinc-500 mt-1">
          Monthly Rollup — Publishers: total revenue summed by month
          {monthRange ? (
            <span className="text-zinc-400"> · {monthRange}</span>
          ) : null}
        </p>
      </div>

      <div className="h-[300px] w-full relative">
        {loading && !data.length ? (
          <div className="h-full flex items-center justify-center text-zinc-500 text-sm">
            Loading publisher revenue…
          </div>
        ) : isClient && rechartsModule ? (
          renderInteractiveChart()
        ) : (
          renderStaticChart()
        )}

        {/* X-axis labels for static */}
        {(!isClient || !rechartsModule) && (
          <div className="absolute bottom-0 left-0 right-0 flex justify-between px-2">
            {data.map((d) => (
              <span key={d.label} className="text-zinc-500 text-[10px]">{d.label}</span>
            ))}
          </div>
        )}
      </div>
    </Card>
  );
}
