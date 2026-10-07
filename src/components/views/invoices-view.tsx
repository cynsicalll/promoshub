"use client";

import * as React from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  FileText, Plus, Trash2, Pencil, Download, Settings, Loader2, Eye, Printer,
} from "lucide-react";
import { toast } from "sonner";
import { useI18n } from "@/components/language-provider";
import { usePromos } from "@/hooks/use-data";
import { formatCurrency, formatDate, formatDateInput, toISODate } from "@/lib/format";

interface Invoice {
  id: string;
  invoiceNo: string;
  promoId: string | null;
  promo: { id: string; name: string } | null;
  date: string;
  dueDate: string | null;
  senderName: string;
  senderCompany: string | null;
  senderAddress: string | null;
  senderEmail: string | null;
  senderPhone: string | null;
  senderTaxId: string | null;
  senderBank: string | null;
  senderIban: string | null;
  senderBic: string | null;
  recipientName: string;
  recipientCompany: string | null;
  recipientAddress: string | null;
  recipientEmail: string | null;
  description: string | null;
  amount: number;
  taxRate: number;
  taxAmount: number;
  totalAmount: number;
  status: string;
  notes: string | null;
  createdAt: string;
}

const INVOICE_STATUS_STYLES: Record<string, { label: string; className: string }> = {
  DRAFT: { label: "Draft", className: "bg-slate-100 text-slate-700 border-slate-200" },
  SENT: { label: "Sent", className: "bg-amber-50 text-amber-700 border-amber-200" },
  PAID: { label: "Paid", className: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  OVERDUE: { label: "Overdue", className: "bg-rose-50 text-rose-700 border-rose-200" },
};

export function InvoicesView() {
  const { t } = useI18n();
  const qc = useQueryClient();
  const { data: promos = [] } = usePromos();
  const [formOpen, setFormOpen] = React.useState(false);
  const [settingsOpen, setSettingsOpen] = React.useState(false);
  const [previewInvoice, setPreviewInvoice] = React.useState<Invoice | null>(null);
  const [editInvoice, setEditInvoice] = React.useState<Invoice | null>(null);
  const [deleteId, setDeleteId] = React.useState<string | null>(null);

  const { data: invoices = [], isLoading } = useQuery<Invoice[]>({
    queryKey: ["invoices"],
    queryFn: async () => {
      const res = await fetch("/api/invoices");
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
  });

  const { data: settings = {} } = useQuery<Record<string, string>>({
    queryKey: ["invoice-settings"],
    queryFn: async () => {
      const res = await fetch("/api/invoice-settings");
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/invoices/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed");
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["invoices"] });
      toast.success("Invoice deleted");
    },
    onError: () => toast.error("Delete failed"),
  });

  const totalAmount = invoices.reduce((s, inv) => s + inv.totalAmount, 0);
  const paidAmount = invoices.filter((i) => i.status === "PAID").reduce((s, i) => s + i.totalAmount, 0);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight flex items-center gap-2">
            <FileText className="h-6 w-6 text-muted-foreground" />
            {t("invoice.title")}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {invoices.length} invoices · {formatCurrency(totalAmount)} total · {formatCurrency(paidAmount)} paid
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => setSettingsOpen(true)} className="gap-2">
            <Settings className="h-4 w-4" /> {t("invoice.settings")}
          </Button>
          <Button size="sm" onClick={() => { setEditInvoice(null); setFormOpen(true); }} className="gap-2">
            <Plus className="h-4 w-4" /> {t("invoice.create")}
          </Button>
        </div>
      </div>

      {/* Invoices table */}
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/40 hover:bg-muted/40">
                <TableHead className="w-[120px]">{t("invoice.col.number")}</TableHead>
                <TableHead className="min-w-[140px]">{t("invoice.col.recipient")}</TableHead>
                <TableHead className="min-w-[140px]">{t("invoice.col.promo")}</TableHead>
                <TableHead className="w-[100px]">{t("invoice.col.date")}</TableHead>
                <TableHead className="text-right w-[110px]">{t("invoice.col.amount")}</TableHead>
                <TableHead className="text-right w-[110px]">{t("invoice.col.total")}</TableHead>
                <TableHead className="w-[100px]">{t("invoice.col.status")}</TableHead>
                <TableHead className="w-[120px] text-right">{t("invoice.col.actions")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow><TableCell colSpan={8} className="text-center py-10 text-muted-foreground">{t("action.loading")}</TableCell></TableRow>
              ) : invoices.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-12 text-muted-foreground">
                    <FileText className="h-8 w-8 mx-auto mb-2 opacity-40" />
                    {t("invoice.noInvoices")}
                  </TableCell>
                </TableRow>
              ) : (
                invoices.map((inv) => (
                  <TableRow key={inv.id} className="hover:bg-muted/40">
                    <TableCell className="font-mono text-sm font-medium">{inv.invoiceNo}</TableCell>
                    <TableCell className="text-sm">
                      <div>{inv.recipientName}</div>
                      {inv.recipientCompany && <div className="text-xs text-muted-foreground">{inv.recipientCompany}</div>}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">{inv.promo?.name || "—"}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{formatDate(inv.date)}</TableCell>
                    <TableCell className="text-right tabular-nums">{formatCurrency(inv.amount)}</TableCell>
                    <TableCell className="text-right font-semibold tabular-nums">{formatCurrency(inv.totalAmount)}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className={INVOICE_STATUS_STYLES[inv.status]?.className || ""}>
                        {INVOICE_STATUS_STYLES[inv.status]?.label || inv.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setPreviewInvoice(inv)}>
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => { setEditInvoice(inv); setFormOpen(true); }}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-rose-600" onClick={() => setDeleteId(inv.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </Card>

      {/* Create/Edit dialog */}
      <InvoiceFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        invoice={editInvoice}
        promos={promos}
        settings={settings}
      />

      {/* Settings dialog */}
      <InvoiceSettingsDialog open={settingsOpen} onOpenChange={setSettingsOpen} settings={settings} />

      {/* Preview dialog */}
      {previewInvoice && (
        <InvoicePreview invoice={previewInvoice} onClose={() => setPreviewInvoice(null)} />
      )}

      {/* Delete confirm */}
      <AlertDialog open={!!deleteId} onOpenChange={(o) => !o && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete invoice?</AlertDialogTitle>
            <AlertDialogDescription>This action cannot be undone.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => deleteId && deleteMutation.mutate(deleteId)} className="bg-rose-600 hover:bg-rose-700 text-white">Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

// ─── Invoice Form Dialog ────────────────────────────────────
function InvoiceFormDialog({
  open, onOpenChange, invoice, promos, settings,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  invoice: Invoice | null;
  promos: { id: string; name: string }[];
  settings: Record<string, string>;
}) {
  const { t } = useI18n();
  const qc = useQueryClient();
  const [promoId, setPromoId] = React.useState("");
  const [recipientName, setRecipientName] = React.useState("");
  const [recipientCompany, setRecipientCompany] = React.useState("");
  const [recipientAddress, setRecipientAddress] = React.useState("");
  const [recipientEmail, setRecipientEmail] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [amount, setAmount] = React.useState("");
  const [taxRate, setTaxRate] = React.useState("0");
  const [date, setDate] = React.useState(formatDateInput(new Date()));
  const [dueDate, setDueDate] = React.useState("");
  const [status, setStatus] = React.useState("DRAFT");
  const [notes, setNotes] = React.useState("");
  const [saving, setSaving] = React.useState(false);

  React.useEffect(() => {
    if (open) {
      if (invoice) {
        setPromoId(invoice.promoId || "none");
        setRecipientName(invoice.recipientName);
        setRecipientCompany(invoice.recipientCompany || "");
        setRecipientAddress(invoice.recipientAddress || "");
        setRecipientEmail(invoice.recipientEmail || "");
        setDescription(invoice.description || "");
        setAmount(String(invoice.amount));
        setTaxRate(String(invoice.taxRate));
        setDate(formatDateInput(invoice.date));
        setDueDate(formatDateInput(invoice.dueDate));
        setStatus(invoice.status);
        setNotes(invoice.notes || "");
      } else {
        setPromoId("none");
        setRecipientName(settings.invoiceSenderName || "");
        setRecipientCompany("");
        setRecipientAddress("");
        setRecipientEmail("");
        setDescription("");
        setAmount("");
        setTaxRate(settings.invoiceTaxRate || "0");
        setDate(formatDateInput(new Date()));
        setDueDate("");
        setStatus("DRAFT");
        setNotes("");
      }
    }
  }, [open, invoice, settings]);

  // Auto-fill from promo
  async function handlePromoSelect(id: string) {
    setPromoId(id);
    if (id === "none") return;
    const res = await fetch(`/api/promos/${id}`);
    if (!res.ok) return;
    const p = await res.json();
    const amt = p.payments?.reduce((s: number, x: { amount: number }) => s + x.amount, 0) || 0;
    setAmount(String(amt));
    setRecipientName(p.customer?.name || "");
    setRecipientCompany(p.customer?.company || "");
    setRecipientEmail(p.customer?.email || "");
    setDescription(`Sound Promo Services: ${p.name}`);
  }

  async function handleSubmit() {
    if (!recipientName.trim()) { toast.error("Recipient name required"); return; }
    setSaving(true);
    try {
      const payload = {
        promoId: promoId === "none" ? null : promoId,
        recipientName: recipientName.trim(),
        recipientCompany: recipientCompany || null,
        recipientAddress: recipientAddress || null,
        recipientEmail: recipientEmail || null,
        description: description || null,
        amount: Number(amount) || 0,
        taxRate: Number(taxRate) || 0,
        date: toISODate(date),
        dueDate: dueDate ? toISODate(dueDate) : null,
        status,
        notes: notes || null,
      };

      if (invoice) {
        const res = await fetch(`/api/invoices/${invoice.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (!res.ok) throw new Error("Failed");
        toast.success("Invoice updated");
      } else {
        const res = await fetch("/api/invoices", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (!res.ok) throw new Error("Failed");
        toast.success("Invoice created");
      }
      qc.invalidateQueries({ queryKey: ["invoices"] });
      onOpenChange(false);
    } catch {
      toast.error("Failed to save");
    } finally {
      setSaving(false);
    }
  }

  const amt = Number(amount) || 0;
  const tx = Number(taxRate) || 0;
  const taxAmt = Math.round(amt * tx) / 100;
  const total = amt + taxAmt;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{invoice ? `Edit ${invoice.invoiceNo}` : t("invoice.create")}</DialogTitle>
          <DialogDescription>{t("invoice.createDesc")}</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-2">
          {/* Link to promo */}
          <div className="space-y-1.5">
            <Label>{t("invoice.linkPromo")}</Label>
            <Select value={promoId} onValueChange={handlePromoSelect}>
              <SelectTrigger><SelectValue placeholder="—" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">— No promo —</SelectItem>
                {promos.map((p) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">Selecting a promo auto-fills amount and recipient.</p>
          </div>

          {/* Recipient */}
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label>{t("invoice.recipientName")} *</Label>
              <Input value={recipientName} onChange={(e) => setRecipientName(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>{t("invoice.recipientCompany")}</Label>
              <Input value={recipientCompany} onChange={(e) => setRecipientCompany(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>{t("invoice.recipientEmail")}</Label>
              <Input value={recipientEmail} onChange={(e) => setRecipientEmail(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>{t("invoice.recipientAddress")}</Label>
              <Input value={recipientAddress} onChange={(e) => setRecipientAddress(e.target.value)} />
            </div>
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <Label>{t("invoice.description")}</Label>
            <Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2} />
          </div>

          {/* Amount + Tax */}
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="space-y-1.5">
              <Label>{t("invoice.amount")} (€)</Label>
              <Input type="number" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>{t("invoice.taxRate")} (%)</Label>
              <Input type="number" step="0.1" value={taxRate} onChange={(e) => setTaxRate(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>{t("invoice.total")}</Label>
              <div className="flex h-9 items-center rounded-md border bg-muted/30 px-3 font-semibold tabular-nums">
                {formatCurrency(total)}
              </div>
              <p className="text-[10px] text-muted-foreground">incl. {formatCurrency(taxAmt)} tax</p>
            </div>
          </div>

          {/* Dates + Status */}
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="space-y-1.5">
              <Label>{t("invoice.date")}</Label>
              <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>{t("invoice.dueDate")}</Label>
              <Input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>{t("invoice.col.status")}</Label>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="DRAFT">Draft</SelectItem>
                  <SelectItem value="SENT">Sent</SelectItem>
                  <SelectItem value="PAID">Paid</SelectItem>
                  <SelectItem value="OVERDUE">Overdue</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-1.5">
            <Label>{t("invoice.notes")}</Label>
            <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={saving}>
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            {invoice ? "Save" : t("invoice.create")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Invoice Settings Dialog ────────────────────────────────
function InvoiceSettingsDialog({
  open, onOpenChange, settings,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  settings: Record<string, string>;
}) {
  const { t } = useI18n();
  const qc = useQueryClient();
  const [form, setForm] = React.useState<Record<string, string>>({});
  const [saving, setSaving] = React.useState(false);

  React.useEffect(() => {
    if (open) {
      setForm({
        invoiceSenderName: settings.invoiceSenderName || "",
        invoiceSenderCompany: settings.invoiceSenderCompany || "",
        invoiceSenderAddress: settings.invoiceSenderAddress || "",
        invoiceSenderEmail: settings.invoiceSenderEmail || "",
        invoiceSenderPhone: settings.invoiceSenderPhone || "",
        invoiceSenderTaxId: settings.invoiceSenderTaxId || "",
        invoiceSenderBank: settings.invoiceSenderBank || "",
        invoiceSenderIban: settings.invoiceSenderIban || "",
        invoiceSenderBic: settings.invoiceSenderBic || "",
        invoiceTaxRate: settings.invoiceTaxRate || "0",
      });
    }
  }, [open, settings]);

  async function handleSave() {
    setSaving(true);
    try {
      const res = await fetch("/api/invoice-settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error("Failed");
      qc.invalidateQueries({ queryKey: ["invoice-settings"] });
      toast.success("Settings saved");
      onOpenChange(false);
    } catch {
      toast.error("Failed to save");
    } finally {
      setSaving(false);
    }
  }

  const fields = [
    { key: "invoiceSenderName", label: t("invoice.yourName") },
    { key: "invoiceSenderCompany", label: t("invoice.yourCompany") },
    { key: "invoiceSenderAddress", label: t("invoice.yourAddress") },
    { key: "invoiceSenderEmail", label: t("invoice.yourEmail") },
    { key: "invoiceSenderPhone", label: t("invoice.yourPhone") },
    { key: "invoiceSenderTaxId", label: t("invoice.yourTaxId") },
    { key: "invoiceSenderBank", label: t("invoice.yourBank") },
    { key: "invoiceSenderIban", label: "IBAN" },
    { key: "invoiceSenderBic", label: "BIC" },
    { key: "invoiceTaxRate", label: t("invoice.defaultTaxRate") + " (%)" },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t("invoice.settings")}</DialogTitle>
          <DialogDescription>{t("invoice.settingsDesc")}</DialogDescription>
        </DialogHeader>
        <div className="space-y-3 py-2">
          {fields.map((f) => (
            <div key={f.key} className="space-y-1">
              <Label>{f.label}</Label>
              <Input
                value={form[f.key] || ""}
                onChange={(e) => setForm({ ...form, [f.key]: e.target.value })}
              />
            </div>
          ))}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Invoice Preview (printable) ────────────────────────────
function InvoicePreview({ invoice, onClose }: { invoice: Invoice; onClose: () => void }) {
  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>{invoice.invoiceNo}</span>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" className="gap-2" onClick={() => window.print()}>
                <Printer className="h-4 w-4" /> Print / PDF
              </Button>
            </div>
          </DialogTitle>
        </DialogHeader>

        {/* Invoice document */}
        <div className="space-y-6 p-4 print:p-0" id="invoice-document">
          {/* Header */}
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-2xl font-bold">{invoice.senderName}</h2>
              {invoice.senderCompany && <p className="text-sm text-muted-foreground">{invoice.senderCompany}</p>}
              {invoice.senderAddress && <p className="text-xs text-muted-foreground whitespace-pre-line">{invoice.senderAddress}</p>}
              {invoice.senderEmail && <p className="text-xs text-muted-foreground">{invoice.senderEmail}</p>}
              {invoice.senderPhone && <p className="text-xs text-muted-foreground">{invoice.senderPhone}</p>}
              {invoice.senderTaxId && <p className="text-xs text-muted-foreground">Tax ID: {invoice.senderTaxId}</p>}
            </div>
            <div className="text-right">
              <h3 className="text-xl font-bold">INVOICE</h3>
              <p className="text-sm font-mono">{invoice.invoiceNo}</p>
              <p className="text-xs text-muted-foreground">{formatDate(invoice.date)}</p>
              {invoice.dueDate && <p className="text-xs text-muted-foreground">Due: {formatDate(invoice.dueDate)}</p>}
              <Badge variant="outline" className={`mt-1 ${INVOICE_STATUS_STYLES[invoice.status]?.className || ""}`}>
                {INVOICE_STATUS_STYLES[invoice.status]?.label || invoice.status}
              </Badge>
            </div>
          </div>

          <hr />

          {/* Bill to */}
          <div>
            <p className="text-xs font-semibold uppercase text-muted-foreground mb-1">Bill To</p>
            <p className="font-medium">{invoice.recipientName}</p>
            {invoice.recipientCompany && <p className="text-sm">{invoice.recipientCompany}</p>}
            {invoice.recipientAddress && <p className="text-sm whitespace-pre-line">{invoice.recipientAddress}</p>}
            {invoice.recipientEmail && <p className="text-sm">{invoice.recipientEmail}</p>}
          </div>

          {/* Line items */}
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="text-left py-2 font-semibold">Description</th>
                <th className="text-right py-2 font-semibold">Amount</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b">
                <td className="py-3">{invoice.description || "Sound Promo Services"}</td>
                <td className="py-3 text-right tabular-nums">{formatCurrency(invoice.amount)}</td>
              </tr>
            </tbody>
          </table>

          {/* Totals */}
          <div className="flex justify-end">
            <div className="w-64 space-y-1 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Subtotal</span>
                <span className="tabular-nums">{formatCurrency(invoice.amount)}</span>
              </div>
              {invoice.taxRate > 0 && (
                <>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Tax ({invoice.taxRate}%)</span>
                    <span className="tabular-nums">{formatCurrency(invoice.taxAmount)}</span>
                  </div>
                </>
              )}
              <div className="flex justify-between border-t pt-1 font-bold text-base">
                <span>Total</span>
                <span className="tabular-nums">{formatCurrency(invoice.totalAmount)}</span>
              </div>
            </div>
          </div>

          {/* Payment info */}
          {(invoice.senderBank || invoice.senderIban) && (
            <div className="border-t pt-4">
              <p className="text-xs font-semibold uppercase text-muted-foreground mb-1">Payment Details</p>
              {invoice.senderBank && <p className="text-xs">Bank: {invoice.senderBank}</p>}
              {invoice.senderIban && <p className="text-xs font-mono">IBAN: {invoice.senderIban}</p>}
              {invoice.senderBic && <p className="text-xs font-mono">BIC: {invoice.senderBic}</p>}
            </div>
          )}

          {/* Notes */}
          {invoice.notes && (
            <div className="border-t pt-4">
              <p className="text-xs font-semibold uppercase text-muted-foreground mb-1">Notes</p>
              <p className="text-sm text-muted-foreground whitespace-pre-wrap">{invoice.notes}</p>
            </div>
          )}

          <div className="text-center text-xs text-muted-foreground border-t pt-4">
            Thank you for your business!
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
