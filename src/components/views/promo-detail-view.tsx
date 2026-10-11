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
  promoTiktokDone,
  promoTiktokRemaining,
  normalizeUrl,
  domainFromUrl,
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
  Video,
  Link2,
  ExternalLink,
  Share2,
  Copy,
  Lock,
  Unlock,
  Bell,
  X,
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
import { TikTokThumbnail } from "@/components/tiktok-thumbnail";
import { toast } from "sonner";
import { useI18n } from "@/components/language-provider";
import {
  useUpdatePayment,
  useEnableShare,
  useDisableShare,
} from "@/hooks/use-data";
import { formatDateInput, toISODate } from "@/lib/format";

export function PromoDetailView() {
  const { t } = useI18n();
  const promoId = useAppStore((s) => s.selectedPromoId);
  const setView = useAppStore((s) => s.setView);
  const { data: promos = [] } = usePromos();
  const deletePromo = useDeletePromo();
  const updatePayment = useUpdatePayment();
  const enableShare = useEnableShare();
  const disableShare = useDisableShare();

  // PNR: track approval status for each payment
  const [approvalStatuses, setApprovalStatuses] = React.useState<Record<string, { status: string; respondedAt?: string }>>({});

  const promo = promos.find((p) => p.id === promoId) || null;
  const [formOpen, setFormOpen] = React.useState(false);
  const [deleteConfirm, setDeleteConfirm] = React.useState(false);

  // PNR: Poll for approval status changes every 10 seconds
  React.useEffect(() => {
    if (!promo) return;
    let cancelled = false;

    async function fetchApprovals() {
      if (!promo) return;
      try {
        // Fetch approval status for all payments in this promo
        const results: Record<string, { status: string; respondedAt?: string }> = {};
        for (const p of promo.payments) {
          const res = await fetch(`/api/payment-approvals?paymentId=${p.id}`);
          if (!res.ok) continue;
          const data = await res.json();
          if (Array.isArray(data) && data.length > 0) {
            // Get the latest approval request for this payment
            const latest = data[0];
            results[p.id] = { status: latest.status, respondedAt: latest.respondedAt };
          }
        }
        if (!cancelled) setApprovalStatuses(results);
      } catch { /* ignore */ }
    }

    fetchApprovals();
    const interval = setInterval(fetchApprovals, 10000); // poll every 10s
    return () => { cancelled = true; clearInterval(interval); };
  }, [promo?.id]);

  if (!promo) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <p className="text-muted-foreground">{t("detail.notFound")}</p>
        <Button variant="outline" className="mt-4" onClick={() => setView("promos")}>
          {t("detail.back")}
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
      toast.success(t("detail.updatedToast"));
    } catch {
      toast.error(t("detail.updateFailedToast"));
    }
  }

  async function handleDelete() {
    try {
      await deletePromo.mutateAsync(promo!.id);
      toast.success(t("promos.deletedToast"));
      setView("promos");
    } catch {
      toast.error(t("action.deleteFailed"));
    }
  }

  async function handleEnableShare() {
    try {
      const res = await enableShare.mutateAsync(promo!.id);
      const url = `${window.location.origin}/?share=${res.shareCode}`;
      await navigator.clipboard.writeText(url);
      toast.success(t("detail.shareEnabledToast"), {
        description: url,
      });
    } catch {
      toast.error(t("detail.shareEnableFailedToast"));
    }
  }

  async function handleDisableShare() {
    try {
      await disableShare.mutateAsync(promo!.id);
      toast.success(t("detail.shareDisabledToast"));
    } catch {
      toast.error(t("detail.shareDisableFailedToast"));
    }
  }

  async function copyShareLink() {
    if (!promo?.shareCode) return;
    const url = `${window.location.origin}/?share=${promo.shareCode}`;
    try {
      await navigator.clipboard.writeText(url);
      toast.success(t("detail.linkCopiedToast"), { description: url });
    } catch {
      toast.error(t("detail.copyFailedToast"));
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
                <User className="h-3.5 w-3.5" /> {promo.customer?.name || t("detail.noCustomer")}
                {promo.customer?.company ? ` · ${promo.customer.company}` : ""}
              </span>
            </p>
          </div>
        </div>
        <div className="flex gap-2 flex-wrap">
          {promo.shareEnabled && promo.shareCode ? (
            <Button
              variant="outline"
              size="sm"
              onClick={copyShareLink}
              className="gap-2"
            >
              <Share2 className="h-4 w-4" /> {t("detail.copyLink")}
            </Button>
          ) : null}
          {promo.shareEnabled ? (
            <Button
              variant="outline"
              size="sm"
              onClick={handleDisableShare}
              className="gap-2"
              disabled={disableShare.isPending}
            >
              <Lock className="h-4 w-4" /> {t("detail.stopShare")}
            </Button>
          ) : (
            <Button
              variant="outline"
              size="sm"
              onClick={handleEnableShare}
              className="gap-2"
              disabled={enableShare.isPending}
            >
              <Unlock className="h-4 w-4" /> {t("detail.shareWithCustomer")}
            </Button>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setFormOpen(true)}
            className="gap-2"
          >
            <Pencil className="h-4 w-4" /> {t("action.edit")}
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="gap-2 text-indigo-600 hover:text-indigo-700 dark:text-indigo-400"
            onClick={async () => {
              try {
                const total = promoTotal(promo);
                const res = await fetch("/api/push/send", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({
                    type: "promo",
                    data: {
                      name: promo.name,
                      amount: total,
                      customer: promo.customer?.name || "",
                      date: formatDate(promo.date),
                    },
                  }),
                });
                if (!res.ok) throw new Error("Failed");
                const result = await res.json();
                if (result.sent > 0) {
                  toast.success(`Notification sent to viewer: "${result.title}"`);
                } else {
                  toast.error("Viewer hasn't enabled notifications yet. Ask them to tap the bell button on their link.");
                }
              } catch {
                toast.error("Failed to send notification");
              }
            }}
          >
            <Bell className="h-4 w-4" /> Notify
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setDeleteConfirm(true)}
            className="gap-2 text-rose-600 hover:text-rose-700"
          >
            <Trash2 className="h-4 w-4" /> {t("action.delete")}
          </Button>
        </div>
      </div>

      {/* Share banner when enabled */}
      {promo.shareEnabled && promo.shareCode && (
        <div className="rounded-lg border border-emerald-200 dark:border-emerald-900/50 bg-emerald-50/60 dark:bg-emerald-950/20 p-4 flex items-center gap-3 flex-wrap">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-emerald-100 dark:bg-emerald-900 text-emerald-700 dark:text-emerald-300">
            <Share2 className="h-4 w-4" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium">{t("detail.shareActive")}</p>
            <p className="text-xs text-muted-foreground truncate">
              {t("detail.shareLink")} {typeof window !== "undefined" ? window.location.origin : ""}/?share={promo.shareCode}
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={copyShareLink}
              className="gap-2"
            >
              <Copy className="h-3.5 w-3.5" /> {t("action.copy")}
            </Button>
            <a
              href={`/?share=${promo.shareCode}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              <Button variant="outline" size="sm" className="gap-2">
                <ExternalLink className="h-3.5 w-3.5" /> {t("detail.openShare")}
              </Button>
            </a>
          </div>
        </div>
      )}

      {/* KPIs */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label={t("detail.totalAmount")}
          value={formatCurrency(total)}
          icon={Wallet}
        />
        <StatCard
          label={t("detail.alreadyReceived")}
          value={formatCurrency(received)}
          icon={CheckCircle2}
          tone="emerald"
        />
        <StatCard
          label={t("detail.stillOpen")}
          value={formatCurrency(outstanding)}
          icon={Clock}
          tone={outstanding > 0 ? "amber" : "default"}
        />
        <StatCard
          label={t("detail.soundsRemaining")}
          value={`${soundsRemaining} / ${soundsTotal}`}
          hint={t("detail.soundsUsedHint", { count: soundsUsed })}
          icon={Music2}
          tone="teal"
        />
      </div>

      <div className="grid gap-5 lg:grid-cols-3">
        {/* Left: Sounds + Customer */}
        <div className="space-y-5">
          <Card className="p-5">
            <h3 className="font-semibold flex items-center gap-2 mb-3">
              <Music2 className="h-4 w-4 text-muted-foreground" /> {t("detail.sounds")}
            </h3>
            {promo.sounds.length === 0 ? (
              <p className="text-sm text-muted-foreground py-2">
                {t("detail.noSounds")}
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
                      <div className="flex justify-between items-center gap-2 text-xs text-muted-foreground">
                        <span className="truncate">
                          {ps.sound.artist || "—"}
                          {ps.sound.internalRef ? ` · ${ps.sound.internalRef}` : ""}
                        </span>
                        <div className="flex items-center gap-2 shrink-0">
                          {ps.sound.url && (
                            <a
                              href={normalizeUrl(ps.sound.url)}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 text-emerald-600 hover:underline dark:text-emerald-400"
                            >
                              <Link2 className="h-3 w-3" />
                              {domainFromUrl(ps.sound.url)}
                              <ExternalLink className="h-2.5 w-2.5" />
                            </a>
                          )}
                          <span className={over ? "text-rose-600" : ""}>
                            {remaining} {t("form.remaining")}
                            {over && " ⚠"}
                          </span>
                        </div>
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
                <User className="h-4 w-4 text-muted-foreground" /> {t("detail.customer")}
              </h3>
              <dl className="space-y-2 text-sm">
                <div className="flex justify-between gap-2">
                  <dt className="text-muted-foreground">{t("detail.field.name")}</dt>
                  <dd className="font-medium text-right">{promo.customer.name}</dd>
                </div>
                {promo.customer.company && (
                  <div className="flex justify-between gap-2">
                    <dt className="text-muted-foreground">{t("detail.field.company")}</dt>
                    <dd className="text-right">{promo.customer.company}</dd>
                  </div>
                )}
                {promo.customer.contactPerson && (
                  <div className="flex justify-between gap-2">
                    <dt className="text-muted-foreground">{t("detail.field.contact")}</dt>
                    <dd className="text-right">{promo.customer.contactPerson}</dd>
                  </div>
                )}
                {promo.customer.email && (
                  <div className="flex justify-between gap-2">
                    <dt className="text-muted-foreground">{t("detail.field.email")}</dt>
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
                    <dt className="text-muted-foreground">{t("detail.field.phone")}</dt>
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
              <Wallet className="h-4 w-4 text-muted-foreground" /> {t("detail.payments")}
            </h3>
            {promo.payments.length === 0 ? (
              <p className="text-sm text-muted-foreground py-2">
                {t("detail.noPayments")}
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
                          <span>{t("form.paidOut")}</span>
                        </label>
                        <label className="flex items-center gap-2 text-sm cursor-pointer">
                          <Checkbox
                            checked={p.received}
                            onCheckedChange={(v) =>
                              togglePayment(p.id, "received", !!v)
                            }
                            disabled={updatePayment.isPending}
                          />
                          <span>{t("form.received")}</span>
                        </label>
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
                        <div>
                          <p className="text-muted-foreground">{t("money.col.expected")}</p>
                          <p className="font-medium">
                            {formatDate(p.expectedDate)}
                          </p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">{t("form.payoutDate")}</p>
                          <p className="font-medium">
                            {formatDate(p.payoutDate)}
                          </p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">{t("money.col.received")}</p>
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
                      {/* PNR: Request Approval button + status — sends to VIEWER (dad) */}
                      <div className="border-t pt-2 flex items-center gap-2 flex-wrap">
                        <Button
                          size="sm"
                          variant="outline"
                          className="gap-1.5 text-xs"
                          onClick={async () => {
                            try {
                              const res = await fetch("/api/backup");
                              const data = await res.json();
                              const viewers = (data.users || []).filter((u: { role: string; shareToken?: string }) => u.role === "VIEWER");
                              if (viewers.length === 0) {
                                toast.error("No viewer user found. Create a viewer account first.");
                                return;
                              }
                              const viewer = viewers[0];
                              if (!viewer.shareToken) {
                                toast.error("Viewer doesn't have a shareToken yet. Go to Settings to generate one.");
                                return;
                              }
                              const promoName = promo.name;
                              const pnrRes = await fetch("/api/payment-approvals", {
                                method: "POST",
                                headers: { "Content-Type": "application/json" },
                                body: JSON.stringify({
                                  paymentId: p.id,
                                  approverToken: viewer.shareToken,
                                  amount: p.amount,
                                  promoName,
                                }),
                              });
                              if (!pnrRes.ok) throw new Error("Failed");
                              toast.success(`Payment approval request sent to ${viewer.username || viewer.displayName || "viewer"}`);
                              // Immediately update local status to PENDING
                              setApprovalStatuses((prev) => ({ ...prev, [p.id]: { status: "PENDING" } }));
                            } catch {
                              toast.error("Failed to send approval request");
                            }
                          }}
                        >
                          <Bell className="h-3 w-3" />
                          Request Approval
                        </Button>
                        {/* Approval status badge */}
                        {approvalStatuses[p.id]?.status === "PENDING" && (
                          <span className="inline-flex items-center gap-1 text-xs font-medium text-amber-600 dark:text-amber-400 bg-amber-100 dark:bg-amber-950/40 px-2 py-1 rounded-full">
                            <Clock className="h-3 w-3 animate-pulse" />
                            Awaiting approval...
                          </span>
                        )}
                        {approvalStatuses[p.id]?.status === "APPROVED" && (
                          <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-600 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-950/40 px-2 py-1 rounded-full">
                            <CheckCircle2 className="h-3 w-3" />
                            Approved{approvalStatuses[p.id]?.respondedAt ? ` · ${new Date(approvalStatuses[p.id].respondedAt).toLocaleString("en", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}` : ""}
                          </span>
                        )}
                        {approvalStatuses[p.id]?.status === "DENIED" && (
                          <span className="inline-flex items-center gap-1 text-xs font-medium text-rose-600 dark:text-rose-400 bg-rose-100 dark:bg-rose-950/40 px-2 py-1 rounded-full">
                            <X className="h-3 w-3" />
                            Denied
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
            <div className="mt-4 pt-3 border-t flex items-center justify-between text-sm">
              <span className="text-muted-foreground">{t("detail.totalReceivedOpen")}</span>
              <span className="font-semibold tabular-nums">
                <span className="text-emerald-600">{formatCurrency(received)}</span>
                {" / "}
                <span className="text-amber-600">{formatCurrency(outstanding)}</span>
              </span>
            </div>
          </Card>

          {/* TikTok card */}
          <Card className="p-5">
            <div className="flex items-center justify-between gap-2 mb-4 flex-wrap">
              <h3 className="font-semibold flex items-center gap-2">
                <Video className="h-4 w-4 text-muted-foreground" /> {t("detail.tiktoks")}
              </h3>
              <div className="text-right">
                <p className="text-lg font-semibold tabular-nums">
                  {promoTiktokDone(promo)}
                  <span className="text-sm text-muted-foreground">
                    /{promo.tiktokTarget || 0}
                  </span>
                </p>
                <p className="text-[11px] text-muted-foreground">{t("detail.createdDone")}</p>
              </div>
            </div>

            {(promo.tiktokTarget || 0) > 0 && (
              <div className="mb-4 h-2 w-full rounded-full bg-muted overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-pink-500 to-rose-500 rounded-full transition-all"
                  style={{
                    width: `${Math.min(
                      100,
                      (promoTiktokDone(promo) / (promo.tiktokTarget || 1)) * 100
                    )}%`,
                  }}
                />
              </div>
            )}

            {promo.tiktoks.length === 0 ? (
              <p className="text-sm text-muted-foreground py-2">
                {t("detail.noTiktoks")}
              </p>
            ) : (
              <div className="grid gap-3 grid-cols-2 sm:grid-cols-3 md:grid-cols-4">
                {promo.tiktoks.map((tk, i) => {
                  const sound = promo.sounds.find((ps) => ps.soundId === tk.soundId);
                  return (
                    <TikTokThumbnail
                      key={tk.id}
                      url={tk.url}
                      title={tk.title}
                      soundName={sound?.sound.name || null}
                      postedDate={tk.createdAt}
                      index={i + 1}
                      fallbackLabel={t("share.noTitle")}
                      accentColor="pink"
                    />
                  );
                })}
              </div>
            )}
          </Card>

          {(promo.notes || promo.customer?.notes) && (
            <Card className="p-5">
              <h3 className="font-semibold flex items-center gap-2 mb-3">
                <StickyNote className="h-4 w-4 text-muted-foreground" /> {t("detail.notes")}
              </h3>
              {promo.notes ? (
                <p className="text-sm whitespace-pre-wrap">{promo.notes}</p>
              ) : (
                <p className="text-sm text-muted-foreground">
                  {t("detail.noNotes")}
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
            <AlertDialogTitle>{t("detail.deleteTitle", { name: promo.name })}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("detail.deleteDesc")}
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
