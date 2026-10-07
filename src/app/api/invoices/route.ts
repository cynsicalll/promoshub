import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";

export const dynamic = "force-dynamic";

// GET: List all invoices
export async function GET(req: NextRequest) {
  if (!(await requireAdmin(req))) {
    return NextResponse.json({ error: "Admin access required" }, { status: 403 });
  }
  const invoices = await db.invoice.findMany({
    include: { promo: { select: { id: true, name: true } } },
    orderBy: { date: "desc" },
  });
  return NextResponse.json(invoices);
}

// POST: Create a new invoice (auto-generate from promo or manual)
export async function POST(req: NextRequest) {
  if (!(await requireAdmin(req))) {
    return NextResponse.json({ error: "Admin access required" }, { status: 403 });
  }

  const body = await req.json();

  // Get invoice settings
  const settings = await db.setting.findMany();
  const settingsMap = new Map(settings.map((s) => [s.key, s.value]));

  // Generate invoice number: INV-2026-001
  const year = new Date().getFullYear();
  const count = await db.invoice.count();
  const invoiceNo = `INV-${year}-${String(count + 1).padStart(3, "0")}`;

  // If promoId is provided, auto-fill from promo + customer
  let promoData: { amount: number; customerName: string; customerCompany: string | null; customerAddress: string | null; customerEmail: string | null; promoName: string } | null = null;
  if (body.promoId) {
    const promo = await db.promo.findUnique({
      where: { id: body.promoId },
      include: { customer: true, payments: true },
    });
    if (promo) {
      const amount = promo.payments.reduce((s, p) => s + p.amount, 0);
      promoData = {
        amount,
        customerName: promo.customer?.name || "Unknown",
        customerCompany: promo.customer?.company || null,
        customerAddress: promo.customer?.notes || null,
        customerEmail: promo.customer?.email || null,
        promoName: promo.name,
      };
    }
  }

  const amount = body.amount ?? promoData?.amount ?? 0;
  const taxRate = body.taxRate ?? (Number(settingsMap.get("invoiceTaxRate")) || 0) ?? 0;
  const taxAmount = Math.round(amount * taxRate) / 100;
  const totalAmount = amount + taxAmount;

  const invoice = await db.invoice.create({
    data: {
      invoiceNo,
      promoId: body.promoId || null,
      date: body.date ? new Date(body.date) : new Date(),
      dueDate: body.dueDate ? new Date(body.dueDate) : null,
      senderName: body.senderName || settingsMap.get("invoiceSenderName") || "",
      senderCompany: body.senderCompany || settingsMap.get("invoiceSenderCompany") || null,
      senderAddress: body.senderAddress || settingsMap.get("invoiceSenderAddress") || null,
      senderEmail: body.senderEmail || settingsMap.get("invoiceSenderEmail") || null,
      senderPhone: body.senderPhone || settingsMap.get("invoiceSenderPhone") || null,
      senderTaxId: body.senderTaxId || settingsMap.get("invoiceSenderTaxId") || null,
      senderBank: body.senderBank || settingsMap.get("invoiceSenderBank") || null,
      senderIban: body.senderIban || settingsMap.get("invoiceSenderIban") || null,
      senderBic: body.senderBic || settingsMap.get("invoiceSenderBic") || null,
      recipientName: body.recipientName || promoData?.customerName || "",
      recipientCompany: body.recipientCompany || promoData?.customerCompany || null,
      recipientAddress: body.recipientAddress || promoData?.customerAddress || null,
      recipientEmail: body.recipientEmail || promoData?.customerEmail || null,
      description: body.description || promoData ? `Sound Promo Services: ${promoData?.promoName || ""}` : null,
      amount,
      taxRate,
      taxAmount,
      totalAmount,
      status: body.status || "DRAFT",
      notes: body.notes || null,
    },
    include: { promo: { select: { id: true, name: true } } },
  });

  return NextResponse.json(invoice, { status: 201 });
}
