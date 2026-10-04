"use client";

import * as React from "react";
import { useSearchParams } from "next/navigation";
import { useAuth } from "@/components/auth-provider";
import { AppShell } from "@/components/app-shell";
import { useAppStore } from "@/lib/store";
import { DashboardView } from "@/components/views/dashboard-view";
import { PromosView } from "@/components/views/promos-view";
import { PromoDetailView } from "@/components/views/promo-detail-view";
import { MoneyView } from "@/components/views/money-view";
import { MonthlyView } from "@/components/views/monthly-view";
import { StatsView } from "@/components/views/stats-view";
import { SoundsView } from "@/components/views/sounds-view";
import { CustomersView } from "@/components/views/customers-view";
import { SettingsView } from "@/components/views/settings-view";
import { ShareView } from "@/components/views/share-view";
import { LoginScreen } from "@/components/views/login-screen";
import { CustomerDashboard } from "@/components/views/customer-dashboard";
import { MoneyViewerDashboard } from "@/components/views/money-viewer-dashboard";

function AdminApp() {
  const view = useAppStore((s) => s.view);
  return (
    <AppShell>
      {view === "dashboard" && <DashboardView />}
      {view === "promos" && <PromosView />}
      {view === "promo-detail" && <PromoDetailView />}
      {view === "money" && <MoneyView />}
      {view === "monthly" && <MonthlyView />}
      {view === "stats" && <StatsView />}
      {view === "sounds" && <SoundsView />}
      {view === "customers" && <CustomersView />}
      {view === "settings" && <SettingsView />}
    </AppShell>
  );
}

function AuthRouter() {
  const { user, loading } = useAuth();
  const searchParams = useSearchParams();
  const shareCode = searchParams.get("share");
  const customerToken = searchParams.get("customer");

  // Public share view (no auth needed)
  if (shareCode) return <ShareView code={shareCode} />;

  // Public customer direct-access link (no auth needed)
  if (customerToken) return <CustomerDashboard token={customerToken} />;

  // Loading state
  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-muted border-t-emerald-500" />
      </div>
    );
  }

  // Not logged in → show login
  if (!user) return <LoginScreen />;

  // Admin → full app
  if (user.role === "ADMIN") return <AdminApp />;

  // Demo → full app UI but with example data (read-only)
  if (user.role === "DEMO") return <AdminApp />;

  // Viewer → money viewer dashboard (only sees financial data)
  if (user.role === "VIEWER") return <MoneyViewerDashboard />;

  // Customer → customer dashboard
  return <CustomerDashboard />;
}

export default function Home() {
  return (
    <React.Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-muted border-t-emerald-500" />
        </div>
      }
    >
      <AuthRouter />
    </React.Suspense>
  );
}
