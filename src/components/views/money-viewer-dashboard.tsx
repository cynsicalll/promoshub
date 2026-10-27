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
  Bell,
  BellOff,
  Check,
  X,
  Loader2,
  Banknote,
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
import { usePushNotifications } from "@/hooks/use-push";
import { toast } from "sonner";

interface ViewerPayment {
  id: string;
  date: string;
  amount: number;
  splitAmount: number;
  splitUserId: string | null;
  isMySplit: boolean;
  paidOut: boolean;
  received: boolean;
  expectedDate: string | null;
  receivedDate: string | null;
  payoutDate: string | null;
  status: string;
  promoName: string | null;
}

interface ViewerData {
  user: { userId: string; username: string; role: string; displayName: string | null };
  payments: ViewerPayment[];
  totals: {
    totalAmount: number;
    totalReceived: number;
    totalOutstanding: number;
    totalOverdue: number;
    totalPaidOut: number;
    count: number;
  };
  splitTotals: {
    totalAmount: number;
    totalReceived: number;
    totalOutstanding: number;
    totalOverdue: number;
    totalPaidOut: number;
    count: number;
  } | null;
  isCollaborator: boolean;
}

export function MoneyViewerDashboard({ externalToken }: { externalToken?: string }) {
  const { t } = useI18n();
  const { user, logout } = useAuth();
  const [data, setData] = React.useState<ViewerData | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [activeTab, setActiveTab] = React.useState<"overview" | "mysplit">("overview");
  const [pendingApprovals, setPendingApprovals] = React.useState<Array<{
    id: string;
    payment: { amount: number; promo?: { name: string } };
    message: string | null;
    createdAt: string;
  }>>([]);
  const [approving, setApproving] = React.useState<string | null>(null);
  const [viewerToken, setViewerToken] = React.useState<string | null>(externalToken || null);
  const [viewerName, setViewerName] = React.useState<string | null>(null);
  const push = usePushNotifications(viewerToken);

  // Fetch viewer's shareToken + display name
  React.useEffect(() => {
    if (externalToken) {
      // Accessed via shareToken URL — fetch viewer info from customer-link API
      setViewerToken(externalToken);
      fetch(`/api/customer-link/${externalToken}`)
        .then((r) => r.json())
        .then((data) => {
          if (data.user?.displayName) setViewerName(data.user.displayName);
        })
        .catch(() => {});
      return;
    }
    // Accessed via login — get shareToken from auth
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((userData) => {
        if (userData.user?.shareToken) {
          setViewerToken(userData.user.shareToken);
        }
      })
      .catch(() => {});
  }, [externalToken]);

  // Fetch pending approvals
  React.useEffect(() => {
    if (!viewerToken) return;
    let cancelled = false;
    async function fetchApprovals() {
      try {
        const res = await fetch(`/api/payment-approvals?approverToken=${viewerToken}`);
        if (!res.ok) return;
        const data = await res.json();
        if (!cancelled) setPendingApprovals(data);
      } catch { /* ignore */ }
    }
    fetchApprovals();
    const interval = setInterval(fetchApprovals, 15000);
    return () => { cancelled = true; clearInterval(interval); };
  }, [viewerToken]);

  // Handle approve/deny
  async function handleApproval(approvalId: string, action: "approve" | "deny") {
    if (!viewerToken) return;
    setApproving(approvalId);
    try {
      const res = await fetch(`/api/payment-approvals/${approvalId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ approverToken: viewerToken, action }),
      });
      if (!res.ok) throw new Error("Failed");
      setPendingApprovals((prev) => prev.filter((a) => a.id !== approvalId));
      // Refresh data to show updated payment status
      if (action === "approve") {
        const url = externalToken ? `/api/viewer-data?token=${externalToken}` : "/api/viewer-data";
        fetch(url)
          .then((r) => r.json())
          .then((d: ViewerData) => setData(d))
          .catch(() => {});
      }
    } catch {
      // ignore
    } finally {
      setApproving(null);
    }
  }

  React.useEffect(() => {
    const url = externalToken ? `/api/viewer-data?token=${externalToken}` : "/api/viewer-data";
    fetch(url)
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
    <div className={`min-h-screen bg-gradient-to-br from-indigo-50/40 via-background to-purple-50/40 dark:from-indigo-950/10 dark:via-background dark:to-purple-950/10 ${typeof window !== "undefined" && localStorage.getItem("promos-ui-prefs")?.includes('"liquidGlass":true') ? "liquid-glass" : ""}`}>
      {/* Header */}
      <header className="sticky top-0 z-30 border-b bg-background/80 backdrop-blur">
        <div className="mx-auto max-w-5xl px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-sm">
              <AudioLines className="h-5 w-5" />
            </div>
            <div className="leading-tight">
              <p className="text-sm font-semibold tracking-tight">Promos</p>
              <p className="text-[11px] text-muted-foreground flex items-center gap-1">
                <Eye className="h-2.5 w-2.5" />
                {viewerName || user?.displayName || user?.username || "Viewer"}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {/* Push notification toggle — always show when viewerToken is available */}
            {viewerToken && (
              <Button
                variant={push.subscribed ? "default" : "outline"}
                onClick={() => {
                  if (!push.supported) {
                    // Show helpful message based on platform
                    if (push.platform.isIOS && !push.platform.isStandalone) {
                      toast.info("To enable notifications on iPhone:", {
                        description: "1. Tap the Share button at the bottom\n2. Scroll down and tap 'Add to Home Screen'\n3. Open the app from your Home Screen\n4. Then tap the bell button again",
                        duration: 10000,
                      });
                    } else {
                      toast.error("Push notifications not supported in this browser.", {
                        description: "Try Chrome on Android/desktop, or Safari on iOS (Add to Home Screen first).",
                        duration: 8000,
                      });
                    }
                    return;
                  }
                  if (push.subscribed) {
                    push.unsubscribe();
                  } else {
                    push.subscribe().then((result) => {
                      if (!result.success) {
                        toast.error("Failed to enable notifications", {
                          description: result.error,
                          duration: 10000,
                        });
                      } else {
                        toast.success("Notifications enabled!", {
                          description: "You'll receive push notifications for payment approvals.",
                        });
                      }
                    });
                  }
                }}
                disabled={push.loading}
                className="gap-2 h-10 px-3 touch-manipulation relative z-40"
                title={
                  !push.supported
                    ? push.platform.isIOS && !push.platform.isStandalone
                      ? "Add to Home Screen first, then enable notifications"
                      : "Push notifications not supported in this browser"
                    : push.subscribed
                      ? "Notifications enabled — click to disable"
                      : "Enable push notifications"
                }
              >
                {push.loading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : push.subscribed ? (
                  <>
                    <Bell className="h-4 w-4" />
                    {pendingApprovals.length > 0 && (
                      <span className="flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
                        {pendingApprovals.length}
                      </span>
                    )}
                  </>
                ) : (
                  <>
                    <BellOff className="h-4 w-4" />
                    <span className="text-xs font-medium">
                      {push.supported ? "Enable" : push.platform.isIOS ? "Add to Home" : "N/A"}
                    </span>
                  </>
                )}
              </Button>
            )}
            <LanguageToggle />
            {/* Only show logout button when logged in (not when accessed via externalToken) */}
            {!externalToken && user && (
              <Button variant="outline" size="sm" onClick={logout} className="gap-2">
                <LogOut className="h-4 w-4" /> {t("customer.logout")}
              </Button>
            )}
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

        {/* Pending payment approvals (PNR) */}
        {pendingApprovals.length > 0 && (
          <Card className="p-4 space-y-3 border-amber-200 dark:border-amber-900/50 bg-amber-50/50 dark:bg-amber-950/20">
            <div className="flex items-center gap-2">
              <Bell className="h-4 w-4 text-amber-500" />
              <h3 className="font-semibold text-sm">Payment Approvals Needed</h3>
            </div>
            {pendingApprovals.map((a) => (
              <div key={a.id} className="flex items-center justify-between gap-3 rounded-lg border bg-background p-3">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium">
                    {a.payment.promo?.name || "Payment"}:{" "}
                    <span className="text-emerald-600 dark:text-emerald-400 font-bold">
                      {a.payment.amount.toLocaleString("en-US", { style: "currency", currency: "EUR" })}
                    </span>
                  </p>
                  {a.message && <p className="text-xs text-muted-foreground truncate">{a.message}</p>}
                </div>
                <div className="flex gap-2 shrink-0">
                  <Button
                    size="sm"
                    onClick={() => handleApproval(a.id, "approve")}
                    disabled={approving === a.id}
                    className="gap-1 bg-emerald-600 hover:bg-emerald-700"
                  >
                    {approving === a.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <Check className="h-3 w-3" />}
                    Approve
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleApproval(a.id, "deny")}
                    disabled={approving === a.id}
                    className="gap-1"
                  >
                    <X className="h-3 w-3" />
                    Deny
                  </Button>
                </div>
              </div>
            ))}
          </Card>
        )}

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
            {/* Tabs for collaborator: Overview vs My Split */}
            {data.isCollaborator && data.splitTotals && (
              <div className="flex gap-2 border-b">
                <button
                  onClick={() => setActiveTab("overview")}
                  className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 -mb-px ${activeTab === "overview" ? "border-indigo-500 text-indigo-600 dark:text-indigo-400" : "border-transparent text-muted-foreground hover:text-foreground"}`}
                >
                  Overview (All)
                </button>
                <button
                  onClick={() => setActiveTab("mysplit")}
                  className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 -mb-px ${activeTab === "mysplit" ? "border-indigo-500 text-indigo-600 dark:text-indigo-400" : "border-transparent text-muted-foreground hover:text-foreground"}`}
                >
                  My Split
                </button>
              </div>
            )}

            {/* KPIs — use split totals when on My Split tab */}
            {(() => {
              const activeTotals = activeTab === "mysplit" && data.splitTotals ? data.splitTotals : data.totals;
              return (
            <>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
              <StatCard
                label={activeTab === "mysplit" ? "My Split Total" : t("viewer.total")}
                value={formatCurrency(activeTotals.totalAmount)}
                icon={Wallet}
              />
              <StatCard
                label="Paid Out"
                value={formatCurrency(activeTotals.totalPaidOut || 0)}
                icon={Banknote}
                tone="teal"
              />
              <StatCard
                label={t("viewer.received")}
                value={formatCurrency(activeTotals.totalReceived)}
                icon={TrendingUp}
                tone="emerald"
              />
              <StatCard
                label={t("viewer.outstanding")}
                value={formatCurrency(activeTotals.totalOutstanding)}
                icon={TrendingDown}
                tone="amber"
              />
              <StatCard
                label={t("viewer.overdue")}
                value={formatCurrency(activeTotals.totalOverdue)}
                icon={AlertTriangle}
                tone={activeTotals.totalOverdue > 0 ? "rose" : "default"}
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
                        // Sort chronologically by key (oldest first for the chart)
                        return Array.from(months.entries())
                          .sort((a, b) => a[0].localeCompare(b[0]))
                          .map(([, val]) => val);
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
            </>
            );
            })()}

            {/* Payments table */}
            <Card className="overflow-hidden">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/40 hover:bg-muted/40">
                      <TableHead>{t("viewer.col.date")}</TableHead>
                      <TableHead>Promo</TableHead>
                      <TableHead className="text-right">{activeTab === "mysplit" ? "My Split" : t("viewer.col.amount")}</TableHead>
                      {activeTab === "overview" && data.isCollaborator && <TableHead className="text-right">Split</TableHead>}
                      <TableHead className="text-center">Paid Out</TableHead>
                      <TableHead className="text-center">Received</TableHead>
                      <TableHead>{t("viewer.col.status")}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(activeTab === "mysplit" ? data.payments.filter((p) => p.isMySplit) : data.payments).length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-12 text-muted-foreground">
                          {t("viewer.noPayments")}
                        </TableCell>
                      </TableRow>
                    ) : (
                      (activeTab === "mysplit" ? data.payments.filter((p) => p.isMySplit) : data.payments).map((p) => {
                        const overdue = p.status === "UEBERFAELLIG";
                        const displayAmount = activeTab === "mysplit" ? p.splitAmount : p.amount;
                        return (
                          <TableRow
                            key={p.id}
                            className={overdue ? "bg-rose-50/40 dark:bg-rose-950/10" : ""}
                          >
                            <TableCell className="text-sm text-muted-foreground">
                              {formatDate(p.date)}
                            </TableCell>
                            <TableCell className="text-sm font-medium">
                              {p.promoName || "—"}
                            </TableCell>
                            <TableCell className="text-right font-semibold tabular-nums">
                              {formatCurrency(displayAmount)}
                            </TableCell>
                            {activeTab === "overview" && data.isCollaborator && (
                              <TableCell className="text-right tabular-nums text-muted-foreground">
                                {p.isMySplit ? formatCurrency(p.splitAmount) : "—"}
                              </TableCell>
                            )}
                            <TableCell className="text-center">
                              <Checkbox checked={p.paidOut} disabled className="mx-auto" />
                            </TableCell>
                            <TableCell className="text-center">
                              <Checkbox checked={p.received} disabled className="mx-auto" />
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
            {(() => {
              const activeTotals = activeTab === "mysplit" && data.splitTotals ? data.splitTotals : data.totals;
              return (
            <div className="flex items-center justify-between rounded-lg border bg-muted/30 px-4 py-3 text-sm">
              <span className="text-muted-foreground">
                {activeTotals.count} {t("viewer.payments")}
              </span>
              <span className="font-semibold tabular-nums">
                <span className="text-emerald-600">{formatCurrency(activeTotals.totalReceived)}</span>
                {" / "}
                <span className="text-amber-600">{formatCurrency(activeTotals.totalOutstanding)}</span>
              </span>
            </div>
              );
            })()}
          </>
        )}
      </main>

      <footer className="border-t mt-10 py-4 text-center text-xs text-muted-foreground">
        Promos · Viewer
      </footer>
    </div>
  );
}
