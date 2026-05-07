"use client";

import { Card } from "@/components/ui/card";

interface DataPoint {
  label: string;
  value: number;
}

interface SimpleAreaChartProps {
  title: string;
  subtitle: string;
  data: DataPoint[];
  color?: string;
  formatValue?: (value: number) => string;
}

export function SimpleAreaChart({
  title,
  subtitle,
  data,
  color = "#10b981",
  formatValue = (v) => `$${(v / 1000).toFixed(1)}K`,
}: SimpleAreaChartProps) {
  if (data.length === 0) return null;

  const maxValue = Math.max(...data.map((d) => d.value));
  const minValue = Math.min(...data.map((d) => d.value));
  const range = maxValue - minValue || 1;

  const width = 100;
  const height = 60;
  const padding = { top: 5, right: 5, bottom: 5, left: 5 };
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;

  // Generate path points
  const points = data.map((d, i) => {
    const x = padding.left + (i / (data.length - 1)) * chartWidth;
    const y = padding.top + chartHeight - ((d.value - minValue) / range) * chartHeight;
    return { x, y, ...d };
  });

  // Create SVG path for line
  const linePath = points.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ");

  // Create SVG path for area (closed polygon)
  const areaPath = `${linePath} L ${points[points.length - 1].x} ${height - padding.bottom} L ${padding.left} ${height - padding.bottom} Z`;

  // Y-axis labels
  const yLabels = [maxValue, (maxValue + minValue) / 2, minValue];

  return (
    <Card className="p-6 bg-gradient-to-br from-zinc-900/80 to-zinc-900 border-zinc-800">
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-white">{title}</h3>
        <p className="text-sm text-zinc-500">{subtitle}</p>
      </div>

      <div className="relative">
        {/* Y-axis labels */}
        <div className="absolute left-0 top-0 bottom-8 w-12 flex flex-col justify-between text-right pr-2">
          {yLabels.map((val, i) => (
            <span key={i} className="text-[10px] text-zinc-500">
              {formatValue(val)}
            </span>
          ))}
        </div>

        {/* Chart */}
        <div className="ml-12">
          <svg
            viewBox={`0 0 ${width} ${height}`}
            className="w-full h-[200px]"
            preserveAspectRatio="none"
          >
            <defs>
              <linearGradient id={`gradient-${title.replace(/\s/g, "")}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={color} stopOpacity="0.3" />
                <stop offset="100%" stopColor={color} stopOpacity="0" />
              </linearGradient>
            </defs>

            {/* Grid lines */}
            {[0, 0.25, 0.5, 0.75, 1].map((ratio, i) => (
              <line
                key={i}
                x1={padding.left}
                y1={padding.top + ratio * chartHeight}
                x2={width - padding.right}
                y2={padding.top + ratio * chartHeight}
                stroke="#27272a"
                strokeWidth="0.5"
              />
            ))}

            {/* Area fill */}
            <path d={areaPath} fill={`url(#gradient-${title.replace(/\s/g, "")})`} />

            {/* Line */}
            <path d={linePath} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />

            {/* Data points */}
            {points.map((p, i) => (
              <circle key={i} cx={p.x} cy={p.y} r="3" fill={color} className="drop-shadow-sm" />
            ))}
          </svg>

          {/* X-axis labels */}
          <div className="flex justify-between mt-2">
            {data.map((d, i) => (
              <span key={i} className="text-[10px] text-zinc-500 text-center" style={{ width: `${100 / data.length}%` }}>
                {d.label}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Value display */}
      <div className="mt-4 flex items-center justify-between">
        <div>
          <p className="text-2xl font-bold text-white">{formatValue(data[data.length - 1]?.value || 0)}</p>
          <p className="text-xs text-zinc-500">Latest</p>
        </div>
        <div className="text-right">
          <p className="text-lg font-semibold text-white">{formatValue(data.reduce((sum, d) => sum + d.value, 0))}</p>
          <p className="text-xs text-zinc-500">Total</p>
        </div>
      </div>
    </Card>
  );
}
