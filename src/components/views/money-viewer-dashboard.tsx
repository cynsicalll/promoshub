"use client";

import * as React from "react";
import { useAuth } from "@/components/auth-provider";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatCard } from "@/components/stat-card";
import { PaymentStatusBadge } from "@/components/status-badges";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AudioLines,
  Wallet,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  LogOut,
  Eye,
  BarChart3,
} from "lucide-react";
import {
  formatCurrency,
  formatDate,
  computePaymentStatus,
} from "@/lib/format";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { useI18n } from "@/components/language-provider";
import { LanguageToggle } from "@/components/language-toggle";

interface ViewerPayment {
  id: string;
  date: string;
  amount: number;
  paidOut: boolean;
  received: boolean;
  expectedDate: string | null;
  receivedDate: string | null;
  payoutDate: string | null;
  status: string;
}

interface ViewerData {
  user: { userId: string; username: string; role: string; displayName: string | null };
  payments: ViewerPayment[];
  totals: {
    totalAmount: number;
    totalReceived: number;
    totalOutstanding: number;
    totalOverdue: number;
    count: number;
  };
}

export function MoneyViewerDashboard() {
  const { t } = useI18n();
  const { user, logout } = useAuth();
  const [data, setData] = React.useState<ViewerData | null>(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    fetch("/api/viewer-data")
      .then(async (r) => {
        if (!r.ok) throw new Error("Failed");
        return r.json();
      })
      .then((d: ViewerData) => {
        setData(d);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50/40 via-background to-teal-50/40 dark:from-emerald-950/10 dark:via-background dark:to-teal-950/10">
      {/* Header */}
      <header className="sticky top-0 z-30 border-b bg-background/80 backdrop-blur">
        <div className="mx-auto max-w-5xl px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-sm">
              <AudioLines className="h-5 w-5" />
            </div>
            <div className="leading-tight">
              <p className="text-sm font-semibold tracking-tight">PromoHub</p>
              <p className="text-[11px] text-muted-foreground flex items-center gap-1">
                <Eye className="h-2.5 w-2.5" />
                {user?.displayName || user?.username}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <LanguageToggle />
            <Button variant="outline" size="sm" onClick={logout} className="gap-2">
              <LogOut className="h-4 w-4" /> {t("customer.logout")}
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-6 space-y-5">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight flex items-center gap-2">
            <Wallet className="h-6 w-6 text-muted-foreground" />
            {t("viewer.title")}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {t("viewer.subtitle")}
          </p>
        </div>

        {loading ? (
          <Card className="p-10 text-center">
            <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-muted border-t-emerald-500" />
            <p className="mt-3 text-sm text-muted-foreground">{t("action.loading")}</p>
          </Card>
        ) : !data ? (
          <Card className="p-10 text-center">
            <p className="text-sm text-muted-foreground">{t("viewer.noData")}</p>
          </Card>
        ) : (
          <>
            {/* KPIs */}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <StatCard
                label={t("viewer.total")}
                value={formatCurrency(data.totals.totalAmount)}
                icon={Wallet}
              />
              <StatCard
                label={t("viewer.received")}
                value={formatCurrency(data.totals.totalReceived)}
                icon={TrendingUp}
                tone="emerald"
              />
              <StatCard
                label={t("viewer.outstanding")}
                value={formatCurrency(data.totals.totalOutstanding)}
                icon={TrendingDown}
                tone="amber"
              />
              <StatCard
                label={t("viewer.overdue")}
                value={formatCurrency(data.totals.totalOverdue)}
                icon={AlertTriangle}
                tone={data.totals.totalOverdue > 0 ? "rose" : "default"}
              />
            </div>

            {/* Charts */}
            <div className="grid gap-4 lg:grid-cols-3">
              {/* Monthly bar chart */}
              <Card className="lg:col-span-2 p-5">
                <div className="flex items-center gap-2 mb-4">
                  <BarChart3 className="h-4 w-4 text-muted-foreground" />
                  <h3 className="font-semibold">{t("viewer.chartTitle")}</h3>
                </div>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={(() => {
                        const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
                        const months = new Map<string, { label: string; earned: number; received: number }>();
                        for (const p of data.payments) {
                          const d = new Date(p.date);
                          const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
                          const label = `${monthNames[d.getMonth()]} ${String(d.getFullYear()).slice(2)}`;
                          if (!months.has(key)) months.set(key, { label, earned: 0, received: 0 });
                          const entry = months.get(key)!;
                          entry.earned += p.amount;
                          if (p.received) entry.received += p.amount;
                        }
                        return Array.from(months.values()).sort((a, b) => a.label.localeCompare(b.label));
                      })()}
                      barGap={4}
                    >
                      <CartesianGrid strokeDasharray="3 3" vertical={false} className="stroke-border" />
                      <XAxis dataKey="label" tickLine={false} axisLine={false} fontSize={11} className="fill-muted-foreground" />
                      <YAxis tickLine={false} axisLine={false} fontSize={11} className="fill-muted-foreground" width={48} tickFormatter={(v) => `${v}€`} />
                      <Tooltip
                        formatter={(v: number) => formatCurrency(v)}
                        contentStyle={{ borderRadius: 8, border: "1px solid var(--border)", fontSize: 12 }}
                      />
                      <Legend wrapperStyle={{ fontSize: 12 }} />
                      <Bar dataKey="earned" name={t("viewer.earned")} fill="#10b981" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="received" name={t("viewer.received")} fill="#0d9488" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </Card>

              {/* Status pie chart */}
              <Card className="p-5">
                <div className="flex items-center gap-2 mb-4">
                  <BarChart3 className="h-4 w-4 text-muted-foreground" />
                  <h3 className="font-semibold">{t("viewer.statusChart")}</h3>
                </div>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    {(() => {
                      const statusCounts = { OFFEN: 0, AUSGEZAHLT: 0, ANGEKOMMEN: 0, UEBERFAELLIG: 0 };
                      for (const p of data.payments) {
                        const s = computePaymentStatus(p.paidOut, p.received, p.expectedDate) as keyof typeof statusCounts;
                        statusCounts[s]++;
                      }
                      const chartData = [
                        { name: t("payStatus.OFFEN"), value: statusCounts.OFFEN, color: "#94a3b8" },
                        { name: t("payStatus.AUSGEZAHLT"), value: statusCounts.AUSGEZAHLT, color: "#f59e0b" },
                        { name: t("payStatus.ANGEKOMMEN"), value: statusCounts.ANGEKOMMEN, color: "#10b981" },
                        { name: t("payStatus.UEBERFAELLIG"), value: statusCounts.UEBERFAELLIG, color: "#f43f5e" },
                      ].filter(d => d.value > 0);

                      if (chartData.length === 0) {
                        return <div className="flex h-full items-center justify-center text-sm text-muted-foreground">{t("viewer.noPayments")}</div>;
                      }

                      return (
                        <PieChart>
                          <Pie data={chartData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={70} innerRadius={40} paddingAngle={2}>
                            {chartData.map((entry, i) => (
                              <Cell key={i} fill={entry.color} />
                            ))}
                          </Pie>
                          <Tooltip
                            formatter={(v: number) => `${v} ${t("viewer.payments")}`}
                            contentStyle={{ borderRadius: 8, border: "1px solid var(--border)", fontSize: 12 }}
                          />
                          <Legend wrapperStyle={{ fontSize: 11 }} />
                        </PieChart>
                      );
                    })()}
                  </ResponsiveContainer>
                </div>
              </Card>
            </div>

            {/* Payments table */}
            <Card className="overflow-hidden">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/40 hover:bg-muted/40">
                      <TableHead className="w-[130px]">{t("viewer.col.date")}</TableHead>
                      <TableHead className="text-right w-[120px]">{t("viewer.col.amount")}</TableHead>
                      <TableHead className="text-center w-[100px]">{t("viewer.col.paidOut")}</TableHead>
                      <TableHead className="text-center w-[100px]">{t("viewer.col.received")}</TableHead>
                      <TableHead className="w-[130px]">{t("viewer.col.receivedDate")}</TableHead>
                      <TableHead className="w-[120px]">{t("viewer.col.status")}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.payments.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-12 text-muted-foreground">
                          {t("viewer.noPayments")}
                        </TableCell>
                      </TableRow>
                    ) : (
                      data.payments.map((p) => {
                        const overdue = p.status === "UEBERFAELLIG";
                        return (
                          <TableRow
                            key={p.id}
                            className={overdue ? "bg-rose-50/40 dark:bg-rose-950/10" : ""}
                          >
                            <TableCell className="text-sm text-muted-foreground">
                              {formatDate(p.date)}
                            </TableCell>
                            <TableCell className="text-right font-semibold tabular-nums">
                              {formatCurrency(p.amount)}
                            </TableCell>
                            <TableCell className="text-center">
                              <Checkbox checked={p.paidOut} disabled className="mx-auto" />
                            </TableCell>
                            <TableCell className="text-center">
                              <Checkbox checked={p.received} disabled className="mx-auto" />
                            </TableCell>
                            <TableCell className="text-sm text-muted-foreground">
                              {formatDate(p.receivedDate)}
                            </TableCell>
                            <TableCell>
                              <PaymentStatusBadge
                                paidOut={p.paidOut}
                                received={p.received}
                                expectedDate={p.expectedDate}
                              />
                            </TableCell>
                          </TableRow>
                        );
                      })
                    )}
                  </TableBody>
                </Table>
              </div>
            </Card>

            {/* Summary row */}
            <div className="flex items-center justify-between rounded-lg border bg-muted/30 px-4 py-3 text-sm">
              <span className="text-muted-foreground">
                {data.totals.count} {t("viewer.payments")}
              </span>
              <span className="font-semibold tabular-nums">
                <span className="text-emerald-600">{formatCurrency(data.totals.totalReceived)}</span>
                {" / "}
                <span className="text-amber-600">{formatCurrency(data.totals.totalOutstanding)}</span>
              </span>
            </div>
          </>
        )}
      </main>

      <footer className="border-t mt-10 py-4 text-center text-xs text-muted-foreground">
        PromoHub · Viewer
      </footer>
    </div>
  );
}
