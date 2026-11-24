"use client";

import * as React from "react";
import {
  usePayments,
  useUpdatePayment,
  useDeletePayment,
  useIsDemo,
} from "@/hooks/use-data";
import { useAppStore } from "@/lib/store";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { PaymentStatusBadge } from "@/components/status-badges";
import { StatCard } from "@/components/stat-card";
import {
  formatCurrency,
  formatDate,
  computePaymentStatus,
  formatDateInput,
  toISODate,
} from "@/lib/format";
import {
  Download,
  Search,
  Trash2,
  Wallet,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
} from "lucide-react";
import { toast } from "sonner";
import { useI18n } from "@/components/language-provider";
import {
  startOfWeek,
  startOfMonth,
  startOfDay,
  isAfter,
  isWithinInterval,
  subMonths,
} from "date-fns";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

type SortKey =
  | "promo"
  | "customer"
  | "amount"
  | "expectedDate"
  | "receivedDate"
  | "status";

export function MoneyView() {
  const { t } = useI18n();
  const isDemo = useIsDemo();
  const { data: payments = [], isLoading } = usePayments();
  const updatePayment = useUpdatePayment();
  const deletePayment = useDeletePayment();
  const openPromo = useAppStore((s) => s.openPromo);

  const [search, setSearch] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState("alle");
  const [periodFilter, setPeriodFilter] = React.useState("alle");
  const [deleteId, setDeleteId] = React.useState<string | null>(null);
  const [sortKey, setSortKey] = React.useState<SortKey>("expectedDate");
  const [sortDir, setSortDir] = React.useState<"asc" | "desc">("asc");

  function toggleSort(key: SortKey) {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
  }

  function inPeriod(date: string | null, period: string): boolean {
    if (!date) return false;
    const d = new Date(date);
    const now = new Date();
    switch (period) {
      case "heute":
        return startOfDay(d).getTime() === startOfDay(now).getTime();
      case "woche":
        return isAfter(d, startOfWeek(now, { weekStartsOn: 1 })) || d.getTime() === startOfWeek(now, { weekStartsOn: 1 }).getTime();
      case "monat":
        return isAfter(d, startOfMonth(now)) || d.getTime() === startOfMonth(now).getTime();
      case "letzter":
        return isWithinInterval(d, {
          start: startOfMonth(subMonths(now, 1)),
          end: startOfMonth(now),
        });
      default:
        return true;
    }
  }

  const filtered = React.useMemo(() => {
    let list = payments;
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (p) =>
          (p.promo?.name || "").toLowerCase().includes(q) ||
          (p.promo?.customer?.name || "").toLowerCase().includes(q) ||
          (p.notes || "").toLowerCase().includes(q) ||
          String(p.amount).includes(q)
      );
    }
    if (statusFilter !== "alle") {
      list = list.filter((p) => {
        const s = computePaymentStatus(p.paidOut, p.received, p.expectedDate);
        if (statusFilter === "offen") return s === "OFFEN";
        if (statusFilter === "ausgezahlt") return s === "AUSGEZAHLT";
        if (statusFilter === "angekommen") return s === "ANGEKOMMEN";
        if (statusFilter === "ueberfaellig") return s === "UEBERFAELLIG";
        return true;
      });
    }
    if (periodFilter !== "alle") {
      list = list.filter((p) => {
        const date = p.receivedDate || p.expectedDate;
        return inPeriod(date, periodFilter);
      });
    }

    // Sort
    const sorted = [...list].sort((a, b) => {
      let av: number | string = 0;
      let bv: number | string = 0;
      switch (sortKey) {
        case "promo":
          av = (a.promo?.name || "").toLowerCase();
          bv = (b.promo?.name || "").toLowerCase();
          break;
        case "customer":
          av = (a.promo?.customer?.name || "").toLowerCase();
          bv = (b.promo?.customer?.name || "").toLowerCase();
          break;
        case "amount":
          av = a.amount;
          bv = b.amount;
          break;
        case "expectedDate":
          av = a.expectedDate ? new Date(a.expectedDate).getTime() : 0;
          bv = b.expectedDate ? new Date(b.expectedDate).getTime() : 0;
          break;
        case "receivedDate":
          av = a.receivedDate ? new Date(a.receivedDate).getTime() : 0;
          bv = b.receivedDate ? new Date(b.receivedDate).getTime() : 0;
          break;
        case "status":
          av = computePaymentStatus(a.paidOut, a.received, a.expectedDate);
          bv = computePaymentStatus(b.paidOut, b.received, b.expectedDate);
          break;
      }
      if (av < bv) return sortDir === "asc" ? -1 : 1;
      if (av > bv) return sortDir === "asc" ? 1 : -1;
      return 0;
    });
    return sorted;
  }, [payments, search, statusFilter, periodFilter, sortKey, sortDir]);

  const totals = React.useMemo(() => {
    const total = filtered.reduce((s, p) => s + p.amount, 0);
    const received = filtered
      .filter((p) => p.received)
      .reduce((s, p) => s + p.amount, 0);
    const outstanding = total - received;
    const overdue = filtered
      .filter(
        (p) =>
          computePaymentStatus(p.paidOut, p.received, p.expectedDate) ===
          "UEBERFAELLIG"
      )
      .reduce((s, p) => s + p.amount, 0);
    return { total, received, outstanding, overdue };
  }, [filtered]);

  async function toggle(
    id: string,
    field: "paidOut" | "received",
    value: boolean
  ) {
    const patch: Record<string, unknown> = { [field]: value };
    if (field === "received" && value)
      patch.receivedDate = toISODate(formatDateInput(new Date()));
    if (field === "received" && !value) patch.receivedDate = null;
    if (field === "paidOut" && value)
      patch.payoutDate = toISODate(formatDateInput(new Date()));
    if (field === "paidOut" && !value) patch.payoutDate = null;
    try {
      await updatePayment.mutateAsync({ id, data: patch as never });
    } catch {
      toast.error(t("money.toast.updateError"));
    }
  }

  function handleExport() {
    window.open("/api/export?type=payments&format=csv", "_blank");
    toast.success(t("settings.exportStarted"));
  }

  async function handleDelete() {
    if (!deleteId) return;
    try {
      await deletePayment.mutateAsync(deleteId);
      toast.success(t("money.toast.paymentDeleted"));
    } catch {
      toast.error(t("money.toast.deleteFailed"));
    } finally {
      setDeleteId(null);
    }
  }

  function SortHeader({ label, k }: { label: string; k: SortKey }) {
    const active = sortKey === k;
    return (
      <button
        onClick={() => toggleSort(k)}
        className={`inline-flex items-center gap-1 hover:text-foreground ${
          active ? "text-foreground" : "text-muted-foreground"
        }`}
      >
        {label}
        {active ? (
          sortDir === "asc" ? (
            <ArrowUp className="h-3 w-3" />
          ) : (
            <ArrowDown className="h-3 w-3" />
          )
        ) : (
          <ArrowUpDown className="h-3 w-3 opacity-40" />
        )}
      </button>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{t("money.title")}</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {t("money.subtitle")}
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={handleExport} className="gap-2">
          <Download className="h-4 w-4" /> {t("action.export")}
        </Button>
      </div>

      {/* KPIs */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label={t("money.total")}
          value={formatCurrency(totals.total)}
          icon={Wallet}
        />
        <StatCard
          label={t("money.received")}
          value={formatCurrency(totals.received)}
          icon={TrendingUp}
          tone="emerald"
        />
        <StatCard
          label={t("money.outstanding")}
          value={formatCurrency(totals.outstanding)}
          icon={TrendingDown}
          tone="amber"
        />
        <StatCard
          label={t("money.overdue")}
          value={formatCurrency(totals.overdue)}
          icon={AlertTriangle}
          tone={totals.overdue > 0 ? "rose" : "default"}
        />
      </div>

      {/* Filters */}
      <Card className="p-3">
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={t("money.searchPlaceholder")}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[170px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="alle">{t("money.filter.allStatus")}</SelectItem>
              <SelectItem value="offen">{t("money.filter.open")}</SelectItem>
              <SelectItem value="ausgezahlt">{t("money.filter.paidOut")}</SelectItem>
              <SelectItem value="angekommen">{t("money.filter.received")}</SelectItem>
              <SelectItem value="ueberfaellig">{t("money.filter.overdue")}</SelectItem>
            </SelectContent>
          </Select>
          <Select value={periodFilter} onValueChange={setPeriodFilter}>
            <SelectTrigger className="w-[170px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="alle">{t("money.filter.allPeriod")}</SelectItem>
              <SelectItem value="heute">{t("money.filter.today")}</SelectItem>
              <SelectItem value="woche">{t("money.filter.thisWeek")}</SelectItem>
              <SelectItem value="monat">{t("money.filter.thisMonth")}</SelectItem>
              <SelectItem value="letzter">{t("money.filter.lastMonth")}</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </Card>

      {/* Table */}
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/40 hover:bg-muted/40">
                <TableHead className="min-w-[180px]"><SortHeader label={t("money.col.promo")} k="promo" /></TableHead>
                <TableHead className="min-w-[140px]"><SortHeader label={t("money.col.customer")} k="customer" /></TableHead>
                <TableHead className="text-right w-[110px]"><SortHeader label={t("money.col.amount")} k="amount" /></TableHead>
                <TableHead className="w-[120px]"><SortHeader label={t("money.col.expected")} k="expectedDate" /></TableHead>
                <TableHead className="w-[120px]"><SortHeader label={t("money.col.received")} k="receivedDate" /></TableHead>
                <TableHead className="text-center w-[90px]">{t("money.col.paidOut")}</TableHead>
                <TableHead className="text-center w-[110px]">{t("money.col.received2")}</TableHead>
                <TableHead className="w-[120px]"><SortHeader label={t("money.col.status")} k="status" /></TableHead>
                <TableHead className="w-[60px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <TableRow key={i}>
                    {Array.from({ length: 9 }).map((_, j) => (
                      <TableCell key={j}>
                        <div className="h-4 w-full rounded bg-muted/50 animate-pulse" />
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-12 text-muted-foreground">
                    <Wallet className="h-8 w-8 mx-auto mb-2 opacity-40" />
                    {t("money.noResults")}
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((p) => {
                  const status = computePaymentStatus(
                    p.paidOut,
                    p.received,
                    p.expectedDate
                  );
                  const overdue = status === "UEBERFAELLIG";
                  return (
                    <TableRow
                      key={p.id}
                      className={`cursor-pointer hover:bg-muted/40 ${
                        overdue ? "bg-rose-50/40 dark:bg-rose-950/10" : ""
                      }`}
                      onClick={() => openPromo(p.promo.id)}
                    >
                      <TableCell className="font-medium">
                        <div className="truncate max-w-[200px]">
                          {p.promo.name}
                        </div>
                        {p.notes && (
                          <div className="text-xs text-muted-foreground truncate max-w-[200px]">
                            {p.notes}
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {p.promo.customer?.name || "—"}
                      </TableCell>
                      <TableCell className="text-right font-semibold tabular-nums">
                        {formatCurrency(p.amount)}
                      </TableCell>
                      <TableCell
                        className={`text-sm ${
                          overdue ? "text-rose-600 font-medium" : "text-muted-foreground"
                        }`}
                      >
                        {formatDate(p.expectedDate)}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {formatDate(p.receivedDate)}
                      </TableCell>
                      <TableCell
                        className="text-center"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <Checkbox
                          checked={p.paidOut}
                          onCheckedChange={(v) => toggle(p.id, "paidOut", !!v)}
                          disabled={updatePayment.isPending}
                          className="mx-auto"
                        />
                      </TableCell>
                      <TableCell
                        className="text-center"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <Checkbox
                          checked={p.received}
                          onCheckedChange={(v) => toggle(p.id, "received", !!v)}
                          disabled={updatePayment.isPending}
                          className="mx-auto"
                        />
                      </TableCell>
                      <TableCell>
                        <PaymentStatusBadge
                          paidOut={p.paidOut}
                          received={p.received}
                          expectedDate={p.expectedDate}
                        />
                      </TableCell>
                      <TableCell
                        className="text-right"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {!isDemo && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-muted-foreground hover:text-rose-600"
                            onClick={() => setDeleteId(p.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      </Card>

      <AlertDialog open={!!deleteId} onOpenChange={(o) => !o && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("delete.paymentTitle")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("delete.paymentDesc")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("action.cancel")}</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-rose-600 hover:bg-rose-700 text-white"
            >
              {t("action.delete")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
