"use client";

type DataScopeBannerProps = {
  latestMonthLabel: string | null;
  previousMonthLabel: string | null;
  monthlyRangeLabel: string | null;
  /** Group landing: tiles mix network-month (CEO/CRO) and lifetime (COO/CPO). */
  layout?: "default" | "group";
};

export function DataScopeBanner({
  latestMonthLabel,
  previousMonthLabel,
  monthlyRangeLabel,
  layout = "default",
}: DataScopeBannerProps) {
  if (!latestMonthLabel && !monthlyRangeLabel) return null;

  return (
    <div className="rounded-lg border border-zinc-800 bg-zinc-900/60 px-4 py-3 text-sm text-zinc-300">
      <p className="font-medium text-zinc-200">What period is this?</p>
      <ul className="mt-2 list-disc list-inside space-y-1 text-zinc-400 text-xs sm:text-sm">
        {layout === "group" ? (
          <li>
            <span className="text-zinc-300">Snapshot tiles:</span>{" "}
            <span className="text-zinc-200">CEO &amp; CRO</span> = latest month,{" "}
            <span className="text-zinc-200">Network Total</span>
            {latestMonthLabel ? (
              <>
                {" "}
                (<span className="text-zinc-200 font-medium">{latestMonthLabel}</span>)
              </>
            ) : null}
            . <span className="text-zinc-200">COO &amp; CPO</span> ={" "}
            <span className="text-zinc-200">lifetime</span> totals summed across publishers (
            <span className="text-zinc-300">Monthly Rollup — Publishers</span>).
            {previousMonthLabel ? (
              <>
                {" "}
                CEO/CRO MoM vs{" "}
                <span className="text-zinc-200 font-medium">{previousMonthLabel}</span>.
              </>
            ) : null}
          </li>
        ) : latestMonthLabel ? (
          <li>
            <span className="text-zinc-300">Top KPI cards</span> use the latest month in{" "}
            <span className="text-zinc-300">Monthly Rollup — Network</span> (Network Total row):
            <span className="text-zinc-200 font-medium"> {latestMonthLabel}</span>
            {previousMonthLabel ? (
              <>
                . Month-over-month change vs{" "}
                <span className="text-zinc-200 font-medium">{previousMonthLabel}</span>.
              </>
            ) : (
              "."
            )}
          </li>
        ) : null}
        {monthlyRangeLabel ? (
          <li>
            <span className="text-zinc-300">Monthly trend charts</span> sum publishers from{" "}
            <span className="text-zinc-300">Monthly Rollup — Publishers</span> by month (
            {monthlyRangeLabel}).
          </li>
        ) : null}
        <li>
          <span className="text-zinc-300">Publisher table &amp; pie</span> are{" "}
          <span className="text-zinc-200">lifetime totals</span> (all months in that tab per
          publisher).
        </li>
      </ul>
    </div>
  );
}
