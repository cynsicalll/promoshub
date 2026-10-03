"use client";

import * as React from "react";
import { useAppStore, type ViewKey } from "@/lib/store";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  LayoutDashboard,
  Megaphone,
  Wallet,
  Music2,
  Users,
  Settings,
  Menu,
  Plus,
  AudioLines,
  Moon,
  Sun,
  CalendarRange,
  Video,
  BarChart3,
} from "lucide-react";
import { useTheme } from "next-themes";
import { GlobalSearch, SearchTrigger } from "@/components/global-search";
import { PromoFormDialog } from "@/components/views/promo-form-dialog";
import { QuickAddTiktokDialog } from "@/components/views/quick-add-tiktok-dialog";
import { useDashboard } from "@/hooks/use-data";
import { formatCurrency } from "@/lib/format";
import { useI18n } from "@/components/language-provider";
import { LanguageToggle } from "@/components/language-toggle";
import { BounceSidebar, type BounceSidebarItem } from "@/components/ui/bounce-sidebar";

interface NavItem {
  key: ViewKey;
  label: string;
  icon: React.ElementType;
}

const NAV: NavItem[] = [
  { key: "dashboard", label: "nav.dashboard", icon: LayoutDashboard },
  { key: "promos", label: "nav.promos", icon: Megaphone },
  { key: "money", label: "nav.money", icon: Wallet },
  { key: "monthly", label: "nav.monthly", icon: CalendarRange },
  { key: "stats", label: "nav.stats", icon: BarChart3 },
  { key: "sounds", label: "nav.sounds", icon: Music2 },
  { key: "customers", label: "nav.customers", icon: Users },
  { key: "settings", label: "nav.settings", icon: Settings },
];

function BrandLogo() {
  const { t } = useI18n();
  return (
    <div className="flex items-center gap-2.5">
      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-sm">
        <AudioLines className="h-5 w-5" />
      </div>
      <div className="leading-tight">
        <p className="text-sm font-semibold tracking-tight">{t("app.name")}</p>
        <p className="text-[11px] text-muted-foreground">{t("app.subtitle")}</p>
      </div>
    </div>
  );
}

function ThemeToggle() {
  const { t } = useI18n();
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);
  React.useEffect(() => setMounted(true), []);
  if (!mounted)
    return <div className="h-9 w-9" />;
  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
      aria-label={t("action.themeToggle")}
    >
      {theme === "dark" ? (
        <Sun className="h-4 w-4" />
      ) : (
        <Moon className="h-4 w-4" />
      )}
    </Button>
  );
}

function NavLinks({ onNavigate }: { onNavigate?: () => void }) {
  const { t } = useI18n();
  const view = useAppStore((s) => s.view);
  const setView = useAppStore((s) => s.setView);
  // promo-detail should highlight promos
  const activeKey: ViewKey = view === "promo-detail" ? "promos" : view;
  const activeIndex = NAV.findIndex((item) => item.key === activeKey);

  const items: BounceSidebarItem[] = NAV.map((item) => ({
    label: t(item.label),
    icon: item.icon,
  }));

  return (
    <BounceSidebar
      items={items}
      value={activeIndex}
      defaultValue={0}
      onChange={(index) => {
        setView(NAV[index].key);
        onNavigate?.();
      }}
      dotColor="#10b981"
    />
  );
}

function MoneySummary() {
  const { t } = useI18n();
  const { data } = useDashboard();
  if (!data) return null;
  return (
    <div className="mt-auto rounded-lg border bg-muted/30 p-3 space-y-1.5">
      <p className="text-xs font-medium text-muted-foreground">{t("sidebar.openPayments")}</p>
      <p className="text-lg font-semibold tabular-nums">
        {formatCurrency(data.money.outstanding)}
      </p>
      <p className="text-xs text-muted-foreground">
        {t("sidebar.received")} {formatCurrency(data.money.received)}
      </p>
    </div>
  );
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const { t } = useI18n();
  const [searchOpen, setSearchOpen] = React.useState(false);
  const [formOpen, setFormOpen] = React.useState(false);
  const [uploadOpen, setUploadOpen] = React.useState(false);
  const [mobileOpen, setMobileOpen] = React.useState(false);

  React.useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setSearchOpen(true);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  return (
    <div className="flex min-h-screen w-full bg-muted/20">
      {/* Desktop sidebar */}
      <aside className="hidden md:flex md:w-60 md:flex-col md:fixed md:inset-y-0 border-r bg-background p-4">
        <BrandLogo />
        <div className="mt-6">
          <NavLinks />
        </div>
        <div className="mt-6 flex flex-col gap-2">
          <Button onClick={() => setFormOpen(true)} className="w-full gap-2">
            <Plus className="h-4 w-4" />
            {t("action.newPromo")}
          </Button>
          <Button
            onClick={() => setUploadOpen(true)}
            variant="outline"
            className="w-full gap-2 border-pink-200 text-pink-600 hover:bg-pink-50 hover:text-pink-700 dark:border-pink-900/50 dark:text-pink-400 dark:hover:bg-pink-950/30"
          >
            <Video className="h-4 w-4" />
            {t("action.upload")}
          </Button>
        </div>
        <div className="mt-6">
          <MoneySummary />
        </div>
      </aside>

      {/* Mobile sidebar */}
      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent side="left" className="w-72 p-4 flex flex-col">
          <SheetTitle className="sr-only">Navigation</SheetTitle>
          <BrandLogo />
          <div className="mt-6">
            <NavLinks onNavigate={() => setMobileOpen(false)} />
          </div>
          <div className="mt-6 flex flex-col gap-2">
            <Button
              onClick={() => {
                setMobileOpen(false);
                setFormOpen(true);
              }}
              className="w-full gap-2"
            >
              <Plus className="h-4 w-4" />
              {t("action.newPromo")}
            </Button>
            <Button
              onClick={() => {
                setMobileOpen(false);
                setUploadOpen(true);
              }}
              variant="outline"
              className="w-full gap-2 border-pink-200 text-pink-600 hover:bg-pink-50 hover:text-pink-700 dark:border-pink-900/50 dark:text-pink-400 dark:hover:bg-pink-950/30"
            >
              <Video className="h-4 w-4" />
              {t("action.upload")}
            </Button>
          </div>
          <div className="mt-6">
            <MoneySummary />
          </div>
        </SheetContent>
      </Sheet>

      {/* Main */}
      <div className="flex flex-1 flex-col md:pl-60 min-w-0">
        <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b bg-background/80 px-4 backdrop-blur md:px-6">
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={() => setMobileOpen(true)}
            aria-label={t("action.openMenu")}
          >
            <Menu className="h-5 w-5" />
          </Button>

          <div className="flex-1">
            <SearchTrigger onOpen={() => setSearchOpen(true)} />
          </div>
          <div className="flex items-center gap-2">
            <Button
              onClick={() => setUploadOpen(true)}
              size="sm"
              variant="outline"
              className="gap-2 border-pink-200 text-pink-600 hover:bg-pink-50 hover:text-pink-700 dark:border-pink-900/50 dark:text-pink-400 dark:hover:bg-pink-950/30"
            >
              <Video className="h-4 w-4" />
              <span className="hidden sm:inline">{t("action.upload")}</span>
            </Button>
            <Button
              onClick={() => setFormOpen(true)}
              size="sm"
              className="gap-2"
            >
              <Plus className="h-4 w-4" />
              <span className="hidden sm:inline">{t("action.newPromo")}</span>
            </Button>
            <LanguageToggle />
            <ThemeToggle />
          </div>
        </header>

        <main className="flex-1 p-4 md:p-6 lg:p-8 min-w-0">{children}</main>

        <footer className="mt-auto border-t bg-background px-4 py-4 text-center text-xs text-muted-foreground md:px-6">
          {t("app.footer")}
        </footer>
      </div>

      <GlobalSearch open={searchOpen} onOpenChange={setSearchOpen} />
      <PromoFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        mode="create"
      />
      <QuickAddTiktokDialog open={uploadOpen} onOpenChange={setUploadOpen} />
    </div>
  );
}
