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
import { ChannelView } from "@/components/views/channel-view";
import { SoundsView } from "@/components/views/sounds-view";
import { CustomersView } from "@/components/views/customers-view";
import { NotesView } from "@/components/views/notes-view";
import { SettingsView } from "@/components/views/settings-view";
import { ShareView } from "@/components/views/share-view";
import { LoginScreen } from "@/components/views/login-screen";
import { CustomerDashboard } from "@/components/views/customer-dashboard";
import { MoneyViewerDashboard } from "@/components/views/money-viewer-dashboard";
import { BioPage } from "@/components/views/bio-page";
import { BioEditorView } from "@/components/views/bio-editor-view";

function AdminApp() {
  const view = useAppStore((s) => s.view);
  const [demoCustomerOpen, setDemoCustomerOpen] = React.useState(false);

  // Listen for "back to admin" event from demo customer view
  React.useEffect(() => {
    const handler = () => setDemoCustomerOpen(false);
    window.addEventListener("demo-customer-close", handler);
    return () => window.removeEventListener("demo-customer-close", handler);
  }, []);

  if (demoCustomerOpen) {
    return <CustomerDashboard demoMode />;
  }

  return (
    <AppShell onOpenDemoCustomer={() => setDemoCustomerOpen(true)}>
      {view === "dashboard" && <DashboardView />}
      {view === "promos" && <PromosView />}
      {view === "promo-detail" && <PromoDetailView />}
      {view === "money" && <MoneyView />}
      {view === "monthly" && <MonthlyView />}
      {view === "channel" && <ChannelView />}
      {view === "sounds" && <SoundsView />}
      {view === "customers" && <CustomersView />}
      {view === "notes" && <NotesView />}
      {view === "bio" && <BioEditorView />}
      {view === "settings" && <SettingsView />}
    </AppShell>
  );
}

function AuthRouter() {
  const { user, loading } = useAuth();
  const searchParams = useSearchParams();
  const shareCode = searchParams.get("share");
  const customerToken = searchParams.get("customer");
  const [showLogin, setShowLogin] = React.useState(false);

  // Public share view (no auth needed)
  if (shareCode) return <ShareView code={shareCode} />;

  // Public customer/viewer/collaborator direct-access link (no auth needed)
  if (customerToken) {
    return <AccessLinkRouter token={customerToken} />;
  }

  // Loading state
  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-muted border-t-emerald-500" />
      </div>
    );
  }

  // If user clicked the login button → show login screen
  if (showLogin && !user) return <LoginScreen />;

  // Already logged in → go straight to app
  if (user) {
    if (user.role === "ADMIN" || user.role === "DEMO") return <AdminApp />;
    if (user.role === "VIEWER" || user.role === "COLLABORATOR") return <MoneyViewerDashboard />;
    return <CustomerDashboard />;
  }

  // Not logged in → show bio page with hidden login button
  return <BioPage onLogin={() => setShowLogin(true)} />;
}

// Router for ?customer=TOKEN links — checks role and renders the right dashboard
function AccessLinkRouter({ token }: { token: string }) {
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

  // VIEWER and COLLABORATOR → MoneyViewerDashboard
  if (role === "VIEWER" || role === "COLLABORATOR") {
    return <MoneyViewerDashboard externalToken={token} />;
  }

  // CUSTOMER → CustomerDashboard
  return <CustomerDashboard token={token} />;
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
