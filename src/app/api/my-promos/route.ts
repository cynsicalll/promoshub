import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSessionFromRequest } from "@/lib/auth";
import type { ShareData } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const session = getSessionFromRequest(req);
  if (!session) {
    return NextResponse.json({ error: "Nicht angemeldet" }, { status: 401 });
  }

  // Admin sees all promos; customer sees only assigned ones
  let promos;
  if (session.role === "ADMIN") {
    promos = await db.promo.findMany({
      include: {
        customer: true,
        sounds: { include: { sound: true } },
        tiktoks: { orderBy: { createdAt: "desc" } },
      },
      orderBy: { date: "desc" },
    });
  } else {
    promos = await db.promo.findMany({
      where: {
        userAccess: { some: { userId: session.userId } },
      },
      include: {
        customer: true,
        sounds: { include: { sound: true } },
        tiktoks: { orderBy: { createdAt: "desc" } },
      },
      orderBy: { date: "desc" },
    });
  }

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
    user: session,
    promos: data,
  });
}
