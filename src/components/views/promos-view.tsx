"use client";

import * as React from "react";
import { usePromos, useCustomers, useDeletePromo } from "@/hooks/use-data";
import { useAppStore } from "@/lib/store";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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
import {
  PromoStatusBadge,
  PaymentStatusBadge,
} from "@/components/status-badges";
import { PromoFormDialog } from "./promo-form-dialog";
import {
  formatCurrency,
  formatDate,
  computePaymentStatus,
  promoSoundsTotal,
  promoSoundsUsed,
  promoSoundsRemaining,
  promoReceived,
  promoTotal,
} from "@/lib/format";
import type { Promo, PromoStatus } from "@/lib/types";
import {
  Plus,
  Search,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Pencil,
  Trash2,
  Eye,
  Download,
  Music2,
} from "lucide-react";
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
import { toast } from "sonner";

type SortKey =
  | "name"
  | "customer"
  | "date"
  | "soundsTotal"
  | "soundsRemaining"
  | "amount"
  | "status";

export function PromosView() {
  const { data: promos = [], isLoading } = usePromos();
  const { data: customers = [] } = useCustomers();
  const openPromo = useAppStore((s) => s.openPromo);
  const deletePromo = useDeletePromo();

  const [search, setSearch] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState<string>("alle");
  const [customerFilter, setCustomerFilter] = React.useState<string>("alle");
  const [sortKey, setSortKey] = React.useState<SortKey>("date");
  const [sortDir, setSortDir] = React.useState<"asc" | "desc">("desc");

  const [formOpen, setFormOpen] = React.useState(false);
  const [editPromo, setEditPromo] = React.useState<Promo | null>(null);
  const [deleteId, setDeleteId] = React.useState<string | null>(null);

  function toggleSort(key: SortKey) {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("desc");
    }
  }

  const filtered = React.useMemo(() => {
    let list = promos;
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          (p.customer?.name || "").toLowerCase().includes(q) ||
          (p.notes || "").toLowerCase().includes(q) ||
          p.sounds.some((s) =>
            s.sound.name.toLowerCase().includes(q)
          )
      );
    }
    if (statusFilter !== "alle") {
      if (statusFilter === "offen") {
        list = list.filter((p) => p.status === "GEPLANT" || p.status === "AKTIV");
      } else {
        list = list.filter((p) => p.status === (statusFilter as PromoStatus));
      }
    }
    if (customerFilter !== "alle") {
      if (customerFilter === "ohne") {
        list = list.filter((p) => !p.customerId);
      } else {
        list = list.filter((p) => p.customerId === customerFilter);
      }
    }

    const sorted = [...list].sort((a, b) => {
      let av: number | string = 0;
      let bv: number | string = 0;
      switch (sortKey) {
        case "name":
          av = a.name.toLowerCase();
          bv = b.name.toLowerCase();
          break;
        case "customer":
          av = (a.customer?.name || "").toLowerCase();
          bv = (b.customer?.name || "").toLowerCase();
          break;
        case "date":
          av = new Date(a.date).getTime();
          bv = new Date(b.date).getTime();
          break;
        case "soundsTotal":
          av = promoSoundsTotal(a);
          bv = promoSoundsTotal(b);
          break;
        case "soundsRemaining":
          av = promoSoundsRemaining(a);
          bv = promoSoundsRemaining(b);
          break;
        case "amount":
          av = promoTotal(a);
          bv = promoTotal(b);
          break;
        case "status":
          av = a.status;
          bv = b.status;
          break;
      }
      if (av < bv) return sortDir === "asc" ? -1 : 1;
      if (av > bv) return sortDir === "asc" ? 1 : -1;
      return 0;
    });
    return sorted;
  }, [promos, search, statusFilter, customerFilter, sortKey, sortDir]);

  function handleExport() {
    window.open("/api/export?type=promos&format=csv", "_blank");
    toast.success("Promos werden exportiert");
  }

  async function handleDelete() {
    if (!deleteId) return;
    try {
      await deletePromo.mutateAsync(deleteId);
      toast.success("Promo gelöscht");
    } catch (e) {
      toast.error("Löschen fehlgeschlagen");
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
          <h1 className="text-2xl font-semibold tracking-tight">Promos</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {filtered.length} von {promos.length} Promos
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handleExport} className="gap-2">
            <Download className="h-4 w-4" /> Export
          </Button>
          <Button
            size="sm"
            onClick={() => {
              setEditPromo(null);
              setFormOpen(true);
            }}
            className="gap-2"
          >
            <Plus className="h-4 w-4" /> Neue Promo
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card className="p-3">
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Promo, Kunde, Sound suchen…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[150px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="alle">Alle Status</SelectItem>
              <SelectItem value="offen">Offen</SelectItem>
              <SelectItem value="GEPLANT">Geplant</SelectItem>
              <SelectItem value="AKTIV">Aktiv</SelectItem>
              <SelectItem value="ABGESCHLOSSEN">Abgeschlossen</SelectItem>
              <SelectItem value="STORNIERT">Storniert</SelectItem>
            </SelectContent>
          </Select>
          <Select value={customerFilter} onValueChange={setCustomerFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="alle">Alle Kunden</SelectItem>
              <SelectItem value="ohne">Ohne Kunde</SelectItem>
              {customers.map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  {c.name}
                </SelectItem>
              ))}
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
                <TableHead className="min-w-[180px]"><SortHeader label="Promo" k="name" /></TableHead>
                <TableHead className="min-w-[140px]"><SortHeader label="Kunde" k="customer" /></TableHead>
                <TableHead className="w-[110px]"><SortHeader label="Datum" k="date" /></TableHead>
                <TableHead className="text-center w-[90px]">Sounds</TableHead>
                <TableHead className="text-center w-[90px]"><SortHeader label="Übrig" k="soundsRemaining" /></TableHead>
                <TableHead className="text-right w-[110px]"><SortHeader label="Vergütung" k="amount" /></TableHead>
                <TableHead className="w-[130px]">Zahlung</TableHead>
                <TableHead className="w-[130px]"><SortHeader label="Status" k="status" /></TableHead>
                <TableHead className="w-[80px] text-right">Aktion</TableHead>
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
                    <Music2 className="h-8 w-8 mx-auto mb-2 opacity-40" />
                    Keine Promos gefunden.
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((p) => {
                  const total = promoSoundsTotal(p);
                  const used = promoSoundsUsed(p);
                  const remaining = promoSoundsRemaining(p);
                  const amount = promoTotal(p);
                  const received = promoReceived(p);
                  const payStatus = computePaymentStatus(
                    p.payments.some((x) => x.paidOut),
                    p.payments.every((x) => x.received) && p.payments.length > 0,
                    p.payments[0]?.expectedDate || null
                  );
                  const fullyReceived =
                    p.payments.length > 0 &&
                    p.payments.every((x) => x.received);
                  const anyPaidOut = p.payments.some((x) => x.paidOut);
                  return (
                    <TableRow
                      key={p.id}
                      className="cursor-pointer hover:bg-muted/40"
                      onClick={() => openPromo(p.id)}
                    >
                      <TableCell className="font-medium">
                        <div className="truncate max-w-[220px]">{p.name}</div>
                        {p.notes && (
                          <div className="text-xs text-muted-foreground truncate max-w-[220px]">
                            {p.notes}
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {p.customer?.name || "—"}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {formatDate(p.date)}
                      </TableCell>
                      <TableCell className="text-center tabular-nums text-muted-foreground">
                        {used}/{total}
                      </TableCell>
                      <TableCell className="text-center">
                        <span
                          className={`tabular-nums font-medium ${
                            remaining === 0
                              ? "text-muted-foreground"
                              : "text-emerald-600 dark:text-emerald-400"
                          }`}
                        >
                          {remaining}
                        </span>
                      </TableCell>
                      <TableCell className="text-right font-medium tabular-nums">
                        {formatCurrency(amount)}
                        {received < amount && received > 0 && (
                          <div className="text-xs text-muted-foreground">
                            {formatCurrency(received)} erhalten
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        {p.payments.length === 0 ? (
                          <span className="text-xs text-muted-foreground">—</span>
                        ) : (
                          <PaymentStatusBadge
                            paidOut={anyPaidOut}
                            received={fullyReceived}
                            expectedDate={p.payments[0]?.expectedDate || null}
                          />
                        )}
                      </TableCell>
                      <TableCell>
                        <PromoStatusBadge status={p.status} />
                      </TableCell>
                      <TableCell className="text-right">
                        <div
                          className="flex justify-end gap-1"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => openPromo(p.id)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => {
                              setEditPromo(p);
                              setFormOpen(true);
                            }}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-muted-foreground hover:text-rose-600"
                            onClick={() => setDeleteId(p.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      </Card>

      <PromoFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        mode={editPromo ? "edit" : "create"}
        promo={editPromo}
      />

      <AlertDialog open={!!deleteId} onOpenChange={(o) => !o && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Promo löschen?</AlertDialogTitle>
            <AlertDialogDescription>
              Diese Aktion kann nicht rückgängig gemacht werden. Alle
              verknüpften Zahlungen und Sound-Zuordnungen werden ebenfalls
              gelöscht.
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
