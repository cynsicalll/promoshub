"use client";

import * as React from "react";
import { usePromos, useDeletePromo } from "@/hooks/use-data";
import { useAppStore } from "@/lib/store";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Checkbox } from "@/components/ui/checkbox";
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
  PROMO_STATUS_STYLES,
} from "@/lib/format";
import {
  ArrowLeft,
  Pencil,
  Trash2,
  Calendar,
  User,
  Music2,
  Wallet,
  CheckCircle2,
  Clock,
  TrendingUp,
  StickyNote,
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
import { StatCard } from "@/components/stat-card";
import { toast } from "sonner";
import {
  useUpdatePayment,
} from "@/hooks/use-data";
import { formatDateInput, toISODate } from "@/lib/format";

export function PromoDetailView() {
  const promoId = useAppStore((s) => s.selectedPromoId);
  const setView = useAppStore((s) => s.setView);
  const { data: promos = [] } = usePromos();
  const deletePromo = useDeletePromo();
  const updatePayment = useUpdatePayment();

  const promo = promos.find((p) => p.id === promoId) || null;
  const [formOpen, setFormOpen] = React.useState(false);
  const [deleteConfirm, setDeleteConfirm] = React.useState(false);

  if (!promo) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <p className="text-muted-foreground">Promo nicht gefunden.</p>
        <Button variant="outline" className="mt-4" onClick={() => setView("promos")}>
          Zurück zu Promos
        </Button>
      </div>
    );
  }

  const total = promoTotal(promo);
  const received = promoReceived(promo);
  const outstanding = total - received;
  const soundsTotal = promoSoundsTotal(promo);
  const soundsUsed = promoSoundsUsed(promo);
  const soundsRemaining = promoSoundsRemaining(promo);

  async function togglePayment(
    id: string,
    field: "paidOut" | "received",
    value: boolean
  ) {
    const patch: Record<string, unknown> = { [field]: value };
    if (field === "received" && value) {
      patch.receivedDate = toISODate(formatDateInput(new Date()));
    }
    if (field === "received" && !value) patch.receivedDate = null;
    if (field === "paidOut" && value) {
      patch.payoutDate = toISODate(formatDateInput(new Date()));
    }
    if (field === "paidOut" && !value) patch.payoutDate = null;
    try {
      await updatePayment.mutateAsync({ id, data: patch as never });
      toast.success(value ? "Aktualisiert" : "Aktualisiert");
    } catch {
      toast.error("Fehler beim Aktualisieren");
    }
  }

  async function handleDelete() {
    try {
      await deletePromo.mutateAsync(promo!.id);
      toast.success("Promo gelöscht");
      setView("promos");
    } catch {
      toast.error("Löschen fehlgeschlagen");
    }
  }

  return (
    <div className="space-y-5 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div className="flex items-start gap-3 min-w-0">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setView("promos")}
            className="mt-0.5"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-2xl font-semibold tracking-tight truncate">
                {promo.name}
              </h1>
              <PromoStatusBadge status={promo.status} />
            </div>
            <p className="text-sm text-muted-foreground mt-1 flex items-center gap-3 flex-wrap">
              <span className="flex items-center gap-1">
                <Calendar className="h-3.5 w-3.5" /> {formatDate(promo.date)}
              </span>
              <span className="flex items-center gap-1">
                <User className="h-3.5 w-3.5" /> {promo.customer?.name || "Kein Kunde"}
                {promo.customer?.company ? ` · ${promo.customer.company}` : ""}
              </span>
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setFormOpen(true)}
            className="gap-2"
          >
            <Pencil className="h-4 w-4" /> Bearbeiten
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setDeleteConfirm(true)}
            className="gap-2 text-rose-600 hover:text-rose-700"
          >
            <Trash2 className="h-4 w-4" /> Löschen
          </Button>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Gesamtbetrag"
          value={formatCurrency(total)}
          icon={Wallet}
        />
        <StatCard
          label="Bereits erhalten"
          value={formatCurrency(received)}
          icon={CheckCircle2}
          tone="emerald"
        />
        <StatCard
          label="Noch offen"
          value={formatCurrency(outstanding)}
          icon={Clock}
          tone={outstanding > 0 ? "amber" : "default"}
        />
        <StatCard
          label="Sounds übrig"
          value={`${soundsRemaining} / ${soundsTotal}`}
          hint={`${soundsUsed} verwendet`}
          icon={Music2}
          tone="teal"
        />
      </div>

      <div className="grid gap-5 lg:grid-cols-3">
        {/* Left: Sounds + Customer */}
        <div className="space-y-5">
          <Card className="p-5">
            <h3 className="font-semibold flex items-center gap-2 mb-3">
              <Music2 className="h-4 w-4 text-muted-foreground" /> Sounds
            </h3>
            {promo.sounds.length === 0 ? (
              <p className="text-sm text-muted-foreground py-2">
                Keine Sounds zugeordnet.
              </p>
            ) : (
              <div className="space-y-3">
                {promo.sounds.map((ps) => {
                  const remaining = ps.quantityTotal - ps.quantityUsed;
                  const over = ps.quantityUsed > ps.quantityTotal;
                  const pct =
                    ps.quantityTotal > 0
                      ? Math.min(
                          100,
                          (ps.quantityUsed / ps.quantityTotal) * 100
                        )
                      : 0;
                  return (
                    <div key={ps.id} className="space-y-1.5">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-sm font-medium truncate">
                          {ps.sound.name}
                        </span>
                        <span
                          className={`text-xs tabular-nums ${
                            over ? "text-rose-600" : "text-muted-foreground"
                          }`}
                        >
                          {ps.quantityUsed}/{ps.quantityTotal}
                        </span>
                      </div>
                      <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
                        <div
                          className={`h-full rounded-full ${
                            over
                              ? "bg-rose-500"
                              : pct >= 100
                              ? "bg-teal-500"
                              : "bg-emerald-500"
                          }`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>
                          {ps.sound.artist || "—"}
                          {ps.sound.internalRef ? ` · ${ps.sound.internalRef}` : ""}
                        </span>
                        <span className={over ? "text-rose-600" : ""}>
                          {remaining} übrig
                          {over && " ⚠"}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </Card>

          {promo.customer && (
            <Card className="p-5">
              <h3 className="font-semibold flex items-center gap-2 mb-3">
                <User className="h-4 w-4 text-muted-foreground" /> Kunde
              </h3>
              <dl className="space-y-2 text-sm">
                <div className="flex justify-between gap-2">
                  <dt className="text-muted-foreground">Name</dt>
                  <dd className="font-medium text-right">{promo.customer.name}</dd>
                </div>
                {promo.customer.company && (
                  <div className="flex justify-between gap-2">
                    <dt className="text-muted-foreground">Firma</dt>
                    <dd className="text-right">{promo.customer.company}</dd>
                  </div>
                )}
                {promo.customer.contactPerson && (
                  <div className="flex justify-between gap-2">
                    <dt className="text-muted-foreground">Ansprechpartner</dt>
                    <dd className="text-right">{promo.customer.contactPerson}</dd>
                  </div>
                )}
                {promo.customer.email && (
                  <div className="flex justify-between gap-2">
                    <dt className="text-muted-foreground">E-Mail</dt>
                    <dd className="text-right">
                      <a
                        href={`mailto:${promo.customer.email}`}
                        className="text-emerald-600 hover:underline"
                      >
                        {promo.customer.email}
                      </a>
                    </dd>
                  </div>
                )}
                {promo.customer.phone && (
                  <div className="flex justify-between gap-2">
                    <dt className="text-muted-foreground">Telefon</dt>
                    <dd className="text-right">{promo.customer.phone}</dd>
                  </div>
                )}
              </dl>
              {promo.customer.notes && (
                <>
                  <Separator className="my-3" />
                  <p className="text-sm text-muted-foreground">
                    {promo.customer.notes}
                  </p>
                </>
              )}
            </Card>
          )}
        </div>

        {/* Right: Payments + Notes */}
        <div className="space-y-5 lg:col-span-2">
          <Card className="p-5">
            <h3 className="font-semibold flex items-center gap-2 mb-4">
              <Wallet className="h-4 w-4 text-muted-foreground" /> Zahlungen
            </h3>
            {promo.payments.length === 0 ? (
              <p className="text-sm text-muted-foreground py-2">
                Keine Zahlungen erfasst.
              </p>
            ) : (
              <div className="space-y-3">
                {promo.payments.map((p) => {
                  const status = computePaymentStatus(
                    p.paidOut,
                    p.received,
                    p.expectedDate
                  );
                  return (
                    <div
                      key={p.id}
                      className="rounded-lg border p-3 space-y-3"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="font-semibold tabular-nums">
                            {formatCurrency(p.amount)}
                          </p>
                          <PaymentStatusBadge
                            paidOut={p.paidOut}
                            received={p.received}
                            expectedDate={p.expectedDate}
                          />
                        </div>
                      </div>

                      <div className="flex gap-6 flex-wrap">
                        <label className="flex items-center gap-2 text-sm cursor-pointer">
                          <Checkbox
                            checked={p.paidOut}
                            onCheckedChange={(v) =>
                              togglePayment(p.id, "paidOut", !!v)
                            }
                            disabled={updatePayment.isPending}
                          />
                          <span>Ausgezahlt</span>
                        </label>
                        <label className="flex items-center gap-2 text-sm cursor-pointer">
                          <Checkbox
                            checked={p.received}
                            onCheckedChange={(v) =>
                              togglePayment(p.id, "received", !!v)
                            }
                            disabled={updatePayment.isPending}
                          />
                          <span>Geld angekommen</span>
                        </label>
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
                        <div>
                          <p className="text-muted-foreground">Erwartet</p>
                          <p className="font-medium">
                            {formatDate(p.expectedDate)}
                          </p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Ausgezahlt am</p>
                          <p className="font-medium">
                            {formatDate(p.payoutDate)}
                          </p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Eingang</p>
                          <p className="font-medium">
                            {formatDate(p.receivedDate)}
                          </p>
                        </div>
                      </div>
                      {p.notes && (
                        <p className="text-xs text-muted-foreground border-t pt-2">
                          {p.notes}
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
            <div className="mt-4 pt-3 border-t flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Gesamt erhalten / offen</span>
              <span className="font-semibold tabular-nums">
                <span className="text-emerald-600">{formatCurrency(received)}</span>
                {" / "}
                <span className="text-amber-600">{formatCurrency(outstanding)}</span>
              </span>
            </div>
          </Card>

          {(promo.notes || promo.customer?.notes) && (
            <Card className="p-5">
              <h3 className="font-semibold flex items-center gap-2 mb-3">
                <StickyNote className="h-4 w-4 text-muted-foreground" /> Notizen
              </h3>
              {promo.notes ? (
                <p className="text-sm whitespace-pre-wrap">{promo.notes}</p>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Keine Notizen zur Promo.
                </p>
              )}
            </Card>
          )}
        </div>
      </div>

      <PromoFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        mode="edit"
        promo={promo}
      />

      <AlertDialog
        open={deleteConfirm}
        onOpenChange={setDeleteConfirm}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Promo „{promo.name}" löschen?</AlertDialogTitle>
            <AlertDialogDescription>
              Diese Aktion kann nicht rückgängig gemacht werden. Alle
              verknüpften Zahlungen und Sound-Zuordnungen werden gelöscht.
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
