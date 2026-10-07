import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

// GET /api/push/vapid-key — returns the public VAPID key for subscribing
export async function GET() {
  const publicKey = process.env.VAPID_PUBLIC_KEY;
  if (!publicKey) {
    return NextResponse.json({ error: "VAPID keys not configured" }, { status: 500 });
  }
  return NextResponse.json({ publicKey });
}
