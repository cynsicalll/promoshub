import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import type { PaymentInput } from "@/lib/types";
import { requireAdmin } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  if (!(await requireAdmin(req))) {
    return NextResponse.json({ error: "Admin-Rechte erforderlich" }, { status: 403 });
  }
  const payments = await db.payment.findMany({
    include: {
      promo: {
        include: { customer: true, sounds: { include: { sound: true } } },
      },
    },
    orderBy: { expectedDate: "asc" },
  });
  return NextResponse.json(payments);
}

export async function POST(req: NextRequest) {
  if (!(await requireAdmin(req))) {
    return NextResponse.json({ error: "Admin-Rechte erforderlich" }, { status: 403 });
  }
  const data = (await req.json()) as PaymentInput;
  if (!data.promoId) {
    return NextResponse.json({ error: "Promo ist erforderlich" }, { status: 400 });
  }
  const payment = await db.payment.create({
    data: {
      promoId: data.promoId,
      amount: Number(data.amount) || 0,
      expectedDate: data.expectedDate ? new Date(data.expectedDate) : null,
      payoutDate: data.payoutDate ? new Date(data.payoutDate) : null,
      receivedDate: data.receivedDate ? new Date(data.receivedDate) : null,
      paidOut: !!data.paidOut,
      received: !!data.received,
      notes: data.notes || null,
    },
    include: { promo: { include: { customer: true } } },
  });
  return NextResponse.json(payment, { status: 201 });
}
