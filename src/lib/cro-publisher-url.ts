/** Canonical CRO dashboard path with a pre-selected publisher (shareable in Slack, etc.). */
export const CRO_DASHBOARD_PATH = "/dashboard/cro";

export function croPublisherDashboardHref(publisherName: string): string {
  const params = new URLSearchParams();
  params.set("publisher", publisherName);
  return `${CRO_DASHBOARD_PATH}?${params.toString()}`;
}

export function absoluteCroPublisherUrl(origin: string, publisherName: string): string {
  return `${origin.replace(/\/$/, "")}${croPublisherDashboardHref(publisherName)}`;
}

/** Resolve a query `publisher` value to a sheet publisher name from live totals. */
export function matchPublisherInTotals(
  decoded: string,
  totals: { publisher: string }[]
): string | null {
  const t = decoded.trim();
  if (!t) return null;
  const exact = totals.find((p) => p.publisher === t);
  if (exact) return exact.publisher;
  const lower = t.toLowerCase();
  return totals.find((p) => p.publisher.trim().toLowerCase() === lower)?.publisher ?? null;
}
