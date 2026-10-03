"use client";

import * as React from "react";
import { useAppStore, type ViewKey } from "@/lib/store";
import { cn } from "@/lib/utils";
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
} from "lucide-react";
import { useTheme } from "next-themes";
import { GlobalSearch, SearchTrigger } from "@/components/global-search";
import { PromoFormDialog } from "@/components/views/promo-form-dialog";
import { useDashboard } from "@/hooks/use-data";
import { formatCurrency } from "@/lib/format";

interface NavItem {
  key: ViewKey;
  label: string;
  icon: React.ElementType;
}

const NAV: NavItem[] = [
  { key: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { key: "promos", label: "Promos", icon: Megaphone },
  { key: "money", label: "Geld", icon: Wallet },
  { key: "sounds", label: "Sounds", icon: Music2 },
  { key: "customers", label: "Kunden", icon: Users },
  { key: "settings", label: "Einstellungen", icon: Settings },
];

function BrandLogo() {
  return (
    <div className="flex items-center gap-2.5">
      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-sm">
        <AudioLines className="h-5 w-5" />
      </div>
      <div className="leading-tight">
        <p className="text-sm font-semibold tracking-tight">PromoHub</p>
        <p className="text-[11px] text-muted-foreground">Sound Promo Manager</p>
      </div>
    </div>
  );
}

function ThemeToggle() {
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
      aria-label="Theme wechseln"
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
  const view = useAppStore((s) => s.view);
  const setView = useAppStore((s) => s.setView);
  // promo-detail should highlight promos
  const activeKey: ViewKey = view === "promo-detail" ? "promos" : view;

  return (
    <nav className="flex flex-col gap-1">
      {NAV.map((item) => {
        const Icon = item.icon;
        const active = activeKey === item.key;
        return (
          <button
            key={item.key}
            onClick={() => {
              setView(item.key);
              onNavigate?.();
            }}
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
              active
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            )}
          >
            <Icon className="h-4 w-4" />
            {item.label}
          </button>
        );
      })}
    </nav>
  );
}

function MoneySummary() {
  const { data } = useDashboard();
  if (!data) return null;
  return (
    <div className="mt-auto rounded-lg border bg-muted/30 p-3 space-y-1.5">
      <p className="text-xs font-medium text-muted-foreground">Offene Zahlungen</p>
      <p className="text-lg font-semibold tabular-nums">
        {formatCurrency(data.money.outstanding)}
      </p>
      <p className="text-xs text-muted-foreground">
        Erhalten: {formatCurrency(data.money.received)}
      </p>
    </div>
  );
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const [searchOpen, setSearchOpen] = React.useState(false);
  const [formOpen, setFormOpen] = React.useState(false);
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
            Neue Promo
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
          <div className="mt-6">
            <Button
              onClick={() => {
                setMobileOpen(false);
                setFormOpen(true);
              }}
              className="w-full gap-2"
            >
              <Plus className="h-4 w-4" />
              Neue Promo
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
            aria-label="Menü öffnen"
          >
            <Menu className="h-5 w-5" />
          </Button>

          <div className="flex-1">
            <SearchTrigger onOpen={() => setSearchOpen(true)} />
          </div>
          <div className="flex items-center gap-2">
            <Button
              onClick={() => setFormOpen(true)}
              size="sm"
              className="gap-2"
            >
              <Plus className="h-4 w-4" />
              <span className="hidden sm:inline">Neue Promo</span>
            </Button>
            <ThemeToggle />
          </div>
        </header>

        <main className="flex-1 p-4 md:p-6 lg:p-8 min-w-0">{children}</main>

        <footer className="mt-auto border-t bg-background px-4 py-4 text-center text-xs text-muted-foreground md:px-6">
          PromoHub · Sound-Promo-Verwaltung · Daten werden lokal in SQLite gespeichert
        </footer>
      </div>

      <GlobalSearch open={searchOpen} onOpenChange={setSearchOpen} />
      <PromoFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        mode="create"
      />
    </div>
  );
}
