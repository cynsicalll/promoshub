import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";

export const dynamic = "force-dynamic";

// POST /api/payments/update-split — update split amount + splitUserId for a payment
// Body: { paymentId, splitUserId, splitAmount }
export async function POST(req: NextRequest) {
  const session = await requireAdmin(req);
  if (!session) {
    return NextResponse.json({ error: "Admin access required" }, { status: 403 });
  }

  let body;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { paymentId, splitUserId, splitAmount } = body;

  if (!paymentId || typeof paymentId !== "string") {
    return NextResponse.json({ error: "paymentId (string) required" }, { status: 400 });
  }

  // Parse splitAmount — handle both string and number
  const parsedSplitAmount = splitUserId
    ? (typeof splitAmount === "number" ? splitAmount : parseFloat(splitAmount) || 0)
    : 0;

  try {
    const payment = await db.payment.update({
      where: { id: paymentId },
      data: {
        splitUserId: splitUserId || null,
        splitAmount: parsedSplitAmount,
      },
    });

    return NextResponse.json({
      success: true,
      splitUserId: payment.splitUserId,
      splitAmount: payment.splitAmount,
    });
  } catch (error) {
    return NextResponse.json({
      error: "Database update failed",
      detail: error instanceof Error ? error.message : "Unknown error",
    }, { status: 500 });
  }
}
