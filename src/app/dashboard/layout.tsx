import { DashboardPersonaShell } from "@/components/dashboard/DashboardPersonaShell";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-zinc-900 text-zinc-50 antialiased">
      <DashboardPersonaShell>{children}</DashboardPersonaShell>
    </div>
  );
}
