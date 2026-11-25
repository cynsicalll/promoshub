"use client";

import * as React from "react";
import { AuthContext, type AuthUser } from "@/components/auth-provider";
import { useAppStore } from "@/lib/store";
import { AppShell } from "@/components/app-shell";
import { DashboardView } from "@/components/views/dashboard-view";
import { PromosView } from "@/components/views/promos-view";
import { PromoDetailView } from "@/components/views/promo-detail-view";
import { MoneyView } from "@/components/views/money-view";
import { MonthlyView } from "@/components/views/monthly-view";
import { SoundsView } from "@/components/views/sounds-view";
import { CustomersView } from "@/components/views/customers-view";
import { NotesView } from "@/components/views/notes-view";
import { SettingsView } from "@/components/views/settings-view";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Sparkles } from "lucide-react";

// Fake demo user — role "DEMO" makes the data hooks fetch from /api/demo-data
const DEMO_USER: AuthUser = {
  userId: "demo",
  username: "demo",
  role: "DEMO",
  displayName: "Demo Viewer",
};

// Fake auth context that always returns the demo user (no login, no logout)
const demoAuthValue = {
  user: DEMO_USER,
  loading: false,
  login: async () => {},
  logout: async () => {
    window.history.back();
  },
  refresh: async () => {},
};

export function DemoAdminApp() {
  const view = useAppStore((s) => s.view);

  return (
    <AuthContext.Provider value={demoAuthValue}>
      {/* Demo banner — neutral Apple-style */}
      <div
        className="fixed top-0 left-0 right-0 z-50 h-7 flex items-center justify-center gap-2 text-[11px] font-medium backdrop-blur-md"
        style={{
          background: "rgba(0,122,255,0.08)",
          borderBottom: "0.5px solid rgba(0,122,255,0.15)",
          color: "#007aff",
        }}
      >
        <Sparkles className="h-3 w-3" />
        Demo mode — sample data, no real information
      </div>

      {/* Push content down to account for the demo banner */}
      <div className="pt-7">
        <AppShell>
          {view === "dashboard" && <DashboardView />}
          {view === "promos" && <PromosView />}
          {view === "promo-detail" && <PromoDetailView />}
          {view === "money" && <MoneyView />}
          {view === "monthly" && <MonthlyView />}
          {view === "sounds" && <SoundsView />}
          {view === "customers" && <CustomersView />}
          {view === "notes" && <NotesView />}
          {view === "settings" && <SettingsView />}
        </AppShell>
      </div>

      {/* Floating back button */}
      <Button
        variant="outline"
        size="sm"
        onClick={() => window.history.back()}
        className="fixed bottom-4 right-4 z-50 gap-2 bg-background/80 backdrop-blur-md"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to bio
      </Button>
    </AuthContext.Provider>
  );
}
