"use client";

import { DashboardDataProvider } from "@/lib/dashboard-data-context";
import { useEffect } from "react";

export default function ClientBody({
  children,
}: {
  children: React.ReactNode;
}) {
  // Remove any extension-added classes during hydration
  useEffect(() => {
    // This runs only on the client after hydration
    document.body.className = "antialiased";
  }, []);

  return (
    <div className="antialiased">
      <DashboardDataProvider>{children}</DashboardDataProvider>
    </div>
  );
}
