import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { sendPushToUser } from "@/lib/push";

export const dynamic = "force-dynamic";

// POST /api/push/send — send a custom push notification to the viewer
// Body: { type: "promo" | "monthly" | "overall", data: { ... } }
export async function POST(req: NextRequest) {
  if (!(await requireAdmin(req))) {
    return NextResponse.json({ error: "Admin access required" }, { status: 403 });
  }

  const body = await req.json();
  const { type, data } = body;

  // Find the viewer user
  const viewer = await db.user.findFirst({ where: { role: "VIEWER" } });
  if (!viewer || !viewer.shareToken) {
    return NextResponse.json({ error: "No viewer with shareToken found" }, { status: 400 });
  }

  let title = "";
  let bodyText = "";
  const baseUrl = req.nextUrl.origin;
  const url = `${baseUrl}/?customer=${viewer.shareToken}`;

  if (type === "promo") {
    // Money received notification
    title = `💸 Money: ${data.name}`;
    bodyText = `${data.amount}€${data.customer ? ` · ${data.customer}` : ""}${data.date ? ` · ${data.date}` : ""}`;
  } else if (type === "monthly") {
    // Monthly summary notification
    title = `📊 Monthly Summary — ${data.month}`;
    bodyText = `Earnings: ${data.earnings}€ · Received: ${data.received}€ · Outstanding: ${data.outstanding}€ · ${data.promoCount} promos`;
  } else if (type === "overall") {
    // Overall summary notification
    title = "📊 Overall Summary";
    bodyText = `Total: ${data.total}€ · Received: ${data.received}€ · Outstanding: ${data.outstanding}€ · ${data.promoCount} promos · ${data.tiktokCount} TikToks`;
  } else if (type === "custom") {
    title = data.title || "Notification";
    bodyText = data.body || "";
  } else {
    return NextResponse.json({ error: "Invalid type" }, { status: 400 });
  }

  const result = await sendPushToUser(viewer.shareToken, {
    title,
    body: bodyText,
    url,
    tag: `notif-${type}-${Date.now()}`,
  });

  return NextResponse.json({
    success: true,
    sent: result.sent,
    failed: result.failed,
    title,
    body: bodyText,
  });
}
