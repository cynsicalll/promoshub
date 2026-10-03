"use client";

import { AppShell } from "@/components/app-shell";
import { useAppStore } from "@/lib/store";
import { DashboardView } from "@/components/views/dashboard-view";
import { PromosView } from "@/components/views/promos-view";
import { PromoDetailView } from "@/components/views/promo-detail-view";
import { MoneyView } from "@/components/views/money-view";
import { SoundsView } from "@/components/views/sounds-view";
import { CustomersView } from "@/components/views/customers-view";
import { SettingsView } from "@/components/views/settings-view";

export default function Home() {
  const view = useAppStore((s) => s.view);

  return (
    <AppShell>
      {view === "dashboard" && <DashboardView />}
      {view === "promos" && <PromosView />}
      {view === "promo-detail" && <PromoDetailView />}
      {view === "money" && <MoneyView />}
      {view === "sounds" && <SoundsView />}
      {view === "customers" && <CustomersView />}
      {view === "settings" && <SettingsView />}
    </AppShell>
  );
}
