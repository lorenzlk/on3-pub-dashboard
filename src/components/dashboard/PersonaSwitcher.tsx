"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";

export const PERSONA_IDS = ["ceo", "coo", "cro", "cpo", "studio"] as const;
export type PersonaId = (typeof PERSONA_IDS)[number];

const PERSONA_META: Record<PersonaId, { label: string; fullTitle: string; color: string }> = {
  ceo: { label: "CEO", fullTitle: "Business Overview", color: "bg-emerald-500" },
  coo: { label: "COO", fullTitle: "Network & partner ops", color: "bg-amber-500" },
  cro: { label: "CRO", fullTitle: "Revenue & Growth", color: "bg-violet-500" },
  cpo: { label: "CPO", fullTitle: "Product Metrics", color: "bg-cyan-500" },
  studio: { label: "Studio", fullTitle: "Investor & advisor analytics", color: "bg-fuchsia-500" },
};

export function PersonaSwitcher({
  currentPersona,
  className,
}: {
  currentPersona: string;
  className?: string;
}) {
  return (
    <nav
      className={cn(
        "inline-flex rounded-full border border-zinc-700/80 bg-zinc-900/90 p-1 gap-0.5",
        className
      )}
      aria-label="Dashboard persona"
    >
      {PERSONA_IDS.map((id) => {
        const active = currentPersona === id;
        const meta = PERSONA_META[id];
        return (
          <Link
            key={id}
            href={`/dashboard/${id}`}
            title={meta.fullTitle}
            className={cn(
              "group relative flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-full transition-all",
              active
                ? "bg-zinc-100 text-zinc-900 shadow-sm"
                : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/80"
            )}
          >
            <span
              className={cn(
                "w-1.5 h-1.5 rounded-full shrink-0 transition-opacity",
                meta.color,
                active ? "opacity-100" : "opacity-40 group-hover:opacity-70"
              )}
            />
            {meta.label}
          </Link>
        );
      })}
    </nav>
  );
}
