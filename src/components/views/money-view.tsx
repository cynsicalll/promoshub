"use client";

import * as React from "react";
import {
  usePayments,
  useUpdatePayment,
  useDeletePayment,
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
  Clock,
  AlertTriangle,
} from "lucide-react";
import { toast } from "sonner";
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

export function MoneyView() {
  const { data: payments = [], isLoading } = usePayments();
  const updatePayment = useUpdatePayment();
  const deletePayment = useDeletePayment();
  const openPromo = useAppStore((s) => s.openPromo);

  const [search, setSearch] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState("alle");
  const [periodFilter, setPeriodFilter] = React.useState("alle");
  const [deleteId, setDeleteId] = React.useState<string | null>(null);

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
    return list;
  }, [payments, search, statusFilter, periodFilter]);

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
      toast.error("Fehler beim Aktualisieren");
    }
  }

  function handleExport() {
    window.open("/api/export?type=payments&format=csv", "_blank");
    toast.success("Zahlungen werden exportiert");
  }

  async function handleDelete() {
    if (!deleteId) return;
    try {
      await deletePayment.mutateAsync(deleteId);
      toast.success("Zahlung gelöscht");
    } catch {
      toast.error("Löschen fehlgeschlagen");
    } finally {
      setDeleteId(null);
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Geld</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Zahlungen verfolgen – per Klick als ausgezahlt oder angekommen markieren.
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={handleExport} className="gap-2">
          <Download className="h-4 w-4" /> Export
        </Button>
      </div>

      {/* KPIs */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Gesamt (gefiltert)"
          value={formatCurrency(totals.total)}
          icon={Wallet}
        />
        <StatCard
          label="Erhalten"
          value={formatCurrency(totals.received)}
          icon={TrendingUp}
          tone="emerald"
        />
        <StatCard
          label="Ausstehend"
          value={formatCurrency(totals.outstanding)}
          icon={TrendingDown}
          tone="amber"
        />
        <StatCard
          label="Überfällig"
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
              placeholder="Promo, Kunde, Betrag suchen…"
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
              <SelectItem value="alle">Alle Status</SelectItem>
              <SelectItem value="offen">Offen</SelectItem>
              <SelectItem value="ausgezahlt">Ausgezahlt</SelectItem>
              <SelectItem value="angekommen">Angekommen</SelectItem>
              <SelectItem value="ueberfaellig">Überfällig</SelectItem>
            </SelectContent>
          </Select>
          <Select value={periodFilter} onValueChange={setPeriodFilter}>
            <SelectTrigger className="w-[170px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="alle">Gesamter Zeitraum</SelectItem>
              <SelectItem value="heute">Heute</SelectItem>
              <SelectItem value="woche">Diese Woche</SelectItem>
              <SelectItem value="monat">Dieser Monat</SelectItem>
              <SelectItem value="letzter">Letzter Monat</SelectItem>
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
                <TableHead className="min-w-[180px]">Promo</TableHead>
                <TableHead className="min-w-[140px]">Kunde</TableHead>
                <TableHead className="text-right w-[110px]">Betrag</TableHead>
                <TableHead className="w-[120px]">Erwartet</TableHead>
                <TableHead className="w-[120px]">Eingang</TableHead>
                <TableHead className="text-center w-[90px]">Ausgezahlt</TableHead>
                <TableHead className="text-center w-[110px]">Angekommen</TableHead>
                <TableHead className="w-[120px]">Status</TableHead>
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
                    Keine Zahlungen gefunden.
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
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground hover:text-rose-600"
                          onClick={() => setDeleteId(p.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
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
            <AlertDialogTitle>Zahlung löschen?</AlertDialogTitle>
            <AlertDialogDescription>
              Die Zahlung wird entfernt. Die zugehörige Promo bleibt erhalten.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Abbrechen</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-rose-600 hover:bg-rose-700 text-white"
            >
              Löschen
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
