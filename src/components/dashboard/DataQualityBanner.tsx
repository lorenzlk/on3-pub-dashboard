"use client";

import type { QaPayload } from "@/lib/dashboard-data-context";
import { AlertTriangle, CheckCircle2, ChevronDown, Shield } from "lucide-react";
import { useState } from "react";

export function DataQualityBanner({ qa }: { qa: QaPayload | undefined | null }) {
  const [open, setOpen] = useState(false);
  if (!qa?.checks?.length) return null;

  const { summary, checks, latestMonthLabel } = qa;
  const hasFail = summary.failCount > 0;
  const hasWarn = summary.warnCount > 0;
  const borderClass = hasFail
    ? "border-red-500/45 bg-red-950/30"
    : hasWarn
      ? "border-amber-500/40 bg-amber-950/20"
      : "border-emerald-500/35 bg-emerald-950/20";

  return (
    <div
      className={`rounded-lg border px-4 py-3 text-sm ${borderClass}`}
      role="region"
      aria-label="Data quality checks"
    >
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between gap-3 text-left"
      >
        <div className="flex items-start gap-2 min-w-0">
          {hasFail ? (
            <AlertTriangle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
          ) : hasWarn ? (
            <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
          ) : (
            <Shield className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
          )}
          <div>
            <p className="font-medium text-zinc-100">
              Data QA
              {latestMonthLabel ? (
                <span className="text-zinc-400 font-normal"> · {latestMonthLabel}</span>
              ) : null}
            </p>
            <p className="text-zinc-400 text-xs mt-0.5">
              {summary.passCount} passed
              {summary.warnCount ? ` · ${summary.warnCount} warning(s)` : ""}
              {summary.failCount ? ` · ${summary.failCount} failed` : ""}
              {hasFail
                ? " — review sheet or formulas before trusting headline numbers."
                : hasWarn
                  ? " — numbers still load; warnings often mean rounding or tab mismatch."
                  : " — rollup identities match within tolerance."}
            </p>
          </div>
        </div>
        <ChevronDown
          className={`w-5 h-5 text-zinc-500 shrink-0 transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open ? (
        <ul className="mt-3 space-y-2 border-t border-zinc-800/80 pt-3">
          {checks.map((c) => (
            <li
              key={c.id}
              className="flex gap-2 text-xs sm:text-sm text-zinc-300"
            >
              {c.severity === "pass" ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
              ) : (
                <AlertTriangle
                  className={`w-4 h-4 shrink-0 mt-0.5 ${c.severity === "fail" ? "text-red-400" : "text-amber-400"}`}
                />
              )}
              <span>
                <span className="text-zinc-500 font-mono text-[10px] sm:text-xs mr-1.5">
                  [{c.id}]
                </span>
                {c.message}
                {c.detail && Object.keys(c.detail).length > 0 ? (
                  <details className="mt-1 text-zinc-500">
                    <summary className="cursor-pointer text-zinc-500 hover:text-zinc-400">
                      Details
                    </summary>
                    <pre className="mt-1 overflow-x-auto rounded bg-zinc-900/80 p-2 text-[10px] sm:text-xs text-zinc-400">
                      {JSON.stringify(c.detail, null, 2)}
                    </pre>
                  </details>
                ) : null}
              </span>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
