import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSessionFromRequest } from "@/lib/auth";
import { computePaymentStatus } from "@/lib/format";

export const dynamic = "force-dynamic";

// Returns safe financial data for VIEWER or COLLABORATOR role users
// VIEWER sees payments from promos where visibleTo="viewer"
// COLLABORATOR sees ALL payments from promos where visibleTo="collaborator:<theirId>"
//   — full amounts in "overview" + their split amounts in "mySplit"
export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get("token");
  let session = getSessionFromRequest(req);

  // If a token is present, ALWAYS use the token (ignore admin session cookie)
  if (token) {
    const user = await db.user.findFirst({
      where: { shareToken: token },
    });
    if (user && (user.role === "VIEWER" || user.role === "COLLABORATOR")) {
      session = {
        userId: user.id,
        username: user.username,
        role: user.role as "VIEWER" | "COLLABORATOR",
        displayName: user.displayName,
        shareToken: user.shareToken,
      };
    } else {
      session = null;
    }
  }

  if (!session) {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }

  // Only VIEWER, COLLABORATOR, and ADMIN can access this
  if (session.role !== "VIEWER" && session.role !== "COLLABORATOR" && session.role !== "ADMIN") {
    return NextResponse.json({ error: "Access denied" }, { status: 403 });
  }

  // Determine which payments to fetch based on role
  let whereClause: Record<string, unknown> = {};

  if (session.role === "VIEWER") {
    whereClause = {
      promo: { visibleTo: "viewer" },
    };
  } else if (session.role === "COLLABORATOR") {
    // Collaborator sees ALL payments from promos assigned to them
    whereClause = {
      promo: { visibleTo: `collaborator:${session.userId}` },
    };
  }

  const payments = await db.payment.findMany({
    where: whereClause,
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
      amount: p.amount, // ALWAYS show the full amount
      splitAmount: p.splitAmount || 0,
      splitUserId: p.splitUserId,
      isMySplit: session.role === "COLLABORATOR" && p.splitUserId === session.userId,
      paidOut: p.paidOut,
      received: p.received,
      expectedDate: p.expectedDate?.toISOString() || null,
      receivedDate: p.receivedDate?.toISOString() || null,
      payoutDate: p.payoutDate?.toISOString() || null,
      status,
      promoName: p.promo?.name || null,
    };
  });

  // Calculate totals for full amounts (overview)
  const totalAmount = safePayments.reduce((s, p) => s + p.amount, 0);
  const totalReceived = safePayments
    .filter((p) => p.received)
    .reduce((s, p) => s + p.amount, 0);
  const totalPaidOut = safePayments
    .filter((p) => p.paidOut)
    .reduce((s, p) => s + p.amount, 0);
  // Outstanding = what hasn't been paid out yet (Total - Paid Out)
  const totalOutstanding = totalAmount - totalPaidOut;
  const totalOverdue = safePayments
    .filter((p) => {
      const st = computePaymentStatus(p.paidOut, p.received, p.expectedDate || null);
      return st === "UEBERFAELLIG";
    })
    .reduce((s, p) => s + p.amount, 0);

  // For collaborators: also calculate split totals
  let splitTotals = null;
  if (session.role === "COLLABORATOR") {
    const mySplits = safePayments.filter((p) => p.isMySplit);
    const splitTotal = mySplits.reduce((s, p) => s + p.splitAmount, 0);
    const splitReceived = mySplits.filter((p) => p.received).reduce((s, p) => s + p.splitAmount, 0);
    const splitPaidOut = mySplits.filter((p) => p.paidOut).reduce((s, p) => s + p.splitAmount, 0);
    splitTotals = {
      totalAmount: splitTotal,
      totalReceived: splitReceived,
      totalPaidOut: splitPaidOut,
      totalOutstanding: splitTotal - splitPaidOut,
      totalOverdue: mySplits
        .filter((p) => {
          const st = computePaymentStatus(p.paidOut, p.received, p.expectedDate || null);
          return st === "UEBERFAELLIG";
        })
        .reduce((s, p) => s + p.splitAmount, 0),
      count: mySplits.length,
    };
  }

  return NextResponse.json({
    user: session,
    payments: safePayments,
    totals: {
      totalAmount,
      totalReceived,
      totalPaidOut,
      totalOutstanding,
      totalOverdue,
      count: safePayments.length,
    },
    splitTotals,
    isCollaborator: session.role === "COLLABORATOR",
  });
}
