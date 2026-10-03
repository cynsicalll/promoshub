"use client";

import * as React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import {
  Plus,
  Trash2,
  Music2,
  Wallet,
  AlertTriangle,
  UserPlus,
  Video,
  Link2,
} from "lucide-react";
import { toast } from "sonner";
import { useI18n } from "@/components/language-provider";
import {
  useCreatePromo,
  useUpdatePromo,
  useCustomers,
  useSounds,
  useCreateCustomer,
  useCreateSound,
} from "@/hooks/use-data";
import type { Promo, PromoInput, PromoStatus } from "@/lib/types";
import {
  formatDateInput,
  toISODate,
  parseCurrencyInput,
  formatCurrency,
} from "@/lib/format";

interface FormSound {
  key: string;
  soundId: string;
  quantityTotal: number;
  quantityUsed: number;
}
interface FormPayment {
  id?: string;
  key: string;
  amount: string;
  expectedDate: string;
  payoutDate: string;
  receivedDate: string;
  paidOut: boolean;
  received: boolean;
  notes: string;
}
interface FormTikTok {
  id?: string;
  key: string;
  url: string;
  title: string;
  soundId: string;
}

const STATUS_OPTIONS: PromoStatus[] = [
  "GEPLANT",
  "AKTIV",
  "ABGESCHLOSSEN",
  "STORNIERT",
];

let keyCounter = 0;
const nextKey = () => `k${++keyCounter}`;

export function PromoFormDialog({
  open,
  onOpenChange,
  mode,
  promo,
  onSaved,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  mode: "create" | "edit";
  promo?: Promo | null;
  onSaved?: (promo: Promo) => void;
}) {
  const { t } = useI18n();
  const { data: customers = [] } = useCustomers();
  const { data: sounds = [] } = useSounds();
  const createPromo = useCreatePromo();
  const updatePromo = useUpdatePromo();
  const createCustomer = useCreateCustomer();
  const createSound = useCreateSound();

  const [name, setName] = React.useState("");
  const [customerId, setCustomerId] = React.useState<string>("");
  const [date, setDate] = React.useState(formatDateInput(new Date()));
  const [status, setStatus] = React.useState<PromoStatus>("GEPLANT");
  const [notes, setNotes] = React.useState("");
  const [tiktokTarget, setTiktokTarget] = React.useState(0);
  const [formSounds, setFormSounds] = React.useState<FormSound[]>([]);
  const [formPayments, setFormPayments] = React.useState<FormPayment[]>([]);
  const [formTiktoks, setFormTiktoks] = React.useState<FormTikTok[]>([]);

  const [newCustomerOpen, setNewCustomerOpen] = React.useState(false);
  const [newCustomerName, setNewCustomerName] = React.useState("");
  const [newCustomerCompany, setNewCustomerCompany] = React.useState("");
  const [newSoundOpen, setNewSoundOpen] = React.useState(false);
  const [newSoundName, setNewSoundName] = React.useState("");
  const [newSoundArtist, setNewSoundArtist] = React.useState("");
  const [newSoundUrl, setNewSoundUrl] = React.useState("");

  React.useEffect(() => {
    if (!open) return;
    if (mode === "edit" && promo) {
      setName(promo.name);
      setCustomerId(promo.customerId || "none");
      setDate(formatDateInput(promo.date));
      setStatus(promo.status);
      setNotes(promo.notes || "");
      setTiktokTarget(promo.tiktokTarget || 0);
      setFormSounds(
        promo.sounds.map((s) => ({
          key: nextKey(),
          soundId: s.soundId,
          quantityTotal: s.quantityTotal,
          quantityUsed: s.quantityUsed,
        }))
      );
      setFormPayments(
        promo.payments.map((p) => ({
          id: p.id,
          key: nextKey(),
          amount: String(p.amount),
          expectedDate: formatDateInput(p.expectedDate),
          payoutDate: formatDateInput(p.payoutDate),
          receivedDate: formatDateInput(p.receivedDate),
          paidOut: p.paidOut,
          received: p.received,
          notes: p.notes || "",
        }))
      );
      setFormTiktoks(
        (promo.tiktoks || []).map((t) => ({
          id: t.id,
          key: nextKey(),
          url: t.url,
          title: t.title || "",
          soundId: t.soundId || "",
        }))
      );
    } else {
      setName("");
      setCustomerId("none");
      setDate(formatDateInput(new Date()));
      setStatus("GEPLANT");
      setNotes("");
      setTiktokTarget(0);
      setFormSounds([]);
      setFormPayments([{ key: nextKey(), amount: "", expectedDate: "", payoutDate: "", receivedDate: "", paidOut: false, received: false, notes: "" }]);
      setFormTiktoks([]);
    }
    setNewCustomerOpen(false);
    setNewCustomerName("");
    setNewCustomerCompany("");
    setNewSoundOpen(false);
    setNewSoundName("");
    setNewSoundArtist("");
    setNewSoundUrl("");
  }, [open, mode, promo]);

  const totalAmount = formPayments.reduce(
    (s, p) => s + parseCurrencyInput(p.amount),
    0
  );

  function addSound() {
    setFormSounds((prev) => [
      ...prev,
      { key: nextKey(), soundId: "", quantityTotal: 1, quantityUsed: 0 },
    ]);
  }
  function updateSound(key: string, patch: Partial<FormSound>) {
    setFormSounds((prev) =>
      prev.map((s) => (s.key === key ? { ...s, ...patch } : s))
    );
  }
  function removeSound(key: string) {
    setFormSounds((prev) => prev.filter((s) => s.key !== key));
  }

  function addPayment() {
    setFormPayments((prev) => [
      ...prev,
      { key: nextKey(), amount: "", expectedDate: "", payoutDate: "", receivedDate: "", paidOut: false, received: false, notes: "" },
    ]);
  }
  function updatePayment(key: string, patch: Partial<FormPayment>) {
    setFormPayments((prev) =>
      prev.map((p) => {
        if (p.key !== key) return p;
        const next = { ...p, ...patch };
        if (patch.received === true && !p.receivedDate) {
          next.receivedDate = formatDateInput(new Date());
        }
        if (patch.received === false) next.receivedDate = "";
        if (patch.paidOut === true && !p.payoutDate) {
          next.payoutDate = formatDateInput(new Date());
        }
        if (patch.paidOut === false) next.payoutDate = "";
        return next;
      })
    );
  }
  function removePayment(key: string) {
    setFormPayments((prev) => prev.filter((p) => p.key !== key));
  }

  function addTiktok() {
    setFormTiktoks((prev) => [
      ...prev,
      { key: nextKey(), url: "", title: "", soundId: "" },
    ]);
  }
  function updateTiktok(key: string, patch: Partial<FormTikTok>) {
    setFormTiktoks((prev) =>
      prev.map((t) => (t.key === key ? { ...t, ...patch } : t))
    );
  }
  function removeTiktok(key: string) {
    setFormTiktoks((prev) => prev.filter((t) => t.key !== key));
  }

  async function handleCreateCustomer() {
    if (!newCustomerName.trim()) return;
    const c = await createCustomer.mutateAsync({
      name: newCustomerName.trim(),
      company: newCustomerCompany || null,
    });
    setCustomerId(c.id);
    setNewCustomerName("");
    setNewCustomerCompany("");
    setNewCustomerOpen(false);
    toast.success(t("form.toast.customerCreated"));
  }

  async function handleCreateSound(addToRowKey?: string) {
    if (!newSoundName.trim()) return;
    const s = await createSound.mutateAsync({
      name: newSoundName.trim(),
      artist: newSoundArtist || null,
      url: newSoundUrl || null,
    });
    if (addToRowKey) updateSound(addToRowKey, { soundId: s.id });
    setNewSoundName("");
    setNewSoundArtist("");
    setNewSoundUrl("");
    setNewSoundOpen(false);
    toast.success(t("form.toast.soundCreated"));
  }

  function buildPayload(): PromoInput | null {
    if (!name.trim()) {
      toast.error(t("form.error.nameRequired"));
      return null;
    }
    if (!date) {
      toast.error(t("form.error.dateRequired"));
      return null;
    }
    const cleanSounds = formSounds
      .filter((s) => s.soundId)
      .map((s) => ({
        soundId: s.soundId,
        quantityTotal: Number(s.quantityTotal) || 0,
        quantityUsed: Number(s.quantityUsed) || 0,
      }));
    const cleanPayments = formPayments
      .filter((p) => parseCurrencyInput(p.amount) > 0 || p.notes)
      .map((p) => ({
        id: p.id,
        amount: parseCurrencyInput(p.amount),
        expectedDate: toISODate(p.expectedDate),
        payoutDate: toISODate(p.payoutDate),
        receivedDate: toISODate(p.receivedDate),
        paidOut: p.paidOut,
        received: p.received,
        notes: p.notes || null,
      }));

    const cleanTiktoks = formTiktoks
      .filter((t) => t.url.trim())
      .map((t) => ({
        id: t.id,
        url: t.url.trim(),
        title: t.title || null,
        soundId: t.soundId || null,
      }));

    return {
      name: name.trim(),
      customerId: customerId === "none" ? null : customerId,
      date: toISODate(date)!,
      status,
      notes: notes || null,
      tiktokTarget: Number(tiktokTarget) || 0,
      sounds: cleanSounds,
      payments: cleanPayments,
      tiktoks: cleanTiktoks,
    };
  }

  async function handleSubmit() {
    const payload = buildPayload();
    if (!payload) return;
    try {
      if (mode === "edit" && promo) {
        const updated = await updatePromo.mutateAsync({
          id: promo.id,
          data: payload,
        });
        toast.success(t("form.toast.promoUpdated"));
        onSaved?.(updated);
        onOpenChange(false);
      } else {
        const created = await createPromo.mutateAsync(payload);
        toast.success(t("form.toast.promoCreated"));
        onSaved?.(created);
        onOpenChange(false);
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : t("form.toast.saveError"));
    }
  }

  const saving = createPromo.isPending || updatePromo.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[92vh] overflow-y-auto p-0">
        <DialogHeader className="px-6 pt-6 pb-4 sticky top-0 bg-background z-10 border-b">
          <DialogTitle>
            {mode === "edit" ? t("form.editTitle") : t("form.createTitle")}
          </DialogTitle>
          <DialogDescription>{t("form.description")}</DialogDescription>
        </DialogHeader>

        <div className="px-6 py-5 space-y-7">
          <section className="space-y-4">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
              {t("form.general")}
            </h3>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5 sm:col-span-2">
                <Label htmlFor="promo-name">{t("form.promoName")}</Label>
                <Input
                  id="promo-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder={t("form.promoNamePlaceholder")}
                />
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label>{t("form.customer")}</Label>
                  <button
                    type="button"
                    onClick={() => setNewCustomerOpen((v) => !v)}
                    className="text-xs text-emerald-600 hover:underline flex items-center gap-1"
                  >
                    <UserPlus className="h-3 w-3" /> {t("form.newCustomer")}
                  </button>
                </div>
                {newCustomerOpen ? (
                  <div className="space-y-2 rounded-lg border p-2.5">
                    <Input
                      placeholder={t("form.customerNamePlaceholder")}
                      value={newCustomerName}
                      onChange={(e) => setNewCustomerName(e.target.value)}
                    />
                    <Input
                      placeholder={t("form.companyPlaceholder")}
                      value={newCustomerCompany}
                      onChange={(e) => setNewCustomerCompany(e.target.value)}
                    />
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        type="button"
                        onClick={handleCreateCustomer}
                        disabled={!newCustomerName.trim()}
                      >
                        {t("action.create")}
                      </Button>
                      <Button
                        size="sm"
                        type="button"
                        variant="ghost"
                        onClick={() => setNewCustomerOpen(false)}
                      >
                        {t("action.cancel")}
                      </Button>
                    </div>
                  </div>
                ) : (
                  <Select value={customerId} onValueChange={setCustomerId}>
                    <SelectTrigger>
                      <SelectValue placeholder={t("form.selectCustomer")} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">{t("form.noCustomer")}</SelectItem>
                      {customers.map((c) => (
                        <SelectItem key={c.id} value={c.id}>
                          {c.name}
                          {c.company ? ` · ${c.company}` : ""}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="promo-date">{t("form.date")}</Label>
                <Input
                  id="promo-date"
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                />
              </div>

              <div className="space-y-1.5">
                <Label>{t("form.status")}</Label>
                <Select
                  value={status}
                  onValueChange={(v) => setStatus(v as PromoStatus)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {STATUS_OPTIONS.map((s) => (
                      <SelectItem key={s} value={s}>
                        {t(`status.${s}`)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </section>

          <Separator />

          <section className="space-y-4">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-2">
                <Music2 className="h-4 w-4" /> {t("form.sounds")}
              </h3>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setNewSoundOpen((v) => !v)}
                >
                  <Plus className="h-3.5 w-3.5" /> {t("form.newSound")}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addSound}
                >
                  <Plus className="h-3.5 w-3.5" /> {t("form.addSound")}
                </Button>
              </div>
            </div>

            {newSoundOpen && (
              <div className="space-y-2 rounded-lg border p-2.5 bg-muted/30">
                <div className="grid gap-2 sm:grid-cols-2">
                  <Input
                    placeholder={t("form.soundNamePlaceholder")}
                    value={newSoundName}
                    onChange={(e) => setNewSoundName(e.target.value)}
                  />
                  <Input
                    placeholder={t("form.artist")}
                    value={newSoundArtist}
                    onChange={(e) => setNewSoundArtist(e.target.value)}
                  />
                </div>
                <Input
                  placeholder={t("form.soundUrlPlaceholder")}
                  value={newSoundUrl}
                  onChange={(e) => setNewSoundUrl(e.target.value)}
                />
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    type="button"
                    onClick={() => handleCreateSound()}
                    disabled={!newSoundName.trim()}
                  >
                    {t("form.createSound")}
                  </Button>
                  <Button
                    size="sm"
                    type="button"
                    variant="ghost"
                    onClick={() => setNewSoundOpen(false)}
                  >
                    {t("action.cancel")}
                  </Button>
                </div>
              </div>
            )}

            {formSounds.length === 0 ? (
              <p className="text-sm text-muted-foreground py-2">
                {t("form.noSounds")}
              </p>
            ) : (
              <div className="space-y-2">
                {formSounds.map((s) => {
                  const over = s.quantityUsed > s.quantityTotal;
                  const remaining = s.quantityTotal - s.quantityUsed;
                  return (
                    <div
                      key={s.key}
                      className="grid gap-2 rounded-lg border p-3 sm:grid-cols-[1fr_auto_auto_auto_auto] sm:items-end"
                    >
                      <div className="space-y-1.5">
                        <Label className="text-xs">{t("form.sound")}</Label>
                        <Select
                          value={s.soundId}
                          onValueChange={(v) => updateSound(s.key, { soundId: v })}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder={t("form.selectSound")} />
                          </SelectTrigger>
                          <SelectContent>
                            {sounds.map((snd) => (
                              <SelectItem key={snd.id} value={snd.id}>
                                {snd.name}
                                {snd.artist ? ` · ${snd.artist}` : ""}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-1.5 w-24">
                        <Label className="text-xs">{t("form.booked")}</Label>
                        <Input
                          type="number"
                          min={0}
                          value={s.quantityTotal}
                          onChange={(e) =>
                            updateSound(s.key, {
                              quantityTotal: Number(e.target.value) || 0,
                            })
                          }
                        />
                      </div>
                      <div className="space-y-1.5 w-24">
                        <Label className="text-xs">{t("form.used")}</Label>
                        <Input
                          type="number"
                          min={0}
                          value={s.quantityUsed}
                          onChange={(e) =>
                            updateSound(s.key, {
                              quantityUsed: Number(e.target.value) || 0,
                            })
                          }
                          className={over ? "border-rose-400 focus-visible:ring-rose-400" : ""}
                        />
                      </div>
                      <div className="w-20 text-center pb-2.5">
                        <p className="text-[10px] text-muted-foreground uppercase">
                          {t("form.remaining")}
                        </p>
                        <p
                          className={`text-sm font-semibold tabular-nums ${
                            over ? "text-rose-600" : "text-foreground"
                          }`}
                        >
                          {remaining}
                        </p>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => removeSound(s.key)}
                        className="text-muted-foreground hover:text-rose-600"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                      {over && (
                        <p className="sm:col-span-5 text-xs text-rose-600 flex items-center gap-1.5">
                          <AlertTriangle className="h-3.5 w-3.5" />
                          {t("form.overbooked", {
                            used: s.quantityUsed,
                            total: s.quantityTotal,
                          })}
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </section>

          <Separator />

          <section className="space-y-4">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-2">
                <Wallet className="h-4 w-4" /> {t("form.payments")}
              </h3>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addPayment}
              >
                <Plus className="h-3.5 w-3.5" /> {t("form.addPayment")}
              </Button>
            </div>

            <div className="space-y-2">
              {formPayments.map((p) => (
                <div key={p.key} className="rounded-lg border p-3 space-y-3">
                  <div className="grid gap-3 sm:grid-cols-[1fr_auto_auto] sm:items-end">
                    <div className="space-y-1.5">
                      <Label className="text-xs">{t("form.amount")}</Label>
                      <Input
                        type="text"
                        inputMode="decimal"
                        value={p.amount}
                        onChange={(e) =>
                          updatePayment(p.key, { amount: e.target.value })
                        }
                        placeholder={t("form.amountPlaceholder")}
                      />
                    </div>
                    <div className="flex gap-4 pb-2.5">
                      <label className="flex items-center gap-2 text-sm">
                        <Checkbox
                          checked={p.paidOut}
                          onCheckedChange={(v) =>
                            updatePayment(p.key, { paidOut: !!v })
                          }
                        />
                        {t("form.paidOut")}
                      </label>
                      <label className="flex items-center gap-2 text-sm">
                        <Checkbox
                          checked={p.received}
                          onCheckedChange={(v) =>
                            updatePayment(p.key, { received: !!v })
                          }
                        />
                        {t("form.received")}
                      </label>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => removePayment(p.key)}
                      className="text-muted-foreground hover:text-rose-600"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-3">
                    <div className="space-y-1.5">
                      <Label className="text-xs">{t("form.expectedDate")}</Label>
                      <Input
                        type="date"
                        value={p.expectedDate}
                        onChange={(e) =>
                          updatePayment(p.key, { expectedDate: e.target.value })
                        }
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs">{t("form.payoutDate")}</Label>
                      <Input
                        type="date"
                        value={p.payoutDate}
                        onChange={(e) =>
                          updatePayment(p.key, { payoutDate: e.target.value })
                        }
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs">{t("form.receivedDate")}</Label>
                      <Input
                        type="date"
                        value={p.receivedDate}
                        onChange={(e) =>
                          updatePayment(p.key, { receivedDate: e.target.value })
                        }
                      />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">{t("form.paymentNotes")}</Label>
                    <Input
                      value={p.notes}
                      onChange={(e) =>
                        updatePayment(p.key, { notes: e.target.value })
                      }
                      placeholder={t("form.paymentNotesPlaceholder")}
                    />
                  </div>
                </div>
              ))}
            </div>

            <div className="flex items-center justify-end gap-2 text-sm">
              <span className="text-muted-foreground">{t("form.totalAmount")}</span>
              <Badge variant="secondary" className="text-base font-semibold tabular-nums">
                {formatCurrency(totalAmount)}
              </Badge>
            </div>
          </section>

          <Separator />

          {/* TikTok Section */}
          <section className="space-y-4">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-2">
                <Video className="h-4 w-4" /> {t("form.tiktoks")}
              </h3>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addTiktok}
              >
                <Plus className="h-3.5 w-3.5" /> {t("form.addTiktok")}
              </Button>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label className="text-xs">{t("form.tiktokTarget")}</Label>
                <Input
                  type="number"
                  min={0}
                  value={tiktokTarget}
                  onChange={(e) => setTiktokTarget(Number(e.target.value) || 0)}
                  placeholder={t("form.tiktokTargetPlaceholder")}
                />
              </div>
              <div className="flex items-end">
                <div className="rounded-lg border bg-muted/30 px-3 py-2 text-sm w-full">
                  <span className="text-muted-foreground">{t("form.tiktokProgress")} </span>
                  <span className="font-semibold tabular-nums">
                    {formTiktoks.filter((t) => t.url.trim()).length}/{tiktokTarget || 0}
                  </span>
                  {tiktokTarget > 0 && (
                    <div className="mt-1.5 h-1.5 w-full rounded-full bg-muted overflow-hidden">
                      <div
                        className="h-full bg-emerald-500 rounded-full transition-all"
                        style={{
                          width: `${Math.min(100, (formTiktoks.filter((t) => t.url.trim()).length / tiktokTarget) * 100)}%`,
                        }}
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>

            {formTiktoks.length === 0 ? (
              <p className="text-sm text-muted-foreground py-2">
                {t("form.noTiktoks")}
              </p>
            ) : (
              <div className="space-y-2">
                {formTiktoks.map((tk) => (
                  <div
                    key={tk.key}
                    className="grid gap-2 rounded-lg border p-3 sm:grid-cols-[1fr_1fr_auto_auto] sm:items-end"
                  >
                    <div className="space-y-1.5">
                      <Label className="text-xs flex items-center gap-1">
                        <Link2 className="h-3 w-3" /> {t("form.tiktokUrl")}
                      </Label>
                      <Input
                        type="url"
                        value={tk.url}
                        onChange={(e) =>
                          updateTiktok(tk.key, { url: e.target.value })
                        }
                        placeholder={t("form.tiktokUrlPlaceholder")}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs">{t("form.tiktokTitle")}</Label>
                      <Input
                        value={tk.title}
                        onChange={(e) =>
                          updateTiktok(tk.key, { title: e.target.value })
                        }
                        placeholder={t("form.tiktokTitlePlaceholder")}
                      />
                    </div>
                    <div className="space-y-1.5 sm:w-40">
                      <Label className="text-xs">{t("form.tiktokSound")}</Label>
                      <Select
                        value={tk.soundId}
                        onValueChange={(v) =>
                          updateTiktok(tk.key, { soundId: v === "none" ? "" : v })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="—" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">{t("form.tiktokNoSound")}</SelectItem>
                          {sounds.map((s) => (
                            <SelectItem key={s.id} value={s.id}>
                              {s.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => removeTiktok(tk.key)}
                      className="text-muted-foreground hover:text-rose-600"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </section>

          <Separator />

          <section className="space-y-2">
            <Label htmlFor="promo-notes">{t("form.notesLabel")}</Label>
            <Textarea
              id="promo-notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              placeholder={t("form.notesPlaceholder")}
            />
          </section>
        </div>

        <DialogFooter className="px-6 py-4 border-t sticky bottom-0 bg-background">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {t("action.cancel")}
          </Button>
          <Button onClick={handleSubmit} disabled={saving}>
            {saving
              ? t("action.saving")
              : mode === "edit"
              ? t("form.editSubmit")
              : t("form.createSubmit")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
