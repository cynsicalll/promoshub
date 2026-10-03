"use client";

import * as React from "react";
import { useSearchParams } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { useAppStore } from "@/lib/store";
import { DashboardView } from "@/components/views/dashboard-view";
import { PromosView } from "@/components/views/promos-view";
import { PromoDetailView } from "@/components/views/promo-detail-view";
import { MoneyView } from "@/components/views/money-view";
import { MonthlyView } from "@/components/views/monthly-view";
import { SoundsView } from "@/components/views/sounds-view";
import { CustomersView } from "@/components/views/customers-view";
import { SettingsView } from "@/components/views/settings-view";
import { ShareView } from "@/components/views/share-view";

function AppContent() {
  const view = useAppStore((s) => s.view);
  return (
    <AppShell>
      {view === "dashboard" && <DashboardView />}
      {view === "promos" && <PromosView />}
      {view === "promo-detail" && <PromoDetailView />}
      {view === "money" && <MoneyView />}
      {view === "monthly" && <MonthlyView />}
      {view === "sounds" && <SoundsView />}
      {view === "customers" && <CustomersView />}
      {view === "settings" && <SettingsView />}
    </AppShell>
  );
}

function ShareRouter() {
  const searchParams = useSearchParams();
  const shareCode = searchParams.get("share");
  if (shareCode) return <ShareView code={shareCode} />;
  return <AppContent />;
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
      <ShareRouter />
    </React.Suspense>
  );
}
