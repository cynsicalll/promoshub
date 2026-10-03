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
} from "lucide-react";
import { toast } from "sonner";
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

const STATUS_OPTIONS: { value: PromoStatus; label: string }[] = [
  { value: "GEPLANT", label: "Geplant" },
  { value: "AKTIV", label: "Aktiv" },
  { value: "ABGESCHLOSSEN", label: "Abgeschlossen" },
  { value: "STORNIERT", label: "Storniert" },
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
  const [formSounds, setFormSounds] = React.useState<FormSound[]>([]);
  const [formPayments, setFormPayments] = React.useState<FormPayment[]>([]);

  const [newCustomerOpen, setNewCustomerOpen] = React.useState(false);
  const [newCustomerName, setNewCustomerName] = React.useState("");
  const [newCustomerCompany, setNewCustomerCompany] = React.useState("");
  const [newSoundOpen, setNewSoundOpen] = React.useState(false);
  const [newSoundName, setNewSoundName] = React.useState("");
  const [newSoundArtist, setNewSoundArtist] = React.useState("");

  React.useEffect(() => {
    if (!open) return;
    if (mode === "edit" && promo) {
      setName(promo.name);
      setCustomerId(promo.customerId || "none");
      setDate(formatDateInput(promo.date));
      setStatus(promo.status);
      setNotes(promo.notes || "");
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
    } else {
      setName("");
      setCustomerId("none");
      setDate(formatDateInput(new Date()));
      setStatus("GEPLANT");
      setNotes("");
      setFormSounds([]);
      setFormPayments([{ key: nextKey(), amount: "", expectedDate: "", payoutDate: "", receivedDate: "", paidOut: false, received: false, notes: "" }]);
    }
    setNewCustomerOpen(false);
    setNewCustomerName("");
    setNewCustomerCompany("");
    setNewSoundOpen(false);
    setNewSoundName("");
    setNewSoundArtist("");
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
    toast.success("Kunde angelegt");
  }

  async function handleCreateSound(addToRowKey?: string) {
    if (!newSoundName.trim()) return;
    const s = await createSound.mutateAsync({
      name: newSoundName.trim(),
      artist: newSoundArtist || null,
    });
    if (addToRowKey) updateSound(addToRowKey, { soundId: s.id });
    setNewSoundName("");
    setNewSoundArtist("");
    setNewSoundOpen(false);
    toast.success("Sound angelegt");
  }

  function buildPayload(): PromoInput | null {
    if (!name.trim()) {
      toast.error("Promo-Name ist erforderlich");
      return null;
    }
    if (!date) {
      toast.error("Datum ist erforderlich");
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

    return {
      name: name.trim(),
      customerId: customerId === "none" ? null : customerId,
      date: toISODate(date)!,
      status,
      notes: notes || null,
      sounds: cleanSounds,
      payments: cleanPayments,
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
        toast.success("Promo aktualisiert");
        onSaved?.(updated);
        onOpenChange(false);
      } else {
        const created = await createPromo.mutateAsync(payload);
        toast.success("Promo angelegt");
        onSaved?.(created);
        onOpenChange(false);
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Fehler beim Speichern");
    }
  }

  const saving = createPromo.isPending || updatePromo.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[92vh] overflow-y-auto p-0">
        <DialogHeader className="px-6 pt-6 pb-4 sticky top-0 bg-background z-10 border-b">
          <DialogTitle>
            {mode === "edit" ? "Promo bearbeiten" : "Neue Promo anlegen"}
          </DialogTitle>
          <DialogDescription>
            Einheitliche Erfassung aller Promo-Daten – Sounds, Vergütung und
            Kunde an einem Ort.
          </DialogDescription>
        </DialogHeader>

        <div className="px-6 py-5 space-y-7">
          <section className="space-y-4">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
              Allgemeine Informationen
            </h3>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5 sm:col-span-2">
                <Label htmlFor="promo-name">Promo-Name *</Label>
                <Input
                  id="promo-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="z. B. Nike Summer Campaign"
                />
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label>Kunde / Firma</Label>
                  <button
                    type="button"
                    onClick={() => setNewCustomerOpen((v) => !v)}
                    className="text-xs text-emerald-600 hover:underline flex items-center gap-1"
                  >
                    <UserPlus className="h-3 w-3" /> Neuer Kunde
                  </button>
                </div>
                {newCustomerOpen ? (
                  <div className="space-y-2 rounded-lg border p-2.5">
                    <Input
                      placeholder="Kundenname"
                      value={newCustomerName}
                      onChange={(e) => setNewCustomerName(e.target.value)}
                    />
                    <Input
                      placeholder="Firma (optional)"
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
                        Anlegen
                      </Button>
                      <Button
                        size="sm"
                        type="button"
                        variant="ghost"
                        onClick={() => setNewCustomerOpen(false)}
                      >
                        Abbrechen
                      </Button>
                    </div>
                  </div>
                ) : (
                  <Select value={customerId} onValueChange={setCustomerId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Kunde auswählen" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">— Kein Kunde —</SelectItem>
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
                <Label htmlFor="promo-date">Datum *</Label>
                <Input
                  id="promo-date"
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                />
              </div>

              <div className="space-y-1.5">
                <Label>Status</Label>
                <Select
                  value={status}
                  onValueChange={(v) => setStatus(v as PromoStatus)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {STATUS_OPTIONS.map((s) => (
                      <SelectItem key={s.value} value={s.value}>
                        {s.label}
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
                <Music2 className="h-4 w-4" /> Sounds
              </h3>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setNewSoundOpen((v) => !v)}
                >
                  <Plus className="h-3.5 w-3.5" /> Neuer Sound
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addSound}
                >
                  <Plus className="h-3.5 w-3.5" /> Sound hinzufügen
                </Button>
              </div>
            </div>

            {newSoundOpen && (
              <div className="space-y-2 rounded-lg border p-2.5 bg-muted/30">
                <div className="grid gap-2 sm:grid-cols-2">
                  <Input
                    placeholder="Soundname"
                    value={newSoundName}
                    onChange={(e) => setNewSoundName(e.target.value)}
                  />
                  <Input
                    placeholder="Artist (optional)"
                    value={newSoundArtist}
                    onChange={(e) => setNewSoundArtist(e.target.value)}
                  />
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    type="button"
                    onClick={() => handleCreateSound()}
                    disabled={!newSoundName.trim()}
                  >
                    Sound anlegen
                  </Button>
                  <Button
                    size="sm"
                    type="button"
                    variant="ghost"
                    onClick={() => setNewSoundOpen(false)}
                  >
                    Abbrechen
                  </Button>
                </div>
              </div>
            )}

            {formSounds.length === 0 ? (
              <p className="text-sm text-muted-foreground py-2">
                Noch keine Sounds hinzugefügt.
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
                        <Label className="text-xs">Sound</Label>
                        <Select
                          value={s.soundId}
                          onValueChange={(v) => updateSound(s.key, { soundId: v })}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Sound wählen" />
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
                        <Label className="text-xs">Gebucht</Label>
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
                        <Label className="text-xs">Verwendet</Label>
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
                          Übrig
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
                          Mehr verwendet als gebucht ({s.quantityUsed}/
                          {s.quantityTotal}).
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
                <Wallet className="h-4 w-4" /> Vergütung / Zahlungen
              </h3>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addPayment}
              >
                <Plus className="h-3.5 w-3.5" /> Zahlung hinzufügen
              </Button>
            </div>

            <div className="space-y-2">
              {formPayments.map((p) => (
                <div key={p.key} className="rounded-lg border p-3 space-y-3">
                  <div className="grid gap-3 sm:grid-cols-[1fr_auto_auto] sm:items-end">
                    <div className="space-y-1.5">
                      <Label className="text-xs">Betrag (€)</Label>
                      <Input
                        type="text"
                        inputMode="decimal"
                        value={p.amount}
                        onChange={(e) =>
                          updatePayment(p.key, { amount: e.target.value })
                        }
                        placeholder="0,00"
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
                        Ausgezahlt
                      </label>
                      <label className="flex items-center gap-2 text-sm">
                        <Checkbox
                          checked={p.received}
                          onCheckedChange={(v) =>
                            updatePayment(p.key, { received: !!v })
                          }
                        />
                        Angekommen
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
                      <Label className="text-xs">Erwartetes Datum</Label>
                      <Input
                        type="date"
                        value={p.expectedDate}
                        onChange={(e) =>
                          updatePayment(p.key, { expectedDate: e.target.value })
                        }
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs">Ausgezahlt am</Label>
                      <Input
                        type="date"
                        value={p.payoutDate}
                        onChange={(e) =>
                          updatePayment(p.key, { payoutDate: e.target.value })
                        }
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs">Eingangsdatum</Label>
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
                    <Label className="text-xs">Notizen zur Zahlung</Label>
                    <Input
                      value={p.notes}
                      onChange={(e) =>
                        updatePayment(p.key, { notes: e.target.value })
                      }
                      placeholder="z. B. PayPal, Rechnung folgt"
                    />
                  </div>
                </div>
              ))}
            </div>

            <div className="flex items-center justify-end gap-2 text-sm">
              <span className="text-muted-foreground">Gesamtbetrag:</span>
              <Badge variant="secondary" className="text-base font-semibold tabular-nums">
                {formatCurrency(totalAmount)}
              </Badge>
            </div>
          </section>

          <Separator />

          <section className="space-y-2">
            <Label htmlFor="promo-notes">Notizen zur Promo</Label>
            <Textarea
              id="promo-notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              placeholder="z. B. Kunde möchte Rechnung erst am Monatsende."
            />
          </section>
        </div>

        <DialogFooter className="px-6 py-4 border-t sticky bottom-0 bg-background">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Abbrechen
          </Button>
          <Button onClick={handleSubmit} disabled={saving}>
            {saving
              ? "Speichern…"
              : mode === "edit"
              ? "Änderungen speichern"
              : "Promo anlegen"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
