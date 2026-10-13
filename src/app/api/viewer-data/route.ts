import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSessionFromRequest } from "@/lib/auth";
import { computePaymentStatus } from "@/lib/format";

export const dynamic = "force-dynamic";

// Returns only safe financial data for VIEWER role users
// No promo names, no customer info, no notes — just dates, amounts, and statuses
export async function GET(req: NextRequest) {
  const session = getSessionFromRequest(req);
  if (!session) {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }

  // Only VIEWER and ADMIN can access this
  if (session.role !== "VIEWER" && session.role !== "ADMIN") {
    return NextResponse.json({ error: "Access denied" }, { status: 403 });
  }

  const payments = await db.payment.findMany({
    where: {
      promo: { viewerVisible: true },
    },
    include: {
      promo: { select: { name: true, date: true } },
    },
    orderBy: { expectedDate: "desc" },
  });

  const safePayments = payments.map((p) => {
    const status = computePaymentStatus(p.paidOut, p.received, p.expectedDate?.toISOString() || null);
    return {
      id: p.id,
      date: p.expectedDate?.toISOString() || p.promo.date.toISOString(),
      amount: p.amount,
      paidOut: p.paidOut,
      received: p.received,
      expectedDate: p.expectedDate?.toISOString() || null,
      receivedDate: p.receivedDate?.toISOString() || null,
      payoutDate: p.payoutDate?.toISOString() || null,
      status,
    };
  });

  // Calculate totals
  const totalAmount = payments.reduce((s, p) => s + p.amount, 0);
  const totalReceived = payments
    .filter((p) => p.received)
    .reduce((s, p) => s + p.amount, 0);
  const totalOutstanding = totalAmount - totalReceived;
  const totalOverdue = payments
    .filter((p) => {
      const st = computePaymentStatus(p.paidOut, p.received, p.expectedDate?.toISOString() || null);
      return st === "UEBERFAELLIG";
    })
    .reduce((s, p) => s + p.amount, 0);

  return NextResponse.json({
    user: session,
    payments: safePayments,
    totals: {
      totalAmount,
      totalReceived,
      totalOutstanding,
      totalOverdue,
      count: payments.length,
    },
  });
}
