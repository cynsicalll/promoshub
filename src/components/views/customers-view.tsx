"use client";

import * as React from "react";
import {
  useCustomers,
  useCreateCustomer,
  useUpdateCustomer,
  useDeleteCustomer,
  usePromos,
  useIsDemo,
} from "@/hooks/use-data";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
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
import { Users, Plus, Pencil, Trash2, Download, Search, Mail, Phone } from "lucide-react";
import { toast } from "sonner";
import type { Customer, CustomerInput } from "@/lib/types";
import { formatCurrency } from "@/lib/format";
import { useAppStore } from "@/lib/store";
import { useI18n } from "@/components/language-provider";

export function CustomersView() {
  const { t } = useI18n();
  const isDemo = useIsDemo();
  const { data: customers = [], isLoading } = useCustomers();
  const { data: promos = [] } = usePromos();
  const createCustomer = useCreateCustomer();
  const updateCustomer = useUpdateCustomer();
  const deleteCustomer = useDeleteCustomer();
  const openPromo = useAppStore((s) => s.openPromo);

  const [search, setSearch] = React.useState("");
  const [formOpen, setFormOpen] = React.useState(false);
  const [editCustomer, setEditCustomer] = React.useState<Customer | null>(null);
  const [deleteId, setDeleteId] = React.useState<string | null>(null);

  const [form, setForm] = React.useState<CustomerInput>({
    name: "",
    company: "",
    contactPerson: "",
    email: "",
    phone: "",
    notes: "",
  });

  React.useEffect(() => {
    if (formOpen) {
      setForm({
        name: editCustomer?.name || "",
        company: editCustomer?.company || "",
        contactPerson: editCustomer?.contactPerson || "",
        email: editCustomer?.email || "",
        phone: editCustomer?.phone || "",
        notes: editCustomer?.notes || "",
      });
    }
  }, [formOpen, editCustomer]);

  // stats per customer
  const stats = React.useMemo(() => {
    const map: Record<
      string,
      { promos: number; earned: number; received: number }
    > = {};
    for (const p of promos) {
      if (!p.customerId) continue;
      if (!map[p.customerId])
        map[p.customerId] = { promos: 0, earned: 0, received: 0 };
      map[p.customerId].promos += 1;
      const earned = p.payments.reduce((s, x) => s + x.amount, 0);
      const received = p.payments
        .filter((x) => x.received)
        .reduce((s, x) => s + x.amount, 0);
      map[p.customerId].earned += earned;
      map[p.customerId].received += received;
    }
    return map;
  }, [promos]);

  const filtered = customers.filter((c) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      c.name.toLowerCase().includes(q) ||
      (c.company || "").toLowerCase().includes(q) ||
      (c.contactPerson || "").toLowerCase().includes(q) ||
      (c.email || "").toLowerCase().includes(q)
    );
  });

  async function handleSubmit() {
    if (!form.name.trim()) {
      toast.error(t("customers.error.nameRequired"));
      return;
    }
    const payload: CustomerInput = {
      name: form.name.trim(),
      company: form.company || null,
      contactPerson: form.contactPerson || null,
      email: form.email || null,
      phone: form.phone || null,
      notes: form.notes || null,
    };
    try {
      if (editCustomer) {
        await updateCustomer.mutateAsync({ id: editCustomer.id, data: payload });
        toast.success(t("customers.toast.updated"));
      } else {
        await createCustomer.mutateAsync(payload);
        toast.success(t("customers.toast.created"));
      }
      setFormOpen(false);
      setEditCustomer(null);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : t("common.error"));
    }
  }

  async function handleDelete() {
    if (!deleteId) return;
    try {
      await deleteCustomer.mutateAsync(deleteId);
      toast.success(t("customers.toast.deleted"));
    } catch {
      toast.error(t("common.deleteFailed"));
    } finally {
      setDeleteId(null);
    }
  }

  function handleExport() {
    window.open("/api/export?type=customers&format=csv", "_blank");
    toast.success(t("settings.exportStarted"));
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{t("customers.title")}</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {t("customers.subtitle")}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handleExport} className="gap-2">
            <Download className="h-4 w-4" /> {t("action.export")}
          </Button>
          {!isDemo && (
            <Button
              size="sm"
              onClick={() => {
                setEditCustomer(null);
                setFormOpen(true);
              }}
              className="gap-2"
            >
              <Plus className="h-4 w-4" /> {t("form.newCustomer")}
            </Button>
          )}
        </div>
      </div>

      <Card className="p-3">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={t("customers.searchPlaceholder")}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8"
          />
        </div>
      </Card>

      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i} className="h-40 animate-pulse bg-muted/40" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <Card className="py-16 text-center">
          <Users className="h-10 w-10 mx-auto mb-3 text-muted-foreground/40" />
          <p className="text-muted-foreground">{t("customers.noResults")}</p>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((c) => {
            const st = stats[c.id] || { promos: 0, earned: 0, received: 0 };
            return (
              <Card key={c.id} className="p-5 flex flex-col gap-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <h3 className="font-semibold truncate">{c.name}</h3>
                    {c.company && (
                      <p className="text-sm text-muted-foreground truncate">
                        {c.company}
                      </p>
                    )}
                  </div>
                  <div className="flex gap-1 shrink-0">
                    {!isDemo && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => {
                          setEditCustomer(c);
                          setFormOpen(true);
                        }}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                    )}
                    {!isDemo && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-rose-600"
                        onClick={() => setDeleteId(c.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>

                <div className="space-y-1 text-sm">
                  {c.contactPerson && (
                    <p className="text-muted-foreground">{c.contactPerson}</p>
                  )}
                  {c.email && (
                    <a
                      href={`mailto:${c.email}`}
                      className="flex items-center gap-1.5 text-emerald-600 hover:underline truncate"
                    >
                      <Mail className="h-3.5 w-3.5 shrink-0" /> {c.email}
                    </a>
                  )}
                  {c.phone && (
                    <p className="flex items-center gap-1.5 text-muted-foreground">
                      <Phone className="h-3.5 w-3.5 shrink-0" /> {c.phone}
                    </p>
                  )}
                </div>

                <div className="mt-auto grid grid-cols-3 gap-2 border-t pt-3 text-center">
                  <div>
                    <p className="text-lg font-semibold tabular-nums">{st.promos}</p>
                    <p className="text-[10px] text-muted-foreground uppercase">{t("customers.stats.promos")}</p>
                  </div>
                  <div>
                    <p className="text-lg font-semibold tabular-nums">{formatCurrency(st.earned)}</p>
                    <p className="text-[10px] text-muted-foreground uppercase">{t("customers.stats.revenue")}</p>
                  </div>
                  <div>
                    <p className="text-lg font-semibold tabular-nums text-emerald-600">{formatCurrency(st.received)}</p>
                    <p className="text-[10px] text-muted-foreground uppercase">{t("customers.stats.received")}</p>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editCustomer ? t("customers.editTitle") : t("customers.createTitle")}
            </DialogTitle>
            <DialogDescription>
              {t("customers.formDescription")}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="c-name">{t("form.customerName")}</Label>
                <Input
                  id="c-name"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder={t("form.customerNamePlaceholder")}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="c-company">{t("form.company")}</Label>
                <Input
                  id="c-company"
                  value={form.company || ""}
                  onChange={(e) => setForm({ ...form, company: e.target.value })}
                  placeholder={t("form.companyPlaceholder")}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="c-contact">{t("form.contactPerson")}</Label>
                <Input
                  id="c-contact"
                  value={form.contactPerson || ""}
                  onChange={(e) => setForm({ ...form, contactPerson: e.target.value })}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="c-email">{t("form.email")}</Label>
                <Input
                  id="c-email"
                  type="email"
                  value={form.email || ""}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                />
              </div>
              <div className="space-y-1.5 sm:col-span-2">
                <Label htmlFor="c-phone">{t("form.phone")}</Label>
                <Input
                  id="c-phone"
                  value={form.phone || ""}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="c-notes">{t("form.customerNotes")}</Label>
              <Textarea
                id="c-notes"
                value={form.notes || ""}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                rows={3}
                placeholder={t("form.customerNotesPlaceholder")}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setFormOpen(false)}>
              {t("action.cancel")}
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={createCustomer.isPending || updateCustomer.isPending}
            >
              {editCustomer ? t("action.save") : t("action.create")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteId} onOpenChange={(o) => !o && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("delete.customerTitle")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("delete.customerDesc")}
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
