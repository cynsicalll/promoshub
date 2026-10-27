"use client";

import dynamic from "next/dynamic";
import * as React from "react";
import { MoneyViewerDashboard } from "@/components/views/money-viewer-dashboard";

// Dynamically import with ssr:false to prevent hydration mismatch
const CustomerDashboard = dynamic(
  () =>
    import("@/components/views/customer-dashboard").then(
      (m) => m.CustomerDashboard
    ),
  {
    ssr: false,
    loading: () => (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-muted border-t-emerald-500" />
      </div>
    ),
  }
);

export function CustomerAccessPage({ token }: { token: string }) {
  const [role, setRole] = React.useState<string | null>(null);

  React.useEffect(() => {
    fetch(`/api/customer-link/${encodeURIComponent(token)}`)
      .then((r) => r.json())
      .then((data) => {
        setRole(data.user?.role || "CUSTOMER");
      })
      .catch(() => setRole("CUSTOMER"));
  }, [token]);

  if (role === null) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-muted border-t-emerald-500" />
      </div>
    );
  }

  // VIEWER and COLLABORATOR → MoneyViewerDashboard (with chart, KPIs, payment table)
  if (role === "VIEWER" || role === "COLLABORATOR") {
    return <MoneyViewerDashboard externalToken={token} />;
  }

  // CUSTOMER → CustomerDashboard (promos, sounds, TikTok videos)
  return <CustomerDashboard token={token} />;
}
