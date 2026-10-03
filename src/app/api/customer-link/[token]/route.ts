import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import type { ShareData } from "@/lib/types";

export const dynamic = "force-dynamic";

// Public endpoint: returns a customer's promos by direct-access token (no login)
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;

  const user = await db.user.findFirst({
    where: { shareToken: token, role: "CUSTOMER" },
  });

  if (!user) {
    return NextResponse.json(
      { error: "Ungültiger oder deaktivierter Link." },
      { status: 404 }
    );
  }

  const promos = await db.promo.findMany({
    where: {
      userAccess: { some: { userId: user.id } },
    },
    include: {
      customer: true,
      sounds: { include: { sound: true } },
      tiktoks: { orderBy: { createdAt: "desc" } },
    },
    orderBy: { date: "desc" },
  });

  // Map to safe ShareData (no payment/financial info)
  const data: ShareData[] = promos.map((promo) => ({
    name: promo.name,
    customerName: promo.customer?.name || null,
    customerCompany: promo.customer?.company || null,
    date: promo.date.toISOString(),
    status: promo.status as ShareData["status"],
    notes: promo.notes || null,
    tiktokTarget: promo.tiktokTarget || 0,
    tiktokDone: promo.tiktoks.length,
    sounds: promo.sounds.map((ps) => ({
      name: ps.sound.name,
      artist: ps.sound.artist,
      url: ps.sound.url,
      quantityTotal: ps.quantityTotal,
      quantityUsed: ps.quantityUsed,
      quantityRemaining: ps.quantityTotal - ps.quantityUsed,
    })),
    tiktoks: promo.tiktoks.map((t) => ({
      url: t.url,
      title: t.title,
      createdAt: t.createdAt.toISOString(),
    })),
  }));

  return NextResponse.json({
    user: {
      displayName: user.displayName,
      username: user.username,
    },
    promos: data,
  });
}
