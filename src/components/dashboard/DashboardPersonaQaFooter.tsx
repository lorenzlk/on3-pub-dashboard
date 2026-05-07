"use client";

import { DataQualityBanner } from "@/components/dashboard/DataQualityBanner";
import { PersonaQaCeoStrip } from "@/components/dashboard/PersonaQaCeoStrip";
import { CooPersonaDataQaSection } from "@/components/dashboard/personas/CooPersonaDataQaSection";
import { useDashboardLive } from "@/lib/dashboard-data-context";
import type { PersonaId } from "@/components/dashboard/PersonaSwitcher";

/**
 * Rollup / ops QA at the bottom of focused `/dashboard/*` persona routes.
 * COO uses the detailed section only (includes the same checks as the banner table).
 */
export function DashboardPersonaQaFooter({ persona }: { persona: PersonaId }) {
  const { data, loading } = useDashboardLive();
  if (loading || !data || persona === "studio") return null;

  return (
    <div className="mt-12 space-y-6 border-t border-zinc-800/80 pt-8 pb-2">
      {persona === "coo" ? (
        <CooPersonaDataQaSection qaSectionId="qa-detail" />
      ) : (
        <DataQualityBanner qa={data.qa} />
      )}
      {persona === "ceo" ? <PersonaQaCeoStrip /> : null}
    </div>
  );
}
