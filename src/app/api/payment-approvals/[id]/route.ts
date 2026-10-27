import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

// POST /api/payment-approvals/[id]/approve — approve a payment
// POST /api/payment-approvals/[id]/deny — deny a payment
// Body: { approverToken } — to verify the approver is authorized
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await req.json();
  const { approverToken, action } = body as { approverToken: string; action: "approve" | "deny" };

  if (!approverToken || !action) {
    return NextResponse.json({ error: "approverToken and action required" }, { status: 400 });
  }

  const approval = await db.paymentApproval.findUnique({
    where: { id },
  });

  if (!approval) {
    return NextResponse.json({ error: "Approval not found" }, { status: 404 });
  }

  if (approval.approverToken !== approverToken) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  // Fetch payment + promo info separately (no foreign key relation)
  const payment = await db.payment.findUnique({
    where: { id: approval.paymentId },
    include: { promo: { select: { name: true } } },
  });

  if (approval.status !== "PENDING") {
    return NextResponse.json({ error: "Already responded" }, { status: 400 });
  }

  const newStatus = action === "approve" ? "APPROVED" : "DENIED";

  await db.paymentApproval.update({
    where: { id },
    data: {
      status: newStatus,
      respondedAt: new Date(),
    },
  });

  // If approved, mark the payment as "received" (money is okay to receive)
  if (action === "approve") {
    await db.payment.update({
      where: { id: approval.paymentId },
      data: { received: true, receivedDate: new Date() },
    });
  }

  return NextResponse.json({
    success: true,
    status: newStatus,
    promoName: payment?.promo?.name,
    amount: payment?.amount,
  });
}
