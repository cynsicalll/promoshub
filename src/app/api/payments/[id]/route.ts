import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import type { PaymentInput } from "@/lib/types";
import { requireAdmin } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await requireAdmin(req))) {
    return NextResponse.json({ error: "Admin-Rechte erforderlich" }, { status: 403 });
  }
  const { id } = await params;
  const data = (await req.json()) as Partial<PaymentInput>;

  const update: Record<string, unknown> = {};
  if (data.amount !== undefined) update.amount = Number(data.amount) || 0;
  if (data.expectedDate !== undefined)
    update.expectedDate = data.expectedDate ? new Date(data.expectedDate) : null;
  if (data.payoutDate !== undefined)
    update.payoutDate = data.payoutDate ? new Date(data.payoutDate) : null;
  if (data.receivedDate !== undefined)
    update.receivedDate = data.receivedDate ? new Date(data.receivedDate) : null;
  if (data.paidOut !== undefined) update.paidOut = !!data.paidOut;
  if (data.received !== undefined) update.received = !!data.received;
  if (data.notes !== undefined) update.notes = data.notes || null;
  if (data.promoId !== undefined) update.promoId = data.promoId;

  const payment = await db.payment.update({
    where: { id },
    data: update,
    include: { promo: { include: { customer: true } } },
  });
  return NextResponse.json(payment);
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await requireAdmin(req))) {
    return NextResponse.json({ error: "Admin-Rechte erforderlich" }, { status: 403 });
  }
  const { id } = await params;
  await db.payment.delete({ where: { id } }).catch(() => {});
  return new NextResponse(null, { status: 204 });
}
