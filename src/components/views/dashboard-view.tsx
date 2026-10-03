"use client";

import { useDashboard } from "@/hooks/use-data";
import { StatCard } from "@/components/stat-card";
import { Card } from "@/components/ui/card";
import { PromoStatusBadge, PaymentStatusBadge } from "@/components/status-badges";
import { useAppStore } from "@/lib/store";
import {
  formatCurrency,
  formatDate,
  computePaymentStatus,
  promoSoundsRemaining,
} from "@/lib/format";
import {
  Megaphone,
  CheckCircle2,
  Clock,
  Music2,
  Wallet,
  TrendingUp,
  TrendingDown,
  Banknote,
  AlertTriangle,
  ArrowRight,
  CircleSlash,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from "recharts";

export function DashboardView() {
  const { data, isLoading } = useDashboard();
  const openPromo = useAppStore((s) => s.openPromo);
  const setView = useAppStore((s) => s.setView);

  if (isLoading || !data) {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i} className="h-28 animate-pulse bg-muted/40" />
          ))}
        </div>
        <Card className="h-64 animate-pulse bg-muted/40" />
      </div>
    );
  }

  const { counts, money, recentPromos, recentPayments, overduePayments, monthly } =
    data;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Überblick über deine Promos, Sounds und Zahlungen.
        </p>
      </div>

      {/* Promos KPIs */}
      <div>
        <h2 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-3">
          Promos
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            label="Promos gesamt"
            value={counts.total}
            hint={`${counts.aktiv} aktiv · ${counts.geplant} geplant`}
            icon={Megaphone}
          />
          <StatCard
            label="Aktive / Offene"
            value={counts.aktiv + counts.geplant}
            hint={`${counts.abgeschlossen} abgeschlossen`}
            icon={Clock}
            tone="amber"
          />
          <StatCard
            label="Abgeschlossen"
            value={counts.abgeschlossen}
            hint={`${counts.storniert} storniert`}
            icon={CheckCircle2}
            tone="teal"
          />
          <StatCard
            label="Sounds übrig"
            value={counts.openSoundsRemaining}
            hint="Verbleibende Nutzungen"
            icon={Music2}
            tone="emerald"
          />
        </div>
      </div>

      {/* Money KPIs */}
      <div>
        <h2 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-3">
          Geld
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            label="Gesamtverdienst"
            value={formatCurrency(money.totalEarned)}
            hint="Summe aller Promos"
            icon={Wallet}
          />
          <StatCard
            label="Bereits erhalten"
            value={formatCurrency(money.received)}
            hint="Angekommene Zahlungen"
            icon={TrendingUp}
            tone="emerald"
          />
          <StatCard
            label="Noch ausstehend"
            value={formatCurrency(money.outstanding)}
            hint="Noch nicht angekommen"
            icon={TrendingDown}
            tone="rose"
          />
          <StatCard
            label="Ausgezahlt, nicht angekommen"
            value={formatCurrency(money.paidOut - money.received > 0 ? money.paidOut - money.received : 0)}
            hint={`Ausgezahlt: ${formatCurrency(money.paidOut)}`}
            icon={Banknote}
            tone="amber"
          />
        </div>
      </div>

      {/* Chart + Overdue */}
      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2 p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-semibold">Verdienst & Eingänge</h3>
              <p className="text-xs text-muted-foreground">Letzte 6 Monate</p>
            </div>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthly} barGap={4}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} className="stroke-border" />
                <XAxis dataKey="month" tickLine={false} axisLine={false} fontSize={12} className="fill-muted-foreground" />
                <YAxis tickLine={false} axisLine={false} fontSize={12} className="fill-muted-foreground" width={48} tickFormatter={(v) => `${v}€`} />
                <Tooltip
                  formatter={(v: number) => formatCurrency(v)}
                  contentStyle={{
                    borderRadius: 8,
                    border: "1px solid var(--border)",
                    fontSize: 12,
                  }}
                />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Bar dataKey="earned" name="Verdienst" fill="#10b981" radius={[4, 4, 0, 0]} />
                <Bar dataKey="received" name="Erhalten" fill="#0d9488" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="p-5">
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle className="h-4 w-4 text-rose-500" />
            <h3 className="font-semibold">Überfällige Zahlungen</h3>
          </div>
          {overduePayments.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-center">
              <CircleSlash className="h-8 w-8 text-muted-foreground/40 mb-2" />
              <p className="text-sm text-muted-foreground">
                Keine überfälligen Zahlungen.
              </p>
            </div>
          ) : (
            <ScrollArea className="max-h-72">
              <div className="space-y-2 pr-2">
                {overduePayments.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => openPromo(p.promo.id)}
                    className="w-full text-left rounded-lg border border-rose-200 dark:border-rose-900/50 bg-rose-50/50 dark:bg-rose-950/20 p-3 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-medium text-sm truncate">
                        {p.promo.name}
                      </span>
                      <span className="font-semibold text-sm tabular-nums text-rose-600">
                        {formatCurrency(p.amount)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between mt-1">
                      <span className="text-xs text-muted-foreground truncate">
                        {p.promo.customer?.name || "—"}
                      </span>
                      <span className="text-xs text-rose-600">
                        seit {formatDate(p.expectedDate)}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            </ScrollArea>
          )}
        </Card>
      </div>

      {/* Recent lists */}
      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="p-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold">Letzte Promos</h3>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setView("promos")}
              className="gap-1 text-muted-foreground"
            >
              Alle <ArrowRight className="h-3.5 w-3.5" />
            </Button>
          </div>
          <div className="divide-y">
            {recentPromos.length === 0 ? (
              <p className="text-sm text-muted-foreground py-6 text-center">
                Noch keine Promos angelegt.
              </p>
            ) : (
              recentPromos.map((p) => (
                <button
                  key={p.id}
                  onClick={() => openPromo(p.id)}
                  className="flex w-full items-center gap-3 py-2.5 text-left hover:bg-muted/40 -mx-2 px-2 rounded transition-colors"
                >
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-sm truncate">{p.name}</p>
                    <p className="text-xs text-muted-foreground truncate">
                      {p.customer?.name || "—"} · {formatDate(p.date)}
                    </p>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <span className="text-sm font-medium tabular-nums">
                      {formatCurrency(
                        p.payments.reduce((s, x) => s + x.amount, 0)
                      )}
                    </span>
                    <PromoStatusBadge status={p.status} />
                  </div>
                </button>
              ))
            )}
          </div>
        </Card>

        <Card className="p-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold">Letzte Zahlungen</h3>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setView("money")}
              className="gap-1 text-muted-foreground"
            >
              Alle <ArrowRight className="h-3.5 w-3.5" />
            </Button>
          </div>
          <div className="divide-y">
            {recentPayments.length === 0 ? (
              <p className="text-sm text-muted-foreground py-6 text-center">
                Noch keine Zahlungen eingegangen.
              </p>
            ) : (
              recentPayments.map((p) => (
                <button
                  key={p.id}
                  onClick={() => openPromo(p.promo.id)}
                  className="flex w-full items-center gap-3 py-2.5 text-left hover:bg-muted/40 -mx-2 px-2 rounded transition-colors"
                >
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-sm truncate">
                      {p.promo.name}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">
                      Eingang {formatDate(p.receivedDate)}
                    </p>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <span className="text-sm font-semibold tabular-nums text-emerald-600">
                      +{formatCurrency(p.amount)}
                    </span>
                    <PaymentStatusBadge
                      paidOut={p.paidOut}
                      received={p.received}
                      expectedDate={p.expectedDate}
                    />
                  </div>
                </button>
              ))
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
