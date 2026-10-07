import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { sendPushToUser } from "@/lib/push";

export const dynamic = "force-dynamic";

// POST /api/payment-approvals — create a payment approval request + send push notification
// Body: { paymentId, approverToken, amount, promoName }
// Called by admin when creating a payment that needs approval
export async function POST(req: NextRequest) {
  if (!(await requireAdmin(req))) {
    return NextResponse.json({ error: "Admin access required" }, { status: 403 });
  }

  const body = await req.json();
  const { paymentId, approverToken, amount, promoName } = body;

  if (!paymentId || !approverToken) {
    return NextResponse.json({ error: "paymentId and approverToken required" }, { status: 400 });
  }

  // Create the approval request
  const approval = await db.paymentApproval.create({
    data: {
      paymentId,
      approverToken,
      status: "PENDING",
      message: `Payment of ${amount}€ for "${promoName}" needs approval`,
    },
  });

  // Send push notification to the approver
  const baseUrl = req.nextUrl.origin;
  const approvalUrl = `${baseUrl}/?customer=${approverToken}&approval=${approval.id}`;
  
  await sendPushToUser(approverToken, {
    title: "💸 Payment Approval Needed",
    body: `${promoName}: ${amount}€ — tap to approve or deny`,
    url: approvalUrl,
    tag: `approval-${approval.id}`,
  });

  return NextResponse.json({ success: true, approvalId: approval.id });
}

async function requireAdmin(req: NextRequest): Promise<boolean> {
  const { requireAdmin } = await import("@/lib/auth");
  return requireAdmin(req);
}

// GET /api/payment-approvals?approverToken=TOKEN — get pending approvals for a user
// GET /api/payment-approvals?paymentId=ID — get approval status for a payment
export async function GET(req: NextRequest) {
  const approverToken = req.nextUrl.searchParams.get("approverToken");
  const paymentId = req.nextUrl.searchParams.get("paymentId");

  if (approverToken) {
    // Get pending approvals for this approver
    const approvals = await db.paymentApproval.findMany({
      where: { approverToken, status: "PENDING" },
      include: {
        payment: {
          include: {
            promo: { select: { name: true } },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(approvals);
  }

  if (paymentId) {
    // Get approval status for a payment
    const approvals = await db.paymentApproval.findMany({
      where: { paymentId },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(approvals);
  }

  return NextResponse.json({ error: "approverToken or paymentId required" }, { status: 400 });
}
