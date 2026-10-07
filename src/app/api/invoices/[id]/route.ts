import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await requireAdmin(req))) {
    return NextResponse.json({ error: "Admin access required" }, { status: 403 });
  }
  const { id } = await params;
  const body = await req.json();

  const update: Record<string, unknown> = {};
  const fields = [
    "date", "dueDate", "senderName", "senderCompany", "senderAddress",
    "senderEmail", "senderPhone", "senderTaxId", "senderBank", "senderIban",
    "senderBic", "recipientName", "recipientCompany", "recipientAddress",
    "recipientEmail", "description", "amount", "taxRate", "status", "notes"
  ];

  for (const f of fields) {
    if (body[f] !== undefined) {
      if (f === "date" || f === "dueDate") {
        update[f] = body[f] ? new Date(body[f]) : null;
      } else {
        update[f] = body[f];
      }
    }
  }

  // Recalculate tax and total if amount or taxRate changed
  if (update.amount !== undefined || update.taxRate !== undefined) {
    const current = await db.invoice.findUnique({ where: { id } });
    if (current) {
      const amount = update.amount !== undefined ? Number(update.amount) : current.amount;
      const taxRate = update.taxRate !== undefined ? Number(update.taxRate) : current.taxRate;
      update.taxAmount = Math.round(amount * taxRate) / 100;
      update.totalAmount = amount + (update.taxAmount as number);
    }
  }

  const invoice = await db.invoice.update({
    where: { id },
    data: update,
    include: { promo: { select: { id: true, name: true } } },
  });

  return NextResponse.json(invoice);
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await requireAdmin(req))) {
    return NextResponse.json({ error: "Admin access required" }, { status: 403 });
  }
  const { id } = await params;
  await db.invoice.delete({ where: { id } }).catch(() => {});
  return new NextResponse(null, { status: 204 });
}
