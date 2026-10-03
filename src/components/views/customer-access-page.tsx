"use client";

import { CustomerDashboard } from "@/components/views/customer-dashboard";

export function CustomerAccessPage({ token }: { token: string }) {
  return <CustomerDashboard token={token} />;
}
