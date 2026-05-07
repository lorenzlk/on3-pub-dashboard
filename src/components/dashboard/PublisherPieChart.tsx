"use client";

import { Card } from "@/components/ui/card";
import { useDashboardLive } from "@/lib/dashboard-data-context";
import { formatCurrencyFull } from "@/lib/data";
import { useEffect, useState } from "react";
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";

type PieDatum = {
  publisher: string;
  totalRev: number;
  percentage: number;
};

function RevenuePieTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: ReadonlyArray<{ payload?: PieDatum; name?: string; value?: number }>;
}) {
  if (!active || !payload?.length) return null;
  const row = payload[0]?.payload as PieDatum | undefined;
  const publisher = row?.publisher ?? String(payload[0]?.name ?? "Publisher");
  const value = row?.totalRev ?? Number(payload[0]?.value);
  return (
    <div
      className="rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 shadow-lg"
      style={{ color: "#fff" }}
    >
      <p className="text-sm font-medium text-white">{publisher}</p>
      <p className="text-sm text-emerald-400 tabular-nums mt-0.5">
        {formatCurrencyFull(Number.isFinite(value) ? value : 0)}
      </p>
    </div>
  );
}

const COLORS = [
  "#10b981",
  "#06b6d4",
  "#8b5cf6",
  "#f59e0b",
  "#ec4899",
  "#6366f1",
  "#14b8a6",
  "#f97316",
  "#84cc16",
  "#a855f7",
];

export function PublisherPieChart() {
  const [isClient, setIsClient] = useState(false);
  const { data: live, loading } = useDashboardLive();
  const rawData = live?.publisherTotals ?? [];
  const totalRevenue = rawData.reduce((sum, d) => sum + d.totalRev, 0);

  const denom = totalRevenue > 0 ? totalRevenue : 1;
  const data = rawData
    .filter((d) => d.totalRev > 0)
    .map((d) => ({
      ...d,
      percentage: (d.totalRev / denom) * 100,
    }));

  useEffect(() => {
    setIsClient(true);
  }, []);

  return (
    <Card className="p-6 bg-gradient-to-br from-zinc-900/80 to-zinc-900 border-zinc-800">
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-white">Revenue distribution</h3>
        <p className="text-sm text-zinc-500">
          Lifetime revenue by publisher (all months summed). Slices omit $0 publishers.
        </p>
      </div>

      <div style={{ height: 220, width: "100%" }}>
        {loading && !rawData.length ? (
          <div className="h-full flex items-center justify-center text-zinc-500 text-sm">
            Loading distribution…
          </div>
        ) : isClient ? (
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={50}
                outerRadius={85}
                paddingAngle={3}
                dataKey="totalRev"
                nameKey="publisher"
              >
                {data.map((_, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={COLORS[index % COLORS.length]}
                    stroke="transparent"
                  />
                ))}
              </Pie>
              <Tooltip content={<RevenuePieTooltip />} />
            </PieChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-full w-full flex items-center justify-center">
            <div className="animate-pulse text-zinc-500">Loading chart...</div>
          </div>
        )}
      </div>

      {/* Legend */}
      <div className="mt-4 grid grid-cols-2 gap-2">
        {data.slice(0, 6).map((item, index) => (
          <div key={item.publisher} className="flex items-center gap-2">
            <div
              className="w-3 h-3 rounded-full flex-shrink-0"
              style={{ backgroundColor: COLORS[index % COLORS.length] }}
            />
            <span className="text-zinc-300 text-xs truncate">{item.publisher}</span>
            <span className="text-zinc-500 text-xs ml-auto">
              {item.percentage.toFixed(0)}%
            </span>
          </div>
        ))}
      </div>
    </Card>
  );
}
