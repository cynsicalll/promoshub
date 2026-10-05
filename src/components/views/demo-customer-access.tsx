"use client";

import { CustomerDashboard } from "@/components/views/customer-dashboard";

// Demo customer access page — shows example customer view with demo data
// Uses the same CustomerDashboard but with a special demo token
export function DemoCustomerAccess() {
  return <CustomerDashboard demoMode />;
}
