import { cn } from "@/lib/utils";

/** Shared definitions for pageviews, widget loads, and viewability (COO / CPO). */
export function PersonaMetricGlossary({ className }: { className?: string }) {
  return (
    <p
      className={cn(
        "text-sm text-zinc-500 max-w-3xl leading-relaxed",
        className
      )}
    >
      <span className="text-zinc-400">Pageviews</span> — pages where the analytics tag loads.{" "}
      <span className="text-zinc-400">Widget loads</span> — eligible ad serves (tag on page, unit can
      serve). <span className="text-zinc-400">Viewability</span> — SS in-views ÷ widget loads (share
      of eligible serves that were seen).
    </p>
  );
}
