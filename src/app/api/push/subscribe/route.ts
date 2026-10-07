import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

// POST /api/push/subscribe — store a push subscription
// Body: { endpoint, keys: { p256dh, auth }, userToken }
// userToken is the shareToken of the customer/viewer
export async function POST(req: NextRequest) {
  const body = await req.json();
  const { endpoint, keys, userToken } = body;

  if (!endpoint || !keys?.p256dh || !keys?.auth) {
    return NextResponse.json({ error: "Missing subscription data" }, { status: 400 });
  }

  // Upsert: if endpoint exists, update; otherwise create
  await db.pushSubscription.upsert({
    where: { endpoint },
    create: {
      endpoint,
      p256dh: keys.p256dh,
      auth: keys.auth,
      userToken: userToken || null,
    },
    update: {
      p256dh: keys.p256dh,
      auth: keys.auth,
      userToken: userToken || null,
    },
  });

  return NextResponse.json({ success: true });
}

// DELETE /api/push/subscribe — remove a push subscription
export async function DELETE(req: NextRequest) {
  const endpoint = req.nextUrl.searchParams.get("endpoint");
  if (!endpoint) {
    return NextResponse.json({ error: "Endpoint required" }, { status: 400 });
  }

  await db.pushSubscription.deleteMany({ where: { endpoint } });
  return NextResponse.json({ success: true });
}

// GET /api/push/subscribe?userToken=TOKEN — check if user has subscriptions
export async function GET(req: NextRequest) {
  const userToken = req.nextUrl.searchParams.get("userToken");
  if (!userToken) {
    return NextResponse.json({ subscribed: false });
  }

  const count = await db.pushSubscription.count({ where: { userToken } });
  return NextResponse.json({ subscribed: count > 0, count });
}
