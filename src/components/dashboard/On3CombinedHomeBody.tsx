"use client";

import {
  On3PublisherDashboard,
  type On3SummaryController,
} from "@/components/dashboard/On3PublisherDashboard";

export function On3CombinedHomeBody({
  onRequestPublisherQuickView,
  summary,
}: {
  onRequestPublisherQuickView: (slug: string) => void;
  summary: On3SummaryController;
}) {
  return (
    <On3PublisherDashboard
      summary={summary}
      onRequestPublisherQuickView={onRequestPublisherQuickView}
    />
  );
}
