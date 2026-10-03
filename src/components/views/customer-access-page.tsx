"use client";

import dynamic from "next/dynamic";

// Dynamically import with ssr:false to prevent hydration mismatch
// (Radix UI useId() generates different IDs on server vs client)
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
  return <CustomerDashboard token={token} />;
}
